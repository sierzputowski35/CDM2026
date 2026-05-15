// ════════════════════════════════════════════════════════════
// CDM 2026 — js/missions.js — Système missions (Bilan v3 §7)
// ════════════════════════════════════════════════════════════
// 3 niveaux : daily (3 sur 12, rotation 24h) / weekly (3 sur 6,
// rotation 7j) / tournament (5 permanentes).
//
// Modèle :
//   • Compteurs vivants dans joueurs.daily_state / weekly_state JSONB,
//     incrémentés via dispatchMissionEvent() depuis les hooks d'action
//     (savePronostic, distributeMatchXP, openChest, checkDailyReward, etc.).
//   • Table missions_progress = identité des missions actives + claimed.
//   • Le progress d'une mission est dérivé à la volée (compteurs +
//     données existantes : pronos, cartes, ligues, globaux).

// ── POOLS ────────────────────────────────────────────────────

const MISSIONS_DAILY_POOL = [
  { id:'d_pronos_3',   desc:'Faire 3 pronostics',                difficulte:'facile',     xp:50,  target:3,   counter:'pronos' },
  { id:'d_exact_1',    desc:'Trouver 1 score exact',             difficulte:'moyenne',    xp:75,  target:1,   counter:'exacts' },
  { id:'d_winner_2',   desc:'Trouver 2 bons vainqueurs',         difficulte:'facile',     xp:50,  target:2,   counter:'winners' },
  { id:'d_diff_1',     desc:'Trouver 1 bonne différence',        difficulte:'moyenne',    xp:60,  target:1,   counter:'diffs' },
  { id:'d_outsider',   desc:'Pronostiquer un outsider gagnant (cote ≥ 3)', difficulte:'difficile', xp:100, target:1, counter:'outsiderWins' },
  { id:'d_bonus',      desc:'Réussir un pari bonus',             difficulte:'moyenne',    xp:60,  target:1,   counter:'bonusCorrect' },
  { id:'d_login_2',    desc:'Se connecter 2 fois aujourd\'hui',  difficulte:'tres_facile',xp:25,  target:2,   counter:'logins' },
  { id:'d_chest_open', desc:'Ouvrir 1 coffre',                   difficulte:'facile',     xp:40,  target:1,   counter:'chestsOpened' },
  { id:'d_all_matchs', desc:'Pronostiquer tous les matchs du jour', difficulte:'moyenne', xp:80, target:1,   computed:'allDayPronos' },
  { id:'d_buteur',     desc:'Trouver 1 bon buteur',              difficulte:'moyenne',    xp:60,  target:1,   counter:'buteurCorrect' },
  { id:'d_pts_50',     desc:'Gagner 50 PTS aujourd\'hui',        difficulte:'facile',     xp:50,  target:50,  counter:'pts' },
  { id:'d_streak',     desc:'Garder ta série active (streak ≥ 2)', difficulte:'difficile', xp:80, target:2,   computed:'streak' },
];

const MISSIONS_WEEKLY_POOL = [
  { id:'w_pronos_15', desc:'Pronostiquer 15 matchs cette semaine', xp:200, target:15, counter:'pronos' },
  { id:'w_exact_3',   desc:'Trouver 3 scores exacts',              xp:300, target:3,  counter:'exacts' },
  { id:'w_streak_5',  desc:'Atteindre série de 5 pronos corrects', xp:400, target:5,  computed:'streak' },
  { id:'w_chest_5',   desc:'Ouvrir 5 coffres',                     xp:250, target:5,  counter:'chests' },
  { id:'w_pts_200',   desc:'Gagner 200 PTS cette semaine',         xp:200, target:200,counter:'pts' },
  { id:'w_badges_2',  desc:'Débloquer 2 nouveaux badges',          xp:300, target:2,  counter:'badges' },
];

const MISSIONS_TOURNAMENT = [
  { id:'t_groups_all',    desc:'Pronostiquer tous les matchs de groupe', xp:500,  computed:'groupsAll' },
  { id:'t_league_silver', desc:'Atteindre la Ligue Argent',              xp:200,  computed:'leagueSilver' },
  { id:'t_team_complete', desc:'Compléter une équipe nationale',         xp:600,  computed:'teamComplete' },
  { id:'t_globaux_all',   desc:'Pronostiquer les 7 pronostics globaux',  xp:400,  computed:'globauxAll' },
  { id:'t_exact_10',      desc:'10 scores exacts sur le tournoi',        xp:1000, computed:'exactsLifetime', target:10 },
];

// Lookup helpers
function getMissionById(id) {
  return MISSIONS_DAILY_POOL.find(m => m.id === id)
      || MISSIONS_WEEKLY_POOL.find(m => m.id === id)
      || MISSIONS_TOURNAMENT.find(m => m.id === id);
}

// ── DATE / WEEK HELPERS ───────────────────────────────────────

function _todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function _weekKey() {
  // Lundi de la semaine courante (clé stable pour reset hebdo).
  const d = new Date();
  const day = d.getUTCDay() || 7; // dim=0 → 7
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function _endOfDayUTC() {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

function _endOfWeekUTC() {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + (7 - day));
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

// ── COMPTEURS : reset si la date a changé ───────────────────

const EMPTY_DAILY = { pronos:0, exacts:0, winners:0, diffs:0, outsiderWins:0, bonusCorrect:0, buteurCorrect:0, logins:0, chestsOpened:0, pts:0 };
const EMPTY_WEEKLY = { pronos:0, exacts:0, chests:0, pts:0, badges:0 };

async function _ensureFreshState(joueur) {
  if (!joueur || !sb) return;
  const today = _todayKey();
  const week  = _weekKey();
  const patches = {};
  if ((joueur.daily_state || {}).date !== today) {
    patches.daily_state = { ...EMPTY_DAILY, date: today };
    joueur.daily_state = patches.daily_state;
  }
  if ((joueur.weekly_state || {}).week !== week) {
    patches.weekly_state = { ...EMPTY_WEEKLY, week };
    joueur.weekly_state = patches.weekly_state;
  }
  if (Object.keys(patches).length) {
    try { await sb.from('joueurs').update(patches).eq('id', joueur.id); } catch(_) {}
  }
}

// ── DISPATCH ─────────────────────────────────────────────────
// Incrémente le compteur `key` de daily (et `weeklyKey` côté weekly si
// fourni) pour le joueur donné. Appelé depuis les hooks d'action.
// `delta` peut être négatif (rare). `weeklyKey` est facultatif : un même
// counter daily n'a pas toujours un équivalent weekly (ex. winners).

async function bumpMissionCounter(joueurId, dailyKey, delta = 1, weeklyKey = null) {
  if (!joueurId || !sb) return;
  const joueur = (typeof allJoueurs !== 'undefined' ? allJoueurs : []).find(j => j.id === joueurId);
  if (!joueur) return;
  await _ensureFreshState(joueur);
  const patches = {};
  if (dailyKey && (dailyKey in (joueur.daily_state || {}))) {
    joueur.daily_state[dailyKey] = (joueur.daily_state[dailyKey] || 0) + delta;
    patches.daily_state = joueur.daily_state;
  }
  if (weeklyKey && (weeklyKey in (joueur.weekly_state || {}))) {
    joueur.weekly_state[weeklyKey] = (joueur.weekly_state[weeklyKey] || 0) + delta;
    patches.weekly_state = joueur.weekly_state;
  }
  if (Object.keys(patches).length) {
    try { await sb.from('joueurs').update(patches).eq('id', joueurId); } catch(_) {}
  }
}

// Setter pour les compteurs qui sont des max (streak), pas des +=.
async function setMissionCounterMax(joueurId, dailyKey, value, weeklyKey = null) {
  if (!joueurId || !sb) return;
  const joueur = (typeof allJoueurs !== 'undefined' ? allJoueurs : []).find(j => j.id === joueurId);
  if (!joueur) return;
  await _ensureFreshState(joueur);
  const patches = {};
  if (dailyKey) {
    const cur = (joueur.daily_state || {})[dailyKey] || 0;
    if (value > cur) {
      joueur.daily_state[dailyKey] = value;
      patches.daily_state = joueur.daily_state;
    }
  }
  if (weeklyKey) {
    const cur = (joueur.weekly_state || {})[weeklyKey] || 0;
    if (value > cur) {
      joueur.weekly_state[weeklyKey] = value;
      patches.weekly_state = joueur.weekly_state;
    }
  }
  if (Object.keys(patches).length) {
    try { await sb.from('joueurs').update(patches).eq('id', joueurId); } catch(_) {}
  }
}

// ── ROTATION : pioche 3 daily + 3 weekly + 5 tournoi pour le joueur ──

async function ensureActiveMissions(joueurId) {
  if (!joueurId || !sb) return;
  const joueur = (typeof allJoueurs !== 'undefined' ? allJoueurs : []).find(j => j.id === joueurId);
  if (!joueur) return;
  await _ensureFreshState(joueur);

  const today = _todayKey();
  const week  = _weekKey();
  const toInsert = [];

  // Daily : rotate si jour différent du dernier roll, ou si pas de rangées daily
  if (joueur.last_daily_missions_date !== today) {
    try {
      await sb.from('missions_progress').delete()
        .eq('joueur_id', joueurId).eq('mission_type', 'daily');
    } catch(_) {}
    const shuffled = [...MISSIONS_DAILY_POOL].sort(() => Math.random() - 0.5);
    shuffled.slice(0, 3).forEach(m => {
      toInsert.push({ joueur_id: joueurId, mission_id: m.id, mission_type: 'daily', reset_at: _endOfDayUTC() });
    });
    try {
      await sb.from('joueurs').update({ last_daily_missions_date: today }).eq('id', joueurId);
      joueur.last_daily_missions_date = today;
    } catch(_) {}
  }

  // Weekly : pareil sur la semaine
  if (joueur.last_weekly_missions_week !== week) {
    try {
      await sb.from('missions_progress').delete()
        .eq('joueur_id', joueurId).eq('mission_type', 'weekly');
    } catch(_) {}
    const shuffled = [...MISSIONS_WEEKLY_POOL].sort(() => Math.random() - 0.5);
    shuffled.slice(0, 3).forEach(m => {
      toInsert.push({ joueur_id: joueurId, mission_id: m.id, mission_type: 'weekly', reset_at: _endOfWeekUTC() });
    });
    try {
      await sb.from('joueurs').update({ last_weekly_missions_week: week }).eq('id', joueurId);
      joueur.last_weekly_missions_week = week;
    } catch(_) {}
  }

  // Tournament : ensure les 5 existent (jamais reset)
  let existingTournament = [];
  try {
    const { data } = await sb.from('missions_progress')
      .select('mission_id').eq('joueur_id', joueurId).eq('mission_type', 'tournament');
    existingTournament = (data || []).map(r => r.mission_id);
  } catch(_) {}
  MISSIONS_TOURNAMENT.forEach(m => {
    if (!existingTournament.includes(m.id)) {
      toInsert.push({ joueur_id: joueurId, mission_id: m.id, mission_type: 'tournament', reset_at: null });
    }
  });

  if (toInsert.length) {
    try { await sb.from('missions_progress').insert(toInsert); } catch(e) {
      console.warn('[missions] insert active failed:', e);
    }
  }
}

// ── PROGRESS COMPUTATION ─────────────────────────────────────

function _computeProgress(missionDef, joueur, opts = {}) {
  // opts.matchsToday, opts.stats — peuvent être précalculés pour batcher.
  if (missionDef.counter) {
    const bucket = missionDef.id.startsWith('w_') ? (joueur.weekly_state || {}) : (joueur.daily_state || {});
    return bucket[missionDef.counter] || 0;
  }
  if (missionDef.computed === 'streak') {
    return (opts.stats && opts.stats.maxStreak) || 0;
  }
  if (missionDef.computed === 'allDayPronos') {
    const todayMs = new Date().toISOString().slice(0, 10);
    const todays = (typeof MATCHS !== 'undefined' ? MATCHS : []).filter(m => {
      // m.ts = YYYYMMDD numérique
      if (!m.ts) return false;
      const y = String(m.ts).slice(0, 4), mo = String(m.ts).slice(4, 6), d = String(m.ts).slice(6, 8);
      return `${y}-${mo}-${d}` === todayMs;
    });
    if (!todays.length) return 0;
    const prog = joueur.pronostics || {};
    return todays.every(m => prog[m.id]) ? 1 : 0;
  }
  if (missionDef.computed === 'groupsAll') {
    if (typeof phaseAllProno === 'function') return phaseAllProno(joueur, 'Groupes') ? 1 : 0;
    return 0;
  }
  if (missionDef.computed === 'leagueSilver') {
    return ['argent','or','diamant','legende'].includes(joueur.league) ? 1 : 0;
  }
  if (missionDef.computed === 'teamComplete') {
    return (opts.stats && opts.stats.teamCompleted) ? 1 : 0;
  }
  if (missionDef.computed === 'globauxAll') {
    return (opts.stats && opts.stats.globauxFilled) || 0;
  }
  if (missionDef.computed === 'exactsLifetime') {
    return (opts.stats && opts.stats.scoresExacts) || 0;
  }
  return 0;
}

function _missionTarget(missionDef) {
  if (typeof missionDef.target !== 'undefined') return missionDef.target;
  if (missionDef.computed === 'globauxAll') return 7;
  return 1;
}

// ── CLAIM ────────────────────────────────────────────────────

async function claimMission(missionRowId) {
  if (!sb) return;
  const { data: row, error: e1 } = await sb.from('missions_progress')
    .select('*').eq('id', missionRowId).maybeSingle();
  if (e1 || !row) { showToast('Mission introuvable'); return; }
  if (row.claimed) { showToast('Mission déjà réclamée'); return; }
  const def = getMissionById(row.mission_id);
  if (!def) return;
  const joueur = allJoueurs.find(j => j.id === row.joueur_id);
  if (!joueur) return;

  // Validation de complétion côté client + serveur (re-compute)
  const stats = (typeof computePlayerStats === 'function') ? computePlayerStats(joueur) : {};
  // Pour teamComplete : on enrichit `stats` à la volée (sinon faudrait re-fetch cartes)
  if (def.computed === 'teamComplete') {
    try {
      const { data: cartes } = await sb.from('cartes_collection')
        .select('equipe').eq('joueur_id', joueur.id);
      const byTeam = (cartes || []).reduce((acc, c) => { if (c.equipe) acc[c.equipe] = (acc[c.equipe] || 0) + 1; return acc; }, {});
      stats.teamCompleted = Object.values(byTeam).some(n => n >= 11);
    } catch(_) {}
  }
  const progress = _computeProgress(def, joueur, { stats });
  const target = _missionTarget(def);
  if (progress < target) {
    showToast(`Pas encore : ${progress}/${target}`);
    return;
  }

  // Persist claimed, gain XP, retire mission unclaimed
  try {
    await sb.from('missions_progress').update({ claimed: true }).eq('id', missionRowId);
  } catch(e) { console.warn('[missions] claim update failed:', e); }
  // SPRINT 7.7 — Small "+X XP" floating popup depuis le bouton tapé.
  // Discret (15px), monte avec trail, complète les particules juicyTap (Sprint 2).
  if (joueur.id === currentUser && typeof spawnFloatingNumber === 'function') {
    const btn = document.querySelector('button.mission-claim-btn[data-mission-id="' + missionRowId + '"]');
    if (btn) {
      const r = btn.getBoundingClientRect();
      spawnFloatingNumber(r.left + r.width / 2, r.top + r.height / 2, '+' + def.xp + ' XP', '#FFE680');
    }
  }
  if (typeof gainXP === 'function' && joueur.id === currentUser) {
    await gainXP(def.xp, 'mission_' + def.id);
  } else if (typeof gainXPFor === 'function') {
    await gainXPFor(joueur.id, def.xp, 'mission_' + def.id);
  }
  showToast(`🎯 ${def.desc} · +${def.xp} XP`);

  // Re-render et recheck badges (5 badges missions de l'Étape 6 dépendent de ça)
  if (typeof renderMissionsCard === 'function') await renderMissionsCard();
  if (typeof checkBadges === 'function') setTimeout(() => checkBadges(), 600);
}

// ── COUNTERS pour les badges missions (Étape 6) ──────────────
// Les badges first_mission / missions_25 / missions_100 /
// missions_weekly_10 / missions_tournoi_all comptent les missions
// CLAIMED (pas juste actives). On expose un helper pour checkBadges.

async function getClaimedMissionsCount(joueurId) {
  if (!sb || !joueurId) return { daily: 0, weekly: 0, tournament: 0, total: 0 };
  try {
    const { data } = await sb.from('missions_progress')
      .select('mission_type, claimed').eq('joueur_id', joueurId).eq('claimed', true);
    const out = { daily: 0, weekly: 0, tournament: 0, total: (data || []).length };
    (data || []).forEach(r => { out[r.mission_type] = (out[r.mission_type] || 0) + 1; });
    return out;
  } catch(_) {
    return { daily: 0, weekly: 0, tournament: 0, total: 0 };
  }
}

// ── RENDER ───────────────────────────────────────────────────

async function renderMissionsCard() {
  const container = document.getElementById('mission-home');
  if (!container) return;
  const joueur = (typeof allJoueurs !== 'undefined' ? allJoueurs : []).find(j => j.id === currentUser);
  if (!joueur || !sb) { container.innerHTML = ''; return; }

  await ensureActiveMissions(joueur.id);

  // Fetch toutes les missions actives en une query
  let rows = [];
  try {
    const { data } = await sb.from('missions_progress')
      .select('*').eq('joueur_id', joueur.id);
    rows = data || [];
  } catch(_) {}

  const stats = (typeof computePlayerStats === 'function') ? computePlayerStats(joueur) : {};

  const buildSection = (type, title, icon) => {
    const items = rows.filter(r => r.mission_type === type);
    if (!items.length) return '';
    const tilesHtml = items.map(row => {
      const def = getMissionById(row.mission_id);
      if (!def) return '';
      const progress = _computeProgress(def, joueur, { stats });
      const target = _missionTarget(def);
      const done = progress >= target;
      const pct = Math.min(100, Math.round((progress / target) * 100));
      const claimed = !!row.claimed;
      const claimBtn = (done && !claimed)
        ? `<button class="mission-claim-btn" data-mission-id="${row.id}" onclick="juicyTap(event, 20); claimMission(${row.id})">Réclamer +${def.xp} XP</button>`
        : claimed
          ? `<div class="mission-claimed">✓ Réclamée</div>`
          : `<div class="mission-xp-pending">+${def.xp} XP</div>`;
      return `
        <div class="mission-tile ${claimed ? 'is-claimed' : done ? 'is-done' : ''}">
          <div class="mission-tile-head">
            <span class="mission-tile-desc">${def.desc}</span>
            <span class="mission-tile-progress">${Math.min(progress, target)}/${target}</span>
          </div>
          <div class="mission-bar"><div class="mission-fill" style="width:${pct}%"></div></div>
          <div class="mission-tile-foot">${claimBtn}</div>
        </div>`;
    }).join('');
    return `
      <div class="missions-section">
        <div class="missions-section-title">${icon} ${title}</div>
        ${tilesHtml}
      </div>`;
  };

  container.innerHTML = `
    <div class="card-missions">
      <div class="missions-head">
        <div class="missions-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--royal-purple)" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
          MISSIONS
        </div>
      </div>
      ${buildSection('daily',      'Quotidiennes',  '🌅')}
      ${buildSection('weekly',     'Hebdomadaires', '📅')}
      ${buildSection('tournament', 'Tournoi',       '🏆')}
    </div>`;
}
