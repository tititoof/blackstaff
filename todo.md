Priorité haute (les plus fréquents dans le dev web fullstack, les plus utiles pour ton workflow de génération de code) :

Strategy — interchangeabilité d'algorithmes au runtime (validation, tri, calcul de prix) — très proche de Factory Method mais côté comportement ; le plus courant dans les codebases web.
Observer — réactivité événementielle (Pinia watches, événements DOM, webhooks n8n, Active Support callbacks Rails) — fondamental en frontend Nuxt.
Decorator — enrichissement d'objets sans héritage (middlewares, logging, cache, validation en couches) — le pattern derrière les middlewares Rails/Laravel/Symfony.
Command — encapsuler une action en objet (jobs, undo/redo, file d'attente) — directement utile pour les jobs Sidekiq/Horizon et les workflows n8n.

Priorité moyenne :

Adapter — interface entre systèmes incompatibles (wrapper d'API externe, adaptateur de format) — utile dès qu'on intègre un SDK tiers.
Facade — simplifier une interface complexe (une classe qui masque la complexité d'un sous-système) — très courant en architecture de service.
State — comportement qui change selon l'état interne (machine à états d'une commande, d'un workflow n8n).
Template Method — squelette d'algorithme avec étapes surchargeables — très utilisé en Rails (concerns, callbacks).

Priorité basse (utiles mais moins fréquents dans un contexte web fullstack standard) : Chain of Responsibility, Iterator, Mediator, Memento, Visitor, Composite, Bridge, Flyweight, Proxy, Abstract Factory.