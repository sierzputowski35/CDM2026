// ════════════════════════════════════════════════════════════
// CDM 2026 — js/utils/motion.js  (PR #9 — Sprint 3)
//
// Préférences de mouvement centralisées + helper de durée.
//
// Avant ce module, chaque appelant écrivait :
//   window.matchMedia('(prefers-reduced-motion: reduce)').matches
// dispersé dans le code. On centralise pour pouvoir :
//   1. réagir en live au changement (toggle iOS / DevTools)
//   2. plafonner les durées d'anim en mode réduit
//   3. exposer un point d'évolution unique
//
// API exposée sur window.motion :
//   motion.prefersReduced            → boolean (toujours à jour)
//   motion.duration(ms, capReduced?) → durée à utiliser : ms en mode
//                                      normal, capReduced (defaut 0)
//                                      en mode réduit. Si capReduced
//                                      est >0 mais inférieur à ms, il
//                                      est retourné tel quel ; sinon 0.
//   motion.subscribe(fn)             → appelle fn(prefersReduced)
//                                      quand la préférence change.
//                                      Retourne un unsubscribe.
//
// Pas de side-effect : ce module n'annule rien et ne modifie aucune
// anim existante. C'est juste la source de vérité partagée.
// ════════════════════════════════════════════════════════════

(function (root) {
  if (typeof window === 'undefined') return;

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new Set();

  const state = { prefersReduced: mq.matches };

  function notify() {
    state.prefersReduced = mq.matches;
    listeners.forEach(fn => { try { fn(state.prefersReduced); } catch (_) {} });
  }

  // addEventListener moderne, fallback addListener pour Safari < 14.
  if (mq.addEventListener) mq.addEventListener('change', notify);
  else if (mq.addListener) mq.addListener(notify);

  function subscribe(fn) {
    if (typeof fn !== 'function') return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  /**
   * Renvoie la durée à utiliser pour une anim.
   * - Mode normal : `ms` inchangé.
   * - Mode réduit : `capReduced` (défaut 0) — borne à `ms` si plus grand.
   * Utilisation typique : `el.animate(..., motion.duration(800))`.
   */
  function duration(ms, capReduced) {
    if (!state.prefersReduced) return ms;
    const cap = typeof capReduced === 'number' ? capReduced : 0;
    return Math.min(ms, cap);
  }

  Object.defineProperty(state, 'prefersReduced', {
    configurable: true,
    get() { return mq.matches; }
  });

  root.motion = {
    get prefersReduced() { return mq.matches; },
    duration,
    subscribe
  };

})(typeof window !== 'undefined' ? window : globalThis);
