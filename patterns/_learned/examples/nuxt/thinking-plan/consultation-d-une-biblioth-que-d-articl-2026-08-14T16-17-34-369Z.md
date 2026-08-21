# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Consultation d'une bibliothèque d'articles publiés — 
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

## Ce qui a été corrigé

Plan approuvé par Claude (score 88/100) — Plan cohérent et proportionné pour une ressource lecture seule : types, composable, pages et endpoints couvrent exactement le besoin sans sur-ingénierie. Deux points mineurs à clarifier (source de données serveur, affichage du content en liste) mais aucun bloquant.

```
TITRE: Consultation d'une bibliothèque d'articles publiés

## Objectif

Permettre aux utilisateurs de consulter une liste d'articles publiés et de lire le détail de chaque article. Les articles sont gérés par un système externe ou un administrateur — l'utilisateur ne peut que les lire.

_Choix d'architecture : Ressource en lecture seule (pas de create/update/delete utilisateur) — structure minimale suffisante : un composable pour les appels GET, deux pages (liste et détail) sans formulaire ni CRUD._

## Fichiers à générer

### Types

- shared/types/article.ts (Schéma Zod Article : id: number, title: string, content: string, publishedAt: string (ISO 8601). Exporte articleSchema et type Article dérivé via z.infer.) [utilise: zod]

### Composables

- app/composables/useArticles.ts (Composable de lecture seule : list(): Promise<Article[]> (récupère tous les articles publiés), get(id: number): Promise<Article> (récupère un article par id). Gère les états de chargement et d'erreur.) [utilise: $fetch]

### Pages

- app/pages/articles/index.vue (Page de liste des articles publiés. Affiche id, titre, contenu et date de publication pour chaque article. Chaque article est cliquable et mène à sa page de détail. Gère les états de chargement et d'erreur.) [utilise: useArticles]
- app/pages/articles/[id].vue (Page de détail d'un article. Affiche l'article complet (id, titre, contenu, date de publication). Propose un lien de retour vers la liste. Gère les états de chargement et d'erreur. Retourne une erreur 404 si l'article n'existe pas.) [utilise: useArticles]

### Server

- server/api/articles/index.get.ts (Endpoint GET /api/articles — retourne la liste complète des articles publiés au format Article[].)
- server/api/articles/[id].get.ts (Endpoint GET /api/articles/[id] — retourne un article spécifique par son id. Retourne une erreur 404 si l'article n'existe pas ou n'est pas publié.)

## Table de routage API (calculée — ne jamais réinventer une URL depuis un chemin de fichier)

- server/api/articles/index.get.ts -> GET /api/articles
- server/api/articles/[id].get.ts -> GET /api/articles/:id

⚠️ Toute page qui consomme une de ces routes doit utiliser EXACTEMENT l'URL ci-dessus (ex: useFetch('/api/articles')) — jamais le chemin du fichier serveur.

## Entités principales

Article

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```