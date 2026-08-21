```typescript
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Données invalides' });
  }

  const config = useRuntimeConfig();
  try {
    return await $fetch(`${config.backendBaseUrl}__BACKEND_RESOURCE_PATH__/${id}`, {
      method: 'PATCH',
      body: parsed.data,
    });
  } catch (e) {
    throw createError({ statusCode: e.statusCode ?? 502, statusMessage: 'Erreur backend' });
  }
});
```

⚠️ Mêmes règles que la route de création (validation avant tout appel
backend) — remplace `__BACKEND_RESOURCE_PATH__` et `updateSchema`.
