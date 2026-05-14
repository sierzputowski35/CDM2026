-- ════════════════════════════════════════════════════════════════════
-- CDM 2026 — Migrations SQL
-- Document de référence : BILAN_STRATEGIQUE_CDM2026_v3.md
-- Plan d'action        : PLAN_ACTION_CLAUDE_CODE.md
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- Étape 1 — Unification du niveau XP
-- ─────────────────────────────────────────────────────────────────────
-- Reset clean slate : la nouvelle courbe XP (85 × level^1.6) stocke
-- joueur.xp comme XP CUMULÉ total (et non plus XP-dans-le-niveau).
-- Les anciennes valeurs sont incompatibles, on remet à zéro pour
-- démarrer la nouvelle économie sur des bases propres.

UPDATE joueurs
SET xp = 0,
    level = 1;

DELETE FROM xp_history;

-- ─────────────────────────────────────────────────────────────────────
-- Hotfix vacuous-truth badges (PR du 2026-05-14)
-- ─────────────────────────────────────────────────────────────────────
-- Les badges round_16, quarters, semis se débloquaient à tort dès le
-- premier prono (les filtres `phase==='Huitièmes'/'Quarts'/'Demies'`
-- ne matchaient aucune entrée de MATCHS — les vraies phases s'appellent
-- '8es de finale', 'Quarts de finale', 'Demi-finales'. Comme `.every()`
-- retourne `true` sur un tableau vide, les badges sautaient.
--
-- Cleanup des comptes pollués par ce bug. À ré-exécuter UNIQUEMENT
-- pour les bases déjà touchées par le bug.

DELETE FROM badges_debloques
WHERE badge_id IN ('round_16', 'quarters', 'semis');

-- Optionnel : pour repartir XP/niveau cohérent après le cleanup badges,
-- re-exécuter le reset XP ci-dessus (UPDATE joueurs SET xp=0, level=1).

-- ─────────────────────────────────────────────────────────────────────
-- Étape 3 — Système de ligues refondu
-- ─────────────────────────────────────────────────────────────────────
-- Table de notifications globales : promotion de ligue, vainqueur du
-- tournoi, etc. Visible par tous dans le feed de news.
-- joueurs.id est un TEXT (code joueur custom), donc user_id TEXT aussi.

CREATE TABLE IF NOT EXISTS notifications_globales (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT REFERENCES joueurs(id) ON DELETE SET NULL,
  pseudo TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_recent
  ON notifications_globales(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- Étape 3 — Resync des ligues sur les nouveaux seuils
-- ─────────────────────────────────────────────────────────────────────
-- Les seuils ont changé (Bronze<300, Argent<1000, Or<2500, Diamant<5000,
-- Légende≥5000). Certains joueurs étaient en dessous des anciens paliers
-- mais sont automatiquement promus avec les nouveaux. On reset la colonne
-- `league` ; syncAllLeagues() la repeuplera au prochain validateMatch.
-- (Alternative : exécuter directement l'UPDATE conditionné ci-dessous.)

UPDATE joueurs SET league = NULL;
