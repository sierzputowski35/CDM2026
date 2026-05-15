// ════════════════════════════════════════════════════════════
// CDM 2026 — js/rewards.js
// TÂCHE 3 — Particules CTA (clic sur bouton) +
// TÂCHE 7 — Particules canvas ambiantes (background)
// Extrait de index.html lignes 5819-5947 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ══ TÂCHE 3 — PARTICULES CTA ══
function autoFillScore(matchId, s1, s2) {
  const i1 = document.getElementById('s1-' + matchId);
  const i2 = document.getElementById('s2-' + matchId);
  if (!i1 || !i2) return;
  i1.value = s1; i2.value = s2;
  if (navigator.vibrate) navigator.vibrate(12);
  // Flash feedback sur les inputs
  [i1, i2].forEach(el => {
    el.style.transition = 'background .15s';
    el.style.background = 'rgba(244,197,66,.2)';
    setTimeout(() => { el.style.background = ''; }, 300);
  });
  // Highlight la cellule active
  document.querySelectorAll('#match-card-' + matchId + ' .odds-cell').forEach(c => c.classList.remove('highlighted'));
  // trouver le bouton cliqué via le résultat
  const res = parseInt(s1) > parseInt(s2) ? 0 : parseInt(s1) < parseInt(s2) ? 2 : 1;
  const cells = document.querySelectorAll('#match-card-' + matchId + ' .odds-cell');
  if (cells[res]) cells[res].classList.add('highlighted');
  markPronoDirty(matchId);
}

// Passe la match-card en mode "édition" : déverrouille les inputs et les
// boutons buteur/pari, remplace "Modifier" par "Sauvegarder la modification".
// Snapshot les valeurs en cours pour permettre Annuler.
function enterEditMode(matchId) {
  const card = document.getElementById('match-card-' + matchId);
  if (!card) return;
  const s1 = document.getElementById('s1-' + matchId);
  const s2 = document.getElementById('s2-' + matchId);
  card.dataset.snapshotS1 = s1?.value || '';
  card.dataset.snapshotS2 = s2?.value || '';
  card.dataset.pronoState = 'editing';
  renderFooterButton(matchId);
  if (navigator.vibrate) navigator.vibrate(8);
  setTimeout(() => s1?.focus(), 60);
}

// Sort du mode édition. Si cancel=true, restaure les valeurs d'avant édition.
function exitEditMode(matchId, cancel) {
  const card = document.getElementById('match-card-' + matchId);
  if (!card) return;
  if (cancel) {
    const s1 = document.getElementById('s1-' + matchId);
    const s2 = document.getElementById('s2-' + matchId);
    if (s1) s1.value = card.dataset.snapshotS1 || s1.dataset.saved || '';
    if (s2) s2.value = card.dataset.snapshotS2 || s2.dataset.saved || '';
  }
  card.dataset.pronoState = 'saved';
  renderFooterButton(matchId);
}

// Met à jour le bouton-footer en fonction du data-prono-state actuel.
function renderFooterButton(matchId) {
  const card = document.getElementById('match-card-' + matchId);
  const btn = document.getElementById('sbtn-' + matchId);
  if (!card || !btn) return;
  const state = card.dataset.pronoState;
  btn.disabled = false;
  btn.className = 'save-btn-v2';
  if (state === 'editing') {
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#050816" stroke="#050816" stroke-width="0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> SAUVEGARDER LA MODIFICATION';
    btn.setAttribute('onclick', 'savePronostic(' + matchId + ')');
  } else if (state === 'saved') {
    btn.classList.add('modifier-btn');
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Modifier mon pronostic';
    btn.setAttribute('onclick', 'enterEditMode(' + matchId + ')');
  } else {
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#050816" stroke="#050816" stroke-width="0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> ENREGISTRER MON PRONOSTIC';
    btn.setAttribute('onclick', 'savePronostic(' + matchId + ')');
  }
}

// No-op: oninput historique conservé pour compat des anciens cards déjà rendus.
function markPronoDirty(){}

function spawnParticles(originEl, count) {
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:6px;height:6px;border-radius:50%;background:${Math.random()>.5?'var(--gold-primary)':'white'};pointer-events:none;z-index:9999;transform:translate(-50%,-50%)`;
    document.body.appendChild(p);
    const angle = (i / count) * Math.PI * 2;
    const dist = 40 + Math.random() * 60;
    const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
    p.animate([
      {transform:'translate(-50%,-50%) scale(1)',opacity:1},
      {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0)`,opacity:0}
    ],{duration:600,easing:'cubic-bezier(.25,.46,.45,.94)',fill:'forwards'}).onfinish=()=>p.remove();
  }
}

// ══ TÂCHE 7 — PARTICULES CANVAS AMBIANTES ══
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { canvas.style.display = 'none'; return; }
  const particles = Array.from({length:25}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*2+0.5,
    vx: (Math.random()-.5)*.3, vy: -Math.random()*.4-.1,
    alpha: Math.random()*.5+.2
  }));
  let rafId;
  function draw() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,215,0,${p.alpha})`; ctx.fill();
      p.x+=p.vx; p.y+=p.vy;
      if(p.y<-5){p.y=H+5;p.x=Math.random()*W;}
      if(p.x<-5) p.x=W+5;
      if(p.x>W+5) p.x=-5;
    });
    rafId = requestAnimationFrame(draw);
  }
  draw();
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){cancelAnimationFrame(rafId);}else{draw();}
  });
})();

