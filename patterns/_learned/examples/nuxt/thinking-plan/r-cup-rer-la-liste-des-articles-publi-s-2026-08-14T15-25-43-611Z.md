# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Récupérer la liste des articles publiés — Implémenter un endpoint qui retourne la liste des articles avec leurs id, titre, contenu et date de publication

## Ce qui a été corrigé

Plan approuvé par Claude (score 88/100) — Plan cohérent et proportionné pour un CRUD lecture seule : les 6 fichiers couvrent bien les 2 endpoints, le composable et les 2 pages. Les deux points mineurs (comportement sur validation échouée côté serveur, source de données non spécifiée) n'empêchent pas la génération mais peuvent produire du code à compléter manuellement.

```
TITRE: Récupérer la liste des articles publiés

## Objectif

Afficher une liste d'articles avec leurs informations essentielles (identifiant, titre, contenu, date de publication).

_Choix d'architecture : Gestion complète d'une ressource persistée (articles) avec lecture seule — list() et get() exposés, create/update/remove non pertinents car l'utilisateur ne crée/modifie/supprime pas lui-même les articles (ils sont publiés par un système externe ou un admin). Structure minimale CRUD lecture seule : 1 type partagé, 1 composable avec list/get, 2 pages (index et détail), 2 endpoints serveur (GET)._

## Fichiers à générer

### Types

- shared/types/article.ts (Schéma Zod Article : id: number, title: string (min 1), content: string (min 1), publishedAt: string (ISO 8601 datetime). Exporte articleSchema (validation complète) et type Article dérivé via z.infer.) [utilise: zod]

### Composables

- app/composables/useArticles.ts (Composable de gestion des articles. Exporte : list(): Promise<Article[]> (récupère tous les articles publiés), get(id: number): Promise<Article> (récupère un article par son id). Utilise $fetch pour appeler les endpoints serveur.) [utilise: $fetch]

### Pages

- app/pages/articles/index.vue (Page de liste des articles publiés. Affiche un tableau/liste avec id, titre, contenu et date de publication. Utilise useArticles().list() au montage. Chaque article est un lien vers sa page de détail ([id].vue). Gère les états de chargement et d'erreur.) [utilise: useArticles]
- app/pages/articles/[id].vue (Page de détail d'un article. Affiche l'article complet (id, titre, contenu, date de publication). Utilise useArticles().get(id) au montage avec l'id extrait de la route. Gère les états de chargement et d'erreur. Inclut un lien de retour vers la liste.) [utilise: useArticles]

### Server

- server/api/articles/index.get.ts (Endpoint GET /api/articles — retourne la liste complète des articles publiés. Récupère les données depuis la source persistante (base de données ou équivalent) et les valide contre articleSchema avant de les retourner. Pas de paramètres de requête, pas de filtrage côté serveur (retourne tous les articles).)
- server/api/articles/[id].get.ts (Endpoint GET /api/articles/[id] — retourne un article spécifique par son id. Récupère l'article depuis la source persistante, valide contre articleSchema, et le retourne. Si l'article n'existe pas, retourne une erreur 404.)

## Table de routage API (calculée — ne jamais réinventer une URL depuis un chemin de fichier)

- server/api/articles/index.get.ts -> GET /api/articles
- server/api/articles/[id].get.ts -> GET /api/articles/:id

⚠️ Toute page qui consomme une de ces routes doit utiliser EXACTEMENT l'URL ci-dessus (ex: useFetch('/api/articles')) — jamais le chemin du fichier serveur.

## Entités principales

Article

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```