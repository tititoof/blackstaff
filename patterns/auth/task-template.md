# Gabarit de tâche — pattern auth

Une tâche qui touche à l'authentification doit systématiquement inclure :

## Architecture — BFF (Backend For Frontend) si un backend séparé existe

⚠️ Si ce projet a un backend séparé déclaré (Rails/Laravel/Symfony, via `related` dans
`.blackstaff/index.md` ou mentionné dans l'instruction), l'authentification suit
TOUJOURS le pattern **BFF** : le serveur Nuxt s'intercale entre le browser et le
backend — le browser n'appelle JAMAIS le backend directement, ni ne voit ses tokens.

- Les tokens du backend (`{backend}_token`, `{backend}_refresh_token` ou équivalent)
  vivent EXCLUSIVEMENT dans la partie `secure` de la session Nuxt (`session.secure`) —
  jamais envoyés au browser, jamais accessibles côté client.
- Seules des infos minimales et non sensibles (id, email) vivent dans `session.user`,
  accessible côté client via `useUserSession().user`.
- Si aucun backend séparé n'est déclaré (auth 100% Nuxt, ex: base de données directe
  via un ORM Nuxt), le pattern BFF ne s'applique pas — utilise une session Nuxt classique
  sans cette séparation client/serveur des tokens.

## Fichiers attendus

### Types

⚠️ COMME POUR LE PATTERN CRUD : schéma Zod OBLIGATOIRE comme source de vérité, type
TypeScript dérivé via `z.infer` — JAMAIS d'interface TypeScript manuscrite pour les
données de formulaire. Énumère les champs CONCRETS dans la description de chaque
fichier (ex: "email: string (format email), password: string (min 8)") — jamais une
description vague du style "interfaces de formulaire".

- shared/types/auth.ts (loginSchema + registerSchema en Zod, types dérivés via z.infer
  — champs adaptés au besoin réel de la tâche, ne les invente pas s'ils ne sont pas
  mentionnés, mais énumère-les explicitement : ex "email: string (format email),
  password: string (min 8)")
- shared/types/user.ts (interface utilisateur retournée par le backend/la source
  d'authentification — énumère les champs réels : id, email, et tout champ
  effectivement exposé)
- shared/types/session.d.ts (UNIQUEMENT si pattern BFF : augmentation de type pour
  `#auth-utils`, déclare la forme exacte de `UserSession.user` et `UserSession.secure`)

### Pages

⚠️ TOUJOURS présentes dès que la tâche mentionne connexion/inscription — ce n'est PAS
optionnel, même si le reste du plan se concentre sur l'API. Un formulaire mentionné
dans le titre/objectif de la tâche SANS page correspondante est un plan incomplet.

- app/pages/login.vue (formulaire de connexion — email + mot de passe, validation,
  redirection vers la page principale après succès) — UNIQUEMENT si la tâche
  mentionne la connexion
- app/pages/register.vue (formulaire d'inscription — champs adaptés au besoin réel,
  redirection vers la page principale après succès) — UNIQUEMENT si la tâche
  mentionne l'inscription

  ⚠️ Ces pages utilisent `definePageMeta({ layout: false })` (ou équivalent) — pas de
  barre de navigation/layout principal pour un visiteur non connecté.

### Utilitaire backend partagé (UNIQUEMENT si pattern BFF)

⚠️ Ne génère CE fichier QUE si l'instruction mentionne EXPLICITEMENT un backend séparé,
un token à protéger, ou un renouvellement automatique — PAS par défaut pour toute tâche
auth. Si l'instruction ne parle que de "vérifier et stocker en base" sans mention de
backend/token/session à protéger, ce fichier est de la sur-ingénierie : NE LE GÉNÈRE PAS.

- server/utils/{backend}-client.ts (client HTTP partagé par toutes les routes serveur
  qui appellent le backend — récupère le token depuis la session, gère le retry
  automatique sur 401 via le refresh token)

  ⚠️ Logique de retry OBLIGATOIRE si un refresh_token existe dans la session : sur une
  réponse 401 du backend, tente UNE SEULE fois de renouveler le token via le refresh
  token avant de réessayer la requête originale. Si le renouvellement échoue aussi,
  efface la session (`clearUserSession`) et renvoie 401 au client — ne boucle jamais
  indéfiniment sur les tentatives de renouvellement.

### Middleware

- app/middleware/auth.ts (garde de route — TOUJOURS présent si des pages doivent être
  protégées)

  ⚠️ La garde d'authentification est TOUJOURS un fichier middleware (`definePageMeta({
  middleware: 'auth' })` côté page), JAMAIS un composable. Un composable nommé
  `useAuthApi`/`useAuth`/équivalent sert aux appels login/register/logout, PAS à
  protéger une route — ne jamais confondre les deux responsabilités dans un seul fichier.

### Server API

- server/api/auth/login.post.ts, register.post.ts, logout.delete.ts (si pas déjà existants)

  ⚠️ Ces trois endpoints n'ont PAS la même logique de session — ne jamais leur appliquer
  la même règle par automatisme :
  - `login.post.ts` et `register.post.ts` CRÉENT une session (via `setUserSession()`
    ou équivalent) — ils ne vérifient JAMAIS `getUserSession()` en précondition. Exiger
    une session existante pour pouvoir se connecter/s'inscrire est un non-sens logique
    (deadlock : impossible de se connecter sans être déjà connecté).
  - `logout.delete.ts` (et UNIQUEMENT lui, parmi ces trois) lit la session existante
    (`getUserSession()`) pour savoir quoi invalider, puis appelle `clearUserSession()`.
    Si pattern BFF : tente aussi de révoquer le token côté backend — en best-effort
    (si ça échoue car la session est déjà expirée côté backend, efface quand même la
    session Nuxt plutôt que de bloquer la déconnexion).
  - La vérification `getUserSession(event)` "avant d'exécuter l'opération" mentionnée
    plus bas dans ce gabarit concerne les endpoints CRUD PROTÉGÉS (create/update/delete
    d'une ressource métier), PAS les trois endpoints auth eux-mêmes.
  - Si pattern BFF : `login.post.ts`/`register.post.ts` appellent le backend
    directement (pas via le client partagé `{backend}-client.ts`, qui suppose déjà une
    session existante pour lire un token — login/register n'en ont pas encore).

### Composable

- app/composables/useAuthApi.ts (signIn, signUp, signOut — UNIQUEMENT ces appels réseau
  vers les server routes Nuxt ci-dessus, aucune logique de garde de route ici, et
  AUCUN appel direct au backend si pattern BFF — toujours via les server routes)

## Si cette tâche combine `auth` avec un pattern `crud`

Le middleware `auth.ts` doit être explicitement appliqué (via `definePageMeta({ middleware:
'auth' })` ou équivalent) sur les pages de création/édition/suppression de la ressource
CRUD concernée — voir le gabarit du pattern `crud` pour la liste exacte des pages à
protéger. Les endpoints serveur correspondants (POST/PATCH/DELETE de la ressource)
doivent vérifier la session via `getUserSession(event)` avant d'exécuter l'opération.
Ne protège PAS systématiquement les pages de lecture seule (liste, détail) sauf si
l'instruction le demande explicitement.

## Règles

- Si le pattern `auth` est résolu pour cette tâche, au MOINS UN élément de garde/protection
  (middleware, vérification de session) doit apparaître dans le plan — sinon ne PAS
  déclarer ce pattern comme utilisé.
- Toute page listée qui nécessite d'être connecté doit le mentionner explicitement dans
  sa description (ex: "nécessite une session active").
- Si pattern BFF : ne JAMAIS générer de code qui expose un token backend au browser
  (ni dans une réponse JSON d'une server route, ni dans `session.user`, ni dans un
  cookie non scellé) — c'est la règle la plus importante de ce gabarit, une violation
  ici est un problème de sécurité, pas juste une question de convention.