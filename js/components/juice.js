// ════════════════════════════════════════════════════════════
// CDM 2026 — js/components/juice.js  (PR #8 — Sprint 3)
//
// Effets « juicy » pour les actions clés :
//   - Juice.pronoSaved(btnEl, matchId, xpAmount)
//     * haptic(20)
//     * pulse glow 600ms sur la cellule de cote sélectionnée
//     * XP toast bottom qui slide-up 300ms puis fade 1.5s plus tard
//   - Juice.badgeParticles(rootEl)
//     * burst de particules dorées canvas (~2s) au-dessus du badge unlock
//   - Juice.xpToast(label)
//     * affiche un toast bas qui monte puis fade (réutilisable)
//
// Toutes les animations respectent prefers-reduced-motion : en mode
// réduit, on saute les particules et le pulse glow (les toasts XP
// restent mais sans translate, juste un fade simple).
// ════════════════════════════════════════════════════════════

(function (root) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // PR #9 — source de vérité : motion.prefersReduced. Fallback inline.
  const isReduced = () => (root.motion ? root.motion.prefersReduced : window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const haptic = (n) => (root.haptic ? root.haptic(n) : (navigator.vibrate ? navigator.vibrate(n) : false));

  // ── XP toast (bottom, slide-up + fade) ─────────────────────
  // 300ms slide-up → tient 1.5s → 400ms fade-out. Animation portée par
  // une classe CSS .xp-toast pilotée par data-state attribute.
  function xpToast(label) {
    const el = document.createElement('div');
    el.className = 'xp-toast';
    el.textContent = label;
    document.body.appendChild(el);
    // Force reflow puis applique l'état "in" pour déclencher la transition
    // (sinon le navigateur peut fusionner l'ajout au DOM et le set de class).
    el.offsetHeight;
    el.dataset.state = 'in';
    // Après 1.5s, on déclenche le fade. Les durées sont gérées en CSS.
    const removeAfter = isReduced() ? 800 : 2200;
    setTimeout(() => { el.dataset.state = 'out'; }, isReduced() ? 500 : 1800);
    setTimeout(() => { el.remove(); }, removeAfter);
    return el;
  }

  // ── Pulse glow sur la cellule de cote sélectionnée ─────────
  // Le « hexagone du score choisi » est concrètement la cellule
  // `.odds-cell.highlighted` dans la match-card. On lui ajoute la
  // classe .score-pulse-glow 600ms puis on la retire.
  function pulseSelectedScore(matchId) {
    if (isReduced()) return;
    const card = matchId != null ? document.getElementById('match-card-' + matchId) : null;
    const cell = card ? card.querySelector('.odds-cell.highlighted') : null;
    if (!cell) return;
    cell.classList.remove('score-pulse-glow');
    // reflow pour relancer l'animation si déjà appliquée
    cell.offsetHeight;
    cell.classList.add('score-pulse-glow');
    setTimeout(() => cell.classList.remove('score-pulse-glow'), 700);
  }

  function pronoSaved(btnEl, matchId, xpAmount) {
    haptic(20);
    pulseSelectedScore(matchId);
    if (xpAmount && xpAmount > 0) xpToast('+' + xpAmount + ' XP');
  }

  // ── Burst de particules dorées (badge unlock) ──────────────
  // Crée un canvas overlay (~2s) qui crache 28 particules en rosace
  // depuis le centre de l'icône. GPU-safe : on dessine sur canvas
  // (pas de mutation DOM par particule). Auto-cancel sur visibility.
  function badgeParticles(rootEl) {
    if (isReduced()) return;
    if (!rootEl) rootEl = document.getElementById('badge-unlock-overlay');
    if (!rootEl) return;

    // Évite les doubles instances quand re-déclenché rapidement
    const prev = rootEl.querySelector('.badge-burst-canvas');
    if (prev) prev.remove();

    const canvas = document.createElement('canvas');
    canvas.className = 'badge-burst-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;width:100%;height:100%;z-index:1';
    rootEl.appendChild(canvas);

    const rect = rootEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = rect.width / 2;
    const cy = rect.height / 2 - 20; // léger biais vers l'icône au centre
    const N = 28;
    const start = performance.now();
    const DURATION = 2000;

    const parts = Array.from({ length: N }, (_, i) => {
      const angle = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const speed = 1.6 + Math.random() * 2.2;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6, // léger upward bias
        r: 2 + Math.random() * 3,
        life: 0,
        rot: Math.random() * Math.PI,
        vr: -0.05 + Math.random() * 0.1,
        hue: Math.random() > 0.6 ? '#FFE680' : '#F4C542'
      };
    });

    let rafId = 0, stopped = false;
    function frame(now) {
      const t = (now - start) / DURATION; // 0..1
      if (t >= 1 || stopped) {
        canvas.remove();
        return;
      }
      ctx.clearRect(0, 0, rect.width, rect.height);
      const alpha = 1 - t;
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravité douce
        p.vx *= 0.992;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.hue;
        ctx.shadowColor = p.hue;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    // Stop si l'onglet passe en background (PR #9 généralisera ce pattern)
    const onVis = () => { if (document.hidden) { stopped = true; cancelAnimationFrame(rafId); canvas.remove(); document.removeEventListener('visibilitychange', onVis); } };
    document.addEventListener('visibilitychange', onVis);

    return canvas;
  }

  root.Juice = { pronoSaved, badgeParticles, xpToast };

})(typeof window !== 'undefined' ? window : globalThis);
