```typescript
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const config = useRuntimeConfig();

  try {
    return await $fetch(`${config.backendBaseUrl}__BACKEND_RESOURCE_PATH__/${id}`);
  } catch (e) {
    // Ne pas absorber silencieusement un 404 backend — le propager tel quel.
    throw createError({ statusCode: e.statusCode ?? 502, statusMessage: e.statusMessage ?? 'Erreur backend' });
  }
});
```

⚠️ Remplace `__BACKEND_RESOURCE_PATH__` par la valeur exacte du contrat.
Un 404 du backend doit rester un 404 côté Nuxt, jamais transformé en 200
avec un corps vide.
