// ════════════════════════════════════════════════════════════
// CDM 2026 — js/utils/haptic.js
// Feedback haptique léger pour les interactions tactiles.
// Wrapper sur navigator.vibrate — no-op silencieux si non supporté
// (desktop, navigateurs sans permission, iOS Safari sans web-app).
//
// API :
//   haptic(intensity)  → intensity en ms (10=light, 25=medium, 50=heavy)
//                        ou tableau [on, off, on, ...] pour pattern.
//
// Auto-bind : tous les boutons portant .btn-primary / .btn-secondary /
// .btn-confirm / .btn-danger / .btn-info déclenchent haptic(10) au
// pointerdown. Désactivable avec data-no-haptic.
// ════════════════════════════════════════════════════════════

(function (root) {

  const _supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  /**
   * Déclenche un feedback haptique. No-op si non supporté.
   * @param {number|number[]} intensity Durée ms ou pattern.
   */
  function haptic(intensity = 10) {
    if (!_supported) return false;
    try { return navigator.vibrate(intensity); }
    catch (_) { return false; }
  }

  // Auto-bind sur les boutons premium (delegated)
  const PRIMARY_SEL = '.btn-primary, .btn-secondary, .btn-confirm, .btn-danger, .btn-info, .btn-hero';

  function _onPointerDown(ev) {
    const btn = ev.target.closest(PRIMARY_SEL);
    if (!btn) return;
    if (btn.hasAttribute('data-no-haptic')) return;
    if (btn.disabled || btn.classList.contains('is-disabled') || btn.classList.contains('btn-disabled')) return;
    haptic(10);
  }

  if (typeof document !== 'undefined') {
    // pointerdown = avant click, plus réactif sur tactile
    document.addEventListener('pointerdown', _onPointerDown, { passive: true });
  }

  root.haptic = haptic;

})(typeof window !== 'undefined' ? window : globalThis);
