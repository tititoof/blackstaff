```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Valide le body AVANT tout appel backend — schéma à adapter aux
  // champs réels du contrat, jamais transmis brut sans validation.
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Données invalides' });
  }

  const config = useRuntimeConfig();
  try {
    return await $fetch(`${config.backendBaseUrl}__BACKEND_RESOURCE_PATH__`, {
      method: 'POST',
      body: parsed.data,
    });
  } catch (e) {
    throw createError({ statusCode: e.statusCode ?? 502, statusMessage: 'Erreur backend' });
  }
});
```

⚠️ Remplace `__BACKEND_RESOURCE_PATH__` et `createSchema` par le schéma
zod réel de la ressource (`shared/types/...`). Aucune logique métier ici
au-delà de la validation de forme — la règle métier est vérifiée par le
backend.
