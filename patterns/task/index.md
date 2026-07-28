# Pattern : task

## Contexte

Ce pattern s'applique quand la génération est pilotée par une description de
tâche libre (OpenProject) plutôt que par une recipe figée. Il n'impose pas de
structure de fichiers prédéfinie — c'est la description de la tâche, complétée
par un plan Blackstaff Thinking, qui définit les fichiers à créer.

## Conventions générales à respecter

- Toujours respecter les conventions du framework listées dans
  `frameworks/{framework}.md` et sa version (`frameworks/{framework}/v{X}.md`).
- Si la tâche recoupe un pattern existant du projet (ex. `auth`, `crud` —
  voir `stack.*.patterns` dans `.blackstaff/index.md`), s'aligner sur les
  mêmes conventions de nommage et d'organisation de fichiers que ce pattern,
  même si sa recipe n'est pas chargée automatiquement ici.
- Un fichier = une responsabilité claire. Pas de fichier fourre-tout.
- Toujours accompagner le code de test(s) correspondant(s), sauf si la tâche
  précise explicitement le contraire.
- Aucun placeholder, aucun TODO dans le code livré — le code doit être
  directement exécutable.

## Ce que ce pattern n'impose pas

- Pas de recipe frontend/backend prédéfinie (contrairement à `auth`/`crud`).
- Pas de liste figée de fichiers — c'est le plan Thinking (`implementationOrder`)
  ou la description de tâche qui fait foi.
EOF