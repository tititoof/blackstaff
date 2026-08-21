# Exemple appris — types (nuxt)

> Fichier d'origine : `shared/types/auth.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — loginSchema + registerSchema en Zod, types dérivés via z.infer — champs adaptés au besoin réel de la tâche (email: string (format email), password: string (min 8))

## Ce qui a été corrigé

Les types LoginInput et RegisterInput sont déclarés mais non exportés, les rendant inutilisables en dehors du fichier.

```
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```