// ════════════════════════════════════════════════════════════
// CDM 2026 — js/badges.js
// Catalogue des badges + fonctions Supabase de déblocage
// Extrait de index.html lignes 1639-1846 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ── SPRINT 5 — BADGES ──
// Le champ `icon` est désormais un NOM d'icône (cf. js/utils/icons.js).
// Le rendu passe par window.icon(name, size) — plus aucun emoji Unicode ici.
const BADGES = [
  // PERFORMANCE
  { id:'first_blood',   name:'Première Lame',   desc:'1er pronostic validé',             icon:'swords',        rarete:'commun',  xp:25  },
  { id:'exact_1',       name:'Œil de Lynx',     desc:'Trouver 1 score exact',            icon:'bullseye',      rarete:'commun',  xp:50  },
  { id:'exact_5',       name:'Télépathe',        desc:'5 scores exacts',                  icon:'crystal-ball',  rarete:'rare',    xp:100 },
  { id:'exact_10',      name:'Predictor God',    desc:'10 scores exacts',                 icon:'eye',           rarete:'epique',  xp:250 },
  { id:'hat_trick',     name:'Hat-Trick',        desc:'3 scores exacts d\'affilée',       icon:'hat',           rarete:'epique',  xp:300 },
  { id:'clutch_king',   name:'Clutch King',      desc:'Gagner sur le dernier match',      icon:'crown',         rarete:'rare',    xp:150 },
  { id:'upset_master',  name:'Upset Master',     desc:'3 outsiders gagnants trouvés',     icon:'fox',           rarete:'epique',  xp:200 },
  // RÉGULARITÉ
  { id:'daily_3',       name:'Habitué',          desc:'3 jours consécutifs',              icon:'calendar',      rarete:'commun',  xp:50  },
  { id:'daily_7',       name:'Fidèle',           desc:'7 jours consécutifs',              icon:'calendar',      rarete:'rare',    xp:150 },
  { id:'daily_14',      name:'Inébranlable',     desc:'14 jours consécutifs',             icon:'shield',        rarete:'epique',  xp:300 },
  { id:'daily_30',      name:'Légende du Daily', desc:'30 jours consécutifs',             icon:'star',          rarete:'legende', xp:500 },
  { id:'streak_5',      name:'En Feu',           desc:'5 pronos corrects d\'affilée',     icon:'flame',         rarete:'rare',    xp:150 },
  { id:'streak_10',     name:'Brasier',          desc:'10 pronos corrects d\'affilée',    icon:'meteor',        rarete:'legende', xp:400 },
  // LIGUES
  { id:'league_silver', name:'Promotion Argent', desc:'Atteindre la ligue Argent',        icon:'silver-medal',  rarete:'commun',  xp:75  },
  { id:'league_gold',   name:'Promotion Or',     desc:'Atteindre la ligue Or',            icon:'gold-medal',    rarete:'rare',    xp:150 },
  { id:'league_diamond',name:'Promotion Diamant',desc:'Atteindre la ligue Diamant',       icon:'diamond',       rarete:'epique',  xp:300 },
  { id:'league_legend', name:'Promotion Légende',desc:'Atteindre la ligue Légende',       icon:'crown',         rarete:'legende', xp:600 },
  // SOCIAL
  { id:'club_member',   name:'Membre d\'un Club',desc:'Rejoindre un club',                icon:'users',         rarete:'commun',  xp:30  },
  { id:'club_top',      name:'Roi du Club',      desc:'Être 1er de ton club',             icon:'trophy',        rarete:'rare',    xp:200 },
  { id:'rival_5',       name:'Rival Tenace',     desc:'Dépasser un ami 5 fois',           icon:'swords',        rarete:'rare',    xp:100 },
  // TOURNOI
  { id:'group_complete',name:'Phase de Groupes', desc:'Pronostiquer tous les matchs de groupe', icon:'ticket',  rarete:'rare',    xp:150 },
  { id:'round_16',      name:'8èmes de Finale',  desc:'Pronos sur tous les 8èmes',        icon:'ticket',        rarete:'rare',    xp:150 },
  { id:'quarters',      name:'Quarts',           desc:'Pronos sur tous les quarts',       icon:'ticket',        rarete:'epique',  xp:200 },
  { id:'semis',         name:'Demies',           desc:'Pronos sur les demi-finales',      icon:'ticket',        rarete:'epique',  xp:250 },
  { id:'final',         name:'Finaliste',        desc:'Pronostic sur la finale',          icon:'trophy',        rarete:'legende', xp:500 },
  // COLLECTION
  { id:'cards_10',      name:'Apprenti Coll.',   desc:'10 cartes obtenues',               icon:'card',          rarete:'commun',  xp:50  },
  { id:'cards_50',      name:'Collectionneur',   desc:'50 cartes obtenues',               icon:'books',         rarete:'rare',    xp:200 },
  { id:'cards_100',     name:'Maître Coll.',     desc:'100 cartes obtenues',              icon:'museum',        rarete:'epique',  xp:400 },
  { id:'album_team',    name:'Maître National',  desc:'Compléter une équipe entière',     icon:'shield',        rarete:'legende', xp:500 },
  { id:'legendary_card',name:'Première Légende', desc:'Obtenir une carte légendaire',     icon:'star',          rarete:'epique',  xp:300 },
];

// ── SPRINT 5 — BADGE FUNCTIONS (Supabase-backed) ──

function computePlayerStats(joueur) {
  const prog = joueur.pronostics || {};
  let totalPronos = 0, scoresExacts = 0, pts = 0, streak = 0, maxStreak = 0;
  let outsiderWins = 0;
  for (const m of MATCHS) {
    const p = prog[m.id]; if (!p) continue;
    totalPronos++;
    const real = allScores[m.id]; if (!real) continue;
    const p1=parseInt(p.s1),p2=parseInt(p.s2),r1=parseInt(real.s1),r2=parseInt(real.s2);
    if (isNaN(p1)||isNaN(p2)) continue;
    const ptsM = computeMatchPts(m, p, real);
    if (ptsM !== null) pts += ptsM;
    if (p1===r1 && p2===r2) { scoresExacts++; streak++; maxStreak=Math.max(maxStreak,streak); }
    else { streak=0; }
    // Outsider win: pronostiquer le vainqueur côté >3.0
    const rRes = r1>r2?1:r1<r2?2:0, pRes = p1>p2?1:p1<p2?2:0;
    if (rRes===pRes && rRes!==0) {
      const winCote = rRes===1 ? (m.c1||1) : (m.c2||1);
      if (winCote >= 3.0) outsiderWins++;
    }
  }
  const loginStreak = joueur.daily_streak || parseInt(localStorage.getItem('cdm2026_dr_streak')||'0');
  return { totalPronos, scoresExacts, pts, maxStreak, loginStreak, outsiderWins,
           totalCartes:0, cartesLegende:0 }; // cartes chargées async si besoin
}

// Vrai uniquement si la phase contient ≥1 match ET le joueur a pronostiqué tous.
function phaseAllProno(joueur, phaseName) {
  const arr = MATCHS.filter(m => m.phase === phaseName);
  if (!arr.length) return false;
  const prog = joueur.pronostics || {};
  return arr.every(m => prog[m.id]);
}

async function checkBadgeCondition(badgeId, joueur, stats) {
  switch(badgeId) {
    case 'first_blood':    return stats.totalPronos >= 1;
    case 'exact_1':        return stats.scoresExacts >= 1;
    case 'exact_5':        return stats.scoresExacts >= 5;
    case 'exact_10':       return stats.scoresExacts >= 10;
    case 'hat_trick':      return stats.maxStreak >= 3;
    case 'clutch_king':    return (() => {
      const lastM = [...MATCHS].reverse().find(m => allScores[m.id]);
      if (!lastM) return false;
      const p = (joueur.pronostics||{})[lastM.id]; if (!p) return false;
      return computeMatchPts(lastM, p, allScores[lastM.id]) > 0;
    })();
    case 'upset_master':   return stats.outsiderWins >= 3;
    case 'daily_3':        return stats.loginStreak >= 3;
    case 'daily_7':        return stats.loginStreak >= 7;
    case 'daily_14':       return stats.loginStreak >= 14;
    case 'daily_30':       return stats.loginStreak >= 30;
    case 'streak_5':       return stats.maxStreak >= 5;
    case 'streak_10':      return stats.maxStreak >= 10;
    case 'league_silver':  return ['argent','or','diamant','legende'].includes(joueur.league);
    case 'league_gold':    return ['or','diamant','legende'].includes(joueur.league);
    case 'league_diamond': return ['diamant','legende'].includes(joueur.league);
    case 'league_legend':  return joueur.league === 'legende';
    // ⚠️ Garde-fou : `.every()` sur un tableau vide retourne `true` (vacuous truth).
    // Sans le check `length > 0`, ces badges se débloquent à tort dès le 1er prono
    // tant que la phase n'existe pas encore dans MATCHS.
    case 'group_complete': return phaseAllProno(joueur, 'Groupes');
    case 'round_16':       return phaseAllProno(joueur, '8es de finale');
    case 'quarters':       return phaseAllProno(joueur, 'Quarts de finale');
    case 'semis':          return phaseAllProno(joueur, 'Demi-finales');
    case 'final':          return MATCHS.filter(m=>m.phase==='Finale').some(m=>(joueur.pronostics||{})[m.id]);
    case 'cards_10':       return stats.totalCartes >= 10;
    case 'cards_50':       return stats.totalCartes >= 50;
    case 'cards_100':      return stats.totalCartes >= 100;
    case 'legendary_card': return stats.cartesLegende >= 1;
    default: return false;
  }
}

// Cache mémoire : protège contre le re-déclenchement du même badge dans
// la session courante si l'insert DB échoue silencieusement (RLS, schéma...).
// Sans ce filet, chaque prono qui re-déclenche checkBadges fait spawn une
// nouvelle modal pour first_blood, alors que la condition est trivialement
// remplie en permanence.
const __sessionUnlockedBadges = new Set();

async function checkBadges() {
  const joueur = allJoueurs.find(j => j.id === currentUser);
  if (!joueur || !sb) return;
  try {
    const { data: alreadyUnlocked, error: selectErr } = await sb
      .from('badges_debloques')
      .select('badge_id').eq('joueur_id', currentUser);
    if (selectErr) console.warn('[badges] SELECT badges_debloques failed:', selectErr);

    const unlockedIds = new Set([
      ...((alreadyUnlocked || []).map(b => b.badge_id)),
      ...__sessionUnlockedBadges,
    ]);

    // Optionally fetch carte counts
    let totalCartes = 0, cartesLegende = 0;
    try {
      const { data: cartes } = await sb.from('cartes_collection').select('rarete').eq('joueur_id', currentUser);
      totalCartes = (cartes||[]).length;
      cartesLegende = (cartes||[]).filter(c=>c.rarete==='legende').length;
    } catch(_) {}

    const stats = computePlayerStats(joueur);
    stats.totalCartes = totalCartes;
    stats.cartesLegende = cartesLegende;

    // Phase 1 : recenser tous les badges à débloquer avant de toucher quoi que ce soit
    const toUnlock = [];
    for (const badge of BADGES) {
      if (unlockedIds.has(badge.id)) continue;
      if (await checkBadgeCondition(badge.id, joueur, stats)) {
        toUnlock.push(badge);
      }
    }
    if (!toUnlock.length) return;

    // Marquer en cache mémoire IMMÉDIATEMENT : même si l'insert DB échoue,
    // on ne reproposera plus ces badges pendant cette session.
    for (const b of toUnlock) __sessionUnlockedBadges.add(b.id);

    // Phase 2 : insert DB en un seul appel.
    // Supabase ne throw pas sur erreur DB → on lit explicitement `error`.
    const { error: insertErr } = await sb.from('badges_debloques').insert(
      toUnlock.map(b => ({ joueur_id: currentUser, badge_id: b.id }))
    );
    if (insertErr) {
      console.warn('[badges] INSERT badges_debloques failed:', insertErr,
        '— badges concernés:', toUnlock.map(b => b.id));
    }

    // Phase 3 : UN seul gainXP cumulé → au plus 1 modal level-up,
    // pas N modales empilées (un coffre d'XP par badge).
    const totalBadgeXP = toUnlock.reduce((sum, b) => sum + (b.xp || 50), 0);
    const totalBadgeCoins = toUnlock.length * (COIN_REWARDS.badge_unlock || 100);
    if (totalBadgeXP > 0) await gainXP(totalBadgeXP, 'badges_batch');
    if (totalBadgeCoins > 0 && typeof addCoins === 'function') {
      await addCoins(totalBadgeCoins);
    }

    // Phase 4 : overlays badge en file séquentielle (attend les modales en cours)
    enqueueBadgeOverlays(toUnlock);
  } catch(e) { console.warn('checkBadges error:', e); }
}

// ── File d'attente pour les overlays de déblocage badge ──
// Empêche l'empilement quand plusieurs badges sautent en même temps
// (ex. score exact = first_blood + exact_1 + ... d'un coup).
const __badgeOverlayQueue = [];
let __badgeOverlayBusy = false;

function enqueueBadgeOverlays(badges) {
  for (const b of badges) __badgeOverlayQueue.push(b);
  drainBadgeOverlayQueue();
}

function drainBadgeOverlayQueue() {
  if (__badgeOverlayBusy || !__badgeOverlayQueue.length) return;
  __badgeOverlayBusy = true;
  // Attendre que toute modal level-up éventuelle se ferme avant d'enchaîner.
  waitForLevelUpClosed().then(() => {
    const badge = __badgeOverlayQueue.shift();
    showBadgeUnlockModal(badge);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    // showBadgeUnlockModal auto-ferme après 5500ms (cf. setTimeout interne)
    setTimeout(() => {
      __badgeOverlayBusy = false;
      drainBadgeOverlayQueue();
    }, 5800);
  });
}

// gainXP programme showLevelUpModal via setTimeout(400ms), donc on lui laisse
// 600ms pour apparaître avant de conclure qu'il n'y aura pas de modal.
function waitForLevelUpClosed() {
  return new Promise(resolve => {
    setTimeout(() => {
      const tick = () => {
        if (!document.querySelector('.level-up-modal')) return resolve();
        setTimeout(tick, 200);
      };
      tick();
    }, 600);
  });
}

// Retourne les badges débloqués depuis Supabase (async) ou localStorage (fallback)
async function getEarnedBadgeIds(joueurId) {
  try {
    if (!sb) throw new Error('no sb');
    const { data } = await sb.from('badges_debloques').select('badge_id').eq('joueur_id', joueurId);
    return new Set((data || []).map(b => b.badge_id));
  } catch(_) {
    const key = 'cdm2026_badges_' + joueurId;
    return new Set(JSON.parse(localStorage.getItem(key)||'[]'));
  }
}

function showBadgeUnlockModal(badge) {
  const overlay = document.getElementById('badge-unlock-overlay');
  const icon    = document.getElementById('badge-unlock-icon');
  const nameEl  = document.getElementById('badge-unlock-name');
  const descEl  = document.getElementById('badge-unlock-desc');
  const rewardEl= document.getElementById('badge-unlock-reward');
  const rareteEl= document.getElementById('badge-unlock-rarete');
  const equipBtn= document.getElementById('badge-equip-btn');

  icon.innerHTML = window.icon(badge.icon || 'gold-medal', 72);
  nameEl.textContent = badge.name;

  if (descEl)  { descEl.textContent = badge.desc || ''; descEl.style.display = badge.desc ? '' : 'none'; }
  if (rewardEl){ rewardEl.innerHTML = `+${badge.xp||50} XP  +${COIN_REWARDS?.badge_unlock||100} ${window.icon('coin', 14)}`; rewardEl.style.display = ''; }

  const rareteLabels = { commun:'COMMUN', rare:'RARE', epique:'ÉPIQUE', legende:'LÉGENDAIRE' };
  const rareteColors = { commun:'#9CA3AF', rare:'#58C8FA', epique:'#A855F7', legende:'#F4C542' };
  if (rareteEl) {
    rareteEl.textContent = rareteLabels[badge.rarete] || '';
    rareteEl.style.color = rareteColors[badge.rarete] || '#fff';
    rareteEl.style.display = '';
  }

  // Glow color selon rareté
  const glowColors = { commun:'rgba(156,163,175,0.15)', rare:'rgba(88,200,250,0.15)', epique:'rgba(168,85,247,0.15)', legende:'rgba(244,197,66,0.18)' };
  overlay.style.background = `radial-gradient(ellipse at center, ${glowColors[badge.rarete]||'rgba(0,0,0,0)'} 0%, rgba(0,0,0,0.88) 70%)`;

  // Bouton équiper titre pour rare+
  if (equipBtn) {
    const canEquip = ['rare','epique','legende'].includes(badge.rarete);
    equipBtn.style.display = canEquip ? '' : 'none';
    equipBtn.onclick = () => { equipTitle(badge); closeBadgeUnlock(); };
  }

  // Replay animation
  icon.style.animation = 'none'; icon.offsetHeight; icon.style.animation = '';
  nameEl.style.animation = 'none'; nameEl.offsetHeight; nameEl.style.animation = '';

  overlay.classList.remove('hidden');
  setTimeout(closeBadgeUnlock, 5500);
}

async function equipTitle(badge) {
  try {
    await sb.from('joueurs').update({ title_equipped: badge.name }).eq('id', currentUser);
    const j = allJoueurs.find(x=>x.id===currentUser);
    if (j) j.title_equipped = badge.name;
    showToast(`Titre "${badge.name}" équipé !`);
  } catch(_) {}
}

