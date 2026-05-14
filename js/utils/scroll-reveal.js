// ════════════════════════════════════════════════════════════
// CDM 2026 — js/utils/scroll-reveal.js  (PR #7 — Sprint 3)
//
// Anime les cartes à l'entrée dans le viewport via IntersectionObserver.
// - Auto-tag : on scanne `.page.active` à chaque tab switch / render et
//   on ajoute la classe `.reveal` aux cartes encore non taguées.
// - Une fois taguées, elles sont observées par un IO global. Quand la
//   carte croise le viewport, on lui ajoute `.revealed` et on cesse de
//   l'observer (fire-once, pas de re-animation au scroll-up).
//
// API exposée :
//   scrollReveal.scan()           → scan & tag de la page active
//   scrollReveal.tag(rootEl)      → tag des cartes dans un sous-arbre
//   scrollReveal.disconnect()     → libère l'observer (rarement utile)
//
// Respect de prefers-reduced-motion : si l'utilisateur le préfère, on
// révèle instantanément sans animation (juste add `.revealed`).
//
// Anti layout-shift : `.reveal` part de opacity:0 + translateY(20px),
// uniquement transform + opacity (GPU) — pas de width/height ni shadow.
// ════════════════════════════════════════════════════════════

(function (root) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Sélecteurs des cartes à animer. Volontairement large : couvre
  // Accueil, Matchs, Arène, Profil (et écrans dérivés).
  // Les rangées (`.ranking-row-v2`, `.feed-item`) sont incluses : elles
  // entrent une par une au scroll comme des mini-cartes.
  const REVEAL_SELECTORS = [
    '.card',
    '.match-card',
    '.hero-card',
    '.quick-match-card',
    '.streak-card-home',
    '.league-card-home',
    '.ranking-row-v2',
    '.stat-card',
    '.badge-item',
    '.feed-item',
    '.podium-item',
    '.ligue-header-v2',
    '.cards-grid > *',
    '[data-reveal]'
  ].join(',');

  // Ne pas tagger ce qui est dans des conteneurs où l'effet est nuisible
  // (boucles d'admin, modales, etc.). On exclut tout descendant de :
  const EXCLUDE_ANCESTORS = '.match-modal-overlay, .level-up-modal, #badge-unlock-overlay, .notif-panel, .skeleton-container';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── IntersectionObserver partagé ─────────────────────────────
  // rootMargin négatif en haut : on attend que la carte rentre vraiment
  // (~10% du viewport) avant d'animer, sinon les cartes en haut entrent
  // déjà "revealed" au premier paint.
  const io = new IntersectionObserver(function (entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      el.classList.add('revealed');
      io.unobserve(el);
    }
  }, {
    root: null,
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.05
  });

  /**
   * Tag + observe les cartes éligibles à l'intérieur de `rootEl`.
   * Idempotent : ne re-tague pas les cartes déjà connues.
   *
   * Garde-fou anti-flicker : on n'applique `.reveal` (opacity:0) que
   * pour les cartes situées sous le viewport au moment du tag. Pour
   * les cartes déjà à l'écran, on marque seulement comme "ready" sans
   * jamais les rendre invisibles — elles apparaissent au paint initial.
   */
  function tag(rootEl) {
    if (!rootEl) return 0;
    const nodes = rootEl.querySelectorAll(REVEAL_SELECTORS);
    const vh = window.innerHeight || document.documentElement.clientHeight;
    let count = 0;
    for (const el of nodes) {
      if (el.dataset.revealReady === '1') continue;
      if (el.closest(EXCLUDE_ANCESTORS)) continue;
      el.dataset.revealReady = '1';

      // Si la carte est déjà visible (ou au-dessus du viewport), on ne
      // déclenche pas l'anim d'entrée — éviterait juste un flash invisible.
      const rect = el.getBoundingClientRect();
      const isBelowViewport = rect.top > vh;
      if (!isBelowViewport || reducedMotion) continue;

      el.classList.add('reveal');
      io.observe(el);
      count++;
    }
    return count;
  }

  /**
   * Scanne la page actuellement active (visible) et tague ses cartes.
   * À appeler après tout (re-)render. Aussi déclenché automatiquement
   * via MutationObserver pour les renders dynamiques.
   */
  function scan() {
    const activePages = document.querySelectorAll('#app-screen .page.active, #admin-app-screen .page.active');
    let total = 0;
    activePages.forEach(p => { total += tag(p); });
    return total;
  }

  function disconnect() { io.disconnect(); }

  // ── Auto-scan via MutationObserver ────────────────────────────
  // Beaucoup d'écrans rerendent en remplaçant innerHTML. On observe
  // l'app pour détecter ces injections et re-scanner (debounce rAF).
  let scanPending = false;
  function requestScan() {
    if (scanPending) return;
    scanPending = true;
    requestAnimationFrame(() => {
      scanPending = false;
      scan();
    });
  }

  const appRoot = document.getElementById('app-screen') || document.body;
  const mo = new MutationObserver(function (mutations) {
    // Filtrage rapide : ne déclencher que si on voit apparaître des
    // éléments susceptibles d'être des cartes (au moins un Element).
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) { requestScan(); return; }
      }
    }
  });
  mo.observe(appRoot, { childList: true, subtree: true });

  // Scan initial (DOM déjà prêt ou DOMContentLoaded)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true });
  } else {
    requestScan();
  }

  root.scrollReveal = { scan, tag, disconnect };

})(typeof window !== 'undefined' ? window : globalThis);
