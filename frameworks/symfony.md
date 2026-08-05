---
type: Framework
title: Symfony — conventions générales
tags: [symfony, backend]
---

# Rôle

Conventions de base pour tout projet Symfony, indépendamment du pattern
métier (auth, crud...) et de la version. Les patterns lient ici pour les
idiomes du framework ; pour les chemins exacts, voir
[Symfony 7.4 LTS](/frameworks/symfony/v7.md) (référence par défaut) ou
[Symfony 8.1](/frameworks/symfony/v8.md) (dernière version standard).

# Identité du framework

Symfony est un framework PHP modulaire — un ensemble de composants
réutilisables (Routing, Security, HttpFoundation...) assemblés via un
système de bundles, avec une configuration explicite (YAML, attributs
PHP) plutôt que des conventions implicites strictes.

# Gestionnaire de paquets

`composer`, généralement via Symfony Flex qui automatise l'installation
de configuration par défaut pour chaque bundle ajouté (`composer require
{bundle}` déclenche souvent une "recipe" Flex qui pose les fichiers de
config).

# Standard release vs LTS — comment choisir

| | Standard | LTS |
|---|---|---|
| Cadence | Tous les 6 mois (mai/novembre) | Tous les 2 ans |
| Support bugs+sécurité | 8 mois | 3 ans bugs + 1 an sécurité (4 ans total) |
| Quand choisir | Besoin des toutes dernières fonctionnalités, upgrade régulier accepté | Projet destiné à vivre longtemps sans suivi de version permanent |

Pour un projet sans contrainte particulière, partir sur la LTS — c'est la
référence par défaut de ce bundle.

# Conventions de structure (communes à toutes versions récentes)

| Concept | Convention |
|---|---|
| Entités Doctrine | `src/Entity/`, PascalCase singulier |
| Controllers | `src/Controller/`, routage par attributs `#[Route]` plutôt que YAML pour le code applicatif |
| Voters (autorisation fine) | `src/Security/Voter/` |
| Configuration des bundles | `config/packages/{bundle}.yaml` |
| Tests | `tests/`, PHPUnit, structure miroir de `src/` |

# Voters pour l'autorisation, jamais dans les controllers

Toute règle d'autorisation au-delà d'un rôle simple (`ROLE_ADMIN`) doit
passer par un Voter — jamais de logique conditionnelle d'autorisation
écrite directement dans un controller.

# Langue des noms

Tous les noms de fichiers, classes, méthodes et variables sont TOUJOURS en
anglais — même si l'instruction ou la description de la tâche est en
français. Traduire les termes métier soi-même (ex: "recherche" → "search",
"catégorie" → "category", "utilisateur" → "user"), en respectant les
conventions de casse PHP/Symfony standard : `PascalCase` pour les classes
et entités (`SearchCriteria.php`), `camelCase` pour les méthodes et
propriétés (`addKeyword()`). Aucun caractère accentué dans un nom de
fichier, une classe, une méthode ou une propriété d'entité.

# Pièges transverses (toute version, tout pattern)

- L'ordre des firewalls dans `security.yaml` est significatif — Symfony
  applique le premier qui matche le pattern d'URL, un firewall mal ordonné
  peut bloquer silencieusement une route censée être publique.
- Ne jamais committer les clés/secrets générés par environnement
  (clés JWT, `APP_SECRET` custom) — toujours dans `.env.local`, jamais
  dans `.env` versionné.
- Les migrations Doctrine (`migrations/`) ne doivent jamais être éditées
  après avoir été jouées en production — créer une nouvelle migration.