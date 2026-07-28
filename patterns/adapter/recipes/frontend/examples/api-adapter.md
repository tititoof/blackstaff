---
type: Example
title: Adapter Nuxt — exemple API externe incompatible
tags: [nuxt, frontend, adapter, api]
---

# Application sur une API météo externe (format propriétaire → format normalisé)

L'API OpenWeatherMap retourne un format très différent du format attendu
par les composants de l'app — l'Adapter traduit de façon transparente.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Target}` | `WeatherData` |
| `{Adapter}` | `OpenWeatherAdapter` |
| `{Adaptee}` | Réponse brute de l'API OpenWeatherMap |

# Types

```ts
// adapters/weather/types.ts

// Format Target — ce que l'app attend (normalisé, camelCase)
export interface WeatherData {
  city:        string
  temperature: number    // °C, toujours
  feelsLike:   number
  humidity:    number    // %
  description: string
  icon:        string    // code icône normalisé
  windSpeed:   number    // km/h, toujours
  updatedAt:   string    // ISO 8601
}

// Format Adaptee — ce que OpenWeatherMap retourne (propriétaire)
export interface OpenWeatherRaw {
  name: string
  main: {
    temp:       number    // Kelvin ou °C selon l'unité appelée
    feels_like: number
    humidity:   number
  }
  weather: Array<{
    description: string
    icon:        string   // ex: '01d', '10n'
  }>
  wind: { speed: number } // m/s
  dt:   number            // timestamp Unix
}
```

# Adapter

```ts
// adapters/weather/OpenWeatherAdapter.ts
import type { WeatherData, OpenWeatherRaw } from './types'

export class OpenWeatherAdapter {
  toTarget(raw: OpenWeatherRaw): WeatherData {
    const weather = raw.weather[0]
    return {
      city:        raw.name,
      temperature: Math.round(raw.main.temp),        // déjà en °C si ?units=metric
      feelsLike:   Math.round(raw.main.feels_like),
      humidity:    raw.main.humidity,
      description: this.capitalizeFirst(weather.description),
      icon:        this.normalizeIcon(weather.icon),
      windSpeed:   Math.round(raw.wind.speed * 3.6), // m/s → km/h
      updatedAt:   new Date(raw.dt * 1000).toISOString(),  // Unix → ISO
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private normalizeIcon(owmIcon: string): string {
    // Mapper les codes OWM vers des icônes Material Design
    const MAP: Record<string, string> = {
      '01d': 'mdi-weather-sunny',
      '01n': 'mdi-weather-night',
      '02d': 'mdi-weather-partly-cloudy',
      '10d': 'mdi-weather-rainy',
      '10n': 'mdi-weather-rainy',
      '13d': 'mdi-weather-snowy',
    }
    return MAP[owmIcon] ?? 'mdi-weather-cloudy'
  }
}

export const openWeatherAdapter = new OpenWeatherAdapter()
```

# Composable utilisant l'Adapter

```ts
// composables/useWeather.ts
import { openWeatherAdapter } from '~~/adapters/weather/OpenWeatherAdapter'
import type { WeatherData, OpenWeatherRaw } from '~~/adapters/weather/types'

export function useWeather() {
  const weather = ref<WeatherData | null>(null)
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function fetchWeather(city: string) {
    loading.value = true
    error.value   = null
    try {
      const config = useRuntimeConfig()
      // L'API externe retourne le format propriétaire
      const raw = await $fetch<OpenWeatherRaw>(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q:     city,
            appid: config.public.openWeatherApiKey,
            units: 'metric',  // °C directement
            lang:  'fr',
          },
        }
      )
      // L'Adapter traduit vers le format normalisé
      weather.value = openWeatherAdapter.toTarget(raw)
    } catch (e: any) {
      error.value = e.statusCode === 404
        ? `Ville "${city}" introuvable`
        : 'Impossible de charger la météo'
    } finally {
      loading.value = false
    }
  }

  return { weather, loading, error, fetchWeather }
}
```

# Utilisation dans un composant

```vue
<!-- app/components/WeatherCard.vue -->
<script setup lang="ts">
const { weather, loading, error, fetchWeather } = useWeather()
onMounted(() => fetchWeather('Paris'))
</script>

<template>
  <v-card :loading="loading">
    <v-card-text v-if="weather">
      <v-icon :icon="weather.icon" size="48" />
      <div class="text-h4">{{ weather.temperature }}°C</div>
      <div>{{ weather.description }}</div>
      <div>Ressenti {{ weather.feelsLike }}°C · Vent {{ weather.windSpeed }} km/h</div>
    </v-card-text>
    <v-alert v-if="error" type="error" :text="error" />
  </v-card>
</template>
```

# Ce que l'Adapter résout concrètement

Sans Adapter, le composant devrait connaître :
- Que `wind.speed` est en m/s et doit être multiplié par 3.6
- Que `dt` est un timestamp Unix à convertir
- Que les icônes OWM `'01d'` correspondent à `mdi-weather-sunny`
- Que `description` commence en minuscule

Avec l'Adapter, le composant reçoit des données déjà normalisées —
si on change d'API météo (AccuWeather, Météo-France), seul l'Adapter change.