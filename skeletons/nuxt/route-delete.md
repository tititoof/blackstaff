```typescript
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const config = useRuntimeConfig();

  try {
    await $fetch(`${config.backendBaseUrl}__BACKEND_RESOURCE_PATH__/${id}`, { method: 'DELETE' });
    setResponseStatus(event, 204);
    return null;
  } catch (e) {
    throw createError({ statusCode: e.statusCode ?? 502, statusMessage: 'Erreur backend' });
  }
});
```

⚠️ Remplace `__BACKEND_RESOURCE_PATH__`. Retourne 204 sans corps si le
backend confirme la suppression — n'invente pas de corps de réponse non
prévu par le contrat.
