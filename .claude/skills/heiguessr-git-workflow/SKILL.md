---
name: heiguessr-git-workflow
description: Git and GitHub workflow of the HEIGUESSR team - one issue per feature, one branch per issue, pull requests with mandatory review before merging into main, and how an AI assistant must hand over its work (commit commands sent by message, never committing itself, no AI co-author). Use whenever work is finished, a change is ready to commit, or the user talks about issues, branches, commits or pull requests.
---

# HEIGUESSR - Workflow Git / GitHub

## Workflow de l'équipe

1. **Une issue par feature** sur GitHub (`miniyankey/HEIGUESSR`). Elle porte un titre court, un
   objectif, des critères d'acceptation et la partie concernée (`api` / `client`).
2. **Une branche par issue**, créée depuis `main` à jour, nommée `<numéro>-<titre-en-kebab-case>`.
   C'est le format du bouton « Create a branch » de GitHub, par exemple
   `9-find-a-method-to-store-images-and-implement-it`.
3. Commits sur cette branche uniquement. **Jamais de commit direct sur `main`.**
4. **Pull request** vers `main` avec `Closes #<numéro>` dans la description.
5. **Validation obligatoire** par un·e autre membre de l'équipe avant le merge. Personne ne merge
   sa propre PR sans approbation.
6. Après le merge, supprimer la branche et repartir de `main` à jour pour l'issue suivante.

Si le travail demandé ne correspond pas à l'issue de la branche courante (`git branch --show-current`),
le signaler. Il faut alors une nouvelle issue et une nouvelle branche, sans mélanger deux features
dans une branche.

## Règles pour l'IA

- **Ne jamais exécuter** `git commit`, `git push`, `git merge`, `git rebase`, `git reset`,
  `git checkout`/`git switch` d'une autre branche, `git stash`, ni créer, modifier ou fermer des
  issues ou PR, sauf demande explicite et ponctuelle de l'utilisateur. Les commandes en lecture
  seule (`git status`, `git diff`, `git log`, `git show`, `git branch`) sont autorisées.
- **Ne pas indexer** les fichiers (`git add`) : c'est l'utilisateur qui le fait.
- **Aucune mention de l'IA** : pas de ligne `Co-Authored-By` concernant une IA, pas de
  « Generated with … » dans les commits, les descriptions d'issue ou de PR.
- Ne jamais committer `.env`, des identifiants ou des fichiers de test temporaires.

### Ce que l'IA rend à la fin d'une tâche

Un message contenant les commits proposés, prêts à copier-coller, découpés en commits
logiques (une intention par commit), **chacun avec ses `git add` explicites**, fichier par fichier,
jamais `git add .` ou `-A` :

```bash
git add api/models/floor.js api/routes/floors.js
git commit -m "Add floors resource with admin-only write access" -m "Explain why, if useful."
```

- Messages en **anglais**, à l'impératif, sujet ≤ 72 caractères, corps optionnel pour le « pourquoi ».
- Si un fichier mélange plusieurs commits, l'indiquer et proposer `git add -p <fichier>` en
  décrivant les parties à garder.
- Signaler les fichiers modifiés mais **volontairement exclus** (tests temporaires, fichiers d'une
  autre feature).
- Si la feature est terminée, proposer aussi le texte de la PR (titre, résumé, `Closes #N`, comment
  tester). Si le travail sort du périmètre de l'issue, proposer le texte de la nouvelle issue.
