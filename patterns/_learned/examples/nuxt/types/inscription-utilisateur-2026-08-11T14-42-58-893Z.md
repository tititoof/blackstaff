# Exemple appris — types (nuxt)

> Fichier d'origine : `shared/types/user.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — interface utilisateur retournée par le backend/la source d'authentification — énumère les champs réels (id: number, email: string)

## Ce qui a été corrigé

Le fichier user.ts est absent alors qu'il est requis par la description (interface User avec id: number, email: string).

```
export interface User {
  id: number;
  email: string;
}
```