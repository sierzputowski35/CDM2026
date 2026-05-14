#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// Génère un hash scrypt pour ADMIN_PASSWORD_HASH (à coller sur Vercel).
//
// Usage :
//   node scripts/hash-admin-password.js
//   (le password est demandé en stdin, jamais affiché à l'écran)
//
// Le hash produit est au format scrypt$N$r$p$saltHex$hashHex et
// se vérifie côté serveur dans api/admin-auth.js.
// ─────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const readline = require('readline');

const N = 16384; // 2^14, raisonnable pour serverless (RAM ~16 MB)
const r = 8;
const p = 1;
const KEY_LEN = 64;

function readPassword(prompt) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Masquage minimal : on remplace l'écho par rien
    const stdin = process.openStdin();
    process.stdin.on('data', char => {
      char = char + '';
      if (char === '\n' || char === '\r' || char === '') {
        stdin.pause();
      } else {
        process.stdout.clearLine?.();
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(prompt + Array(rl.line.length + 1).join('*'));
      }
    });
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

(async () => {
  const pwd = await readPassword('Mot de passe admin : ');
  if (!pwd) {
    console.error('Mot de passe vide, abandon.');
    process.exit(1);
  }
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pwd, salt, KEY_LEN, { N, r, p, maxmem: 64 * 1024 * 1024 });
  const encoded = `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`;
  console.log('\n\nCopie cette valeur dans Vercel → Env Vars → ADMIN_PASSWORD_HASH :\n');
  console.log(encoded);
  console.log('\nGénère aussi un ADMIN_TOKEN_SECRET avec :');
  console.log("  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n");
})();
