// ════════════════════════════════════════════════════════════
// CDM 2026 — js/badges.js
// Catalogue des badges + fonctions Supabase de déblocage
// Extrait de index.html lignes 1639-1846 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ══ Étape 6 — Refonte complète des badges (Bilan v3 §10) ══
// 46 badges sur 7 catégories. XP/Coins uniquement (pas de bonus
// cosmétique). Badges Club/Rival supprimés (système Club inexistant).
// IDs réutilisés quand sémantique identique ; sinon migration SQL
// dans migrations.sql pour les renommages first_blood→first_prono,
// exact_1→first_exact, exact_5→sniper, legendary_card→first_legende.
const BADGES = [
  // 🎯 PRONOSTIC (6)
  { id:'first_prono',   name:'Premier Prono',    desc:'1er pronostic',                       icon:'swords',       rarete:'commun',  xp:30,   coins:50   },
  { id:'pronos_50',     name:'Pronostiqueur',    desc:'50 pronostics',                       icon:'trending-up',  rarete:'rare',    xp:200,  coins:300  },
  { id:'first_exact',   name:'Premier Score Exact', desc:'1er score exact',                  icon:'bullseye',     rarete:'commun',  xp:100,  coins:100  },
  { id:'sniper',        name:'Sniper',           desc:'5 scores exacts',                     icon:'crystal-ball', rarete:'rare',    xp:250,  coins:500  },
  { id:'oracle',        name:'Oracle',           desc:'25 scores exacts',                    icon:'eye',          rarete:'legende', xp:1000, coins:1500 },
  { id:'precision_70',  name:'Précision 70%',    desc:'70% pronos corrects (min 20)',        icon:'check-double', rarete:'epique',  xp:400,  coins:500  },

  // 🔥 STREAKS & DAILY (6)
  { id:'daily_3',       name:'Régulier',         desc:'3 jours daily consécutifs',           icon:'calendar',     rarete:'commun',  xp:50,   coins:100  },
  { id:'daily_7',       name:'Fidèle',           desc:'7 jours daily consécutifs',           icon:'calendar',     rarete:'rare',    xp:200,  coins:300  },
  { id:'daily_14',      name:'Inébranlable',     desc:'14 jours daily consécutifs',          icon:'shield',       rarete:'epique',  xp:400,  coins:500  },
  { id:'daily_30',      name:'Légende du Daily', desc:'30 jours daily consécutifs',          icon:'star',         rarete:'legende', xp:1000, coins:1500 },
  { id:'streak_5',      name:'En Feu',           desc:'5 pronos corrects d\'affilée',        icon:'flame',        rarete:'rare',    xp:200,  coins:300  },
  { id:'streak_10',     name:'Brasier',          desc:'10 pronos corrects d\'affilée',       icon:'meteor',       rarete:'legende', xp:600,  coins:1000 },

  // 🏆 LIGUES (4)
  { id:'league_silver', name:'Promotion Argent', desc:'Atteindre Ligue Argent',              icon:'silver-medal', rarete:'commun',  xp:100,  coins:200  },
  { id:'league_gold',   name:'Promotion Or',     desc:'Atteindre Ligue Or',                  icon:'gold-medal',   rarete:'rare',    xp:250,  coins:500  },
  { id:'league_diamond',name:'Promotion Diamant',desc:'Atteindre Ligue Diamant',             icon:'diamond',      rarete:'epique',  xp:500,  coins:1000 },
  { id:'league_legend', name:'Promotion Légende',desc:'Atteindre Ligue Légende',             icon:'crown',        rarete:'legende', xp:1500, coins:3000 },

  // 🎫 TOURNOI (7)
  { id:'group_complete',name:'Phase de Groupes', desc:'Pronos sur tous les matchs groupes',  icon:'ticket',       rarete:'rare',    xp:300,  coins:500  },
  { id:'round_16',      name:'8èmes Complet',    desc:'Pronos sur tous les 8èmes',           icon:'ticket',       rarete:'rare',    xp:250,  coins:500  },
  { id:'quarters',      name:'Quarts Complet',   desc:'Pronos sur tous les quarts',          icon:'ticket',       rarete:'epique',  xp:400,  coins:1000 },
  { id:'semis',         name:'Demies Complet',   desc:'Pronos sur les demi-finales',         icon:'ticket',       rarete:'epique',  xp:500,  coins:1000 },
  { id:'final',         name:'Pronostic Finale', desc:'Pronostic sur la finale',             icon:'trophy',       rarete:'legende', xp:1000, coins:2000 },
  { id:'globaux_all',   name:'Pronostics Globaux', desc:'Tous les 7 globaux soumis',         icon:'check-double', rarete:'rare',    xp:300,  coins:500  },
  { id:'vainqueur_trouve', name:'Vainqueur Trouvé', desc:'Trouver le vainqueur du tournoi',  icon:'crown',        rarete:'legende', xp:2000, coins:3000 },

  // 🃏 COLLECTION (9)
  { id:'cards_10',      name:'Apprenti Coll.',   desc:'10 cartes obtenues',                  icon:'card',         rarete:'commun',  xp:75,   coins:100  },
  { id:'cards_50',      name:'Collectionneur',   desc:'50 cartes obtenues',                  icon:'books',        rarete:'rare',    xp:250,  coins:500  },
  { id:'cards_100',     name:'Maître Coll.',     desc:'100 cartes obtenues',                 icon:'museum',       rarete:'epique',  xp:500,  coins:1000 },
  { id:'cards_200',     name:'Maître Suprême',   desc:'200 cartes obtenues',                 icon:'museum',       rarete:'legende', xp:1200, coins:2000 },
  { id:'album_team',    name:'Maître National',  desc:'Compléter une équipe nationale',      icon:'shield',       rarete:'legende', xp:1000, coins:2000 },
  { id:'first_or',      name:'Première Or',      desc:'Obtenir 1ère carte Or',               icon:'gold-medal',   rarete:'commun',  xp:100,  coins:100  },
  { id:'first_diamant', name:'Premier Diamant',  desc:'Obtenir 1ère carte Diamant',          icon:'diamond',      rarete:'rare',    xp:250,  coins:500  },
  { id:'first_legende', name:'Première Légende', desc:'Obtenir 1ère carte Légende',          icon:'star',         rarete:'epique',  xp:500,  coins:1000 },
  { id:'legends_5',     name:'Coll. de Légendes',desc:'5 cartes Légende',                    icon:'star',         rarete:'legende', xp:1500, coins:3000 },

  // 📈 PROGRESSION (8)
  { id:'level_5',       name:'Nouveau Talent',   desc:'Atteindre Niveau 5',                  icon:'muscle',       rarete:'commun',  xp:100,  coins:200  },
  { id:'level_10',      name:'Pro Confirmé',     desc:'Atteindre Niveau 10',                 icon:'muscle',       rarete:'rare',    xp:300,  coins:500  },
  { id:'level_15',      name:'Élite',            desc:'Atteindre Niveau 15',                 icon:'muscle',       rarete:'epique',  xp:600,  coins:1000 },
  { id:'level_20',      name:'Légende Vivante',  desc:'Atteindre Niveau 20',                 icon:'crown',        rarete:'legende', xp:2000, coins:3000 },
  { id:'chests_10',     name:'Apprenti Coffres', desc:'10 coffres ouverts',                  icon:'gift',         rarete:'commun',  xp:75,   coins:100  },
  { id:'chests_50',     name:'Chasseur Trésors', desc:'50 coffres ouverts',                  icon:'gift',         rarete:'rare',    xp:300,  coins:500  },
  { id:'chests_200',    name:'Maître Coffres',   desc:'200 coffres ouverts',                 icon:'gift',         rarete:'epique',  xp:800,  coins:1500 },
  { id:'pts_1000',      name:'Premier Mille',    desc:'1 000 PTS accumulés',                 icon:'trending-up',  rarete:'epique',  xp:500,  coins:1000 },

  // 🎯 MISSIONS & ENGAGEMENT (6) — conditions stub jusqu'à l'Étape 7 (missions) / 10 (shop)
  { id:'first_mission', name:'Première Mission', desc:'1ère mission complétée',              icon:'check',        rarete:'commun',  xp:30,   coins:50   },
  { id:'missions_25',   name:'Travailleur',      desc:'25 missions quotidiennes',            icon:'check-double', rarete:'rare',    xp:200,  coins:500  },
  { id:'missions_100',  name:'Acharné',          desc:'100 missions quotidiennes',           icon:'check-double', rarete:'epique',  xp:500,  coins:1000 },
  { id:'missions_weekly_10', name:'Stratège Hebdo', desc:'10 missions hebdo complétées',     icon:'calendar',     rarete:'rare',    xp:300,  coins:500  },
  { id:'missions_tournoi_all', name:'Champion Tournoi', desc:'Toutes missions tournoi',      icon:'trophy',       rarete:'legende', xp:1500, coins:3000 },
  { id:'first_shop',    name:'Premier Achat',    desc:'1ère transaction au shop',            icon:'coin',         rarete:'commun',  xp:50,   coins:50   },

  // 🏅 COMMÉMORATIFS CDM 2026 (5) — distribués par l'Étape 8 selon
  // la ligue finale. Pas de XP/coins (le pack en distribue déjà), juste
  // un badge-souvenir exclusif. Conditions câblées via badges_debloques
  // (l'admin trigger fait l'insert direct, pas de condition à checker).
  { id:'cdm2026_bronze',  name:'CDM 2026 — Participant', desc:'Tournoi 2026 terminé en Ligue Bronze',  icon:'bullseye',     rarete:'commun',  xp:0, coins:0 },
  { id:'cdm2026_argent',  name:'CDM 2026 — Combattant',  desc:'Tournoi 2026 terminé en Ligue Argent',  icon:'silver-medal', rarete:'rare',    xp:0, coins:0 },
  { id:'cdm2026_or',      name:'CDM 2026 — Or',          desc:'Tournoi 2026 terminé en Ligue Or',      icon:'gold-medal',   rarete:'epique',  xp:0, coins:0 },
  { id:'cdm2026_diamant', name:'CDM 2026 — Diamant',     desc:'Tournoi 2026 terminé en Ligue Diamant', icon:'diamond',      rarete:'epique',  xp:0, coins:0 },
  { id:'cdm2026_legende', name:'CDM 2026 — Légende',     desc:'Tournoi 2026 terminé en Ligue Légende', icon:'crown',        rarete:'legende', xp:0, coins:0 },
];

// ── SPRINT 5 — BADGE FUNCTIONS (Supabase-backed) ──

function computePlayerStats(joueur) {
  const prog = joueur.pronostics || {};
  let totalPronos = 0, scoresExacts = 0, bonDiff = 0, bonVainqueur = 0;
  let pts = 0, streak = 0, maxStreak = 0;
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
    // Tier de succès non-exact
    const rRes = r1>r2?1:r1<r2?2:0, pRes = p1>p2?1:p1<p2?2:0;
    if (rRes===pRes && !(p1===r1 && p2===r2)) {
      if (p1-p2 === r1-r2) bonDiff++; else bonVainqueur++;
    }
    if (rRes===pRes && rRes!==0) {
      const winCote = rRes===1 ? (m.c1||1) : (m.c2||1);
      if (winCote >= 3.0) outsiderWins++;
    }
  }
  // Précision : tous les pronos réussis (exact/diff/vainqueur) sur total
  const successCount = scoresExacts + bonDiff + bonVainqueur;
  const precision = totalPronos > 0 ? Math.round(100 * successCount / totalPronos) : 0;
  // Globaux : compte les valeurs non vides
  const glob = joueur.globaux || {};
  const globauxFilled = Object.values(glob).filter(v => v && String(v).trim()).length;
  // Vainqueur du tournoi correctement pronostiqué
  const vainqueurRel = (typeof allGlobaux !== 'undefined' ? (allGlobaux.vainqueur || '') : '').toString().trim().toLowerCase();
  const vainqueurUser = (glob.vainqueur || '').toString().trim().toLowerCase();
  const vainqueurTrouve = !!vainqueurRel && vainqueurRel === vainqueurUser;
  const loginStreak = joueur.daily_streak || parseInt(localStorage.getItem('cdm2026_dr_streak')||'0');
  // Niveau dérivé via getLevelInfo (fallback joueur.level si helper absent)
  const level = typeof getLevelInfo === 'function' ? getLevelInfo(joueur).level : (joueur.level || 1);
  return {
    totalPronos, scoresExacts, bonDiff, bonVainqueur,
    pts, maxStreak, loginStreak, outsiderWins,
    precision, globauxFilled, vainqueurTrouve,
    level,
    // Stats chargées async dans checkBadges() :
    totalCartes:0, cartesOr:0, cartesDiamant:0, cartesLegende:0,
    teamCompleted:false, chestsOpened:0,
  };
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
    // 🎯 PRONOSTIC
    case 'first_prono':    return stats.totalPronos >= 1;
    case 'pronos_50':      return stats.totalPronos >= 50;
    case 'first_exact':    return stats.scoresExacts >= 1;
    case 'sniper':         return stats.scoresExacts >= 5;
    case 'oracle':         return stats.scoresExacts >= 25;
    case 'precision_70':   return stats.totalPronos >= 20 && stats.precision >= 70;

    // 🔥 STREAKS & DAILY
    case 'daily_3':        return stats.loginStreak >= 3;
    case 'daily_7':        return stats.loginStreak >= 7;
    case 'daily_14':       return stats.loginStreak >= 14;
    case 'daily_30':       return stats.loginStreak >= 30;
    case 'streak_5':       return stats.maxStreak >= 5;
    case 'streak_10':      return stats.maxStreak >= 10;

    // 🏆 LIGUES
    case 'league_silver':  return ['argent','or','diamant','legende'].includes(joueur.league);
    case 'league_gold':    return ['or','diamant','legende'].includes(joueur.league);
    case 'league_diamond': return ['diamant','legende'].includes(joueur.league);
    case 'league_legend':  return joueur.league === 'legende';

    // 🎫 TOURNOI
    // Garde-fou : `.every()` sur un tableau vide retourne `true` (vacuous truth).
    case 'group_complete': return phaseAllProno(joueur, 'Groupes');
    case 'round_16':       return phaseAllProno(joueur, '8es de finale');
    case 'quarters':       return phaseAllProno(joueur, 'Quarts de finale');
    case 'semis':          return phaseAllProno(joueur, 'Demi-finales');
    case 'final':          return MATCHS.filter(m=>m.phase==='Finale').some(m=>(joueur.pronostics||{})[m.id]);
    case 'globaux_all':    return stats.globauxFilled >= 7;
    case 'vainqueur_trouve': return stats.vainqueurTrouve;

    // 🃏 COLLECTION
    case 'cards_10':       return stats.totalCartes >= 10;
    case 'cards_50':       return stats.totalCartes >= 50;
    case 'cards_100':      return stats.totalCartes >= 100;
    case 'cards_200':      return stats.totalCartes >= 200;
    case 'album_team':     return stats.teamCompleted;
    case 'first_or':       return stats.cartesOr >= 1;
    case 'first_diamant':  return stats.cartesDiamant >= 1;
    case 'first_legende':  return stats.cartesLegende >= 1;
    case 'legends_5':      return stats.cartesLegende >= 5;

    // 📈 PROGRESSION
    case 'level_5':        return stats.level >= 5;
    case 'level_10':       return stats.level >= 10;
    case 'level_15':       return stats.level >= 15;
    case 'level_20':       return stats.level >= 20;
    case 'chests_10':      return stats.chestsOpened >= 10;
    case 'chests_50':      return stats.chestsOpened >= 50;
    case 'chests_200':     return stats.chestsOpened >= 200;
    case 'pts_1000':       return stats.pts >= 1000;

    // 🎯 MISSIONS & ENGAGEMENT — câblés en Étape 7 sur missions_progress.claimed
    case 'first_mission':         return (stats.missionsClaimedTotal   || 0) >= 1;
    case 'missions_25':           return (stats.missionsClaimedDaily   || 0) >= 25;
    case 'missions_100':          return (stats.missionsClaimedDaily   || 0) >= 100;
    case 'missions_weekly_10':    return (stats.missionsClaimedWeekly  || 0) >= 10;
    case 'missions_tournoi_all':  return (stats.missionsClaimedTournoi || 0) >= 5;
    case 'first_shop':            return false; // TODO Étape 10
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

    // Récupère les stats async : cartes par rareté, coffres ouverts, équipe complète
    let cartes = [];
    try {
      const { data } = await sb.from('cartes_collection').select('rarete, equipe').eq('joueur_id', currentUser);
      cartes = data || [];
    } catch(_) {}
    let chestsOpened = 0;
    try {
      const { count } = await sb.from('coffres_inventaire')
        .select('id', { count: 'exact', head: true })
        .eq('joueur_id', currentUser).eq('opened', true);
      chestsOpened = count || 0;
    } catch(_) {}

    // Équipe complète : au moins 1 équipe avec ≥ 11 cartes (effectif type FUT)
    // Fallback simple si pas de colonne 'equipe' : reste false.
    let teamCompleted = false;
    if (cartes.length && cartes[0].equipe !== undefined) {
      const byTeam = cartes.reduce((acc, c) => {
        if (!c.equipe) return acc;
        acc[c.equipe] = (acc[c.equipe] || 0) + 1;
        return acc;
      }, {});
      teamCompleted = Object.values(byTeam).some(n => n >= 11);
    }

    // Étape 7 — Compte des missions claimed (pour badges first_mission /
    // missions_25 / missions_100 / missions_weekly_10 / missions_tournoi_all).
    let missionsClaimed = { daily: 0, weekly: 0, tournament: 0, total: 0 };
    if (typeof getClaimedMissionsCount === 'function') {
      missionsClaimed = await getClaimedMissionsCount(currentUser);
    }

    const stats = computePlayerStats(joueur);
    stats.totalCartes    = cartes.length;
    stats.cartesOr       = cartes.filter(c => c.rarete === 'or').length;
    stats.cartesDiamant  = cartes.filter(c => c.rarete === 'diamant').length;
    stats.cartesLegende  = cartes.filter(c => c.rarete === 'legende').length;
    stats.chestsOpened   = chestsOpened;
    stats.teamCompleted  = teamCompleted;
    stats.missionsClaimedDaily   = missionsClaimed.daily;
    stats.missionsClaimedWeekly  = missionsClaimed.weekly;
    stats.missionsClaimedTournoi = missionsClaimed.tournament;
    stats.missionsClaimedTotal   = missionsClaimed.total;

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
    // Étape 6 : coins par badge (b.coins), pas un forfait commun.
    const totalBadgeXP = toUnlock.reduce((sum, b) => sum + (b.xp || 50), 0);
    const totalBadgeCoins = toUnlock.reduce((sum, b) => sum + (b.coins || 0), 0);
    if (totalBadgeXP > 0) await gainXP(totalBadgeXP, 'badges_batch');
    if (totalBadgeCoins > 0 && typeof addCoins === 'function') {
      await addCoins(totalBadgeCoins);
    }

    // Étape 7 — Dispatch missions : badges débloqués comptent côté
    // weekly (w_badges_2 : 2 nouveaux badges dans la semaine).
    if (typeof bumpMissionCounter === 'function') {
      await bumpMissionCounter(currentUser, null, toUnlock.length, 'badges');
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
  // Étape 6 : coins per-badge (badge.coins) au lieu d'un forfait COIN_REWARDS.badge_unlock.
  if (rewardEl){ rewardEl.innerHTML = `+${badge.xp||50} XP  +${badge.coins||0} ${window.icon('coin', 14)}`; rewardEl.style.display = ''; }

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

