---
type: Example
title: Prototype Nuxt — exemple Composant UI paramétré (widget dupliqué)
tags: [nuxt, frontend, prototype, component, ui, widget]
---

# Application du pattern sur un widget de dashboard

Dupliquer un widget de dashboard existant pour en créer une variante
avec une configuration légèrement différente — sans recréer la configuration
complète depuis zéro.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Prototype}` | `DashboardWidget` |
| `{Child}` | `WidgetDataSource` |
| Override post-clone | `title: "${title} (copie)"`, `position: auto-calculée` |

# Modèle TypeScript

```ts
// app/models/dashboardWidget.ts
export type WidgetType = 'chart' | 'stats' | 'table' | 'map'

export class WidgetDataSource implements Cloneable<WidgetDataSource> {
  constructor(
    public endpoint: string,
    public filters: Record<string, unknown>,
    public refreshInterval: number,   // secondes
  ) {}

  clone(): WidgetDataSource {
    return new WidgetDataSource(
      this.endpoint,
      { ...this.filters },            // copie de niveau 1 du filtre
      this.refreshInterval,
    )
  }
}

export class DashboardWidget implements Cloneable<DashboardWidget> {
  constructor(
    public id: string | null,
    public type: WidgetType,
    public title: string,
    public position: { x: number; y: number; w: number; h: number },
    public dataSource: WidgetDataSource,
    public displayOptions: Record<string, unknown>,
  ) {}

  clone(): DashboardWidget {
    return new DashboardWidget(
      null,                                  // nouvel id généré localement
      this.type,
      `${this.title} (copie)`,
      {                                      // décaler légèrement la position
        ...this.position,
        x: this.position.x + 1,
        y: this.position.y + 1,
      },
      this.dataSource.clone(),               // clone profond de la source de données
      structuredClone(this.displayOptions),  // copie profonde des options d'affichage
    )
  }

  // Id local (non persisté) pour les besoins du rendu Vue
  static createLocalId(): string {
    return `widget-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  static fromApi(data: unknown): DashboardWidget {
    const d = data as Record<string, unknown>
    const ds = d.data_source as Record<string, unknown>
    return new DashboardWidget(
      d.id as string,
      d.type as WidgetType,
      d.title as string,
      d.position as DashboardWidget['position'],
      new WidgetDataSource(
        ds.endpoint as string,
        ds.filters as Record<string, unknown>,
        ds.refresh_interval as number,
      ),
      d.display_options as Record<string, unknown>,
    )
  }
}
```

# Composable de gestion du dashboard

```ts
// composables/useDashboard.ts
import { DashboardWidget } from '~~/models/dashboardWidget'

export function useDashboard() {
  const widgets = ref<DashboardWidget[]>([])
  const loading = ref(false)

  async function loadWidgets(dashboardId: number) {
    const data = await $fetch<unknown[]>(`/api/dashboards/${dashboardId}/widgets`)
    widgets.value = data.map(DashboardWidget.fromApi)
  }

  function duplicateWidget(original: DashboardWidget): DashboardWidget {
    // Clonage local immédiat — pas d'appel API synchrone
    // Le clone est ajouté à la liste locale avec un id temporaire
    const clone = original.clone()
    clone.id = DashboardWidget.createLocalId()
    widgets.value.push(clone)
    return clone
  }

  async function saveWidget(widget: DashboardWidget, dashboardId: number) {
    loading.value = true
    try {
      const saved = await $fetch<unknown>(`/api/dashboards/${dashboardId}/widgets`, {
        method: 'POST',
        body: {
          type:            widget.type,
          title:           widget.title,
          position:        widget.position,
          data_source:     { endpoint: widget.dataSource.endpoint,
                             filters: widget.dataSource.filters,
                             refresh_interval: widget.dataSource.refreshInterval },
          display_options: widget.displayOptions,
        },
      })
      // Remplacer le widget temporaire par celui persisté (avec le vrai id)
      const savedWidget = DashboardWidget.fromApi(saved as Record<string, unknown>)
      const idx = widgets.value.findIndex(w => w.id === widget.id)
      if (idx !== -1) widgets.value.splice(idx, 1, savedWidget)
      return savedWidget
    } finally {
      loading.value = false
    }
  }

  return { widgets, loading, loadWidgets, duplicateWidget, saveWidget }
}
```

# Composant dashboard avec duplication

```vue
<!-- app/components/Dashboard.vue -->
<script setup lang="ts">
const props = defineProps<{ dashboardId: number }>()
const { widgets, loading, loadWidgets, duplicateWidget, saveWidget } = useDashboard()

onMounted(() => loadWidgets(props.dashboardId))

async function handleDuplicate(widget: DashboardWidget) {
  const clone = duplicateWidget(widget)    // 1. Clone local immédiat (UX fluide)
  await saveWidget(clone, props.dashboardId)  // 2. Persistance asynchrone
}
</script>

<template>
  <div class="dashboard-grid">
    <div
      v-for="widget in widgets"
      :key="widget.id"
      :style="{
        gridColumn: `${widget.position.x} / span ${widget.position.w}`,
        gridRow:    `${widget.position.y} / span ${widget.position.h}`,
      }"
    >
      <WidgetFactory :type="widget.type" :title="widget.title"
                     :data-source="widget.dataSource" />
      <button :disabled="loading" @click="handleDuplicate(widget)">
        Dupliquer ce widget
      </button>
    </div>
  </div>
</template>
```

# Différence avec l'exemple entité métier

L'entité métier (`Order`) est toujours persistée immédiatement après le clone.
Le widget de dashboard illustre un cas **optimiste** : le clone est ajouté
à l'UI instantanément avec un id temporaire local, puis la persistance
backend se fait en arrière-plan — l'utilisateur voit le résultat immédiatement
sans attendre la réponse réseau.

Ce pattern "clone local → persist async" est courant pour les éditeurs de
type "canvas" ou "drag and drop" où la réactivité UI est critique.