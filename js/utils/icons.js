// ════════════════════════════════════════════════════════════
// CDM 2026 — js/utils/icons.js
// Système d'icônes unifié : PNG fournis (/assets/icons/) ou
// SVG inline (style Lucide stroke 1.5, currentColor).
// Remplace tous les emojis non-drapeau côté UI.
//
// API :
//   icon(name, size = 20)        → string HTML
//   icon('trophy', 24)           → <img|svg> 24x24
//
// Ajout : déposer le PNG dans /assets/icons/<file>.png et l'inscrire
// dans PNG_MAP ci-dessous. Si pas de PNG, le SVG est servi.
// ════════════════════════════════════════════════════════════

(function (root) {

  // ─── PNG disponibles dans /assets/icons/ ───
  const PNG_MAP = {
    'nav-home':      'home.png',
    'nav-matchs':    'matchs.png',
    'nav-arene':     'arene.png',
    'nav-club':      'club.png',
    'nav-profil':    'profil.png',
    'league-bronze': 'league_bronze.png',
    'league-argent': 'league_argent.png',
  };

  // ─── SVG inline (24×24 viewBox, style Lucide) ───
  // Chaque entrée : { p: '<path>...</path>', s: 'stroke'|'fill' }
  // 'stroke' → stroke 1.6, fill="none". 'fill' → fill="currentColor".
  const SVG_MAP = {
    // Badges performance
    'bullseye':      { s: 'stroke', p: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' },
    'crystal-ball':  { s: 'stroke', p: '<circle cx="12" cy="11" r="7"/><path d="M6 18l-2 3h16l-2-3"/><path d="M9 9a3 3 0 0 1 3-3"/>' },
    'eye':           { s: 'stroke', p: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>' },
    'hat':           { s: 'stroke', p: '<path d="M5 19h14"/><path d="M7 19V9h10v10"/><path d="M5 9h14"/><path d="M9 9V6h6v3"/>' },
    'crown':         { s: 'fill',   p: '<path d="M3 8l3 8h12l3-8-4 3-5-6-5 6-4-3z"/>' },
    'fox':           { s: 'stroke', p: '<path d="M4 6l4 4v4l-2 4 4 1 2-2 2 2 4-1-2-4v-4l4-4-3 1-3-2h-7L7 7z"/><circle cx="9.5" cy="11" r=".7" fill="currentColor"/><circle cx="14.5" cy="11" r=".7" fill="currentColor"/>' },
    'swords':        { s: 'stroke', p: '<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="M9.5 14.5L21 3v3l-3.5 3.5"/>' },

    // Régularité / streaks
    'calendar':      { s: 'stroke', p: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>' },
    'shield':        { s: 'stroke', p: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>' },
    'star':          { s: 'fill',   p: '<path d="M12 2l3 7 7 .6-5.5 4.7 1.8 6.9L12 17.5 5.7 21.2l1.8-6.9L2 9.6 9 9z"/>' },
    'flame':         { s: 'fill',   p: '<path d="M12 2c-2 4 1 6-2 9-1.5 1.5-4 3-4 6 0 3.3 2.7 5 6 5s6-1.7 6-5c0-2.6-1.8-4.4-3-7-1.2-2.6 1-4-3-8z"/>' },
    'meteor':        { s: 'stroke', p: '<path d="M14 4l6 6"/><path d="M19 3l-2 2"/><path d="M22 6l-2 2"/><circle cx="9" cy="15" r="5"/><path d="M13 11l-2 2M15 9l-1 1"/>' },

    // Ligues / médailles
    'gold-medal':    { s: 'fill',   p: '<circle cx="12" cy="14" r="7"/><path d="M8 7l2 5M16 7l-2 5M9 2h6l-2 5h-2z" fill="currentColor"/>' },
    'silver-medal':  { s: 'stroke', p: '<circle cx="12" cy="14" r="7"/><path d="M8 7l2 5M16 7l-2 5M9 2h6l-2 5h-2z"/>' },
    'diamond':       { s: 'fill',   p: '<path d="M6 3h12l4 6-10 12L2 9z"/>' },
    'gem':           { s: 'fill',   p: '<path d="M6 3h12l4 6-10 12L2 9z"/>' },

    // Tournoi / collection
    'users':         { s: 'stroke', p: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 12 0v1"/><circle cx="17" cy="9" r="3"/><path d="M16 21v-1a5 5 0 0 1 6-5"/>' },
    'trophy':        { s: 'fill',   p: '<path d="M6 4h12v4a6 6 0 0 1-12 0V4z"/><path d="M4 5h2v2a2 2 0 0 1-2-2zM18 5h2a2 2 0 0 1-2 2V5z" fill="currentColor"/><path d="M10 14h4v3h2v3H8v-3h2z"/>' },
    'ticket':        { s: 'stroke', p: '<path d="M3 8a2 2 0 0 0 0 4v5h18v-5a2 2 0 0 0 0-4V3H3z"/><path d="M9 3v18"/>' },
    'card':          { s: 'stroke', p: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 12h6M9 17h3"/>' },
    'books':         { s: 'stroke', p: '<path d="M4 4h6v16H4z"/><path d="M10 4h5v16h-5z"/><path d="M17 6l3 1-3 14-3-1z"/>' },
    'museum':        { s: 'stroke', p: '<path d="M2 9l10-6 10 6v2H2z"/><path d="M5 11v8M9 11v8M15 11v8M19 11v8"/><path d="M2 21h20"/>' },

    // Monnaies
    'coin':          { s: 'fill',   p: '<circle cx="12" cy="12" r="9"/><path d="M9 9h5a2 2 0 0 1 0 4H9m0 0h5a2 2 0 0 1 0 4H9m3-9v11" fill="none" stroke="#050816" stroke-width="2" stroke-linecap="round"/>' },

    // Notifications
    'gift':          { s: 'fill',   p: '<rect x="3" y="11" width="18" height="10" rx="1"/><rect x="2" y="7" width="20" height="4" rx="1"/><path d="M11 7v14M12 7c-1-3-5-3-5-1s2 1 5 1zM12 7c1-3 5-3 5-1s-2 1-5 1z" fill="none" stroke="currentColor" stroke-width="1.6"/>' },
    'zap':           { s: 'fill',   p: '<path d="M13 2L3 14h7l-1 8 10-12h-7z"/>' },
    'trending-up':   { s: 'stroke', p: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>' },
    'muscle':        { s: 'fill',   p: '<path d="M5 12c0-4 3-7 7-7s7 3 7 7v3a3 3 0 0 1-3 3h-2v-3l-3 3H8a3 3 0 0 1-3-3z"/>' },
    'check-double':  { s: 'stroke', p: '<path d="M2 12l5 5L18 6"/><path d="M9 17L20 6"/>' },

    // UI
    'lock':          { s: 'stroke', p: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>' },
    'check':         { s: 'stroke', p: '<path d="M5 12l5 5L20 7"/>' },
    'dice':          { s: 'stroke', p: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/>' },
    'sparkle':       { s: 'fill',   p: '<path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z"/>' },

    // Ligues custom (or/diamant/légende — pas de PNG dispo)
    'league-or':       { s: 'fill', p: '<path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>' },
    'league-diamant':  { s: 'fill', p: '<path d="M6 3h12l4 6-10 12L2 9z"/>' },
    'league-legende':  { s: 'fill', p: '<path d="M12 1l2.8 7.5L22 9l-5.5 5 1.5 8L12 18l-6 4 1.5-8L2 9l7.2-.5z"/><circle cx="12" cy="12" r="2.5" fill="#050816"/>' },
  };

  // ─── Render helpers ───
  function pngTag(file, size, alt) {
    return `<img src="assets/icons/${file}" width="${size}" height="${size}" alt="${alt || ''}" loading="lazy" decoding="async" style="display:inline-block;vertical-align:middle;object-fit:contain">`;
  }

  function svgTag(name, def, size) {
    const stroke = def.s === 'stroke';
    const attrs = stroke
      ? 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'
      : 'fill="currentColor"';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ${attrs} style="display:inline-block;vertical-align:middle;flex-shrink:0" aria-hidden="true" data-icon="${name}">${def.p}</svg>`;
  }

  /**
   * Retourne le HTML d'une icône.
   * @param {string} name  — clé du catalogue (ex: 'trophy', 'nav-home')
   * @param {number} size  — taille en px (carré). Défaut : 20.
   * @returns {string} HTML inline (img ou svg)
   */
  function icon(name, size = 20) {
    const png = PNG_MAP[name];
    if (png) return pngTag(png, size, name.replace(/-/g, ' '));

    const def = SVG_MAP[name];
    if (def) return svgTag(name, def, size);

    // Fallback discret : carré neutre, jamais d'emoji visible
    console.warn(`[icon] Unknown icon "${name}"`);
    return `<span style="display:inline-block;width:${size}px;height:${size}px;background:rgba(255,255,255,0.08);border-radius:4px;vertical-align:middle" aria-hidden="true"></span>`;
  }

  // ─── Auto-hydrate placeholders dans le DOM statique ───
  // <span data-icon="trophy" data-icon-size="16"></span>
  // → remplit l'innerHTML avec l'icône. Lancé une fois au DOMContentLoaded
  // et exposé via window.hydrateIcons() pour les insertions dynamiques.
  function hydrateIcons(rootEl) {
    const scope = rootEl || document;
    scope.querySelectorAll('[data-icon]:not([data-icon-hydrated])').forEach(el => {
      const name = el.getAttribute('data-icon');
      const size = parseInt(el.getAttribute('data-icon-size') || '16', 10);
      el.innerHTML = icon(name, size);
      el.setAttribute('data-icon-hydrated', '');
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => hydrateIcons());
    } else {
      hydrateIcons();
    }
  }

  // Expose
  root.icon = icon;
  root.hydrateIcons = hydrateIcons;
  root.ICON_PNG_MAP = PNG_MAP;
  root.ICON_SVG_MAP = SVG_MAP;

})(typeof window !== 'undefined' ? window : globalThis);
