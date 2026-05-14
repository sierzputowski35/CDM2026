// ════════════════════════════════════════════════════════════
// CDM 2026 — js/supabase.js
// Init du client Supabase + helpers de session admin
// (décodage + validation du token signé renvoyé par /api/admin-auth)
// Extrait de index.html lignes 695-730 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ══════════════════════════════════════════
// SUPABASE
// ══════════════════════════════════════════
const SUPABASE_URL = 'https://hqhosgwebucwtqtnlbqg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O1tjA5w5G9jBQni9vA2wZg_NBKEu2jj';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Admin auth ──────────────────────────────────────────────
// Le mot de passe admin n'est plus en clair côté client : il est
// vérifié par /api/admin-auth qui renvoie un token signé HMAC
// (valide 1h). Le token est stocké dans localStorage.cdm2026_admin
// et son champ exp est inspecté au démarrage pour décider de la
// restauration de la session admin. Voir SECURITY.md.
const ADMIN_TOKEN_KEY = 'cdm2026_admin';

function decodeAdminToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const json = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    if (payload && typeof payload.exp === 'number') return payload;
  } catch (_) {}
  return null;
}

function getValidAdminToken() {
  const raw = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!raw || raw === 'true') return null; // 'true' = ancien format, on force re-login
  const payload = decodeAdminToken(raw);
  if (!payload) return null;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;
  return raw;
}
