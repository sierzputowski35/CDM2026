# Architecture — CDM 2026

État de la structure du code après le sprint de refactor (PR #1 sécurité, #2 CSS, #3 JS).

## Vue d'ensemble

```
CDM 2026 App/
├── index.html                    ← coquille HTML + <script> inline pour le code non encore extrait
├── manifest.json                 ← PWA manifest
├── sw.js                         ← service worker (cache offline, version v4)
├── vercel.json                   ← config runtime serverless
│
├── api/                          ← Vercel serverless functions
│   ├── admin-auth.js            ← (PR #1) vérification password admin + HMAC token
│   ├── scores.js                ← fetch & cache des scores réels
│   └── odds.js                  ← fetch & cache des cotes (The Odds API)
│
├── styles/                       ← (PR #2) CSS séparé
│   ├── variables.css            ← :root + palette + @import Google Fonts
│   ├── reset.css                ← keyframes globaux, reset *, scrollbar, utilitaires
│   ├── components.css           ← header, nav, cards, buttons, modals, toast, login…
│   ├── animations.css           ← TÂCHE 5/6/8/9 (streak, transitions, badges, podium)
│   └── screens.css              ← home AAA, avatar modal, coffres, FUT cards, collection…
│
├── js/                           ← (PR #3) modules JS extraits
│   ├── supabase.js              ← init du client + helpers de session admin
│   ├── avatars.js               ← catalogue avatars + modal de personnalisation
│   ├── badges.js                ← catalogue badges + déblocage Supabase
│   ├── cartes.js                ← système cartes joueurs CDM (FUT-like)
│   ├── pwa.js                   ← install prompt PWA
│   ├── rewards.js               ← particules CTA + canvas ambiantes
│   ├── notifications.js         ← panel notifications in-app
│   ├── badge-unlock.js          ← animation d'overlay de déblocage
│   ├── components/
│   │   ├── skeleton.js          ← (PR #7) générateur de skeleton screens
│   │   └── juice.js             ← (PR #8) effets juicy (XP toast, pulse, particules)
│   ├── utils/
│   │   ├── icons.js             ← table d'icônes SVG
│   │   ├── haptic.js            ← wrapper navigator.vibrate
│   │   ├── flag.js              ← rendu drapeaux flagcdn
│   │   ├── motion.js            ← (PR #9) prefers-reduced-motion centralisé
│   │   └── scroll-reveal.js     ← (PR #7) IntersectionObserver reveal
│   └── data/
│       ├── flags.js             ← table FLAG_CODES (code pays → emoji)
│       └── cotes.js             ← calculerCotesMatch() — fonction pure
│
├── scripts/                      ← outils de dev (PR #1)
│   ├── backup.sh                ← snapshot horodaté avant bricolage risqué
│   ├── hash-admin-password.js   ← générateur de hash scrypt pour ADMIN_PASSWORD_HASH
│   └── install-hooks.sh         ← active les hooks .githooks/
│
├── .githooks/                    ← hooks Git versionnés (PR #1)
│   └── pre-commit               ← bloque les fuites de SUPABASE_SERVICE_KEY / passwords
│
├── SECURITY.md                   ← (PR #1) posture sécurité + vars d'env + RLS + dette
└── ARCHITECTURE.md               ← ce document
```

## Ordre de chargement (index.html)

```html
<head>
  <!-- CSS : ordre préservé de la cascade originale -->
  <link rel="stylesheet" href="styles/variables.css">
  <link rel="stylesheet" href="styles/reset.css">
  <link rel="stylesheet" href="styles/components.css">
  <link rel="stylesheet" href="styles/animations.css">
  <link rel="stylesheet" href="styles/screens.css">

  <!-- CDN Supabase chargé en premier (avant nos modules qui l'utilisent) -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  ...HTML body...

  <!-- Modules extraits : ordre préservé du code original -->
  <script src="js/supabase.js"></script>
  <script src="js/avatars.js"></script>
  <script src="js/data/flags.js"></script>
  <script src="js/data/cotes.js"></script>
  <script src="js/badges.js"></script>
  <script src="js/cartes.js"></script>
  <script src="js/pwa.js"></script>
  <script src="js/rewards.js"></script>
  <script src="js/notifications.js"></script>
  <script src="js/badge-unlock.js"></script>

  <!-- Code restant (à extraire par écran dans des PR de suivi) -->
  <script>
    /* État global, XP, daily reward, coffres, mission, bonus côté,
       calcPoints, getLeaderboard, renderClassement, render matchs,
       render globaux, groupes, bracket, chat, cagnotte, profil joueur,
       admin (matchs, scores, joueurs, codes, cotes, globaux), toast,
       init() … */
  </script>
</body>
```

### Choix : scripts classiques, pas modules ES

Tous les fichiers `js/*.js` sont chargés via `<script src="…">` (pas `type="module"`). Conséquence :

- **Toutes les fonctions et constantes** déclarées dans un module sont exposées au **scope global** (`window`).
- Les **handlers HTML inline** (`onclick="doAdminLogin()"`, etc.) continuent de fonctionner sans modification.
- **Pas d'`import`/`export`** : les dépendances entre modules se résolvent via le scope global.
- L'**ordre des `<script>`** importe : un module qui référence une `const` d'un autre module au top-level doit être chargé après.

C'est moins propre que des modules ES, mais c'est **zéro risque** pour les `onclick` inline qui sont nombreux dans `index.html`.

### Migration future vers modules ES

Quand on voudra passer à `type="module"`, il faudra :

1. Ajouter `export` aux symboles que d'autres modules consomment.
2. Ajouter `import` en tête de chaque module.
3. **Soit** ré-exposer manuellement les handlers sur `window.X` pour les `onclick` inline.
4. **Soit** remplacer les `onclick="foo()"` par `addEventListener` dans le module qui définit `foo`.

Pas urgent pour une app entre amis.

## Métriques

| Métrique | Avant sprint | Après sprint | Δ |
|---|---|---|---|
| `index.html` total | 8 610 lignes | ~4 592 lignes | **-47 %** |
| CSS inline | 2 576 lignes | 0 ligne | **-100 %** |
| JS inline | 5 395 lignes | ~3 886 lignes | **-28 %** |
| Nombre de fichiers source | 5 | 21 | +16 |
| Modules JS extraits | 0 | 10 | — |

## Dette technique connue

| # | Sujet | Pourquoi laissé | Quand le faire |
|---|---|---|---|
| A-01 | ~3 900 lignes de JS restent dans `index.html` (cœur métier : `calcPoints`, `getLeaderboard`, `renderClassement`, render matchs/globaux/groupes, admin, daily reward, coffres, mission, chat, cagnotte, profil) | Forte interdépendance + absence de tests automatisés. Extraction risquée en une fois. | PR de suivi par écran (un module par fonctionnalité) : `js/screens/accueil.js`, `js/screens/matchs.js`, `js/screens/arene.js`, `js/screens/club.js`, `js/screens/profil.js`, `js/admin.js` |
| A-02 | Pas de tests automatisés (unitaires ou e2e) | Hors scope du sprint. Délivrer la sécu et le rangement d'abord. | Une fois la structure stabilisée, ajouter Vitest pour les fonctions pures (`calcPoints`, `calculerCotesMatch`) et Playwright pour 1-2 smoke tests |
| A-03 | Pas de bundler / minifier (Vite, esbuild…) | App entre amis, taille réseau acceptable. Pas de TypeScript en jeu. | Si l'app s'ouvre à plus d'utilisateurs ou si la latence devient un sujet |
| A-04 | `manifest.json` charge des polices Google **deux fois** (un `<link>` dans `index.html` + un `@import` dans `variables.css`) | Existant avant le refactor, intentionnellement non touché | Trivial à corriger : retirer le `<link>` ou le `@import`. À voir la prochaine fois qu'on touche aux polices |
| A-05 | Dette sécurité documentée séparément dans `SECURITY.md` (D-01 à D-05) | Voir SECURITY.md §4 | Idem |

## Conventions

- **Pas de mixage** entre modules et code inline qui définirait/réécrirait les mêmes symboles. Si un module définit `const FLAG_CODES`, ce nom **n'existe nulle part ailleurs**.
- **Comments header** en tête de chaque fichier `js/*.js` et `styles/*.css` qui rappelle son origine (lignes source dans `index.html` avant extraction). Utile pour faire des git blame remontant à l'historique.
- **Bump du `CACHE` dans `sw.js`** à chaque PR qui change la structure des fichiers servis (sinon les PWA installées gardent l'ancien layout en cache).
