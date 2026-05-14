# Performance — CDM 2026

Notes et budget de performance livrés avec le **Sprint 3** (PR #7 → #9).

> Les captures DevTools FPS ne sont pas encore intégrées. Voir la
> section **Captures à faire** ci-dessous pour la procédure et les
> emplacements à remplir.

## Budget

| Scénario | Cible | Comment vérifier |
|---|---|---|
| Scroll Accueil (hero card + 4-6 quick matches) | **60 fps** (iPhone 12 et Pixel 4a) | DevTools → Performance → record pendant ~3s de scroll, vérifier l'absence de barres rouges (« long task ») et un FPS bar continu à 60 |
| Scroll Matchs (64 match-cards potentielles) | **60 fps** | idem ; surveiller surtout au moment où les match-cards entrent dans le viewport (anim `.reveal` → `.revealed`) |
| Pronostic validé (juice) | **Pas de jank** sur les 800 ms qui suivent le tap | Performance → record sur le tap ; le scripting doit rester < 5 ms par frame |
| Badge unlock + particules dorées | **60 fps** pendant 2s de particules canvas | enregistrer le déclenchement → frames toutes < 16 ms |
| Level-up modal (coin rain + scaleX bar) | **60 fps** | idem |
| Cold boot avec skeleton fullscreen | **First Contentful Paint < 1s** sur 4G simulé | DevTools → Lighthouse mobile slow 4G |

## Choix techniques pour tenir le budget

1. **Toutes les animations Sprint 3 utilisent `transform` + `opacity`.** Aucune anim ne touche à `width`, `height`, `top/left`, `box-shadow` en boucle ou en scroll.
   - Exception assumée : la barre XP standard reste sur `width` (cf. `components.css:107`) parce qu'elle s'anime rarement (à chaque gain de XP, soit 1× toutes les 30 s max). Le cas level-up bascule en `transform: scaleX` (cf. `animateXPBar` dans `index.html`).
2. **Skeleton shimmer** n'anime QUE `background-position` (cf. `animations.css` → `@keyframes skeleton-shimmer`). C'est GPU-safe : pas de layout, pas de paint sur le DOM voisin.
3. **Scroll-reveal** utilise un `IntersectionObserver` global partagé. Une fois la carte révélée, on `unobserve` et on retire `will-change`. Donc même avec 64 match-cards, on garde au plus ~10 cibles observées à la fois.
4. **Anti-flicker reveal** (`js/utils/scroll-reveal.js`) : on ne tague une carte avec `.reveal` (opacity:0) que si elle est sous le viewport au moment du tag. Les cartes déjà visibles apparaissent au paint initial sans transition — pas de flash invisible.
5. **`prefers-reduced-motion`** est centralisé via `js/utils/motion.js`. Le check est lu **à chaque appel** (live), pas mémorisé au boot, donc un toggle iOS/DevTools réagit immédiatement.

## Audit `requestAnimationFrame` (PR #9)

Tous les RAF en **boucle** annulent au `visibilitychange` (document.hidden = true) :

| Fichier:ligne | RAF | Cancel sur hidden |
|---|---|---|
| [index.html:1579](index.html) | `startCoinRain` loop | ✓ ligne 1585 + listener 1588 |
| [js/rewards.js:129](js/rewards.js) | particules ambient `draw` | ✓ ligne 132 |
| [js/components/juice.js:139](js/components/juice.js) | badge particles burst (~2s) | ✓ via `visibilitychange` interne |

Les `requestAnimationFrame` **one-shot** (pour caler une mutation après reflow) n'ont pas besoin d'être annulés — ils s'exécutent en 16 ms et meurent :

| Fichier:ligne | Usage |
|---|---|
| index.html:826, 1509, 1540, 2299, 2490 | modale fade-in après reflow |
| index.html:1468 | XP bar reset après level-up |
| js/club-chat.js:89 | scroll to latest |
| js/utils/scroll-reveal.js:123 | debounce MutationObserver scan |

`js/cartes.js:131` expose un `safeRaf` qui enregistre les ids dans un tableau et les annule sur `visibilitychange`. Il n'est appelé nulle part dans la base actuelle — laissé en place pour les call sites futurs.

## Anti-layout-shift

- Countdown Hero card (`.cd-num`) : `font-variant-numeric: tabular-nums` + `min-width: 38px` sur `.cd-block` → pas de jitter quand 23 → 22 → 21 → 20 etc. (cf. PR #9 / [screens.css:131-145](styles/screens.css))
- Skeleton global au boot : utilise les mêmes wrappers (`.badges-grid`, `.cards-grid`) que le rendu final pour préserver la dimension des grilles pendant le fetch.

## Captures à faire (TODO)

Procédure pour iPhone 12 (ou DevTools mobile emulation iPhone 12 + CPU 4× slowdown) :

1. **Cold boot** : Cmd+Shift+R + Performance record sur les 5 premières secondes. Capture le screenshot des Frames + Network. Cibler : FCP < 1s, pas de tâche > 50 ms.
2. **Scroll Accueil** : ouvre `#page-home`, Performance record, scroll au pouce du haut vers le bas et retour. Vérifier les frames + FPS bar.
3. **Pronostic validé** : ouvre un match, tape un score, valide. Record sur ~2s. Confirmer que :
   - Le tap génère la vibration
   - L'XP toast slide-up sans frame drop
   - La cellule cote pulse 600 ms sans saccade
4. **Badge unlock** : déclencher (manuellement via Supabase ou en pronostiquant pour atteindre un seuil) → record 2s → confirmer 60 fps pendant le canvas burst.
5. **Level-up** : forcer un level-up → record sur les 2s → confirmer XP bar scaleX fluide + coin rain à 60 fps.
6. **`prefers-reduced-motion`** : Settings iOS → Accessibility → Motion → Reduce Motion ON, puis répéter scénarios 1-5. Confirmer absence d'animations longues (tout en < 100 ms).

Coller les captures dans `/perf-captures/` (à créer) et les référencer dans une section ci-dessous.

## Captures (à compléter)

_(vide pour l'instant — voir TODO ci-dessus)_

| Scénario | iPhone 12 réel | DevTools throttle 4× | Date |
|---|---|---|---|
| Cold boot | — | — | — |
| Scroll Accueil | — | — | — |
| Pronostic validé | — | — | — |
| Badge unlock | — | — | — |
| Level-up | — | — | — |
| Reduced motion sweep | — | — | — |
