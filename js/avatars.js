// ════════════════════════════════════════════════════════════
// CDM 2026 — js/avatars.js
// Système avatar AAA : catalogue (catégories, emojis, cadres,
// fonds, titres), modal de personnalisation, sauvegarde Supabase.
// Extrait de index.html lignes 734-1304 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ══════════════════════════════════════════
// SYSTÈME AVATAR AAA — CDM 2026
// ══════════════════════════════════════════

const AVATAR_CATEGORIES = {
  foot: {
    label: '⚽ Football',
    items: [
      { e: '⚽', rarity: 'common', locked: false },
      { e: '🥅', rarity: 'common', locked: false },
      { e: '🏆', rarity: 'rare', locked: false },
      { e: '🎯', rarity: 'rare', locked: false },
      { e: '⚡', rarity: 'epic', locked: false },
      { e: '🔥', rarity: 'epic', locked: false },
      { e: '👟', rarity: 'epic', locked: true, unlock: 'Niveau 10', unlockType: 'level', unlockValue: 10 },
      { e: '🥇', rarity: 'legendary', locked: true, unlock: 'Top 3', unlockType: 'rank', unlockValue: 3 },
    ]
  },
  animaux: {
    label: '🐯 Animaux',
    items: [
      { e: '🦁', rarity: 'rare', locked: false },
      { e: '🐯', rarity: 'rare', locked: false },
      { e: '🦅', rarity: 'rare', locked: false },
      { e: '🦊', rarity: 'common', locked: false },
      { e: '🐺', rarity: 'epic', locked: true, unlock: 'Streak 5j', unlockType: 'streak', unlockValue: 5 },
      { e: '🐉', rarity: 'epic', locked: true, unlock: 'Ligue Or', unlockType: 'ligue', unlockValue: 'Or' },
      { e: '🦋', rarity: 'legendary', locked: true, unlock: '💎 500', unlockType: 'gems', unlockValue: 500 },
      { e: '🦄', rarity: 'legendary', locked: true, unlock: 'Ligue Légende', unlockType: 'ligue', unlockValue: 'Légende' },
    ]
  },
  legendes: {
    label: '👑 Légendes',
    items: [
      { e: '👑', rarity: 'rare', locked: false },
      { e: '🌟', rarity: 'rare', locked: false },
      { e: '💎', rarity: 'epic', locked: true, unlock: 'Ligue Diamant', unlockType: 'ligue', unlockValue: 'Diamant' },
      { e: '🏅', rarity: 'epic', locked: true, unlock: '50 matchs', unlockType: 'matches', unlockValue: 50 },
      { e: '🎭', rarity: 'legendary', locked: true, unlock: 'Niveau 20', unlockType: 'level', unlockValue: 20 },
      { e: '🤖', rarity: 'legendary', locked: true, unlock: '💎 1000', unlockType: 'gems', unlockValue: 1000 },
    ]
  },
  mascottes: {
    label: '🏆 CDM',
    items: [
      { e: '🌍', rarity: 'common', locked: false },
      { e: '🗽', rarity: 'common', locked: false },
      { e: '🍁', rarity: 'rare', locked: false },
      { e: '🎪', rarity: 'epic', locked: true, unlock: 'Ligue Argent', unlockType: 'ligue', unlockValue: 'Argent' },
      { e: '🚀', rarity: 'legendary', locked: true, unlock: 'Ligue Légende', unlockType: 'ligue', unlockValue: 'Légende' },
    ]
  }
};

const AVATAR_FRAMES = [
  {
    id: 'none',
    label: 'Aucun',
    rarity: 'common',
    locked: false,
    css: 'border: 2px solid rgba(136,153,187,0.4); border-radius: 24px',
  },
  {
    id: 'gold',
    label: 'Or',
    rarity: 'rare',
    locked: false,
    css: 'border: 3px solid #F4C542; border-radius: 24px; box-shadow: 0 0 14px rgba(244,197,66,0.5)',
  },
  {
    id: 'flame',
    label: 'Flamme',
    rarity: 'epic',
    locked: true,
    unlock: 'Streak 7 jours',
    unlockType: 'streak',
    unlockValue: 7,
    css: 'border: 3px solid #FF8A3D; border-radius: 24px; box-shadow: 0 0 18px rgba(255,138,61,0.6)',
  },
  {
    id: 'diamond',
    label: 'Diamant',
    rarity: 'epic',
    locked: true,
    unlock: 'Ligue Diamant',
    unlockType: 'ligue',
    unlockValue: 'Diamant',
    css: 'border: 3px solid #58C8FA; border-radius: 24px; box-shadow: 0 0 18px rgba(88,200,250,0.5)',
  },
  {
    id: 'legend',
    label: 'Légende',
    rarity: 'legendary',
    locked: true,
    unlock: 'Ligue Légende',
    unlockType: 'ligue',
    unlockValue: 'Légende',
    css: 'border: 3px solid #A855F7; border-radius: 24px; box-shadow: 0 0 22px rgba(168,85,247,0.7)',
  },
  {
    id: 'champion',
    label: 'Champion',
    rarity: 'legendary',
    locked: true,
    unlock: 'Vainqueur Saison',
    unlockType: 'season_winner',
    css: 'border: 3px solid #FF4D5A; border-radius: 24px; box-shadow: 0 0 22px rgba(255,77,90,0.7)',
  },
];

const AVATAR_BACKGROUNDS = [
  { id: 'cosmos',  label: 'Cosmos',   bg: 'linear-gradient(135deg, #1a1060, #0a2a50)', locked: false },
  { id: 'fire',    label: 'Feu',      bg: 'linear-gradient(135deg, #3D1000, #6B2000)', locked: false },
  { id: 'jungle',  label: 'Jungle',   bg: 'linear-gradient(135deg, #002A1A, #004430)', locked: false },
  { id: 'ocean',   label: 'Océan',    bg: 'linear-gradient(135deg, #001A3D, #003060)', locked: false },
  { id: 'sunset',  label: 'Sunset',   bg: 'linear-gradient(135deg, #3D1A00, #5A2A00)', locked: true, unlock: 'Niveau 5' },
  { id: 'legend',  label: 'Légende',  bg: 'linear-gradient(135deg, #1A0035, #2A0055)', locked: true, unlock: 'Ligue Or' },
  { id: 'gold',    label: 'Or Pur',   bg: 'linear-gradient(135deg, #2A1A00, #3D2800)', locked: true, unlock: 'Ligue Or' },
  { id: 'arctic',  label: 'Arctique', bg: 'linear-gradient(135deg, #001A35, #00253A)', locked: true, unlock: 'Streak 10j' },
];

const AVATAR_TITLES = [
  { id: 'default',  name: 'Joueur CDM',     color: '#8899BB', locked: false, unlock: 'Par défaut' },
  { id: 'prophet',  name: 'Prophète',       color: '#F4C542', locked: false, unlock: '5 scores exacts' },
  { id: 'sniper',   name: 'Sniper',         color: '#58C8FA', locked: false, unlock: '10 scores exacts' },
  { id: 'clutch',   name: 'Clutch King',    color: '#FF8A3D', locked: true,  unlock: 'Streak 7 jours', unlockType: 'streak', unlockValue: 7 },
  { id: 'legend',   name: 'Légende Vivante',color: '#A855F7', locked: true,  unlock: 'Ligue Légende', unlockType: 'ligue', unlockValue: 'Légende' },
  { id: 'telepath', name: 'Télépathe',      color: '#22D16B', locked: true,  unlock: '95% précision', unlockType: 'precision', unlockValue: 95 },
  { id: 'champion', name: 'Champion',       color: '#FF4D5A', locked: true,  unlock: 'Vainqueur Saison', unlockType: 'season_winner' },
];

const RARITY_COLORS = {
  common:    '#8899BB',
  rare:      '#22D16B',
  epic:      '#A855F7',
  legendary: '#F4C542',
};

// Twemoji — images HD illustrées (standard Discord / Twitter / Slack)
function twUrl(emoji) {
  const cps = [...emoji]
    .map(c => c.codePointAt(0).toString(16))
    .filter(c => c !== 'fe0f');
  const file = cps.join('-');
  // cdnjs cloudflare > jsdelivr (plus fiable pour les gros packages)
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${file}.png`;
}

const AVATAR_FLAG_BGS = [
  { id: 'flag_fr', label: 'France',    code: 'fr',     locked: false },
  { id: 'flag_br', label: 'Brésil',    code: 'br',     locked: false },
  { id: 'flag_es', label: 'Espagne',   code: 'es',     locked: false },
  { id: 'flag_ar', label: 'Argentine', code: 'ar',     locked: false },
  { id: 'flag_pt', label: 'Portugal',  code: 'pt',     locked: false },
  { id: 'flag_gb', label: 'Angleterre',code: 'gb-eng', locked: false },
  { id: 'flag_ma', label: 'Maroc',     code: 'ma',     locked: false },
  { id: 'flag_ca', label: 'Canada',    code: 'ca',     locked: false },
  { id: 'flag_us', label: 'USA',       code: 'us',     locked: false },
  { id: 'flag_mx', label: 'Mexique',   code: 'mx',     locked: false },
  { id: 'flag_ba', label: 'Bosnie',     code: 'ba',     locked: false },
  { id: 'flag_de', label: 'Allemagne', code: 'de',     locked: false },
  { id: 'flag_jp', label: 'Japon',     code: 'jp',     locked: false },
  { id: 'flag_nl', label: 'Pays-Bas',  code: 'nl',     locked: false },
  { id: 'flag_sn', label: 'Sénégal',   code: 'sn',     locked: false },
  { id: 'flag_hr', label: 'Croatie',   code: 'hr',     locked: false },
].map(f => ({
  ...f,
  bg: '#0a1520',
  bgUrl: `https://flagcdn.com/w160/${f.code}.png`,
}));

function getAvatarBgById(id) {
  return AVATAR_BACKGROUNDS.find(b => b.id === id)
      || AVATAR_FLAG_BGS.find(b => b.id === id)
      || AVATAR_BACKGROUNDS[0];
}

let pendingAvatarConfig = null;

function getAvatar(joueur) {
  const pseudo = joueur?.pseudo || '?';
  const colors = ['#F4C542','#22D16B','#58C8FA','#FF4D5A','#A855F7','#FF8A3D','#22D16B','#F472B6'];
  const color = colors[pseudo.charCodeAt(0) % colors.length];
  const initials = pseudo.substring(0, 2).toUpperCase();

  let config = { emoji: null, frame: 'none', bg: 'cosmos', title: 'Joueur CDM' };

  // Priorité : localStorage (fonctionne même si colonne Supabase absente)
  const lsKey = 'cdm2026_avatar_' + joueur?.id;
  const lsRaw = joueur?.id ? localStorage.getItem(lsKey) : null;
  const raw = lsRaw || joueur?.avatar || null;

  if (raw) {
    if (!raw.startsWith('{')) {
      config.emoji = raw;
    } else {
      try {
        const parsed = JSON.parse(raw);
        config = { ...config, ...parsed };
      } catch(e) {
        config.emoji = raw;
      }
    }
  }

  return { ...config, initials, color };
}

function renderAvatarEl(joueur, size = 34, radius = 10) {
  const av = getAvatar(joueur);

  const frameData = AVATAR_FRAMES.find(f => f.id === (av.frame || 'none')) || AVATAR_FRAMES[0];
  const bgData = getAvatarBgById(av.bg || 'cosmos');

  const innerSize = size - 6;
  const imgSize = Math.round(innerSize * 0.64);

  const bgStyle = `
    width:${size}px;height:${size}px;border-radius:${radius}px;
    background:${bgData.bg};
    display:flex;align-items:center;justify-content:center;
    position:relative;flex-shrink:0;overflow:hidden;
    ${frameData.css}
  `.replace(/\s+/g, ' ');

  const flagImg = bgData.bgUrl
    ? `<img src="${bgData.bgUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none" loading="lazy">`
    : '';

  if (av.emoji) {
    return `<div style="${bgStyle}">
      ${flagImg}
      <img src="${twUrl(av.emoji)}" width="${imgSize}" height="${imgSize}"
           style="object-fit:contain;image-rendering:auto;position:relative;z-index:1"
           onerror="this.style.display='none';this.nextSibling.style.display='flex'"
           loading="lazy">
      <span style="display:none;font-size:${imgSize}px;line-height:1;position:relative;z-index:1">${av.emoji}</span>
    </div>`;
  }

  return `<div style="${bgStyle}">
    ${flagImg}
    <span style="font-family:'Bebas Neue',sans-serif;font-size:${Math.round(innerSize*0.4)}px;color:#fff;font-weight:700;letter-spacing:1px;position:relative;z-index:1">${av.initials}</span>
  </div>`;
}

// ── Vérifier si un item est débloqué pour ce joueur ──
function isAvatarItemUnlocked(item, joueur) {
  if (!item.locked) return true;
  if (!joueur) return false;

  const stats = calcPlayerStats(joueur);
  const t = item.unlockType;
  const v = item.unlockValue;

  if (t === 'streak')   return (joueur.streak || 0) >= v;
  if (t === 'ligue')    return joueur.ligue === v;
  if (t === 'level')    return (joueur.level || 1) >= v;
  if (t === 'matches')  return (stats?.total || 0) >= v;
  if (t === 'rank')     return (joueur.rank || 999) <= v;
  if (t === 'gems')     return (joueur.gems || 0) >= v;
  if (t === 'precision') {
    if (!stats?.total) return false;
    const precision = Math.round(((stats.exact + stats.bonDiff + stats.bonVainqueur) / stats.total) * 100);
    return precision >= v;
  }
  return false;
}

// ── Ouvrir le modal ──
function openAvatarModal() {
  const joueur = allJoueurs.find(j => j.id === currentUser);
  if (!joueur) return;

  const current = getAvatar(joueur);
  pendingAvatarConfig = {
    emoji: current.emoji || '⚽',
    frame: current.frame || 'none',
    bg:    current.bg    || 'cosmos',
    title: current.title || 'Joueur CDM',
  };

  const gemsEl = document.getElementById('av-gems-count');
  if (gemsEl) gemsEl.textContent = joueur.gems || 0;

  applyAvatarPreview();

  renderAvatarCatNav('foot');
  renderAvatarEmojiGrid('foot', joueur);
  renderAvatarFrameGrid(joueur);
  renderAvatarBgGrid(joueur);
  renderAvatarTitleGrid(joueur);

  switchAvatarTab('emoji', document.querySelector('.av-tab-btn'));

  document.getElementById('avatar-modal').classList.remove('hidden');
}

function closeAvatarModal() {
  document.getElementById('avatar-modal').classList.add('hidden');
  pendingAvatarConfig = null;
}

// ── Appliquer la preview en temps réel ──
function applyAvatarPreview() {
  if (!pendingAvatarConfig) return;

  const bgData    = getAvatarBgById(pendingAvatarConfig.bg);
  const frameData = AVATAR_FRAMES.find(f => f.id === pendingAvatarConfig.frame) || AVATAR_FRAMES[0];
  const titleData = AVATAR_TITLES.find(t => t.name === pendingAvatarConfig.title) || AVATAR_TITLES[0];

  const bgEl    = document.getElementById('av-preview-bg');
  const frameEl = document.getElementById('av-preview-frame');
  const emojiEl = document.getElementById('av-preview-emoji');
  const titleEl = document.getElementById('av-preview-title');

  if (bgEl) {
    bgEl.style.background = bgData.bg;
    if (bgData.bgUrl) {
      bgEl.style.backgroundImage = `url(${bgData.bgUrl})`;
      bgEl.style.backgroundSize = 'cover';
      bgEl.style.backgroundPosition = 'center';
    }
  }
  if (frameEl) {
    frameEl.style.cssText = `
      position:absolute;inset:-5px;border-radius:33px;
      pointer-events:none;transition:all 0.3s ease;
      ${frameData.css}
    `;
  }
  if (emojiEl) {
    const em = pendingAvatarConfig.emoji || '⚽';
    emojiEl.innerHTML = `<img src="${twUrl(em)}" width="60" height="60"
      style="object-fit:contain;image-rendering:auto"
      onerror="this.style.display='none';this.nextSibling.style.display='block'"
      loading="lazy"><span style="display:none;font-size:52px;line-height:1">${em}</span>`;
  }
  if (titleEl) {
    titleEl.textContent = pendingAvatarConfig.title;
    titleEl.style.color = titleData.color;
    titleEl.style.borderColor = titleData.color;
  }
}

// ── Navigation par onglet ──
function switchAvatarTab(tab, btn) {
  document.querySelectorAll('.av-tab-btn').forEach(b => b.classList.remove('av-tab-active'));
  document.querySelectorAll('.av-tab-content').forEach(t => t.style.display = 'none');
  if (btn) btn.classList.add('av-tab-active');
  const el = document.getElementById('av-tab-' + tab);
  if (el) el.style.display = 'block';
}

// ── Catégories emoji ──
function renderAvatarCatNav(activeCat) {
  const nav = document.getElementById('av-cat-nav');
  if (!nav) return;
  nav.innerHTML = Object.entries(AVATAR_CATEGORIES).map(([key, cat]) => `
    <div class="av-cat-pill ${key === activeCat ? 'active' : ''}"
         onclick="selectAvatarCat('${key}')">
      ${cat.label}
    </div>
  `).join('');
}

function selectAvatarCat(cat) {
  document.querySelectorAll('.av-cat-pill').forEach(p => p.classList.remove('active'));
  const pill = [...document.querySelectorAll('.av-cat-pill')]
    .find(p => p.textContent.trim().includes(AVATAR_CATEGORIES[cat]?.label?.split(' ')[1] || cat));
  if (pill) pill.classList.add('active');

  const joueur = allJoueurs.find(j => j.id === currentUser);
  renderAvatarEmojiGrid(cat, joueur);
}

// ── Grille Emoji ──
function renderAvatarEmojiGrid(cat, joueur) {
  const grid = document.getElementById('av-emoji-grid');
  if (!grid) return;
  const items = AVATAR_CATEGORIES[cat]?.items || [];

  grid.innerHTML = items.map(item => {
    const unlocked = isAvatarItemUnlocked(item, joueur);
    const selected = item.e === pendingAvatarConfig?.emoji;
    return `
      <div class="av-item ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}"
           onclick="pickAvatarEmoji('${item.e}', ${!unlocked})">
        <img src="${twUrl(item.e)}" width="36" height="36"
             style="object-fit:contain;image-rendering:auto;pointer-events:none"
             onerror="this.outerHTML='<span style=font-size:28px;line-height:1>${item.e}</span>'"
             loading="lazy">
        ${!unlocked ? `
          <div style="position:absolute;inset:0;background:rgba(5,8,22,0.65);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:14px;gap:2px">
            <span style="font-size:14px">🔒</span>
            <span style="font-size:8px;color:rgba(255,255,255,0.6);padding:0 4px;text-align:center;line-height:1.2">${item.unlock || ''}</span>
          </div>
        ` : ''}
        <div class="av-rarity-dot" style="background:${RARITY_COLORS[item.rarity] || '#8899BB'}"></div>
      </div>
    `;
  }).join('');
}

function pickAvatarEmoji(emoji, locked) {
  if (locked) return;
  if (!pendingAvatarConfig) return;
  pendingAvatarConfig.emoji = emoji;
  applyAvatarPreview();
  const activeCat = document.querySelector('.av-cat-pill.active');
  const catKey = activeCat ? Object.keys(AVATAR_CATEGORIES).find(k =>
    activeCat.textContent.includes(AVATAR_CATEGORIES[k].label.split(' ')[1] || k)
  ) : 'foot';
  renderAvatarEmojiGrid(catKey || 'foot', allJoueurs.find(j => j.id === currentUser));
}

// ── Grille Cadres ──
function renderAvatarFrameGrid(joueur) {
  const grid = document.getElementById('av-frame-grid');
  if (!grid) return;

  grid.innerHTML = AVATAR_FRAMES.map(frame => {
    const unlocked = isAvatarItemUnlocked(frame, joueur);
    const selected = frame.id === pendingAvatarConfig?.frame;
    const rarityColor = frame.rarity === 'legendary' ? '#F4C542'
      : frame.rarity === 'epic' ? '#A855F7'
      : frame.rarity === 'rare' ? '#22D16B' : '#8899BB';

    return `
      <div class="av-frame-item ${selected ? 'selected' : ''}"
           onclick="${unlocked ? `pickAvatarFrame('${frame.id}')` : ''}">
        <div style="width:56px;height:56px;${frame.css};display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1060,#0a2a50);overflow:hidden">
          <img src="${twUrl(pendingAvatarConfig?.emoji || '⚽')}" width="34" height="34"
               style="object-fit:contain" loading="lazy"
               onerror="this.style.display='none'">
        </div>
        <div style="font-size:9px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${rarityColor}">
          ${frame.rarity === 'legendary' ? '✦ ' : ''}${frame.label}
        </div>
        ${!unlocked ? `
          <div style="position:absolute;inset:0;background:rgba(5,8,22,0.6);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;gap:4px">
            <span style="font-size:16px">🔒</span>
            <span style="font-size:9px;color:rgba(255,255,255,0.6);text-align:center;padding:0 6px">${frame.unlock || ''}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function pickAvatarFrame(frameId) {
  if (!pendingAvatarConfig) return;
  pendingAvatarConfig.frame = frameId;
  applyAvatarPreview();
  const joueur = allJoueurs.find(j => j.id === currentUser);
  renderAvatarFrameGrid(joueur);
}

// ── Grille Fonds ──
function renderAvatarBgGrid(joueur) {
  const grid = document.getElementById('av-bg-grid');
  if (!grid) return;

  const renderBgItem = (bg) => {
    const unlocked = isAvatarItemUnlocked(bg, joueur);
    const selected = bg.id === pendingAvatarConfig?.bg;
    const flagLayer = bg.bgUrl
      ? `<img src="${bg.bgUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none" loading="lazy">`
      : '';
    return `
      <div class="av-bg-item ${selected ? 'selected' : ''}"
           style="background:${bg.bg}"
           onclick="${unlocked ? `pickAvatarBg('${bg.id}')` : ''}">
        ${flagLayer}
        ${selected ? '<div style="position:absolute;top:4px;right:4px;width:16px;height:16px;border-radius:50%;background:#F4C542;display:flex;align-items:center;justify-content:center;font-size:9px;color:#050816;font-weight:900;z-index:2">✓</div>' : ''}
        ${!unlocked ? '<div style="position:absolute;inset:0;background:rgba(5,8,22,0.6);display:flex;align-items:center;justify-content:center;border-radius:14px;font-size:16px;z-index:2">🔒</div>' : ''}
        <div style="position:absolute;bottom:0;left:0;right:0;padding:2px 0;background:rgba(0,0,0,0.55);text-align:center;font-size:8px;color:rgba(255,255,255,0.9);font-weight:700;z-index:2">${bg.label}</div>
      </div>
    `;
  };

  grid.innerHTML =
    `<div style="grid-column:1/-1;font-size:10px;font-weight:700;letter-spacing:0.8px;color:var(--text3);text-transform:uppercase;padding:4px 0 2px">Thèmes</div>`
    + AVATAR_BACKGROUNDS.map(renderBgItem).join('')
    + `<div style="grid-column:1/-1;font-size:10px;font-weight:700;letter-spacing:0.8px;color:var(--text3);text-transform:uppercase;padding:10px 0 2px">Drapeaux CDM 2026</div>`
    + AVATAR_FLAG_BGS.map(renderBgItem).join('');
}

function pickAvatarBg(bgId) {
  if (!pendingAvatarConfig) return;
  pendingAvatarConfig.bg = bgId;
  applyAvatarPreview();
  const joueur = allJoueurs.find(j => j.id === currentUser);
  renderAvatarBgGrid(joueur);
}

// ── Grille Titres ──
function renderAvatarTitleGrid(joueur) {
  const grid = document.getElementById('av-title-grid');
  if (!grid) return;

  grid.innerHTML = AVATAR_TITLES.map(t => {
    const unlocked = isAvatarItemUnlocked(t, joueur);
    const selected = t.name === pendingAvatarConfig?.title;

    return `
      <div class="av-title-item ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}"
           onclick="${unlocked ? `pickAvatarTitle('${t.name.replace(/'/g,"\\'")}')` : ''}"
           style="${!unlocked ? 'opacity:0.45;cursor:not-allowed' : ''}">
        <div>
          <div style="font-size:14px;font-weight:700;color:${t.color}">${t.name}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${!unlocked ? '🔒 ' : '✓ '}${t.unlock}</div>
        </div>
        ${selected ? '<div style="color:var(--gold,#F4C542);font-size:18px">✓</div>' : ''}
      </div>
    `;
  }).join('');
}

function pickAvatarTitle(name) {
  if (!pendingAvatarConfig) return;
  pendingAvatarConfig.title = name;
  applyAvatarPreview();
  const joueur = allJoueurs.find(j => j.id === currentUser);
  renderAvatarTitleGrid(joueur);
}

// ── Sauvegarder ──
async function saveAvatarConfig() {
  if (!pendingAvatarConfig) {
    closeAvatarModal();
    return;
  }

  const btn = document.getElementById('av-save-btn');
  const btnReset = () => { if (btn) { btn.innerHTML = '<span>✓</span> SAUVEGARDER'; btn.disabled = false; btn.style.opacity = '1'; } };
  if (btn) { btn.innerHTML = '...'; btn.style.opacity = '0.7'; btn.disabled = true; }

  const payload = JSON.stringify(pendingAvatarConfig);

  // Sauvegarde locale immédiate (fonctionne même si Supabase échoue)
  localStorage.setItem('cdm2026_avatar_' + currentUser, payload);

  // Patch local allJoueurs pour que l'UI se mette à jour sans reload
  const joueurLocal = allJoueurs.find(j => j.id === currentUser);
  if (joueurLocal) joueurLocal.avatar = payload;

  // Tenter la sync Supabase
  const { error } = await sb.from('joueurs').update({ avatar: payload }).eq('id', currentUser);
  if (error) {
    console.error('[Avatar save] Supabase error:', error);
    // On ferme quand même — la config est dans localStorage
  }

  btnReset();
  closeAvatarModal();

  // Mettre à jour tous les affichages d'avatar du joueur courant
  const joueurMaj = allJoueurs.find(j => j.id === currentUser);
  if (joueurMaj) {
    // Profil modal (ouvert depuis le classement)
    const profilAvEl = document.getElementById('profil-avatar-display');
    if (profilAvEl) profilAvEl.innerHTML = renderAvatarEl(joueurMaj, 46, 13);
    // Home header
    const homeAvEl = document.getElementById('home-avatar');
    if (homeAvEl) homeAvEl.innerHTML = renderAvatarEl(joueurMaj, 38, 11);
  }

  if (typeof refreshPage === 'function') refreshPage();
  showToast('✨ Avatar mis à jour !');
}
