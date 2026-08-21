# Exemple appris — server-api (nuxt)

> Fichier d'origine : `server/api/auth/register.post.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — endpoint pour l'inscription utilisateur — vérifie les données, crée une session

## Ce qui a été corrigé

`createUser` est appelée sans être importée ni définie, ce qui provoque une erreur d'exécution.

```
import { defineEventHandler, readBody, createError } from 'h3';
import { setUserSession } from '#auth-utils';
import { registerSchema } from '~/shared/types/auth';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Données invalides' });
  }

  // TODO: implémenter la création en base de données
  // Exemple:
  // import { hashPassword } from '~/server/utils/password';
  // const user = await db.users.create({
  //   name: parsed.data.name,
  //   email: parsed.data.email,
  //   passwordHash: await hashPassword(parsed.data.password),
  // });
  // await setUserSession(event, { user: { id: user.id, email: user.email } });
  // return { success: true, message: 'Utilisateur créé avec succès' };

  throw createError({ statusCode: 501, statusMessage: 'Création en base de données non implémentée' });
});

```