// ════════════════════════════════════════════════════════════
// CDM 2026 — js/club-chat.js
// Chat du club (onglet Club) — stockage localStorage uniquement.
//
// Limitation assumée : pas de sync inter-device. Chaque appareil
// voit ses propres messages locaux. Migration vers Supabase realtime
// possible plus tard sans toucher à l'UI (échanger CHAT_STORE).
//
// Format message :
//   { id, ts, authorId, authorPseudo, authorColor, text }
// ════════════════════════════════════════════════════════════

const CLUB_CHAT_KEY = 'cdm2026_club_chat_v1';
const CLUB_CHAT_LAST_SEEN_KEY = 'cdm2026_club_chat_last_seen_v1';
const CLUB_CHAT_MAX = 500;

const CHAT_STORE = {
  load() {
    try { return JSON.parse(localStorage.getItem(CLUB_CHAT_KEY) || '[]'); }
    catch (_) { return []; }
  },
  save(msgs) {
    const trimmed = msgs.slice(-CLUB_CHAT_MAX);
    localStorage.setItem(CLUB_CHAT_KEY, JSON.stringify(trimmed));
  },
};

function _chatAuthor() {
  const joueur = (typeof allJoueurs !== 'undefined' && typeof currentUser !== 'undefined')
    ? allJoueurs.find(j => j.id === currentUser)
    : null;
  if (joueur) {
    const colors = ['var(--gold-primary)','var(--emerald)','var(--electric-blue)','var(--crimson)','var(--royal-purple)','#FF8A3D','#F472B6'];
    const color = colors[(joueur.pseudo || '?').charCodeAt(0) % colors.length];
    return { id: joueur.id, pseudo: joueur.pseudo || 'Anonyme', color };
  }
  return { id: 'anon', pseudo: 'Anonyme', color: '#8B9DC3' };
}

function _chatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `${hh}:${mm}`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mo} ${hh}:${mm}`;
}

function _escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderClubChat() {
  const list = document.getElementById('club-chat-messages');
  const counter = document.getElementById('club-chat-count');
  if (!list) return;

  const msgs = CHAT_STORE.load();
  if (counter) counter.textContent = msgs.length === 0
    ? '0 message'
    : msgs.length === 1 ? '1 message' : `${msgs.length} messages`;

  if (!msgs.length) {
    list.innerHTML = '<div class="club-chat-empty">Aucun message pour l\'instant. Lance la discussion !</div>';
    return;
  }

  const me = _chatAuthor();
  list.innerHTML = msgs.map(m => {
    const mine = m.authorId === me.id;
    return `<div class="club-msg ${mine ? 'club-msg-mine' : ''}">
      <div class="club-msg-meta">
        <span class="club-msg-author" style="color:${m.authorColor || '#8B9DC3'}">${_escape(m.authorPseudo)}</span>
        <span class="club-msg-time">${_chatTime(m.ts)}</span>
      </div>
      <div class="club-msg-bubble">${_escape(m.text)}</div>
    </div>`;
  }).join('');

  // Scroll au plus récent
  requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });

  // Mark seen
  localStorage.setItem(CLUB_CHAT_LAST_SEEN_KEY, String(msgs[msgs.length - 1].ts));
  updateClubBadge();
}

function sendClubMessage(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  const input = document.getElementById('club-chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const author = _chatAuthor();
  const msg = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    ts: Date.now(),
    authorId: author.id,
    authorPseudo: author.pseudo,
    authorColor: author.color,
    text,
  };

  const msgs = CHAT_STORE.load();
  msgs.push(msg);
  CHAT_STORE.save(msgs);

  input.value = '';
  renderClubChat();
  if (navigator.vibrate) navigator.vibrate(10);
}

function updateClubBadge() {
  const badge = document.getElementById('badge-club');
  if (!badge) return;
  const msgs = CHAT_STORE.load();
  if (!msgs.length) { badge.style.display = 'none'; return; }
  const lastSeen = parseInt(localStorage.getItem(CLUB_CHAT_LAST_SEEN_KEY) || '0', 10);
  const me = _chatAuthor();
  const unread = msgs.filter(m => m.ts > lastSeen && m.authorId !== me.id).length;
  if (unread > 0) {
    badge.textContent = unread > 99 ? '99+' : String(unread);
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Expose pour switchTab/onsubmit
window.renderClubChat = renderClubChat;
window.sendClubMessage = sendClubMessage;
window.updateClubBadge = updateClubBadge;
