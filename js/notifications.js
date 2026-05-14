// ════════════════════════════════════════════════════════════
// CDM 2026 — js/notifications.js
// PHASE 10 — Notifications in-app (panel + badge unread count)
// Extrait de index.html lignes 5948-6034 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ══ PHASE 10 — NOTIFICATIONS IN-APP ══
function generateNotifs() {
  const joueur = allJoueurs.find(j => j.id === currentUser);
  if (!joueur) return [];
  const notifs = [];
  const today = new Date().toISOString().split('T')[0];

  // Daily reward dispo
  const lastClaim = localStorage.getItem('cdm2026_last_claim');
  if (lastClaim !== today) {
    const streak = parseInt(localStorage.getItem('cdm2026_dr_streak') || '0');
    notifs.push({ icon: 'gift', title: 'Récompense quotidienne disponible !', sub: `Jour ${streak + 1} — réclamez vos bonus`, action: () => switchTab('home', document.getElementById('tab-home')) });
  }

  // Matchs sans prono dans les prochaines 24h
  const now = Date.now();
  const prog = joueur.pronostics || {};
  const urgents = MATCHS.filter(m => {
    if (allScores[m.id] || prog[m.id]) return false;
    const ts = (m.ts * 86400 + 18 * 3600) * 1000;
    return ts > now && ts < now + 86400000;
  });
  if (urgents.length > 0) {
    notifs.push({ icon: 'zap', title: `${urgents.length} match${urgents.length > 1 ? 's' : ''} à pronostiquer aujourd'hui`, sub: urgents.slice(0, 2).map(m => `${m.name1} vs ${m.name2}`).join(' · '), action: () => switchTab('pronos', document.getElementById('tab-pronos')) });
  }

  // Quelqu'un a dépassé dans le classement
  const board = getLeaderboard();
  const myRank = board.findIndex(p => p.id === currentUser) + 1;
  if (myRank > 1) {
    const above = board[myRank - 2];
    const gap = above.pts - (board[myRank - 1]?.pts || 0);
    if (gap <= 10) notifs.push({ icon: 'trending-up', title: `${above.pseudo} est devant toi de seulement ${gap} pt${gap > 1 ? 's' : ''}`, sub: 'Pronostique pour reprendre la tête !', action: () => switchTab('pronos', document.getElementById('tab-pronos')) });
  }

  // Badge proche
  const stats = computePlayerStats(joueur);
  const key = 'cdm2026_badges_' + joueur.id;
  const earned = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
  const proche = BADGES.find(b => !earned.has(b.id) && (
    (b.id === 'exact_5'   && stats.scoresExacts >= 3) ||
    (b.id === 'exact_10'  && stats.scoresExacts >= 7) ||
    (b.id === 'hat_trick' && stats.maxStreak    >= 2) ||
    (b.id === 'streak_5'  && stats.maxStreak    >= 3)
  ));
  if (proche) notifs.push({ icon: proche.icon, title: `Badge "${proche.name}" presque débloqué !`, sub: 'Continue comme ça', action: null });

  return notifs;
}

function updateNotifBadge() {
  const notifs = generateNotifs();
  const btn = document.getElementById('notif-btn');
  const cnt = document.getElementById('notif-count');
  if (!btn || !cnt) return;
  if (notifs.length > 0) { cnt.textContent = notifs.length; cnt.style.display = 'flex'; }
  else { cnt.style.display = 'none'; }
}

function openNotifPanel() {
  const notifs = generateNotifs();
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!notifs.length) {
    list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text3)"><div style="margin-bottom:12px;color:var(--text2)">${window.icon('check-double', 40)}</div><div>Tout est à jour !</div></div>`;
  } else {
    list.innerHTML = notifs.map((n, i) => `
      <div class="notif-item" style="${n.action ? 'cursor:pointer' : ''}">
        <div class="notif-dot-icon">${window.icon(n.icon, 22)}</div>
        <div class="notif-text">
          <strong>${n.title}</strong>
          <span>${n.sub}</span>
          ${n.action ? '<span class="notif-cta">Voir →</span>' : ''}
        </div>
      </div>`).join('');
    window._notifActions = notifs.map(n => n.action);
    list.querySelectorAll('.notif-item').forEach((el, i) => {
      if (window._notifActions[i]) el.addEventListener('click', () => { closeNotifPanel(); setTimeout(() => window._notifActions[i]?.(), 200); });
    });
  }
  document.getElementById('notif-panel').classList.remove('hidden');
}

function closeNotifPanel() {
  document.getElementById('notif-panel')?.classList.add('hidden');
}

