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
