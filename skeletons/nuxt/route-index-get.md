```typescript
// __API_BASE_URL__ = chemin de CE fichier converti (déjà calculé, visible
// dans la table de routage injectée). __BACKEND_RESOURCE_PATH__ = chemin
// exact chez le backend (contract.backendResourcePath) — jamais deviné.
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig();

  try {
    return await $fetch(`${config.backendBaseUrl}__BACKEND_RESOURCE_PATH__`, {
      query, // transmet tel quel (pagination incluse) — aucune transformation
    });
  } catch (e) {
    throw createError({ statusCode: e.statusCode ?? 502, statusMessage: 'Erreur backend' });
  }
});
```

⚠️ Remplace `__BACKEND_RESOURCE_PATH__` par la valeur exacte du contrat.
Aucun accès base de données direct ici si un backend séparé est déclaré —
ce fichier ne fait QUE proxier. Ne transforme jamais la forme de la
réponse (`responseFormat` du contrat), retourne-la telle quelle.
