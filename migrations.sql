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
