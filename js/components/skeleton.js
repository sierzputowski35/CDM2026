// ════════════════════════════════════════════════════════════
// CDM 2026 — js/components/skeleton.js  (PR #7 — Sprint 3)
//
// Générateur de skeleton screens (placeholders shimmer) pour combler
// la latence pendant un fetch Supabase. À utiliser AVANT le fetch ;
// le vrai contenu remplacera le skeleton via innerHTML une fois la
// donnée arrivée.
//
// API :
//   Skeleton.render(type, count?)        → string HTML
//   Skeleton.into(el, type, count?)      → injecte dans `el`
//
// Types supportés :
//   'match-card'       — carte de match (Matchs)
//   'classement-row'   — ligne de classement (Arène)
//   'badge-grid'       — grille de badges (Profil)
//   'card-grid'        — grille de cartes joueurs (Profil/Collection)
//   'home'             — squelette complet écran Accueil (hero + cartes)
//
// Le shimmer est purement CSS (animation `skeleton-shimmer` sur
// background-position — GPU-safe, pas de layout). Désactivé en
// prefers-reduced-motion par la règle globale de animations.css.
// ════════════════════════════════════════════════════════════

(function (root) {

  function box(opts) {
    const s = opts || {};
    const w = s.w || '100%';
    const h = s.h || '14px';
    const r = s.r || '6px';
    const mt = s.mt || '0';
    const mb = s.mb || '0';
    return '<div class="skeleton skeleton-box" style="width:' + w + ';height:' + h + ';border-radius:' + r + ';margin-top:' + mt + ';margin-bottom:' + mb + '"></div>';
  }

  function circle(size) {
    return '<div class="skeleton skeleton-box" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;flex-shrink:0"></div>';
  }

  // ── Templates ────────────────────────────────────────────────

  function matchCardOne() {
    return '<div class="skeleton-container match-card" style="display:flex;flex-direction:column;gap:10px;padding:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        box({ w:'90px', h:'10px' }) +
        box({ w:'70px', h:'10px' }) +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">' +
        '<div style="display:flex;align-items:center;gap:8px">' + circle(32) + box({ w:'80px', h:'14px' }) + '</div>' +
        box({ w:'24px', h:'18px' }) +
        '<div style="display:flex;align-items:center;gap:8px">' + box({ w:'80px', h:'14px' }) + circle(32) + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px">' +
        box({ h:'48px' }) + box({ h:'48px' }) + box({ h:'48px' }) +
      '</div>' +
      box({ h:'40px', mt:'4px', r:'10px' }) +
    '</div>';
  }

  function classementRowOne() {
    return '<div class="skeleton-container" style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border)">' +
      box({ w:'24px', h:'18px' }) +
      circle(36) +
      '<div style="flex:1;display:flex;flex-direction:column;gap:6px">' +
        box({ w:'60%', h:'12px' }) +
        box({ w:'40%', h:'10px' }) +
      '</div>' +
      box({ w:'46px', h:'18px' }) +
    '</div>';
  }

  function badgeGridOne() {
    return '<div class="skeleton-container" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px">' +
      circle(42) +
      box({ w:'70%', h:'10px' }) +
    '</div>';
  }

  function cardGridOne() {
    return '<div class="skeleton-container" style="aspect-ratio:3/4;border-radius:14px" >' +
      box({ w:'100%', h:'100%', r:'14px' }) +
    '</div>';
  }

  function homeFull() {
    return '<div class="skeleton-container" style="display:flex;flex-direction:column;gap:10px;padding:12px">' +
      // Hero card
      '<div style="display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--border);border-radius:18px;background:var(--bg-card)">' +
        '<div style="display:flex;justify-content:space-between">' + box({ w:'120px', h:'12px' }) + box({ w:'90px', h:'12px' }) + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">' +
          circle(40) + box({ w:'50px', h:'24px' }) + circle(40) +
        '</div>' +
        box({ h:'46px', mt:'8px', r:'12px' }) +
      '</div>' +
      // 3 quick matches
      '<div style="display:flex;flex-direction:column;gap:8px">' +
        '<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border)">' +
          circle(28) + box({ w:'60px', h:'12px' }) + box({ w:'40px', h:'18px' }) + box({ w:'60px', h:'12px' }) + circle(28) +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border)">' +
          circle(28) + box({ w:'60px', h:'12px' }) + box({ w:'40px', h:'18px' }) + box({ w:'60px', h:'12px' }) + circle(28) +
        '</div>' +
      '</div>' +
    '</div>';
  }

  const TEMPLATES = {
    'match-card':     { one: matchCardOne,     defaultCount: 4, wrap: (children) => children },
    'classement-row': { one: classementRowOne, defaultCount: 6, wrap: (children) => children },
    'badge-grid':     { one: badgeGridOne,     defaultCount: 8, wrap: (children) => '<div class="badges-grid">' + children + '</div>' },
    'card-grid':      { one: cardGridOne,      defaultCount: 6, wrap: (children) => '<div class="cards-grid">' + children + '</div>' },
    'home':           { one: homeFull,         defaultCount: 1, wrap: (children) => children }
  };

  function render(type, count) {
    const tpl = TEMPLATES[type];
    if (!tpl) return '';
    const n = (typeof count === 'number' && count > 0) ? count : tpl.defaultCount;
    let html = '';
    for (let i = 0; i < n; i++) html += tpl.one();
    return tpl.wrap(html);
  }

  function into(el, type, count) {
    if (!el) return;
    el.innerHTML = render(type, count);
  }

  root.Skeleton = { render, into };

})(typeof window !== 'undefined' ? window : globalThis);
