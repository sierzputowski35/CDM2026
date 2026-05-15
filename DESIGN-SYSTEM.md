# Design System — CDM 2026

Référence rapide pour rester cohérent. Tout vit dans `styles/variables.css` (tokens) et `styles/components.css` (classes).

## Typographie

6 styles canoniques, exposés en variables CSS et en classes utilitaires.

| Variable          | Classe          | Usage                                     | Police       | Taille  |
| ----------------- | --------------- | ----------------------------------------- | ------------ | ------- |
| `--font-hero`     | `.text-hero`    | Titre d'écran (one per page max)          | Bebas Neue   | 36 / 1  |
| `--font-section`  | `.text-section` | Titre de section (UPPERCASE, 1.5px track) | Oswald 700   | 14 / 1.2 |
| `--font-card`     | `.text-card`    | Titre de carte                            | Oswald 700   | 16 / 1.3 |
| `--font-body`     | `.text-body`    | Texte courant                             | Inter 400    | 14 / 1.5 |
| `--font-caption`  | `.text-caption` | Méta / sous-texte                         | Inter 500    | 11 / 1.4 |
| `--font-mono`     | `.text-mono`    | Chiffres / data tabulaire                 | JetBrains Mono / Consolas | 14 / 1.2 |

Couleurs combinables : `.text-muted` (text3), `.text-gold`, `.text-emerald`, `.text-crimson`, `.text-blue`, `.text-purple`.

```html
<h2 class="text-section text-gold">Mes pronostics</h2>
<p class="text-body">Le texte courant ici.</p>
<span class="text-caption text-muted">il y a 3 minutes</span>
```

### Couleurs de texte (WCAG AA validé)

| Token       | Hex       | Ratio sur `--bg-primary` (#050816) | Conformité |
| ----------- | --------- | ---------------------------------- | ---------- |
| `--text`    | `#FFFFFF` | 19.5:1                             | AAA        |
| `--text2`   | `#8B9DC3` | ~7:1                               | AAA        |
| `--text3`   | `#7388A8` | 4.6:1                              | AA *(corrigé depuis #3D4F6E)* |

## Boutons (6 variantes)

Toutes les classes héritent du sélecteur `[class*="btn-"]` qui pose les fondations :

```css
display: inline-flex; gap: 6px; width: 100%;
padding: 14px 20px; border-radius: 14px;
font: 700 16px/1 'Bebas Neue'; letter-spacing: 2px;
transition: transform 150ms ease-out;  /* uniquement transform */
```

Chaque variante a :
- **Gradient 3 stops** (light → primary → dark)
- **Lip 3D** : `inset 0 1px 0 rgba(white,.5)` + `inset 0 -2px 0 rgba(black,.18)`
- **Glow externe** à 35 % opacity dans la couleur dominante
- **`:active`** : `transform: scale(.96) translateY(1px)` (pas de transition sur shadow — instruction explicite)

| Classe           | Usage             | Couleur dominante          |
| ---------------- | ----------------- | --------------------------- |
| `.btn-primary`   | Action principale | Or (`#F4C542`)              |
| `.btn-secondary` | Action alternative | Purple (`#A855F7`)         |
| `.btn-confirm`   | Validation, succès | Emerald (`#22D16B`)        |
| `.btn-danger`    | Destructif, refus | Crimson (`#FF4D5A`)         |
| `.btn-info`      | Informatif        | Electric blue (`#58C8FA`)   |
| `.btn-disabled`  | État inactif      | Gris (sans transform actif) |

Variantes utilitaires conservées : `.btn-hero` (oversized + pulse), `.btn-ghost` (transparent), `.btn-sm` (compact).

### Haptic

Le module `js/utils/haptic.js` attache automatiquement un `navigator.vibrate(10)` au `pointerdown` de tous les boutons primaires listés ci-dessus. No-op silencieux sur desktop / iOS Safari.

Désactiver ponctuellement avec `data-no-haptic`. Appeler manuellement avec `haptic(25)` (ms) ou `haptic([50, 30, 50])` (pattern).

## Tabs vs Dock

L'app distingue deux composants navigation :

- **Dock** (`.nav-tab`, bottom nav) — navigation principale persistante. Riche en feedback : icône qui rebondit + glow doré + dot indicateur + badges notifs (style Supercell / iOS UITabBar). **Reste à part**, ne pas le forcer dans `.tab-bar`.
- **Tabs** (`.tab-bar`) — onglets contextuels dans une vue (filtres, sous-sections). Simples : texte qui change de couleur ou un peu plus.

### Composant `.tab-bar` (2 variantes)

Un seul composant remplace les 4 systèmes legacy de tabs (`.sub-tab`, `.nav-btn`, `.av-tab-btn`/`.av-cat-pill`, `.profil-tab`). Variante via modificateur, état actif via `.is-active` (et non `.active`, pour éviter collision avec `.page.active`).

```html
<nav class="tab-bar tab-bar--pill">
  <button class="tab-bar__tab is-active">Avatars</button>
  <button class="tab-bar__tab">Cadres</button>
</nav>
```

| Modificateur            | Usage                                          | Look                                              |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------- |
| `.tab-bar--pill`        | Filtres scrollables (modal avatar, catégories) | Pilule 20px radius, actif = bg or                 |
| `.tab-bar--underline`   | Sub-section (profil tabs, admin nav)           | Texte 11px caps, actif = underline + color or     |
| `.tab-bar--filled`      | Toggle 2-3 onglets pleine largeur (pronos, résultats) | Radius 8px, actif = bg or pleine + texte sombre |

Tous : couleur inactive `--text3`, transition .2s, état actif via `.is-active`. Couleur active = `--gold-primary`.

## Cartes (3 niveaux)

```html
<div class="card">…</div>           <!-- base -->
<div class="card-elevated">…</div>  <!-- accent : modal interne, important -->
<div class="card-hero">…</div>      <!-- premium : hero section, gold -->
```

| Classe            | Background                       | Bordure                   | Élévation                     |
| ----------------- | -------------------------------- | ------------------------- | ----------------------------- |
| `.card`           | `--bg-card`                      | 1px white/5%              | aucune                        |
| `.card-elevated`  | `--bg-elevated`                  | 1px white/8%              | shadow 24px + inner highlight |
| `.card-hero`      | Gradient or sur `--bg-elevated`  | 1px gold/35%              | Glow doré 30px + ombre 30px   |

Border-radius : **20px** minimum partout.

## Tokens couleurs (palette V2)

Définis dans `styles/variables.css` :

```
Backgrounds : --bg-primary, --bg-secondary, --bg-card, --bg-elevated
Or          : --gold-primary, --gold-light, --gold-dark
Emerald     : --emerald, --emerald-light, --emerald-dark
Crimson     : --crimson, --crimson-light, --crimson-dark
Purple      : --royal-purple, --purple-light, --purple-dark
Blue        : --electric-blue, --blue-light, --blue-dark
Accents     : --orange-fire
Text        : --text, --text2, --text3
```

## Icônes

Système découplé. Voir `js/utils/icons.js` :
- `icon(name, size)` → PNG `/assets/icons/` si dispo, sinon SVG inline (style Lucide stroke 1.5).
- Placeholder HTML : `<span data-icon="trophy" data-icon-size="16"></span>` auto-hydraté au `DOMContentLoaded`.
- Catalogue : badges, ligues, monnaies, navigation, UI (lock/check/dice…).

## Drapeaux

Voir `js/utils/flag.js` :
- `flag(country, size)` — `<img>` simple flagcdn (xs/sm/md/lg).
- `flagHTML(country, size)` — version riche avec shine/gloss.
- `countryCode(country)` — résout nom FR ou code ISO vers code flagcdn.
- Placeholder HTML : `<span data-flag="us" data-flag-size="xs"></span>` auto-hydraté.

## Conventions

- **Inline styles** : à éviter pour la typo. Préférer les classes `.text-*`. Les styles inline restants dans `index.html` sont de la dette progressive — à migrer au fil des modifs.
- **Nouvelles cartes** : toujours partir d'une des 3 classes `.card*`.
- **Nouveaux boutons** : toujours utiliser une des 6 variantes `.btn-*`. Si besoin d'une nouvelle couleur, l'ajouter dans le bloc « BUTTON SYSTEM PREMIUM » de `components.css` en suivant le même squelette (gradient/lip/glow).
- **Pas de transition sur `box-shadow`** sur les boutons : volontaire (perf + cohérence du lip).
