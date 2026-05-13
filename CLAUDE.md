# CDM 2026 App — Instructions Claude

## Règle 1 : Rebase systématique avant chaque PR

Avant de pousser une branche et de créer ou mettre à jour une PR, toujours exécuter :

```bash
git fetch origin main
git rebase origin/main
git push --force-with-lease origin <branch>
```

Cela garantit que la branche est toujours au-dessus de `main` et que le bouton merge est disponible immédiatement.

## Règle 2 : Ne jamais ajouter des commits sur une branche dont la PR est déjà mergée

Avant de committer de nouveaux changements, vérifier si la PR courante est déjà mergée :

```bash
gh pr view --json state -q .state
```

- Si le résultat est `MERGED` ou `CLOSED` → créer une nouvelle branche avant de continuer
- Si la PR n'existe pas encore ou est `OPEN` → continuer normalement

Cela évite que des commits restent orphelins sans PR associée.
