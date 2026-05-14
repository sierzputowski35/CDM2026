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
-- Ajout de la colonne `league` si elle manque (le code la lit/écrit
-- depuis longtemps mais Supabase n'avait jamais throw — les updates
-- échouaient silencieusement).
-- Puis reset : syncAllLeagues() repeuplera au prochain validateMatch.

ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS league TEXT;

UPDATE joueurs SET league = NULL;

-- ─────────────────────────────────────────────────────────────────────
-- Étape 5 — Level-up rewards
-- ─────────────────────────────────────────────────────────────────────
-- gainXP écrit désormais joueurs.coins ET joueurs.gems à chaque update.
-- On s'assure que les colonnes existent (sécurité : si elles avaient été
-- créées silencieusement par addCoins/addGems c'est OK, mais idempotent).

ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS gems  INTEGER DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────
-- Étape 6 — Refonte badges (46 badges sur 7 catégories)
-- ─────────────────────────────────────────────────────────────────────
-- Renames d'IDs pour préserver l'historique des comptes déjà touchés :
--   first_blood     → first_prono
--   exact_1         → first_exact
--   exact_5         → sniper
--   legendary_card  → first_legende
-- Si un compte a DÉJÀ les deux IDs (improbable mais possible), l'UPDATE
-- échouera sur la contrainte d'unicité ; à régler manuellement le cas
-- échéant via DELETE du nouveau puis UPDATE de l'ancien.

UPDATE badges_debloques SET badge_id = 'first_prono'   WHERE badge_id = 'first_blood';
UPDATE badges_debloques SET badge_id = 'first_exact'   WHERE badge_id = 'exact_1';
UPDATE badges_debloques SET badge_id = 'sniper'        WHERE badge_id = 'exact_5';
UPDATE badges_debloques SET badge_id = 'first_legende' WHERE badge_id = 'legendary_card';

-- Cleanup des badges supprimés (hors spec v3 / système Club inexistant)
DELETE FROM badges_debloques
WHERE badge_id IN (
  'hat_trick', 'clutch_king', 'upset_master', 'exact_10',
  'club_member', 'club_top', 'rival_5'
);

-- ─────────────────────────────────────────────────────────────────────
-- Étape 4 — Refonte cartes (pool 528 joueurs, doublons FUT-style)
-- ─────────────────────────────────────────────────────────────────────
-- Les cartes sont désormais droppées par les coffres (CARD_DROP_RATES) et
-- pointent vers un joueur unique de ALL_PLAYERS via `player_id`. Les
-- doublons (même joueur déjà possédé) sont auto-convertis en coins/gems.
--
-- L'ancien schéma stockait une ligne par drop (carte_id = "<pid>_<match>_<ts>"),
-- ce qui empêchait toute détection de doublon. On nettoie les données de
-- test, on ajoute les colonnes `player_id` et `equipe` (lecture badges
-- `album_team` côté checkBadges), puis on pose un index unique
-- (joueur_id, player_id) pour garantir l'unicité au niveau DB.

DELETE FROM cartes_collection;

ALTER TABLE cartes_collection ADD COLUMN IF NOT EXISTS player_id TEXT;
ALTER TABLE cartes_collection ADD COLUMN IF NOT EXISTS equipe    TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cartes_unique_player
  ON cartes_collection(joueur_id, player_id)
  WHERE player_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────
-- Étape 7 — Système missions (3 niveaux : daily / weekly / tournament)
-- ─────────────────────────────────────────────────────────────────────
-- Architecture hybride :
--   • joueurs.daily_state JSONB   — compteurs du jour, reset à minuit
--   • joueurs.weekly_state JSONB  — compteurs de la semaine, reset lundi
--   • joueurs.last_daily_missions_date  TEXT — clé de rotation daily
--   • joueurs.last_weekly_missions_week TEXT — clé de rotation weekly
--   • missions_progress (TABLE) — quelles 3 daily + 3 weekly + 5 tournoi
--     sont actives pour chaque joueur, et leur statut claimed.
--
-- Les compteurs (pronos, exacts, etc.) vivent dans daily_state/weekly_state
-- côté joueur. Le `progress` d'une mission est calculé à la volée à partir
-- de ces compteurs + des données existantes (cartes, ligues, globaux).
-- La table missions_progress ne stocke PAS le progress (dérivé) mais
-- seulement l'identité des missions actives + le flag claimed.

ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS daily_state  JSONB DEFAULT '{}'::jsonb;
ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS weekly_state JSONB DEFAULT '{}'::jsonb;
ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS last_daily_missions_date  TEXT;
ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS last_weekly_missions_week TEXT;

CREATE TABLE IF NOT EXISTS missions_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  joueur_id TEXT REFERENCES joueurs(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('daily','weekly','tournament')),
  claimed BOOLEAN DEFAULT FALSE,
  reset_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missions_user_type
  ON missions_progress(joueur_id, mission_type);

-- Unicité : un même joueur ne peut pas avoir 2x la même mission active
-- dans la même fenêtre de reset. Pour tournament, reset_at IS NULL donc
-- on garantit qu'il n'y a qu'une seule ligne par mission tournoi.
CREATE UNIQUE INDEX IF NOT EXISTS idx_missions_unique
  ON missions_progress(joueur_id, mission_id, COALESCE(reset_at, 'epoch'::timestamp));

-- Legacy : la colonne joueurs.missions_progress JSONB (ancien proto-système
-- qui ne suivait qu'une seule mission "3 pronos = +50 XP") n'est plus lue
-- ni écrite par l'app. On la laisse en DB par sécurité — peut être
-- supprimée plus tard via : ALTER TABLE joueurs DROP COLUMN missions_progress;

-- ─────────────────────────────────────────────────────────────────────
-- Étape 8 — Pack de fin de tournoi (cosmétiques commémoratifs)
-- ─────────────────────────────────────────────────────────────────────
-- L'admin déclenche `triggerEndOfSeason()` après validation de la finale.
-- Pour chaque joueur, on calcule sa ligue finale (à partir des PTS) et
-- on distribue le pack correspondant (coins, gems, coffre, carte
-- garantie de rareté, badge commémoratif, parfois frame/avatar/titre).
--
-- Idempotence : le flag `end_of_season_pack` empêche la double-distribution.
-- L'utilisateur voit la modale cinématique à son prochain login, après
-- quoi `end_of_season_seen` est passé à TRUE.

ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS end_of_season_pack  TEXT;
ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS end_of_season_seen  BOOLEAN DEFAULT FALSE;
