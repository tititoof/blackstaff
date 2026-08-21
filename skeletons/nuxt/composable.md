```typescript
// __RESOURCE_PLURAL__ composable — squelette CRUD complet.
// __API_BASE_URL__ doit être remplacé par l'URL EXACTE de la table de
// routage API déjà injectée dans ce prompt (ex: '/api/articles') —
// jamais recalculée depuis le nom de la ressource. Ne pas ajouter de
// logique de redirection ici — c'est le rôle de la page appelante.
export function use__RESOURCE__s() {
  const items = ref([]);
  const item = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function fetchAll(page) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await useFetch('__API_BASE_URL__', {
        query: page ? { page } : undefined,
      });
      items.value = data.value;
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(id) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await useFetch(`__API_BASE_URL__/${id}`);
      item.value = data.value;
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  }

  async function create(payload) {
    loading.value = true;
    error.value = null;
    try {
      return await $fetch('__API_BASE_URL__', { method: 'POST', body: payload });
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function update(id, payload) {
    loading.value = true;
    error.value = null;
    try {
      return await $fetch(`__API_BASE_URL__/${id}`, { method: 'PATCH', body: payload });
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function remove(id) {
    loading.value = true;
    error.value = null;
    try {
      await $fetch(`__API_BASE_URL__/${id}`, { method: 'DELETE' });
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { items, item, loading, error, fetchAll, fetchOne, create, update, remove };
}
```

⚠️ Remplace `__RESOURCE__`/`__RESOURCE_PLURAL__` par le nom réel de la
ressource (ex: `useArticles`) et **toutes** les occurrences de
`__API_BASE_URL__` par l'URL exacte de la table de routage — ce sont des
marqueurs littéraux à remplacer, jamais du code à exécuter tel quel.
Ne change pas la structure des 5 fonctions (mêmes états `loading`/`error`
gérés partout, mêmes noms de fonctions).
