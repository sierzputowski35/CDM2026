// ════════════════════════════════════════════════════════════
// CDM 2026 — js/utils/flag.js
// Wrapper unifié autour de flagcdn.com pour le rendu des drapeaux.
// Plus aucun emoji Unicode 🇫🇷 dans le rendu — uniquement des <img>.
//
// API :
//   flag(country, size = 'sm')        → <img> simple (inline, listes)
//   flagHTML(country, size = 'md')    → div riche (flag-wrap + shine/gloss)
//   countryCode(country)              → code ISO (ex 'Mexique' → 'mx')
//
// `country` accepte soit un nom français (lookup via FLAG_CODES),
// soit déjà un code ISO ('mx', 'gb-eng', etc.).
// ════════════════════════════════════════════════════════════

(function (root) {

  // FLAG_CODES vient de js/data/flags.js (chargé avant). On reste tolérant.
  function _codes() {
    return (typeof FLAG_CODES !== 'undefined') ? FLAG_CODES : {};
  }

  // ISO codes valides sur flagcdn : 2 lettres ou format spécial type "gb-eng"
  const ISO_RE = /^[a-z]{2}(-[a-z]{3})?$/;

  /**
   * Résout un nom de pays (ou un code déjà ISO) vers un code flagcdn.
   * Tolérant : accepte 'France', 'fr', 'gb-eng'.
   */
  function countryCode(country) {
    if (!country) return 'un';
    const lookup = _codes()[country];
    if (lookup) return lookup;
    const lower = String(country).toLowerCase().trim();
    if (ISO_RE.test(lower)) return lower;
    return 'un'; // UN flag = unknown
  }

  /**
   * Drapeau simple : <img> flat, sans wrapper. Idéal inline (listes, headers).
   * @param {string} country Nom FR ou code ISO
   * @param {'xs'|'sm'|'md'|'lg'} size Taille préset
   */
  function flag(country, size = 'sm') {
    const code = countryCode(country);
    const dims = {
      xs: { w: 24,  h: 16, src: 'w40'  },
      sm: { w: 36,  h: 24, src: 'w80'  },
      md: { w: 52,  h: 36, src: 'w80'  },
      lg: { w: 72,  h: 48, src: 'w160' },
    };
    const d = dims[size] || dims.sm;
    const src2x = d.src === 'w40' ? 'w80' : d.src === 'w80' ? 'w160' : 'w320';
    return `<img src="https://flagcdn.com/${d.src}/${code}.png" srcset="https://flagcdn.com/${src2x}/${code}.png 2x" width="${d.w}" height="${d.h}" alt="${_escape(country)}" loading="lazy" decoding="async" class="flag-inline" style="display:inline-block;vertical-align:middle;border-radius:3px;object-fit:cover">`;
  }

  /**
   * Drapeau riche avec effet brillance/gloss — usage cartes match, headers.
   * Compatible avec l'ancienne flagHTML(country, size).
   */
  function flagHTML(country, size = 'md') {
    const code = countryCode(country);
    const dims = { sm: { w: '40px', h: '28px' }, md: { w: '52px', h: '36px' }, lg: { w: '72px', h: '48px' } };
    const d = dims[size] || dims.md;
    return `<div class="flag-wrap flag-${size}" style="width:${d.w};height:${d.h}"><img src="https://flagcdn.com/w80/${code}.png" srcset="https://flagcdn.com/w160/${code}.png 2x" alt="${_escape(country)}" class="flag-img" loading="lazy"><div class="flag-shine"></div><div class="flag-gloss"></div></div>`;
  }

  function _escape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── Auto-hydrate placeholders <span data-flag="fr" data-flag-size="sm"> ───
  function hydrateFlags(rootEl) {
    const scope = rootEl || document;
    scope.querySelectorAll('[data-flag]:not([data-flag-hydrated])').forEach(el => {
      const country = el.getAttribute('data-flag');
      const size = el.getAttribute('data-flag-size') || 'sm';
      el.innerHTML = flag(country, size);
      el.setAttribute('data-flag-hydrated', '');
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => hydrateFlags());
    } else {
      hydrateFlags();
    }
  }

  // Expose. flagHTML reste compatible avec l'existant.
  root.flag = flag;
  root.flagHTML = flagHTML;
  root.countryCode = countryCode;
  root.hydrateFlags = hydrateFlags;

})(typeof window !== 'undefined' ? window : globalThis);
