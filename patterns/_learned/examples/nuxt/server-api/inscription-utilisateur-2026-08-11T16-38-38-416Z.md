# Exemple appris — server-api (nuxt)

> Fichier d'origine : `server/api/auth/login.post.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — endpoint pour la connexion utilisateur — vérifie les données, crée une session

## Ce qui a été corrigé

L'endpoint lève systématiquement une erreur 401 sans jamais créer de session, rendant la connexion impossible même avec des identifiants valides. Le flux doit être corrigé pour permettre la vérification et la création de session.

```
import { defineEventHandler, readBody, createError } from 'h3';
import { setUserSession } from '#auth-utils';
import { loginSchema } from '~/shared/types/auth';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Données invalides' });
  }

  // TODO: remplacer par une vraie vérification en base de données
  // const user = await db.users.findByEmail(parsed.data.email);
  // if (!user || !await verifyPassword(parsed.data.password, user.passwordHash)) {
  //   throw createError({ statusCode: 401, statusMessage: 'Identifiants invalides' });
  // }
  // await setUserSession(event, { user: { id: user.id, email: user.email } });
  // return { success: true };

  throw createError({ statusCode: 501, statusMessage: 'Vérification en base de données non implémentée' });
});

```