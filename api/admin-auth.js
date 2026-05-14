// ─────────────────────────────────────────────────────────────────
// /api/admin-auth — vérification du mot de passe admin côté serveur
//
// Variables d'environnement requises (Vercel → Settings → Env Vars) :
//   ADMIN_PASSWORD_HASH  format: scrypt$N$r$p$saltHex$hashHex
//                        (généré par scripts/hash-admin-password.js)
//   ADMIN_TOKEN_SECRET   secret HMAC pour signer le token de session
//                        (au moins 32 caractères aléatoires)
//
// Le client envoie { password } en POST, reçoit { token } valide 1h.
// Le token est utilisé côté client pour protéger l'UI admin.
// ─────────────────────────────────────────────────────────────────

const crypto = require('crypto');

const TOKEN_TTL_SECONDS = 60 * 60; // 1h

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function verifyScryptHash(password, encoded) {
  // Format attendu : scrypt$N$r$p$saltHex$hashHex
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = parseInt(parts[1], 10);
  const r = parseInt(parts[2], 10);
  const p = parseInt(parts[3], 10);
  const salt = Buffer.from(parts[4], 'hex');
  const expected = Buffer.from(parts[5], 'hex');
  let derived;
  try {
    derived = crypto.scryptSync(password, salt, expected.length, { N, r, p, maxmem: 64 * 1024 * 1024 });
  } catch (_) {
    return false;
  }
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function signToken(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!hash || !secret) {
    return res.status(500).json({
      error: "Configuration manquante : ADMIN_PASSWORD_HASH et ADMIN_TOKEN_SECRET doivent être définies sur Vercel."
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  const password = body && typeof body.password === 'string' ? body.password : '';
  if (!password) {
    return res.status(400).json({ error: 'Mot de passe manquant' });
  }

  if (!verifyScryptHash(password, hash)) {
    // Petit délai constant pour limiter le brute-force trivial
    await new Promise(r => setTimeout(r, 300));
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signToken({ role: 'admin', iat: now, exp: now + TOKEN_TTL_SECONDS }, secret);
  return res.status(200).json({ token, expiresIn: TOKEN_TTL_SECONDS });
};
