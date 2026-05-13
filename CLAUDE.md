# CDM 2026 App — Instructions Claude

## Règle : Rebase systématique avant chaque PR

Avant de pousser une branche et de créer ou mettre à jour une PR, toujours exécuter :

```bash
git fetch origin main
git rebase origin/main
git push --force-with-lease origin <branch>
```

Cela garantit que la branche est toujours au-dessus de `main` et que le bouton merge est disponible immédiatement.
