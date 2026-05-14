// ════════════════════════════════════════════════════════════
// CDM 2026 — js/data/cotes.js
// Système de cotes V3 — Expert Bookmaker
// calculerCotesMatch(team1, team2) — fonction pure
// Extrait de index.html lignes 1337-1374 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ══════════════════════════════════════════
// 🎲 SYSTÈME DE COTES V3 — EXPERT BOOKMAKER
// ══════════════════════════════════════════
function calculerCotesMatch(team1, team2) {
  const pts1 = EQUIPES_PTS[team1];
  const pts2 = EQUIPES_PTS[team2];
  if (!pts1 || !pts2) return null;

  const force1 = 1 / pts1;
  const force2 = 1 / pts2;
  const ecart = Math.abs(pts1 - pts2);

  const ecart_norm = Math.min(ecart / 30, 1.0);
  const prob_nul = Math.max(0.08, Math.min(0.32, 0.32 - 0.22 * Math.pow(ecart_norm, 1.5)));

  const prob_restante = 1 - prob_nul;
  const total_force = force1 + force2;
  const prob1 = (force1 / total_force) * prob_restante;
  const prob2 = (force2 / total_force) * prob_restante;

  const marge = ecart >= 25 ? 1.10 : ecart >= 15 ? 1.08 : ecart >= 8 ? 1.06 : 1.04;

  const cote1 = Math.max(1.08, Math.min(20.00, (1/prob1)/marge));
  const cote2 = Math.max(1.08, Math.min(20.00, (1/prob2)/marge));
  const cote_nul = Math.max(3.10, Math.min(11.00, (1/prob_nul)/marge));

  return {
    cote1: Math.round(cote1*100)/100,
    cote_nul: Math.round(cote_nul*100)/100,
    cote2: Math.round(cote2*100)/100,
  };
}

function getTypePronostic(s1, s2) {
  if (s1 > s2) return 'cote1';
  if (s1 < s2) return 'cote2';
  return 'cote_nul';
}
