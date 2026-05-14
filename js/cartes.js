// ════════════════════════════════════════════════════════════
// CDM 2026 — js/cartes.js
// Système cartes joueurs CDM (FUT-like)
// Extrait de index.html lignes 1847-2137 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ── SPRINT 4 — CARTES JOUEURS CDM ──

function generateStats(player, rarete) {
  const boosts = { bronze:0, argent:3, or:6, diamant:10, legende:15 };
  const boost = boosts[rarete] || 0;
  const r = player.base_rating;
  const rng = () => Math.floor(Math.random() * 8) - 4;
  const pos = player.pos;
  const isATT = pos==='ATT', isMIL = pos==='MIL', isDEF = pos==='DEF'||pos==='GAR';
  return {
    PAC: Math.min(99, Math.max(40, (isATT?r+4:isMIL?r:r-8) + boost + rng())),
    SHO: Math.min(99, Math.max(30, (isATT?r+2:isMIL?r-4:r-18) + boost + rng())),
    PAS: Math.min(99, Math.max(40, (isMIL?r+2:r-2) + boost + rng())),
    DRI: Math.min(99, Math.max(35, (isATT?r+3:isMIL?r:r-10) + boost + rng())),
    DEF: Math.min(99, Math.max(20, (isDEF?r+5:isMIL?r-8:r-22) + boost + rng())),
    PHY: Math.min(99, Math.max(50, r - 5 + boost + rng())),
  };
}

function upgradeRarete(rarete) {
  const tiers = ['bronze','argent','or','diamant','legende'];
  const idx = tiers.indexOf(rarete);
  return idx < tiers.length-1 ? tiers[idx+1] : rarete;
}

function computeAccuracy(prono, real) {
  if (!prono || !real) return { exact:false, diff:false, winner:false };
  const p1=parseInt(prono.s1),p2=parseInt(prono.s2),r1=parseInt(real.s1),r2=parseInt(real.s2);
  if (isNaN(p1)||isNaN(p2)) return { exact:false, diff:false, winner:false };
  const exact = p1===r1 && p2===r2;
  const rRes = r1>r2?1:r1<r2?2:0, pRes = p1>p2?1:p1<p2?2:0;
  const winner = rRes===pRes;
  const diff = winner && (r1-r2===p1-p2);
  return { exact, diff, winner };
}

function pickCardsForMatch(players, adminInputs, accuracy) {
  if (!players.length) return [];
  const count = accuracy.exact ? 3 : (accuracy.diff ? 2 : 1);
  const cards = [];
  for (let i = 0; i < count; i++) {
    const p = players[Math.floor(Math.random() * players.length)];
    let rarete = 'bronze';
    const butInfo = (adminInputs.buteurs||[]).find(b=>b.name===p.name||b.name===p.id);
    if (butInfo) rarete = 'argent';
    if (butInfo && (butInfo.count||0) >= 2) rarete = 'or';
    if (adminInputs.motm && (adminInputs.motm===p.name||adminInputs.motm===p.id)) rarete = 'diamant';
    if (butInfo && (butInfo.count||0) >= 3) rarete = 'legende';
    if (accuracy.exact && Math.random() < 0.2) rarete = upgradeRarete(rarete);
    cards.push({ ...p, rarete, stats: generateStats(p, rarete) });
  }
  return cards;
}

async function distributeCardsForMatch(matchId) {
  const match = MATCHS.find(m => m.id === matchId);
  if (!match) return;
  const code1 = TEAM_COUNTRY_MAP[match.name1] || '';
  const code2 = TEAM_COUNTRY_MAP[match.name2] || '';
  const matchPlayers = CDM_PLAYERS.filter(p => p.country===code1 || p.country===code2);
  if (!matchPlayers.length) return;

  // Build adminInputs from existing buteurs_reels data
  const real = allScores[matchId] || {};
  const buteurs = (real.buteurs_reels||[]).map(name => ({ name, count:1 }));
  const adminInputs = { buteurs, motm: buteurs[0]?.name || '' };

  for (const joueur of allJoueurs) {
    const prono = (joueur.pronostics||{})[matchId];
    if (!prono) continue;
    const accuracy = computeAccuracy(prono, real);
    const cards = pickCardsForMatch(matchPlayers, adminInputs, accuracy);
    for (const card of cards) {
      try {
        await sb.from('cartes_collection').insert({
          joueur_id: joueur.id,
          carte_id:  `${card.id}_${matchId}_${Date.now()}`,
          player_name: card.name,
          player_country_code: card.country,
          player_position: card.pos,
          rarete: card.rarete,
          match_id: matchId,
          stats: card.stats,
        });
      } catch(_) {}
    }
  }
  showToast('Cartes distribuées !');
}

let _carteCache = [];
function renderPlayerCard(carte, idx) {
  const stats = carte.stats || {};
  const flagUrl = getPlayerFlagUrl(carte.player_country_code || 'fr');
  const initials = (carte.player_name||'??').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const rating = Object.keys(stats).length ? Math.round(Object.values(stats).reduce((a,b)=>a+b,0)/Object.keys(stats).length) : 75;
  const clickHandler = idx !== undefined ? `onclick="showCardDetail(${idx})"` : '';
  return `
  <div class="player-card rarete-${carte.rarete||'bronze'}" ${clickHandler}>
    <div class="card-bg-glow"></div>
    <div class="card-header">
      <div class="card-rating">${rating}</div>
      <div class="card-pos-flag">
        <div class="card-position">${carte.player_position||'MIL'}</div>
        <img class="card-flag" src="${flagUrl}" alt="${carte.player_country_code||''}" onerror="this.style.display='none'">
      </div>
    </div>
    <div class="card-portrait">${carte.emoji||initials}</div>
    <div class="card-name">${(carte.player_name||'Joueur').toUpperCase()}</div>
    <div class="card-stats">
      ${Object.entries(stats).slice(0,6).map(([k,v])=>`<div class="card-stat"><span>${k}</span><b>${v}</b></div>`).join('')}
    </div>
  </div>`;
}

function showCardDetail(idx) {
  const carte = _carteCache[idx];
  if (!carte) return;
  const rareteNames = { bronze:'Bronze', argent:'Argent', or:'Or', diamant:'Diamant', legende:'Légendaire' };
  showToast(`${carte.player_name} · ${rareteNames[carte.rarete]||carte.rarete}`);
}

// RAF nettoyé en arrière-plan
let _rafIds = [];
function safeRaf(callback) {
  const id = requestAnimationFrame(callback);
  _rafIds.push(id);
  return id;
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { _rafIds.forEach(id => cancelAnimationFrame(id)); _rafIds = []; }
});

const MATCHS = [
  // ── 11 JUIN ──
  {id: 1, phase:'Groupes',groupe:'A',date:'11 juin · 21h00',ts:20260611,venue:'Azteca, Mexico',team1:'🇲🇽',name1:'Mexique',team2:'🇿🇦',name2:'Afrique du Sud',c1:1.65,cN:3.90,c2:5.50},
  // ── 12 JUIN ──
  {id: 7, phase:'Groupes',groupe:'B',date:'12 juin · 18h00',ts:20260612,venue:'Toronto',team1:'🇨🇦',name1:'Canada',team2:'🇧🇦',name2:'Bosnie-Herzégovine',c1:2.20,cN:3.30,c2:3.50},
  {id:19, phase:'Groupes',groupe:'D',date:'12 juin · 21h00',ts:20260612,venue:'MetLife, New York',team1:'🇺🇸',name1:'États-Unis',team2:'🇵🇾',name2:'Paraguay',c1:1.55,cN:4.00,c2:6.50},
  // ── 13 JUIN ──
  {id:20, phase:'Groupes',groupe:'D',date:'13 juin · 03h00',ts:20260612,venue:'Philadelphia',team1:'🇦🇺',name1:'Australie',team2:'🇹🇷',name2:'Turquie',c1:2.60,cN:3.20,c2:2.80},
  {id:13, phase:'Groupes',groupe:'C',date:'13 juin · 21h00',ts:20260613,venue:'Los Angeles',team1:'🇧🇷',name1:'Brésil',team2:'🇲🇦',name2:'Maroc',c1:1.60,cN:4.00,c2:6.00},
  // ── 14 JUIN ──
  {id:14, phase:'Groupes',groupe:'C',date:'14 juin · 03h00',ts:20260613,venue:'Seattle',team1:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',name1:'Écosse',team2:'🇭🇹',name2:'Haïti',c1:1.40,cN:4.50,c2:9.00},
  {id:25, phase:'Groupes',groupe:'E',date:'14 juin · 21h00',ts:20260614,venue:'Boston',team1:'🇩🇪',name1:'Allemagne',team2:'🇨🇮',name2:'Côte d\'Ivoire',c1:1.50,cN:4.20,c2:7.00},
  // ── 15 JUIN ──
  {id:26, phase:'Groupes',groupe:'E',date:'15 juin · 03h00',ts:20260614,venue:'Kansas City',team1:'🇪🇨',name1:'Équateur',team2:'🇨🇼',name2:'Curaçao',c1:1.45,cN:4.50,c2:8.00},
  // ── 14 JUIN ──
  {id:31, phase:'Groupes',groupe:'F',date:'14 juin · 18h00',ts:20260614,venue:'San Francisco',team1:'🇳🇱',name1:'Pays-Bas',team2:'🇯🇵',name2:'Japon',c1:1.75,cN:3.80,c2:4.80},
  // ── 15 JUIN ──
  {id:32, phase:'Groupes',groupe:'F',date:'15 juin · 02h00',ts:20260614,venue:'Seattle',team1:'🇸🇪',name1:'Suède',team2:'🇹🇳',name2:'Tunisie',c1:1.60,cN:4.00,c2:5.50},
  {id: 2, phase:'Groupes',groupe:'A',date:'15 juin · 21h00',ts:20260615,venue:'Guadalajara',team1:'🇰🇷',name1:'Corée du Sud',team2:'🇨🇿',name2:'Tchéquie',c1:2.10,cN:3.40,c2:3.60},
  // ── 16 JUIN ──
  {id: 3, phase:'Groupes',groupe:'A',date:'16 juin · 00h00',ts:20260615,venue:'Monterrey',team1:'🇲🇽',name1:'Mexique',team2:'🇰🇷',name2:'Corée du Sud',c1:1.80,cN:3.60,c2:4.80},
  // ── 15 JUIN ──
  {id:37, phase:'Groupes',groupe:'G',date:'15 juin · 18h00',ts:20260615,venue:'Atlanta',team1:'🇧🇪',name1:'Belgique',team2:'🇪🇬',name2:'Égypte',c1:1.55,cN:4.00,c2:6.50},
  // ── 16 JUIN ──
  {id:38, phase:'Groupes',groupe:'G',date:'16 juin · 02h00',ts:20260615,venue:'Dallas',team1:'🇮🇷',name1:'Iran',team2:'🇳🇿',name2:'Nouvelle-Zélande',c1:1.80,cN:3.60,c2:4.80},
  // ── 15 JUIN ──
  {id:43, phase:'Groupes',groupe:'H',date:'15 juin · 23h00',ts:20260615,venue:'Miami',team1:'🇪🇸',name1:'Espagne',team2:'🇨🇻',name2:'Cap-Vert',c1:1.20,cN:6.50,c2:16.0},
  // ── 16 JUIN ──
  {id: 8, phase:'Groupes',groupe:'B',date:'16 juin · 21h00',ts:20260616,venue:'Kansas City',team1:'🇨🇦',name1:'Canada',team2:'🇶🇦',name2:'Qatar',c1:1.45,cN:4.50,c2:8.00},
  // ── 17 JUIN ──
  {id: 9, phase:'Groupes',groupe:'B',date:'17 juin · 02h00',ts:20260616,venue:'Vancouver',team1:'🇧🇦',name1:'Bosnie-Herzégovine',team2:'🇨🇭',name2:'Suisse',c1:3.20,cN:3.20,c2:2.40},
  // ── 16 JUIN ──
  {id:21, phase:'Groupes',groupe:'D',date:'16 juin · 21h00',ts:20260616,venue:'Dallas',team1:'🇺🇸',name1:'États-Unis',team2:'🇦🇺',name2:'Australie',c1:1.70,cN:3.80,c2:5.00},
  // ── 17 JUIN ──
  {id:22, phase:'Groupes',groupe:'D',date:'17 juin · 02h00',ts:20260616,venue:'MetLife, New York',team1:'🇵🇾',name1:'Paraguay',team2:'🇹🇷',name2:'Turquie',c1:2.80,cN:3.20,c2:2.60},
  // ── 16 JUIN ──
  {id:44, phase:'Groupes',groupe:'H',date:'16 juin · 18h00',ts:20260616,venue:'Los Angeles',team1:'🇸🇦',name1:'Arabie saoudite',team2:'🇺🇾',name2:'Uruguay',c1:3.20,cN:3.30,c2:2.30},
  {id:49, phase:'Groupes',groupe:'I',date:'16 juin · 21h00',ts:20260616,venue:'Los Angeles',team1:'🇫🇷',name1:'France',team2:'🇸🇳',name2:'Sénégal',c1:1.55,cN:4.10,c2:6.50},
  // ── 17 JUIN ──
  {id:50, phase:'Groupes',groupe:'I',date:'17 juin · 03h00',ts:20260616,venue:'Boston',team1:'🇳🇴',name1:'Norvège',team2:'🇮🇶',name2:'Irak',c1:1.35,cN:5.20,c2:10.0},
  // ── 16 JUIN ──
  {id:55, phase:'Groupes',groupe:'J',date:'16 juin · 18h00',ts:20260616,venue:'MetLife, New York',team1:'🇦🇷',name1:'Argentine',team2:'🇩🇿',name2:'Algérie',c1:1.35,cN:5.20,c2:10.0},
  // ── 17 JUIN ──
  {id:56, phase:'Groupes',groupe:'J',date:'17 juin · 02h00',ts:20260616,venue:'Miami',team1:'🇦🇹',name1:'Autriche',team2:'🇯🇴',name2:'Jordanie',c1:1.50,cN:4.20,c2:7.00},
  {id:15, phase:'Groupes',groupe:'C',date:'17 juin · 21h00',ts:20260617,venue:'Atlanta',team1:'🇧🇷',name1:'Brésil',team2:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',name2:'Écosse',c1:1.35,cN:5.00,c2:10.0},
  // ── 18 JUIN ──
  {id:16, phase:'Groupes',groupe:'C',date:'18 juin · 03h00',ts:20260617,venue:'Seattle',team1:'🇲🇦',name1:'Maroc',team2:'🇭🇹',name2:'Haïti',c1:1.35,cN:5.20,c2:11.0},
  // ── 17 JUIN ──
  {id:61, phase:'Groupes',groupe:'K',date:'17 juin · 18h00',ts:20260617,venue:'Philadelphia',team1:'🇵🇹',name1:'Portugal',team2:'🇨🇴',name2:'Colombie',c1:1.75,cN:3.80,c2:4.80},
  // ── 18 JUIN ──
  {id:62, phase:'Groupes',groupe:'K',date:'18 juin · 02h00',ts:20260617,venue:'Atlanta',team1:'🇺🇿',name1:'Ouzbékistan',team2:'🇨🇩',name2:'DR Congo',c1:2.00,cN:3.30,c2:4.00},
  // ── 17 JUIN ──
  {id:67, phase:'Groupes',groupe:'L',date:'17 juin · 21h00',ts:20260617,venue:'San Francisco',team1:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',name1:'Angleterre',team2:'🇭🇷',name2:'Croatie',c1:1.75,cN:3.80,c2:4.80},
  // ── 18 JUIN ──
  {id:68, phase:'Groupes',groupe:'L',date:'18 juin · 03h00',ts:20260617,venue:'Toronto',team1:'🇬🇭',name1:'Ghana',team2:'🇵🇦',name2:'Panama',c1:1.90,cN:3.60,c2:4.20},
  {id:27, phase:'Groupes',groupe:'E',date:'18 juin · 21h00',ts:20260618,venue:'Houston',team1:'🇩🇪',name1:'Allemagne',team2:'🇨🇼',name2:'Curaçao',c1:1.10,cN:9.00,c2:25.0},
  // ── 19 JUIN ──
  {id:28, phase:'Groupes',groupe:'E',date:'19 juin · 03h00',ts:20260618,venue:'Boston',team1:'🇨🇮',name1:'Côte d\'Ivoire',team2:'🇪🇨',name2:'Équateur',c1:2.10,cN:3.30,c2:3.60},
  // ── 18 JUIN ──
  {id:33, phase:'Groupes',groupe:'F',date:'18 juin · 18h00',ts:20260618,venue:'Seattle',team1:'🇳🇱',name1:'Pays-Bas',team2:'🇸🇪',name2:'Suède',c1:1.80,cN:3.70,c2:4.50},
  // ── 19 JUIN ──
  {id:34, phase:'Groupes',groupe:'F',date:'19 juin · 02h00',ts:20260618,venue:'San Francisco',team1:'🇯🇵',name1:'Japon',team2:'🇹🇳',name2:'Tunisie',c1:1.70,cN:3.80,c2:5.20},
  {id: 4, phase:'Groupes',groupe:'A',date:'19 juin · 21h00',ts:20260619,venue:'Azteca, Mexico',team1:'🇿🇦',name1:'Afrique du Sud',team2:'🇨🇿',name2:'Tchéquie',c1:3.50,cN:3.30,c2:2.15},
  // ── 20 JUIN ──
  {id: 5, phase:'Groupes',groupe:'A',date:'20 juin · 00h00',ts:20260619,venue:'Guadalajara',team1:'🇲🇽',name1:'Mexique',team2:'🇨🇿',name2:'Tchéquie',c1:1.55,cN:4.10,c2:6.50},
  {id: 6, phase:'Groupes',groupe:'A',date:'20 juin · 00h00',ts:20260619,venue:'Monterrey',team1:'🇿🇦',name1:'Afrique du Sud',team2:'🇰🇷',name2:'Corée du Sud',c1:4.00,cN:3.40,c2:2.00},
  // ── 19 JUIN ──
  {id:39, phase:'Groupes',groupe:'G',date:'19 juin · 21h00',ts:20260619,venue:'Houston',team1:'🇧🇪',name1:'Belgique',team2:'🇮🇷',name2:'Iran',c1:1.55,cN:4.00,c2:6.50},
  // ── 20 JUIN ──
  {id:40, phase:'Groupes',groupe:'G',date:'20 juin · 03h00',ts:20260619,venue:'Atlanta',team1:'🇪🇬',name1:'Égypte',team2:'🇳🇿',name2:'Nouvelle-Zélande',c1:1.65,cN:3.80,c2:5.50},
  {id:23, phase:'Groupes',groupe:'D',date:'20 juin · 21h00',ts:20260620,venue:'Dallas',team1:'🇺🇸',name1:'États-Unis',team2:'🇹🇷',name2:'Turquie',c1:1.65,cN:3.80,c2:5.50},
  // ── 21 JUIN ──
  {id:24, phase:'Groupes',groupe:'D',date:'21 juin · 03h00',ts:20260620,venue:'Philadelphia',team1:'🇦🇺',name1:'Australie',team2:'🇵🇾',name2:'Paraguay',c1:2.20,cN:3.30,c2:3.40},
  // ── 20 JUIN ──
  {id:45, phase:'Groupes',groupe:'H',date:'20 juin · 21h00',ts:20260620,venue:'Los Angeles',team1:'🇪🇸',name1:'Espagne',team2:'🇸🇦',name2:'Arabie saoudite',c1:1.35,cN:5.20,c2:9.50},
  // ── 21 JUIN ──
  {id:46, phase:'Groupes',groupe:'H',date:'21 juin · 02h00',ts:20260620,venue:'MetLife, New York',team1:'🇨🇻',name1:'Cap-Vert',team2:'🇺🇾',name2:'Uruguay',c1:3.80,cN:3.40,c2:2.10},
  // ── 20 JUIN ──
  {id:51, phase:'Groupes',groupe:'I',date:'20 juin · 21h00',ts:20260620,venue:'Boston',team1:'🇫🇷',name1:'France',team2:'🇳🇴',name2:'Norvège',c1:1.60,cN:4.00,c2:5.80},
  // ── 21 JUIN ──
  {id:52, phase:'Groupes',groupe:'I',date:'21 juin · 03h00',ts:20260620,venue:'San Francisco',team1:'🇸🇳',name1:'Sénégal',team2:'🇮🇶',name2:'Irak',c1:1.45,cN:4.50,c2:8.00},
  // ── 20 JUIN ──
  {id:57, phase:'Groupes',groupe:'J',date:'20 juin · 18h00',ts:20260620,venue:'Miami',team1:'🇦🇷',name1:'Argentine',team2:'🇦🇹',name2:'Autriche',c1:1.55,cN:4.20,c2:6.00},
  // ── 21 JUIN ──
  {id:58, phase:'Groupes',groupe:'J',date:'21 juin · 02h00',ts:20260620,venue:'Dallas',team1:'🇩🇿',name1:'Algérie',team2:'🇯🇴',name2:'Jordanie',c1:1.80,cN:3.60,c2:4.80},
  {id:10, phase:'Groupes',groupe:'B',date:'21 juin · 21h00',ts:20260621,venue:'Toronto',team1:'🇨🇭',name1:'Suisse',team2:'🇶🇦',name2:'Qatar',c1:1.40,cN:4.80,c2:9.00},
  {id:17, phase:'Groupes',groupe:'C',date:'21 juin · 21h00',ts:20260621,venue:'Los Angeles',team1:'🇧🇷',name1:'Brésil',team2:'🇭🇹',name2:'Haïti',c1:1.15,cN:7.50,c2:20.0},
  // ── 22 JUIN ──
  {id:18, phase:'Groupes',groupe:'C',date:'22 juin · 03h00',ts:20260621,venue:'Atlanta',team1:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',name1:'Écosse',team2:'🇲🇦',name2:'Maroc',c1:2.80,cN:3.20,c2:2.60},
  // ── 21 JUIN ──
  {id:63, phase:'Groupes',groupe:'K',date:'21 juin · 18h00',ts:20260621,venue:'Atlanta',team1:'🇵🇹',name1:'Portugal',team2:'🇺🇿',name2:'Ouzbékistan',c1:1.25,cN:6.20,c2:14.0},
  // ── 22 JUIN ──
  {id:64, phase:'Groupes',groupe:'K',date:'22 juin · 02h00',ts:20260621,venue:'Philadelphia',team1:'🇨🇴',name1:'Colombie',team2:'🇨🇩',name2:'DR Congo',c1:1.55,cN:4.00,c2:6.50},
  // ── 21 JUIN ──
  {id:69, phase:'Groupes',groupe:'L',date:'21 juin · 21h00',ts:20260621,venue:'Toronto',team1:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',name1:'Angleterre',team2:'🇬🇭',name2:'Ghana',c1:1.50,cN:4.20,c2:7.00},
  // ── 22 JUIN ──
  {id:70, phase:'Groupes',groupe:'L',date:'22 juin · 03h00',ts:20260621,venue:'Boston',team1:'🇭🇷',name1:'Croatie',team2:'🇵🇦',name2:'Panama',c1:1.60,cN:4.00,c2:6.00},
  {id:29, phase:'Groupes',groupe:'E',date:'22 juin · 21h00',ts:20260622,venue:'Houston',team1:'🇩🇪',name1:'Allemagne',team2:'🇪🇨',name2:'Équateur',c1:1.60,cN:4.00,c2:6.00},
  // ── 23 JUIN ──
  {id:30, phase:'Groupes',groupe:'E',date:'23 juin · 03h00',ts:20260622,venue:'Kansas City',team1:'🇨🇼',name1:'Curaçao',team2:'🇨🇮',name2:'Côte d\'Ivoire',c1:5.00,cN:3.60,c2:1.75},
  // ── 22 JUIN ──
  {id:35, phase:'Groupes',groupe:'F',date:'22 juin · 21h00',ts:20260622,venue:'San Francisco',team1:'🇳🇱',name1:'Pays-Bas',team2:'🇹🇳',name2:'Tunisie',c1:1.40,cN:4.80,c2:9.00},
  // ── 23 JUIN ──
  {id:36, phase:'Groupes',groupe:'F',date:'23 juin · 03h00',ts:20260622,venue:'Seattle',team1:'🇸🇪',name1:'Suède',team2:'🇯🇵',name2:'Japon',c1:2.30,cN:3.30,c2:3.20},
  {id:41, phase:'Groupes',groupe:'G',date:'23 juin · 21h00',ts:20260623,venue:'Dallas',team1:'🇧🇪',name1:'Belgique',team2:'🇳🇿',name2:'Nouvelle-Zélande',c1:1.25,cN:6.00,c2:14.0},
  // ── 24 JUIN ──
  {id:42, phase:'Groupes',groupe:'G',date:'24 juin · 03h00',ts:20260623,venue:'Houston',team1:'🇮🇷',name1:'Iran',team2:'🇪🇬',name2:'Égypte',c1:2.20,cN:3.30,c2:3.40},
  {id:47, phase:'Groupes',groupe:'H',date:'24 juin · 21h00',ts:20260624,venue:'Miami',team1:'🇪🇸',name1:'Espagne',team2:'🇺🇾',name2:'Uruguay',c1:1.55,cN:4.20,c2:6.00},
  // ── 25 JUIN ──
  {id:48, phase:'Groupes',groupe:'H',date:'25 juin · 03h00',ts:20260624,venue:'Los Angeles',team1:'🇸🇦',name1:'Arabie saoudite',team2:'🇨🇻',name2:'Cap-Vert',c1:1.80,cN:3.60,c2:4.80},
  // ── 24 JUIN ──
  {id:53, phase:'Groupes',groupe:'I',date:'24 juin · 21h00',ts:20260624,venue:'Los Angeles',team1:'🇫🇷',name1:'France',team2:'🇮🇶',name2:'Irak',c1:1.15,cN:7.50,c2:20.0},
  // ── 25 JUIN ──
  {id:54, phase:'Groupes',groupe:'I',date:'25 juin · 03h00',ts:20260624,venue:'Boston',team1:'🇳🇴',name1:'Norvège',team2:'🇸🇳',name2:'Sénégal',c1:1.75,cN:3.80,c2:4.80},
  // ── 24 JUIN ──
  {id:59, phase:'Groupes',groupe:'J',date:'24 juin · 18h00',ts:20260624,venue:'MetLife, New York',team1:'🇦🇷',name1:'Argentine',team2:'🇯🇴',name2:'Jordanie',c1:1.15,cN:7.50,c2:20.0},
  // ── 25 JUIN ──
  {id:60, phase:'Groupes',groupe:'J',date:'25 juin · 02h00',ts:20260624,venue:'Miami',team1:'🇦🇹',name1:'Autriche',team2:'🇩🇿',name2:'Algérie',c1:2.00,cN:3.40,c2:4.00},
  {id:11, phase:'Groupes',groupe:'B',date:'25 juin · 21h00',ts:20260625,venue:'Kansas City',team1:'🇨🇦',name1:'Canada',team2:'🇨🇭',name2:'Suisse',c1:2.40,cN:3.20,c2:3.10},
  // ── 26 JUIN ──
  {id:12, phase:'Groupes',groupe:'B',date:'26 juin · 00h00',ts:20260625,venue:'Vancouver',team1:'🇧🇦',name1:'Bosnie-Herzégovine',team2:'🇶🇦',name2:'Qatar',c1:1.55,cN:4.20,c2:7.00},
  // ── 25 JUIN ──
  {id:65, phase:'Groupes',groupe:'K',date:'25 juin · 18h00',ts:20260625,venue:'Kansas City',team1:'🇵🇹',name1:'Portugal',team2:'🇨🇩',name2:'DR Congo',c1:1.20,cN:6.80,c2:16.0},
  // ── 26 JUIN ──
  {id:66, phase:'Groupes',groupe:'K',date:'26 juin · 02h00',ts:20260625,venue:'Atlanta',team1:'🇨🇴',name1:'Colombie',team2:'🇺🇿',name2:'Ouzbékistan',c1:1.65,cN:3.90,c2:5.50},
  // ── 25 JUIN ──
  {id:71, phase:'Groupes',groupe:'L',date:'25 juin · 21h00',ts:20260625,venue:'San Francisco',team1:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',name1:'Angleterre',team2:'🇵🇦',name2:'Panama',c1:1.25,cN:6.20,c2:14.0},
  // ── 26 JUIN ──
  {id:72, phase:'Groupes',groupe:'L',date:'26 juin · 03h00',ts:20260625,venue:'Toronto',team1:'🇬🇭',name1:'Ghana',team2:'🇭🇷',name2:'Croatie',c1:3.40,cN:3.30,c2:2.20},
  // ── PHASES FINALES ──
  {id:73, phase:'16es de finale',groupe:'',date:'28 juin · 21h00',ts:20260628,venue:'Los Angeles',team1:'🏆',name1:'1er Groupe A',team2:'🏆',name2:'2e Groupe B',c1:2.10,cN:3.40,c2:3.40},
  {id:74, phase:'16es de finale',groupe:'',date:'29 juin · 21h00',ts:20260629,venue:'Houston',team1:'🏆',name1:'1er Groupe C',team2:'🏆',name2:'2e Groupe F',c1:2.10,cN:3.40,c2:3.40},
  {id:75, phase:'16es de finale',groupe:'',date:'30 juin · 00h30',ts:20260629,venue:'Boston',team1:'🏆',name1:'1er Groupe E',team2:'🏆',name2:'3e repêché',c1:2.10,cN:3.40,c2:3.40},
  {id:76, phase:'16es de finale',groupe:'',date:'30 juin · 03h00',ts:20260629,venue:'Monterrey',team1:'🏆',name1:'1er Groupe F',team2:'🏆',name2:'2e Groupe C',c1:2.10,cN:3.40,c2:3.40},
  {id:77, phase:'16es de finale',groupe:'',date:'30 juin · 23h00',ts:20260630,venue:'Dallas',team1:'🏆',name1:'1er Groupe I',team2:'🏆',name2:'3e repêché',c1:2.10,cN:3.40,c2:3.40},
  {id:78, phase:'16es de finale',groupe:'',date:'1 juil. · 03h00',ts:20260630,venue:'MetLife, New York',team1:'🏆',name1:'1er Groupe D',team2:'🏆',name2:'3e repêché',c1:2.10,cN:3.40,c2:3.40},
  {id:79, phase:'16es de finale',groupe:'',date:'1 juil. · 03h00',ts:20260701,venue:'Azteca, Mexico',team1:'🏆',name1:'1er Groupe B',team2:'🏆',name2:'2e Groupe A',c1:2.10,cN:3.40,c2:3.40},
  {id:80, phase:'16es de finale',groupe:'',date:'1 juil. · 18h00',ts:20260701,venue:'Atlanta',team1:'🏆',name1:'1er Groupe L',team2:'🏆',name2:'3e repêché',c1:2.10,cN:3.40,c2:3.40},
  {id:81, phase:'16es de finale',groupe:'',date:'1 juil. · 22h00',ts:20260701,venue:'Seattle',team1:'🏆',name1:'1er Groupe G',team2:'🏆',name2:'3e repêché',c1:2.10,cN:3.40,c2:3.40},
  {id:83, phase:'16es de finale',groupe:'',date:'2 juil. · 21h00',ts:20260702,venue:'Los Angeles',team1:'🏆',name1:'1er Groupe H',team2:'🏆',name2:'2e Groupe J',c1:2.10,cN:3.40,c2:3.40},
  {id:84, phase:'16es de finale',groupe:'',date:'3 juil. · 01h00',ts:20260702,venue:'Toronto',team1:'🏆',name1:'2e Groupe K',team2:'🏆',name2:'2e Groupe L',c1:2.10,cN:3.40,c2:3.40},
  {id:85, phase:'16es de finale',groupe:'',date:'3 juil. · 05h00',ts:20260702,venue:'Vancouver',team1:'🏆',name1:'1er Groupe B',team2:'🏆',name2:'3e repêché',c1:2.10,cN:3.40,c2:3.40},
  {id:86, phase:'16es de finale',groupe:'',date:'3 juil. · 20h00',ts:20260703,venue:'Dallas',team1:'🏆',name1:'2e Groupe D',team2:'🏆',name2:'2e Groupe G',c1:2.10,cN:3.40,c2:3.40},
  {id:87, phase:'16es de finale',groupe:'',date:'4 juil. · 00h00',ts:20260703,venue:'Miami',team1:'🏆',name1:'1er Groupe J',team2:'🏆',name2:'2e Groupe H',c1:2.10,cN:3.40,c2:3.40},
  {id:88, phase:'16es de finale',groupe:'',date:'4 juil. · 03h30',ts:20260703,venue:'Kansas City',team1:'🏆',name1:'1er Groupe K',team2:'🏆',name2:'3e repêché',c1:2.10,cN:3.40,c2:3.40},
  {id:89, phase:'8es de finale', groupe:'',date:'4 juil. · 19h00',ts:20260704,venue:'Houston',team1:'🏆',name1:'Vainqueur 16e #1',team2:'🏆',name2:'Vainqueur 16e #2',c1:2.10,cN:3.40,c2:3.40},
  {id:90, phase:'8es de finale', groupe:'',date:'4 juil. · 23h00',ts:20260704,venue:'Philadelphia',team1:'🏆',name1:'Vainqueur 16e #3',team2:'🏆',name2:'Vainqueur 16e #4',c1:2.10,cN:3.40,c2:3.40},
  {id:91, phase:'8es de finale', groupe:'',date:'5 juil. · 19h00',ts:20260705,venue:'MetLife, New York',team1:'🏆',name1:'Vainqueur 16e #5',team2:'🏆',name2:'Vainqueur 16e #6',c1:2.10,cN:3.40,c2:3.40},
  {id:92, phase:'8es de finale', groupe:'',date:'5 juil. · 23h00',ts:20260705,venue:'Guadalajara',team1:'🏆',name1:'Vainqueur 16e #7',team2:'🏆',name2:'Vainqueur 16e #8',c1:2.10,cN:3.40,c2:3.40},
  {id:93, phase:'Quarts de finale',groupe:'',date:'8 juil. · 19h00',ts:20260708,venue:'Los Angeles',team1:'🏆',name1:'Vainqueur 8e #1',team2:'🏆',name2:'Vainqueur 8e #2',c1:2.10,cN:3.40,c2:3.40},
  {id:94, phase:'Quarts de finale',groupe:'',date:'8 juil. · 23h00',ts:20260708,venue:'Kansas City',team1:'🏆',name1:'Vainqueur 8e #3',team2:'🏆',name2:'Vainqueur 8e #4',c1:2.10,cN:3.40,c2:3.40},
  {id:95, phase:'Quarts de finale',groupe:'',date:'9 juil. · 19h00',ts:20260709,venue:'Boston',team1:'🏆',name1:'Vainqueur 8e #5',team2:'🏆',name2:'Vainqueur 8e #6',c1:2.10,cN:3.40,c2:3.40},
  {id:96, phase:'Quarts de finale',groupe:'',date:'9 juil. · 23h00',ts:20260709,venue:'Dallas',team1:'🏆',name1:'Vainqueur 8e #7',team2:'🏆',name2:'Vainqueur 8e #8',c1:2.10,cN:3.40,c2:3.40},
  {id:97, phase:'Demi-finales',   groupe:'',date:'14 juil. · 21h00',ts:20260714,venue:'Dallas',team1:'🏆',name1:'Vainqueur QF #1',team2:'🏆',name2:'Vainqueur QF #2',c1:2.10,cN:3.40,c2:3.40},
  {id:98, phase:'Demi-finales',   groupe:'',date:'15 juil. · 21h00',ts:20260715,venue:'Los Angeles',team1:'🏆',name1:'Vainqueur QF #3',team2:'🏆',name2:'Vainqueur QF #4',c1:2.10,cN:3.40,c2:3.40},
  {id:99, phase:'Finale',         groupe:'',date:'19 juil. · 21h00',ts:20260719,venue:'MetLife Stadium, New York',team1:'🏆',name1:'Finaliste 1',team2:'🏆',name2:'Finaliste 2',c1:2.10,cN:3.40,c2:3.40},
];

