// ════════════════════════════════════════════════════════════
// CDM 2026 — modal.js
// Helper a11y modales : focus trap + Escape + restore focus.
//
// Usage minimal (côté code appelant) :
//   ouverture : modal.classList.remove('hidden');
//               A11yModal.open(modal, { onClose: closeMyModal });
//   fermeture : A11yModal.close(modal);
//               modal.classList.add('hidden');
//
// Le helper :
//   - mémorise l'élément qui avait le focus avant ouverture
//   - focus le premier élément focusable (ou [data-autofocus]) au mount
//   - intercepte Tab/Shift+Tab pour boucler dans la modale (focus trap)
//   - intercepte Escape pour appeler onClose
//   - restaure le focus à la fermeture sur l'élément d'origine
//
// Stack-aware : ouvre une modale par-dessus une autre, Escape ferme la plus
// récente, on revient au focus précédent dans l'ordre LIFO.
// ════════════════════════════════════════════════════════════
(function () {
  const stack = [];
  const FOCUSABLE_SEL = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function visibleFocusables(root) {
    return Array.from(root.querySelectorAll(FOCUSABLE_SEL))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }

  function onKeydown(e) {
    if (!stack.length) return;
    const top = stack[stack.length - 1];
    if (e.key === 'Escape') {
      e.preventDefault();
      if (typeof top.onClose === 'function') top.onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const f = visibleFocusables(top.el);
    if (!f.length) { e.preventDefault(); top.el.focus(); return; }
    const first = f[0], last = f[f.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !top.el.contains(active))) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && (active === last || !top.el.contains(active))) {
      e.preventDefault(); first.focus();
    }
  }

  function open(el, opts) {
    if (!el) return;
    opts = opts || {};
    // évite double-open
    if (stack.some(e => e.el === el)) return;
    const previousFocus = document.activeElement;
    stack.push({ el, previousFocus, onClose: opts.onClose });
    if (stack.length === 1) document.addEventListener('keydown', onKeydown);
    // tabindex sur le conteneur si pas déjà focusable, pour fallback
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    // focus initial : [data-autofocus] sinon premier focusable sinon le conteneur
    setTimeout(() => {
      const auto = el.querySelector('[data-autofocus]');
      const target = auto || visibleFocusables(el)[0] || el;
      try { target.focus(); } catch (_) {}
    }, 0);
  }

  function close(el) {
    if (!el) return;
    const idx = stack.findIndex(e => e.el === el);
    if (idx === -1) return;
    const entry = stack.splice(idx, 1)[0];
    if (stack.length === 0) document.removeEventListener('keydown', onKeydown);
    if (entry.previousFocus && typeof entry.previousFocus.focus === 'function') {
      try { entry.previousFocus.focus(); } catch (_) {}
    }
  }

  window.A11yModal = { open, close };
})();
