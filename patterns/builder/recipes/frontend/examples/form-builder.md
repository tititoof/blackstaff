---
type: Example
title: Builder Nuxt — exemple Formulaire multi-étapes
tags: [nuxt, frontend, builder, form, composite]
---

# Application du pattern sur un formulaire multi-étapes

Construit un formulaire complexe étape par étape (wizard), avec un
Director qui encapsule les recettes de formulaire réutilisables.
Cas "composite" : la structure interne (sections, champs) est assemblée
progressivement.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Form` |
| `{Product}` | `FormConfig` (structure du formulaire) |
| `{Builder}Interface` | `FormBuilderInterface` |
| `{ConcreteA}{Builder}` | `RegistrationFormBuilder` |
| `{ConcreteB}{Builder}` | `CheckoutFormBuilder` |
| `{Director}` | `FormDirector` |
| `stepA` | `addPersonalInfoSection()` |
| `stepB` | `addAddressSection()` |
| `stepC` | `addPaymentSection()` |
| `stepD` | `addConfirmationStep()` |

# Structure concrète des fichiers

```
app/builders/forms/
├── types.ts
│     FormField = { name, type, label, rules, placeholder? }
│     FormSection = { title, fields: FormField[], optional?: boolean }
│     FormConfig = { sections: FormSection[], submitLabel: string, steps: number }
├── RegistrationFormBuilder.ts
│     addPersonalInfoSection() → section: prénom, nom, email, mot de passe
│     addAddressSection()     → section: rue, ville, CP, pays
│     addConfirmationStep()   → step: CGU + récapitulatif
│     getResult(): FormConfig
├── CheckoutFormBuilder.ts
│     addPersonalInfoSection() → section: prénom, nom, email (sans mot de passe)
│     addAddressSection()     → section: adresse de livraison
│     addPaymentSection()     → section: CB, expiry, CVV
│     addConfirmationStep()   → step: récapitulatif commande
│     getResult(): FormConfig
└── FormDirector.ts
      buildRegistrationForm(builder):
        builder.reset()
               .addPersonalInfoSection()
               .addAddressSection()
               .addConfirmationStep()

      buildCheckoutForm(builder):
        builder.reset()
               .addPersonalInfoSection()
               .addAddressSection()
               .addPaymentSection()
               .addConfirmationStep()
```

# Composable

```ts
// composables/useFormBuilder.ts
import { RegistrationFormBuilder } from '~~/builders/forms/RegistrationFormBuilder'
import { CheckoutFormBuilder } from '~~/builders/forms/CheckoutFormBuilder'
import { FormDirector } from '~~/builders/forms/FormDirector'
import type { FormConfig } from '~~/builders/forms/types'

export function useFormBuilder() {
  const formConfig = ref<FormConfig | null>(null)
  const currentStep = ref(0)

  function buildRegistrationForm() {
    const builder = new RegistrationFormBuilder()
    const director = new FormDirector()
    director.buildRegistrationForm(builder)
    formConfig.value = builder.getResult()
    currentStep.value = 0
  }

  function buildCheckoutForm() {
    const builder = new CheckoutFormBuilder()
    const director = new FormDirector()
    director.buildCheckoutForm(builder)
    formConfig.value = builder.getResult()
    currentStep.value = 0
  }

  const currentSection = computed(() =>
    formConfig.value?.sections[currentStep.value] ?? null
  )

  const totalSteps = computed(() =>
    formConfig.value?.sections.length ?? 0
  )

  function nextStep() {
    if (currentStep.value < totalSteps.value - 1) currentStep.value++
  }

  function prevStep() {
    if (currentStep.value > 0) currentStep.value--
  }

  return {
    formConfig,
    currentSection,
    currentStep,
    totalSteps,
    buildRegistrationForm,
    buildCheckoutForm,
    nextStep,
    prevStep,
  }
}
```

# Utilisation dans un composant Wizard

```vue
<!-- pages/register.vue -->
<script setup lang="ts">
const {
  currentSection,
  currentStep,
  totalSteps,
  buildRegistrationForm,
  nextStep,
  prevStep,
} = useFormBuilder()

onMounted(() => buildRegistrationForm())
</script>

<template>
  <div v-if="currentSection">
    <div class="steps-indicator">
      Étape {{ currentStep + 1 }} / {{ totalSteps }}
    </div>

    <h2>{{ currentSection.title }}</h2>

    <v-form>
      <template v-for="field in currentSection.fields" :key="field.name">
        <v-text-field
          v-if="field.type === 'text' || field.type === 'email'"
          :label="field.label"
          :type="field.type"
          :placeholder="field.placeholder"
        />
        <v-text-field
          v-else-if="field.type === 'password'"
          :label="field.label"
          type="password"
        />
        <!-- autres types de champs -->
      </template>
    </v-form>

    <div class="navigation">
      <v-btn v-if="currentStep > 0" @click="prevStep">Précédent</v-btn>
      <v-btn v-if="currentStep < totalSteps - 1" color="primary" @click="nextStep">
        Suivant
      </v-btn>
      <v-btn v-else color="success" type="submit">Valider</v-btn>
    </div>
  </div>
</template>
```

# Pourquoi Builder ici (cas composite)

Le formulaire est un objet composite (sections → champs) construit
progressivement. Le Director encapsule les recettes de formulaire
(inscription vs checkout) qui partagent certaines sections mais les
configurent différemment. Sans Builder, la config du formulaire serait
codée en dur dans chaque page — impossible de réutiliser et tester
la structure indépendamment du rendu.