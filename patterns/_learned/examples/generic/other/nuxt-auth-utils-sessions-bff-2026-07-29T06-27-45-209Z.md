# Exemple appris — other (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — clés auth: email, password, submit_login, etc.

## Ce qui a été corrigé

Fichier absent de la génération.

```
export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'fr',
  messages: {
    fr: {
      auth: {
        login: 'Connexion',
        register: 'Inscription',
        email: 'Adresse e-mail',
        password: 'Mot de passe',
        first_name: 'Prénom',
        last_name: 'Nom',
        confirm_password: 'Confirmer le mot de passe',
        submit_login: 'Se connecter',
        submit_register: "S'inscrire",
        invalid_credentials: 'Email ou mot de passe incorrect',
        register_failed: "Échec de l'inscription",
        confirm_password_required: 'Veuillez confirmer votre mot de passe',
        passwords_mismatch: 'Les mots de passe ne correspondent pas',
      },
    },
    en: {
      auth: {
        login: 'Login',
        register: 'Register',
        email: 'Email address',
        password: 'Password',
        first_name: 'First name',
        last_name: 'Last name',
        confirm_password: 'Confirm password',
        submit_login: 'Sign in',
        submit_register: 'Sign up',
        invalid_credentials: 'Invalid email or password',
        register_failed: 'Registration failed',
        confirm_password_required: 'Please confirm your password',
        passwords_mismatch: 'Passwords do not match',
      },
    },
  },
}));

```