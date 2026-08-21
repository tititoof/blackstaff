# Exemple appris — server-api (nuxt)

> Fichier d'origine : `server/api/auth/register.post.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — endpoint pour l'inscription utilisateur — vérifie les données, crée une session

## Ce qui a été corrigé

registerSchema et createUser ne sont pas importés, ce qui provoque des erreurs runtime. La chaîne contient aussi une apostrophe non échappée causant une erreur de syntaxe.

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
  // Exemple: const user = await db.users.create({ name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) })
  try {
    // const user = await createUser(parsed.data);
    // await setUserSession(event, { user: { id: user.id, email: user.email } });
    return {
      success: true,
      message: 'Utilisateur créé avec succès',
    };
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Erreur lors de la création de l\'utilisateur' });
  }
});
```