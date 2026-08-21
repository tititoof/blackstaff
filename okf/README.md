# Bundle de connaissance OKF — Nuxt / Vuetify / Rails-Laravel-Symfony

## Ce que c'est

Un bundle au format OKF (Open Knowledge Format, Google Cloud, v0.1) : des
fichiers markdown avec frontmatter YAML, un champ `type` obligatoire, reliés
entre eux par des liens markdown classiques. Chaque fichier est un "concept"
autonome, consommable seul ou avec ses dépendances.

Ce bundle est **déjà câblé et testé** dans le workflow n8n `Blackstaff ·
Code Generator` (node `03f · OKF Concept Resolver`) — ce README documente
l'état réel, pas un plan à implémenter.

## Principe directeur

Un petit modèle (7-14B) suit bien une règle courte avec exemple, mais échoue
à *dériver* une information à partir du contexte (ex: calculer une URL
d'API depuis un chemin de fichier, choisir entre deux stratégies d'auth).

Règle appliquée partout : **tout ce qui est calculable ou doit être décidé
une fois est sorti du prompt du LLM**. Soit calculé en dur dans un node
Code n8n (mapping fichier → URL), soit posé comme fait déclaré dans
`.blackstaff/index.md` (version Nuxt, backend, stratégie d'auth) — jamais
réinféré par un LLM à l'exécution.

## Répartition des rôles — 4 sources, jamais redondantes

| Source | Rôle | Nature de l'info |
|---|---|---|
| `.blackstaff/index.md` (par projet) | Faits déclarés pour CE projet (version Nuxt, backend, stratégie auth, lib UI) | Déclaré une fois, jamais déduit |
| `reference-sheets/` (JSON) | Faits externes exacts (exports d'une lib, endpoints backend, props de composant) | Volatile, machine-précis |
| Ce bundle OKF (markdown) | Conventions et patterns du projet | Stable, narratif |
| MCP Nuxt / Vuetify | Doc à jour pour alimenter `reference-sheets/` | Volatile, versionnée par le package |

⚠️ Il n'y a **pas** de `config/project.md` dans ce bundle — cette info vit
dans `.blackstaff/index.md` (par projet), résolue automatiquement par le
pipeline. Avoir les deux créerait une source de vérité en double.

## Structure

```
frameworks/nuxt/     conventions Nuxt (routing fichier -> URL, par version)
backends/             conventions du backend (format de réponse Rails, pagination, erreurs)
integrations/         patterns d'intégration cross-système (nuxt-auth-utils <-> Devise)
patterns/             recettes de génération, un concept par fichier généré
contracts/            schémas JSON — deux familles distinctes (voir ci-dessous)
```

### `contracts/` — deux familles de schémas, pas doublon

- `auth-backend.schema.json`, `library.schema.json`, `ui-component.schema.json`
  — valident les **fiches de faits** (`reference-sheets/*.json`) : ce à
  quoi ressemble réellement une lib/un backend externe.
- `auth-contract.schema.json`, `crud-contract.schema.json` — valident le
  **contrat de décision par run** : quelle stratégie est active pour CETTE
  génération (dérivé des faits + de `.blackstaff/index.md`).

## Résolution des concepts (comment le pipeline choisit quoi charger)

La résolution se fait par **pattern de chemin de fichier exact** (verbe
HTTP + présence d'un segment dynamique pour les routes, nom de fichier pour
les pages), pas par correspondance de tags — deux recettes différentes
(`route-index-get.md` vs `route-delete.md`) peuvent partager les mêmes tags
sans que ce soit ambigu, la résolution ne s'appuie jamais sur ces tags pour
choisir entre elles.

## Stratégies d'auth disponibles

Trois patterns existent en parallèle dans `integrations/nuxt-auth-utils/` —
un seul doit être actif par projet, déclaré via `stack.backend.authProvider`
dans `.blackstaff/index.md` :

- [devise-jwt-pattern.md](./integrations/nuxt-auth-utils/devise-jwt-pattern.md)
- [devise-token-auth-pattern.md](./integrations/nuxt-auth-utils/devise-token-auth-pattern.md)
- [devise-session-csrf-pattern.md](./integrations/nuxt-auth-utils/devise-session-csrf-pattern.md)

Pour Laravel (Sanctum) et Symfony (json_login / Lexik JWT), voir
`reference-sheets/auth-backends/` — ces backends n'ont pas encore de
pattern OKF dédié (seulement leur fiche de faits), à ajouter si besoin.
