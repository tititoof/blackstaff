# Workflows n8n

Exports des workflows n8n qui utilisent ce dépôt. Les identifiants (clés d'API) ne
sont **jamais** inclus : n8n n'exporte que le nom des identifiants, à recréer de
votre côté.

| Fichier | Webhook | Rôle |
|---------|---------|------|
| `blackstaff-code-generator.json` | `POST /webhook/blackstaff` | Générateur principal : un seul point d'entrée, le champ `step` choisit l'action (`contracts`, `generate`, `local-review`, `generate-tests`…). Modèles cloud uniquement. |
| `qwen-assemble-new-file.json` | `POST /webhook/qwen-assemble-new-file` | Crée un fichier Ruby neuf : chaque méthode est générée séparément par `qwen2.5-coder` (Ollama), puis assemblée dans l'enveloppe module/classe déduite du chemin (Zeitwerk). |
| `qwen-assemble-new-file-ts.json` | `POST /webhook/qwen-assemble-new-file-ts` | Équivalent TypeScript pour un nouveau store Pinia (Options API). |
| `qwen-ast-patch.json` | `POST /webhook/qwen-ast-patch` | Génère **une** méthode Ruby et l'insère ou la remplace dans un fichier existant par patch AST, sans toucher au reste. |
| `qwen-ast-patch-ts.json` | `POST /webhook/qwen-ast-patch-ts` | Équivalent TypeScript pour une action de store Pinia. |

## Import

Dans n8n : *Workflows → Import from File*, ou en ligne de commande :

```bash
n8n import:workflow --input=blackstaff-code-generator.json
```

## Ce qu'il faut recréer

**Identifiants** (rattachés ensuite aux nœuds correspondants) :

- `NVIDIA Nemotron account` (API NVIDIA) : génération des fichiers, et secours
  des workflows `qwen-assemble-*`
- `Groq account` : secours de la génération, génération des tests
- `Google Gemini(PaLM) Api account` (nom par défaut de l'identifiant Gemini dans
  n8n) : planification, décomposition, relecture du plan
- `Anthropic account` : analyse fonctionnelle et fiches de faits (Claude Haiku)
- `Ollama account` : workflows `qwen-*`

**Tables de données n8n** :

- `llm_generation_log` : une ligne par génération (`execution_id`, `workflow`,
  `target_file`, `method`, `model`, `pieces`, `files_written`, `outcome`, `error`).
- une table de configuration des modèles (`workflow_id`, `usage_key`, `model`,
  `rank`, `active`), qui permet de changer de modèle sans modifier les workflows.

Les identifiants de ces tables dans les nœuds sont ceux de mon instance : à
re-sélectionner après l'import.

**Services attendus sur le même réseau Docker que n8n** :

- `project-ollama:11434` : Ollama, avec `qwen2.5-coder:7b` (et `3b` en option).
- `docker-bridge:3001` : exécute une commande dans le conteneur du projet cible
  (vérification de syntaxe, écriture du fichier, patch AST, tests).

**Volume** : les projets et ce dépôt sont montés dans n8n sous
`/home/node/projets/` (ce dépôt en `/home/node/projets/blackstaff/`).

Le contrôle des specs générées (`07c · Spec Check`) appelle un script
`rspec_pitfalls.rb` qui ne fait pas partie de ce dépôt : sans lui, l'étape
signale simplement qu'elle n'a pas pu s'exécuter (`specCheck.ran: false`).

## Mise à jour

Ces fichiers sont des instantanés. Pour les régénérer depuis l'instance :

```bash
docker exec <conteneur-n8n> n8n export:workflow --id=<id> --output=/tmp/wf.json
```

puis retirer les métadonnées propres à l'instance (`shared`, dates, versions)
avant de committer.
