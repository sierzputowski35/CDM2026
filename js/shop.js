// ════════════════════════════════════════════════════════════
// CDM 2026 — js/shop.js — Shop 4 catégories (Bilan v3 §11)
// ════════════════════════════════════════════════════════════
// Coffres / Cosmétiques / Boosters / Packs cartes.
//
// Modèle :
//   • shop_transactions = journal append-only (historique + base
//     pour calculer cooldowns 1/jour, 1/semaine, 1/mois).
//   • joueurs.shop_purchases JSONB = liste des items permanents
//     (cosmétiques notamment) → cache sync sur joueur._shopPurchases Set.
//   • joueurs.boost_*_until TIMESTAMP = expiration des boosters
//     temporaires, lus dans gainXP/addCoins via isBoostActive().

// ── POOLS ────────────────────────────────────────────────────

const SHOP_CHESTS = [
  { id: 'shop_chest_bronze',  type: 'bronze',  label: 'Coffre Bronze',  icon: '📦', price: { coins: 100 }, cooldown: null,      desc: '2 rolls · 10% carte' },
  { id: 'shop_chest_argent',  type: 'argent',  label: 'Coffre Argent',  icon: '🥈', price: { coins: 300 }, cooldown: null,      desc: '3 rolls · carte garantie' },
  { id: 'shop_chest_or',      type: 'or',      label: 'Coffre Or',      icon: '🎁', price: { coins: 800 }, cooldown: 'daily',   desc: '4 rolls · 1/jour' },
  { id: 'shop_chest_diamant', type: 'diamant', label: 'Coffre Diamant', icon: '💎', price: { gems: 50 },   cooldown: 'daily',   desc: '5 rolls · 1/jour' },
  { id: 'shop_chest_legende', type: 'legende', label: 'Coffre Légende', icon: '👑', price: { gems: 200 },  cooldown: 'weekly',  desc: '6 rolls · 1/semaine' },
  { id: 'shop_chest_mega',    type: 'legende', label: 'MEGA Coffre Légende', icon: '🌠', price: { gems: 500 }, cooldown: 'monthly', mega: true, desc: '1 carte Légende garantie · 1/mois' },
];

// Cosmétiques shop : ids alignés sur AVATAR_CATEGORIES / AVATAR_FRAMES /
// AVATAR_TITLES. L'unlock se fait via shop_purchases (type 'shop' dans
// isAvatarItemUnlocked).
const SHOP_COSMETICS = [
  // Avatars rares (3 × 300 🪙)
  { id: 'avatar_lion',     itemKey: '🦁', label: 'Avatar Lion',     icon: '🦁', price: { coins: 300 }, kind: 'avatar', rarity: 'rare' },
  { id: 'avatar_tigre',    itemKey: '🐯', label: 'Avatar Tigre',    icon: '🐯', price: { coins: 300 }, kind: 'avatar', rarity: 'rare' },
  { id: 'avatar_aigle',    itemKey: '🦅', label: 'Avatar Aigle',    icon: '🦅', price: { coins: 300 }, kind: 'avatar', rarity: 'rare' },
  // Avatar légendaire (1 × 1000 💎)
  { id: 'avatar_robot',    itemKey: '🤖', label: 'Avatar Robot',    icon: '🤖', price: { gems: 1000 }, kind: 'avatar', rarity: 'legendary' },
];

const SHOP_BOOSTERS = [
  { id: 'boost_double_xp',    label: 'Double XP (24h)',     icon: '⚡', price: { gems: 30 },  field: 'boost_double_xp_until',    durationH: 24, desc: 'Toute l\'XP gagnée ×2 pendant 24h' },
  { id: 'boost_double_coins', label: 'Double Coins (24h)',  icon: '💰', price: { gems: 25 },  field: 'boost_double_coins_until', durationH: 24, desc: 'Tous les coins gagnés ×2 pendant 24h' },
  { id: 'boost_streak',       label: 'Boost Streak',        icon: '🔥', price: { gems: 20 },  field: 'boost_streak_until',       durationH: 24, desc: 'Protège ta série daily pendant 24h' },
  { id: 'boost_reroll',       label: 'Re-roll Mission',     icon: '🎲', price: { gems: 5 },   action: 'reroll_mission',          desc: 'Change 1 mission daily aléatoirement' },
  { id: 'boost_hint',         label: 'Indice Pronostic',    icon: '🎯', price: { gems: 10 },  action: 'hint_prono',              desc: 'Affiche une stat indice (stub)' },
];

const SHOP_PACKS = [
  { id: 'pack_3_random',   label: 'Pack 3 cartes',         icon: '🎴', price: { coins: 200 }, count: 3, guaranteedRarity: null,      desc: '3 cartes aléatoires' },
  { id: 'pack_or',         label: 'Pack Or garanti',       icon: '🥇', price: { coins: 500 }, count: 3, guaranteedRarity: 'or',      desc: '3 cartes dont 1 Or min.' },
  { id: 'pack_diamant',    label: 'Pack Diamant garanti', icon: '💎', price: { gems: 80 },   count: 3, guaranteedRarity: 'diamant', desc: '3 cartes dont 1 Diamant min.' },
  { id: 'pack_legende',    label: 'Pack Légende',          icon: '👑', price: { gems: 250 },  count: 1, guaranteedRarity: 'legende', desc: '1 carte Légende garantie' },
];

const SHOP_ALL = [
  ...SHOP_CHESTS.map(i => ({ ...i, _kind: 'chest' })),
  ...SHOP_COSMETICS.map(i => ({ ...i, _kind: 'cosmetic' })),
  ...SHOP_BOOSTERS.map(i => ({ ...i, _kind: 'booster' })),
  ...SHOP_PACKS.map(i => ({ ...i, _kind: 'pack' })),
];

function getShopItem(id) {
  return SHOP_ALL.find(i => i.id === id);
}

// ── COOLDOWN HELPERS ──────────────────────────────────────────

const COOLDOWN_MS = { daily: 86400e3, weekly: 7 * 86400e3, monthly: 30 * 86400e3 };

async function getCooldownRemainingMs(joueurId, itemId, cooldown) {
  if (!cooldown || !sb) return 0;
  const window = COOLDOWN_MS[cooldown];
  if (!window) return 0;
  try {
    const { data } = await sb.from('shop_transactions')
      .select('created_at').eq('joueur_id', joueurId).eq('item_id', itemId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!data) return 0;
    const last = new Date(data.created_at).getTime();
    const elapsed = Date.now() - last;
    return Math.max(0, window - elapsed);
  } catch(_) { return 0; }
}

function formatCooldown(ms) {
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600e3);
  if (h >= 24) return `${Math.floor(h / 24)}j ${h % 24}h`;
  if (h > 0) return `${h}h ${Math.floor((ms % 3600e3) / 60e3)}m`;
  return `${Math.floor(ms / 60e3)}m`;
}

// ── BOOSTERS ─────────────────────────────────────────────────

function isBoostActive(joueur, field) {
  if (!joueur || !joueur[field]) return false;
  return new Date(joueur[field]).getTime() > Date.now();
}

async function activateBooster(joueurId, item) {
  if (!sb || !item.field) return;
  const until = new Date(Date.now() + (item.durationH || 24) * 3600e3).toISOString();
  await sb.from('joueurs').update({ [item.field]: until }).eq('id', joueurId);
  const j = (typeof allJoueurs !== 'undefined' ? allJoueurs : []).find(j => j.id === joueurId);
  if (j) j[item.field] = until;
}

// ── PURCHASE FLOW ────────────────────────────────────────────

async function canAffordItem(joueur, item) {
  if (!joueur || !item) return false;
  const need = item.price || {};
  if ((need.coins || 0) > (joueur.coins || 0)) return false;
  if ((need.gems  || 0) > (joueur.gems  || 0)) return false;
  return true;
}

async function purchaseItem(itemId) {
  if (!currentUser || !sb) return;
  const item = getShopItem(itemId);
  if (!item) { showToast('Item introuvable'); return; }
  const joueur = allJoueurs.find(j => j.id === currentUser);
  if (!joueur) return;

  // Cooldown
  if (item.cooldown) {
    const rem = await getCooldownRemainingMs(currentUser, itemId, item.cooldown);
    if (rem > 0) { showToast(`Disponible dans ${formatCooldown(rem)}`); return; }
  }

  // Already purchased (cosmetics) → block re-achat
  if (item._kind === 'cosmetic' && joueur._shopPurchases?.has?.(itemId)) {
    showToast('Déjà acheté'); return;
  }

  // Solvabilité
  if (!(await canAffordItem(joueur, item))) {
    const need = item.price || {};
    const what = need.coins ? `${need.coins} 🪙` : `${need.gems} 💎`;
    showToast(`Solde insuffisant (besoin ${what})`); return;
  }

  // Débit (sans appliquer le booster Double Coins, qui ne s'applique
  // qu'aux gains, pas aux dépenses)
  const debitTasks = [];
  if (item.price.coins) {
    debitTasks.push(sb.from('joueurs').update({ coins: (joueur.coins || 0) - item.price.coins }).eq('id', currentUser));
    joueur.coins = (joueur.coins || 0) - item.price.coins;
  }
  if (item.price.gems) {
    debitTasks.push(sb.from('joueurs').update({ gems: (joueur.gems || 0) - item.price.gems }).eq('id', currentUser));
    joueur.gems = (joueur.gems || 0) - item.price.gems;
  }
  await Promise.all(debitTasks);

  // Effet
  let deliveryToast = '';
  if (item._kind === 'chest') {
    await sb.from('coffres_inventaire').insert({ joueur_id: currentUser, type: item.type, source: 'shop_' + item.id });
    deliveryToast = `🎁 ${item.label} ajouté à ton inventaire`;
    // MEGA coffre : on injecte une carte Légende garantie directement
    if (item.mega && typeof rollCardOfRarity === 'function' && typeof addCardToCollection === 'function') {
      const card = rollCardOfRarity('legende');
      if (card) await addCardToCollection(card);
    }
  } else if (item._kind === 'pack') {
    await deliverShopPack(item);
    deliveryToast = `🎴 ${item.label} ouvert`;
  } else if (item._kind === 'cosmetic') {
    // Persist sur joueur.shop_purchases (array JSONB)
    const newList = Array.isArray(joueur.shop_purchases) ? [...joueur.shop_purchases, itemId] : [itemId];
    await sb.from('joueurs').update({ shop_purchases: newList }).eq('id', currentUser);
    joueur.shop_purchases = newList;
    joueur._shopPurchases = new Set(newList);
    deliveryToast = `✨ ${item.label} débloqué`;
  } else if (item._kind === 'booster') {
    if (item.field) {
      await activateBooster(currentUser, item);
      deliveryToast = `${item.icon} ${item.label} activé`;
    } else if (item.action === 'reroll_mission') {
      const rerolled = await rerollOneDailyMission(currentUser);
      deliveryToast = rerolled ? `🎲 Mission daily échangée` : 'Aucune mission daily à re-roll';
    } else if (item.action === 'hint_prono') {
      deliveryToast = '🎯 Indice prono — feature à venir (Sprint H2H)';
    }
  }

  // Journal de la transaction (pour cooldown + badge first_shop + historique)
  await sb.from('shop_transactions').insert({
    joueur_id: currentUser,
    item_id: itemId,
    item_type: item._kind,
    price_coins: item.price.coins || 0,
    price_gems:  item.price.gems  || 0,
  });

  await loadData();
  if (deliveryToast) showToast(deliveryToast);
  if (typeof renderShop === 'function') renderShop();
  // Étape 6 : 1er achat débloque le badge first_shop
  if (typeof checkBadges === 'function') setTimeout(() => checkBadges(), 600);
}

// Livre les cartes d'un pack avec garantie de rareté éventuelle.
async function deliverShopPack(pack) {
  if (typeof addCardToCollection !== 'function') return;
  const count = pack.count || 1;
  const guarantee = pack.guaranteedRarity;
  let guaranteeDelivered = false;
  for (let i = 0; i < count; i++) {
    let card;
    if (guarantee && !guaranteeDelivered) {
      // Premier tirage : on garantit la rareté minimum
      card = typeof rollCardOfRarity === 'function' ? rollCardOfRarity(guarantee) : null;
      guaranteeDelivered = true;
    } else {
      // Tirages restants : table CARD_DROP_RATES d'un coffre Argent (mid-tier)
      card = typeof rollCardFromChest === 'function' ? rollCardFromChest('argent') : null;
    }
    if (card) await addCardToCollection(card);
  }
}

// Reroll : pick 1 active daily mission row, replace by another from pool.
async function rerollOneDailyMission(joueurId) {
  if (!sb || typeof MISSIONS_DAILY_POOL === 'undefined') return false;
  try {
    const { data: active } = await sb.from('missions_progress')
      .select('id, mission_id').eq('joueur_id', joueurId).eq('mission_type', 'daily').eq('claimed', false);
    if (!active || !active.length) return false;
    const target = active[Math.floor(Math.random() * active.length)];
    const used = new Set(active.map(m => m.mission_id));
    const pool = MISSIONS_DAILY_POOL.filter(m => !used.has(m.id));
    if (!pool.length) return false;
    const replacement = pool[Math.floor(Math.random() * pool.length)];
    // 2 queries simples : delete l'ancienne row, insert la nouvelle.
    await sb.from('missions_progress').delete().eq('id', target.id);
    const reset_at = (function(){ const d = new Date(); d.setUTCHours(23,59,59,999); return d.toISOString(); })();
    await sb.from('missions_progress').insert({
      joueur_id: joueurId, mission_id: replacement.id, mission_type: 'daily', reset_at,
    });
    return true;
  } catch(e) { console.warn('[shop] reroll failed:', e); return false; }
}

// ── RENDER ───────────────────────────────────────────────────

let _shopActiveTab = 'chests';

// ── Notifications « nouveaux objets shop » ────────────────────
// Suivi local (localStorage) des objets déjà vus par le joueur. Un objet
// du catalogue dont l'id n'a jamais été vu compte comme « nouveau » →
// pastille rouge sur la cellule Shop de l'accueil. Ouvrir le shop marque
// tout le catalogue courant comme vu (la pastille retombe à 0).
function _shopSeenKey() {
  return 'cdm2026_shop_seen_' + (typeof currentUser !== 'undefined' && currentUser ? currentUser : 'anon');
}
function getNewShopItemsCount() {
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(_shopSeenKey()) || '[]'); } catch (_) {}
  const seenSet = new Set(seen);
  return SHOP_ALL.filter(i => !seenSet.has(i.id)).length;
}
function markShopItemsSeen() {
  try { localStorage.setItem(_shopSeenKey(), JSON.stringify(SHOP_ALL.map(i => i.id))); } catch (_) {}
}

function openShop() {
  // Le joueur consulte le shop → plus de « nouveaux » objets en attente.
  markShopItemsSeen();
  if (typeof renderShopHomeCard === 'function') renderShopHomeCard();
  const modal = document.getElementById('shop-modal');
  if (modal) { modal.remove(); }
  const bg = document.createElement('div');
  bg.id = 'shop-modal';
  bg.className = 'shop-modal-bg';
  bg.innerHTML = `
    <div class="shop-modal-head">
      <div class="shop-modal-title">🏪 SHOP</div>
      <div class="shop-balance" id="shop-balance"></div>
      <button class="shop-close-btn" onclick="closeShop()">×</button>
    </div>
    <div class="shop-tabs">
      <button class="shop-tab" data-tab="chests"    onclick="setShopTab('chests')">🎁 Coffres</button>
      <button class="shop-tab" data-tab="cosmetics" onclick="setShopTab('cosmetics')">✨ Cosmétiques</button>
      <button class="shop-tab" data-tab="boosters"  onclick="setShopTab('boosters')">⚡ Boosters</button>
      <button class="shop-tab" data-tab="packs"     onclick="setShopTab('packs')">🃏 Cartes</button>
    </div>
    <div class="shop-grid" id="shop-grid"></div>
  `;
  document.body.appendChild(bg);
  setShopTab(_shopActiveTab);
}

function closeShop() {
  const bg = document.getElementById('shop-modal');
  if (bg) { bg.style.opacity = '0'; setTimeout(() => bg.remove(), 250); }
}

function setShopTab(tab) {
  _shopActiveTab = tab;
  document.querySelectorAll('.shop-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  renderShop();
}

async function renderShop() {
  const grid = document.getElementById('shop-grid');
  const balance = document.getElementById('shop-balance');
  if (!grid || !balance) return;
  const joueur = allJoueurs.find(j => j.id === currentUser);
  if (!joueur) return;
  balance.innerHTML = `<span>${joueur.coins || 0} 🪙</span> · <span>${joueur.gems || 0} 💎</span>`;

  const pools = { chests: SHOP_CHESTS, cosmetics: SHOP_COSMETICS, boosters: SHOP_BOOSTERS, packs: SHOP_PACKS };
  const kindMap = { chests: 'chest', cosmetics: 'cosmetic', boosters: 'booster', packs: 'pack' };
  const items = pools[_shopActiveTab] || [];

  // Pré-calculer cooldowns (coffres uniquement)
  const cooldownMap = {};
  for (const it of items) {
    if (it.cooldown) {
      cooldownMap[it.id] = await getCooldownRemainingMs(currentUser, it.id, it.cooldown);
    }
  }

  grid.innerHTML = items.map(it => {
    const fakeFull = { ...it, _kind: kindMap[_shopActiveTab] };
    const price = it.price || {};
    const priceLabel = price.coins ? `${price.coins} 🪙` : price.gems ? `${price.gems} 💎` : 'Gratuit';
    const canBuy = (price.coins || 0) <= (joueur.coins || 0) && (price.gems || 0) <= (joueur.gems || 0);
    const cdRem = cooldownMap[it.id] || 0;
    const isOwnedCosmetic = _shopActiveTab === 'cosmetics' && joueur._shopPurchases?.has?.(it.id);
    const isBoostActive = it.field && joueur[it.field] && new Date(joueur[it.field]).getTime() > Date.now();
    let btnLabel = 'ACHETER';
    let btnDisabled = false;
    let btnClass = 'shop-buy-btn';
    if (isOwnedCosmetic) { btnLabel = 'POSSÉDÉ'; btnDisabled = true; btnClass += ' is-owned'; }
    else if (cdRem > 0) { btnLabel = formatCooldown(cdRem); btnDisabled = true; btnClass += ' is-cooldown'; }
    else if (isBoostActive) { btnLabel = 'ACTIF'; btnDisabled = true; btnClass += ' is-active'; }
    else if (!canBuy) { btnLabel = priceLabel + ' (KO)'; btnDisabled = true; btnClass += ' is-broke'; }
    return `
      <div class="shop-item ${it.mega ? 'is-mega' : ''}">
        <div class="shop-item-icon">${it.icon || '🎁'}</div>
        <div class="shop-item-label">${it.label}</div>
        <div class="shop-item-desc">${it.desc || ''}</div>
        <div class="shop-item-price">${priceLabel}</div>
        <button class="${btnClass}" ${btnDisabled ? 'disabled' : ''} onclick="purchaseItem('${it.id}')">${btnLabel}</button>
      </div>
    `;
  }).join('') || `<div class="shop-empty">Aucun item dans cette catégorie</div>`;
}

// ── HOME CARD : point d'entrée vers le shop ──────────────────
// Sprint 1c — #shop-home est désormais une cellule de la grid d'accueil
// (un <button class="home-grid-card"> avec onclick="openShop()"). On y
// injecte uniquement le contenu compact (.hgc-*), pas de wrapper de carte.
function renderShopHomeCard() {
  const container = document.getElementById('shop-home');
  if (!container) return;
  const joueur = (typeof allJoueurs !== 'undefined' ? allJoueurs : []).find(j => j.id === currentUser);
  if (!joueur) { container.innerHTML = ''; return; }
  // Petits indicateurs : boosters actifs
  const activeBoosts = ['boost_double_xp_until','boost_double_coins_until','boost_streak_until']
    .filter(f => joueur[f] && new Date(joueur[f]).getTime() > Date.now()).length;
  const newCount = (typeof getNewShopItemsCount === 'function') ? getNewShopItemsCount() : 0;
  container.innerHTML = `
    <span class="hgc-icon">🏪</span>
    <span class="hgc-title">SHOP</span>
    <span class="hgc-sub">${joueur.coins || 0} 🪙 · ${joueur.gems || 0} 💎${activeBoosts > 0 ? ` · ⚡${activeBoosts}` : ''}</span>
    ${newCount > 0 ? `<span class="hgc-badge">${newCount}</span>` : ''}`;
}

