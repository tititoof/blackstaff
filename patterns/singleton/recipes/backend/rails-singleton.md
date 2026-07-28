---
type: Recipe
title: Singleton Rails — générique
tags: [rails, backend, singleton, design-pattern]
---

# Contexte Rails : le Singleton GoF est rarement nécessaire

Rails tourne en mode **multi-thread** (Puma). Une variable de classe ou
une constante statique est partagée entre **tous les threads et toutes les
requêtes** — stocker un état mutable dans un Singleton GoF classique est
donc risqué (race conditions, fuite de données entre utilisateurs).

Pour la majorité des cas d'usage (client API, config, service utilitaire),
Rails offre des alternatives plus sûres et idiomatiques :

| Besoin | Alternative Rails recommandée |
|---|---|
| Client API partagé (instance unique) | Constante de module + `||=` (thread-safe en lecture) |
| Config globale | `Rails.application.config` ou variable d'env |
| Service sans état | Module avec méthodes de classe (`module_function`) |
| Service avec état par requête | `CurrentAttributes` (Rails natif) |

Le Singleton GoF classique (instance statique + constructeur privé) reste
pertinent pour : scripts CLI Rails (`rails runner`), gems autonomes hors
contexte requête, et objets lourds à initialiser une seule fois au
démarrage de l'app (lecture d'un fichier de config, connexion à un service
externe).

Exemples concrets :
- [Client API partagé](/patterns/singleton/recipes/backend/examples/api-client.md)
- [Configuration globale](/patterns/singleton/recipes/backend/examples/app-config.md)
- [Service formateur (sans état)](/patterns/singleton/recipes/backend/examples/formatter.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Structure des fichiers

```
app/services/{singleton}.rb     ← Singleton GoF (si vraiment nécessaire)
# ou
lib/{singleton}.rb              ← pour les utilitaires hors Rails MVC
```

# Implémentation Singleton GoF (avec Mutex pour thread-safety)

```ruby
# app/services/{singleton}.rb
class {Singleton}
  # Mutex pour garantir l'unicité en environnement multi-thread
  INSTANCE_MUTEX = Mutex.new
  private_class_method :new

  def self.instance
    # Double-checked locking — évite d'acquérir le lock à chaque appel
    return @instance if @instance
    INSTANCE_MUTEX.synchronize do
      @instance ||= new
    end
    @instance
  end

  def initialize
    # Initialisation — appelée une seule fois
    @{resource} = setup_{resource}
  end

  def do_something
    # Méthode métier
  end

  private

  def setup_{resource}
    # Initialisation de la ressource partagée
  end
end
```

# Alternative idiomatique Rails — Module avec état (plus simple, thread-safe)

```ruby
# Pour un service sans état ou avec un état en lecture seule :
module {Singleton}
  module_function

  def do_something
    # Logique sans état mutable — toujours thread-safe
  end

  # État partagé en lecture seule (initialisé au chargement, jamais modifié)
  CONFIG = Rails.application.credentials.{singleton} || {}
  private_constant :CONFIG
end

# Utilisation
{Singleton}.do_something
```

# Alternative idiomatique Rails — `||=` pour une instance unique

```ruby
# Pour un client externe initialisé une fois (léger, idiomatic Ruby)
module MyApp
  def self.{singleton}
    @{singleton} ||= {ExternalClient}.new(
      api_key: ENV.fetch('{API_KEY}'),
      timeout: 30
    )
  end
end

# Utilisation
MyApp.{singleton}.call(...)
```

# Choisir la bonne approche

| Situation | Approche recommandée |
|---|---|
| Service sans état mutable | Module `module_function` |
| Client léger, initialisé une fois | `||=` sur module/classe |
| Objet lourd, multi-thread critique | Singleton GoF + Mutex |
| État par requête | `CurrentAttributes` Rails |

# Règles à respecter

- Ne jamais stocker dans `@instance` un état qui varie par requête
  (utilisateur courant, paramètres de la requête) — c'est partagé entre
  tous les threads.
- Si `initialize` peut lever une exception (timeout réseau, fichier absent),
  le Singleton doit gérer le cas où `@instance` reste `nil` après une
  tentative échouée — sinon l'app reste dans un état partiel sans
  possibilité de retry.
- Préférer `||=` avec Mutex explicite plutôt que de supposer que `||=`
  est thread-safe en Ruby — il ne l'est pas sans synchronisation externe.