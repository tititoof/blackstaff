# Gabarit de tâche — pattern auth

Une tâche qui touche à l'authentification doit systématiquement inclure :

## Fichiers attendus

- app/middleware/auth.ts (garde de route — TOUJOURS présent si des pages doivent être
  protégées)

  ⚠️ La garde d'authentification est TOUJOURS un fichier middleware (`definePageMeta({
  middleware: 'auth' })` côté page), JAMAIS un composable. Un composable nommé
  `useAuthApi`/`useAuth`/équivalent sert aux appels login/register/logout, PAS à
  protéger une route — ne jamais confondre les deux responsabilités dans un seul fichier.

- server/api/auth/login.post.ts, register.post.ts, logout.delete.ts (si pas déjà existants)
- app/composables/useAuthApi.ts (signIn, signUp, signOut — UNIQUEMENT ces appels réseau,
  aucune logique de garde de route ici)

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