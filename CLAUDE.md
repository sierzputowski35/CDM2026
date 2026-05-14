# CDM 2026 App — Instructions Claude

## Règle 1 : Toujours une nouvelle branche par session de fixes

Avant chaque session de modifications, créer une branche fraîche depuis `main` :

```bash
git fetch origin main
git checkout -b fix/$(date +%Y%m%d-%H%M) origin/main
```

Ne jamais réutiliser une branche dont la PR a déjà été mergée.
Si on réutilise une branche sans nouvelle PR → pas de bouton vert pour merger.

## Règle 2 : Rebase et PR vers deploy/trigger-vercel

Avant de pousser et créer la PR :

```bash
git fetch origin main
git rebase origin/main
git push origin <nouvelle-branche>
gh pr create --base deploy/trigger-vercel --head <nouvelle-branche>
```

Cela garantit que le bouton merge est toujours disponible.

## Résumé du workflow à chaque session

1. Nouvelle branche depuis `main`
2. Faire les modifications dans `index.html`
3. Commit + rebase + push
4. Créer une nouvelle PR vers `deploy/trigger-vercel`
5. L'utilisateur clique le bouton vert → Vercel redéploie
