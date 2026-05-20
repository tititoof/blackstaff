# Contexte — chartman2.fr

## Identité
- Auteur : Christophe Hartmann
- Type : Vitrine freelance technique
- Dépôt : https://github.com/tititoof/chartman2-fr
- Site : https://chartman2-fr.ovh
- Licence : MIT

---

## Architecture globale

Nuxt 3 est le frontend. Ruby on Rails est le backend API.
Le token JWT ne touche JAMAIS le JavaScript côté client.
Nitro (server/) agit comme proxy entre le browser et Rails.
Le token JWT vit uniquement dans un cookie httpOnly côté Nitro.

```
Browser                  Nitro (server/)              Rails API
  │                            │                          │
  │── POST /api/auth/login ───→│                          │
  │                            │── POST /auth/login ─────→│
  │                            │←── { token, user } ──────│
  │←── { user } ───────────────│  Set-Cookie:             │
  │    cookie httpOnly         │  auth_token=eyJ...       │
  │    secure, sameSite        │  httpOnly; secure        │
  │                            │                          │
  │── GET /api/articles ──────→│                          │
  │   (cookie auto)            │── Authorization ────────→│
  │                            │   Bearer eyJ...          │
  │←── { articles } ───────────│←── { articles } ─────────│
```

---

## Architecture layer-based

```
/components     → UI pure, présentation uniquement
/composables    → logique métier, appels via useApi (→ Nitro)
/stores         → état global Pinia (user uniquement, jamais le token)
/pages          → routes, orchestration, pas de logique métier
/layouts        → structure globale
/middleware     → guards de navigation (auth, guest)
/server
  /api
    /auth
      login.post.ts     → proxy login → Rails, set cookie httpOnly
      logout.delete.ts  → proxy logout → Rails, delete cookie
      me.get.ts         → vérifie le cookie, retourne le user
    /articles
      index.get.ts      → proxy GET /articles → Rails
      index.post.ts     → proxy POST /articles → Rails
      [id].get.ts       → proxy GET /articles/:id → Rails
      [id].put.ts       → proxy PUT /articles/:id → Rails
      [id].delete.ts    → proxy DELETE /articles/:id → Rails
/types          → types globaux PascalCase
/utils          → fonctions pures uniquement
```

---

## Matrice composable vs store

| Situation                        | Composable | Store     |
|----------------------------------|------------|-----------|
| User connecté                    | ❌          | ✅        |
| isAuthenticated                  | ❌          | ✅        |
| Token JWT                        | ❌ jamais   | ❌ jamais |
| État partagé entre pages         | ❌          | ✅        |
| Appels API (CRUD)                | ✅          | ❌        |
| Logique métier locale            | ✅          | ❌        |

---

## Règles par layer

### Components
- Présentation uniquement, aucune logique métier
- Aucun appel $fetch ou useApi direct
- Props et emits strictement typés
- Maximum 200 lignes

### Composables
- Préfixe `use` obligatoire
- Contient toute la logique d'appel API via useApi
- Maximum 20 lignes par fonction interne
- Un composable par domaine métier (useArticles, useAuth, useApi)

### Stores (Pinia)
- useAuthStore : user uniquement, jamais le token
- Autres stores uniquement si état partagé entre plusieurs pages
- Pas de logique d'appel API dans les stores
- Pas de persist (rehydratation via plugin auth.ts)

### Pages
- Orchestration uniquement
- useAsyncData pour les données SSR
- definePageMeta avec middleware approprié
- Délèguent aux composables et composants

### Server (Nitro)
- Proxy vers Rails uniquement
- Gestion du cookie httpOnly
- Validation des entrées avant de transmettre à Rails
- Jamais de logique métier propre à Nitro

### Utils
- Fonctions pures uniquement
- Exemples : formatDate, truncate, slugify
- Aucun accès aux stores ou composables

---

## Conventions de nommage
- Composants : PascalCase.vue
- Composables : useNomExplicite.ts
- Types / Interfaces : PascalCase
- Variables et fonctions : camelCase
- Pas de `any`, jamais
- Strict mode TypeScript activé
- Endpoints Rails : snake_case (author_id, created_at)
- Props Nuxt : camelCase côté TS, kebab-case dans les templates
- Routes Nitro proxy : miroir des routes Rails (/api/articles → /api/v1/articles)

---

## Sécurité
- Token JWT stocké UNIQUEMENT dans cookie httpOnly côté Nitro
- Jamais de token dans Pinia, localStorage, sessionStorage, ou URL
- railsApiBase est privé — jamais dans runtimeConfig.public
- credentials: 'include' obligatoire dans tous les appels useApi
- Validation des entrées dans chaque handler Nitro avant appel Rails
- setCookie avec httpOnly: true, secure: true, sameSite: 'strict'