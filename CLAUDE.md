# HEIGUESSR

Projet ArchiOWeb : API Express/MongoDB (`api/`) et client Vue (`client/`), indépendants.
Skills détaillés dans `.claude/skills/` : `heiguessr-api`, `heiguessr-client`, `heiguessr-git-workflow`.

## Règles Git (toujours applicables)

- Ne jamais faire `git add`, `git commit`, `git push`, `git merge`, ni changer de branche, ni
  créer d'issue ou de PR, sauf demande explicite. Les commandes Git en lecture seule sont permises.
- À la fin d'une tâche, donner **par message** les commits à faire, avec leurs `git add` fichier par
  fichier (voir le skill `heiguessr-git-workflow`).
- Aucune mention d'une IA dans les commits, issues ou PR (pas de `Co-Authored-By`, pas de
  « Generated with »).
- Une issue = une feature = une branche `<numéro>-<titre>`. Merge dans `main` uniquement par PR
  approuvée par un·e autre membre.

## Coordination des agents

La session principale est le **coordinateur**. Les sous-agents (`.claude/agents/`) ne peuvent pas
lancer d'autres agents.

| Agent | Rôle | Écrit dans |
| --- | --- | --- |
| `api-specialist` | routes, modèles, middlewares, temps réel, `openapi.yaml` | `api/` sauf `api/test/` |
| `client-specialist` | écrans, composants, stores, appels API | `client/` |
| `test-reviewer` | écrit et exécute les tests de l'**API** (pas de tests client) | `api/test/` |

Déroulement pour une feature :
1. Coordinateur : lire l'issue, vérifier la branche courante, découper le travail, préciser à
   chaque agent le numéro d'issue, le périmètre et les critères d'acceptation.
2. `api-specialist`, puis `client-specialist` (en parallèle si le client ne dépend pas d'une route
   nouvelle ou modifiée).
3. `test-reviewer` avec le rapport de l'API specialist. Un bug signalé repart chez
   `api-specialist`, puis `test-reviewer` relance les tests.
4. Coordinateur : relire le diff par rapport à l'issue et à `evaluation.md`, puis donner à
   l'utilisateur les commits à faire (avec les `git add`) et le texte de la PR.

N'utiliser les agents que pour une feature substantielle : une petite modification se fait
directement, sans agent. Ne pas lancer d'agent sans que l'utilisateur l'ait demandé.
