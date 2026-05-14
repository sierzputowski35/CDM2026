# Sécurité — CDM 2026

Document vivant sur la posture de sécurité de l'app. Mis à jour à chaque PR sécu.

> **Contexte.** L'app est utilisée entre amis pour la Coupe du monde 2026. La cible de sécurité est **raisonnable** : empêcher les fuites évidentes et les abus opportunistes, sans bloquer le delivery. Les compromis sont documentés ci-dessous plutôt qu'ignorés.

---

## 1. Variables d'environnement Vercel

À configurer dans **Vercel → Project → Settings → Environment Variables** (Production + Preview).

| Variable | Usage | Comment l'obtenir |
|---|---|---|
| `SUPABASE_URL` | URL du projet Supabase (déjà utilisé par `api/scores.js` et `api/odds.js`) | Dashboard Supabase → Project Settings → API |
| `SUPABASE_KEY` | Clé **publishable** (`sb_publishable_…`) utilisée côté serveur pour les lectures (déjà en place) | Dashboard Supabase → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Clé **service_role** (déjà utilisée par `api/odds.js`). **À ne jamais exposer côté client.** | Dashboard Supabase → Project Settings → API → "service_role" |
| `ADMIN_PASSWORD_HASH` | Hash scrypt du mot de passe admin, format `scrypt$N$r$p$saltHex$hashHex` | Générer avec `node scripts/hash-admin-password.js` |
| `ADMIN_TOKEN_SECRET` | Secret HMAC pour signer le token de session admin (≥ 32 chars aléatoires) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Procédure de rotation du mot de passe admin

1. `node scripts/hash-admin-password.js` → saisir le nouveau mot de passe
2. Copier le hash imprimé dans Vercel → `ADMIN_PASSWORD_HASH`
3. Redéployer (ou attendre le prochain push). Les tokens en cours restent valides jusqu'à expiration (1h).
4. Pour invalider tous les tokens actifs : régénérer aussi `ADMIN_TOKEN_SECRET`.

---

## 2. Authentification admin

### Avant

Le mot de passe admin était inscrit en clair comme constante JavaScript dans `index.html` (ligne 3274 avant la refonte). Trivial à extraire via *View Source* ou DevTools.

### Après (PR #1)

1. Le client envoie le password à `POST /api/admin-auth`.
2. Le serveur compare en temps constant avec `ADMIN_PASSWORD_HASH` (scrypt N=16384, r=8, p=1).
3. En cas de succès, renvoie un token `base64url(payload).base64url(HMAC-SHA256(payload))` valide 1h.
4. Le client stocke le token dans `localStorage.cdm2026_admin` et vérifie son `exp` au démarrage.

### Choix de scrypt vs bcrypt

La spec initiale mentionnait bcrypt. Nous utilisons **scrypt** (`crypto.scryptSync`, natif Node.js) pour les raisons suivantes :

- Pas de dépendance externe (aucun `package.json` requis sur Vercel)
- Robustesse équivalente à bcrypt pour ce cas d'usage
- Algorithme moderne, recommandé par OWASP au même titre que bcrypt et Argon2

---

## 3. Tables Supabase et RLS recommandées

### État actuel

Le code client écrit directement dans Supabase via la **publishable key**. Sans RLS, toute personne qui possède l'URL Supabase peut écrire dans les tables. **À ce jour, la sécurité repose sur l'obscurité**, pas sur des règles.

### Inventaire

| Table | Lectures attendues | Écritures attendues | Sensibilité |
|---|---|---|---|
| `joueurs` | Publique (classement) | Tout joueur sur sa ligne (pronos, avatar, coins, xp…) | **Haute** — possibilité de cheat sur points |
| `scores_reels` | Publique | **Admin seulement** | **Critique** — détermine les points |
| `globaux_reels` | Publique | **Admin seulement** | **Critique** — détermine les bonus |
| `cotes_raw` | Publique | **Admin seulement** (et `api/odds.js` via service_role) | Moyenne |
| `equipes_pts` | Publique | **Admin seulement** | Moyenne |
| `coffres_inventaire` | Owner | Owner (ajout/maj) | Moyenne — récompenses |
| `badges_debloques` | Owner | Owner (ajout) | Faible |
| `cartes_collection` | Owner | Owner (ajout) | Faible |
| `xp_history` | Owner | Owner (insert append-only) | Faible |
| `messages` | Publique (chat) | Insert public | Faible — modération manuelle |

### Politiques RLS minimales recommandées

> **À appliquer dans Supabase → SQL Editor.** Les écritures admin sont aujourd'hui faites depuis le client avec la publishable key : tant que ce flux n'a pas été migré derrière des routes serverless (voir §4 *Dette*), les `INSERT/UPDATE/DELETE` doivent rester ouverts sur les tables admin sous peine de casser l'app. Le tableau ci-dessous indique l'**état souhaité à terme** ; l'état pratique pour ce sprint est marqué *(transitoire)*.

```sql
-- Activer RLS partout (à appliquer table par table en testant)
ALTER TABLE joueurs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_reels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE globaux_reels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotes_raw            ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes_pts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffres_inventaire   ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges_debloques     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartes_collection    ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;

-- Lecture publique : ces tables sont visibles par tous les clients
CREATE POLICY "read_all" ON joueurs            FOR SELECT USING (true);
CREATE POLICY "read_all" ON scores_reels       FOR SELECT USING (true);
CREATE POLICY "read_all" ON globaux_reels      FOR SELECT USING (true);
CREATE POLICY "read_all" ON cotes_raw          FOR SELECT USING (true);
CREATE POLICY "read_all" ON equipes_pts        FOR SELECT USING (true);
CREATE POLICY "read_all" ON messages           FOR SELECT USING (true);

-- Écritures *transitoires* (à durcir une fois les routes serverless en place)
CREATE POLICY "write_anon" ON joueurs            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_anon" ON coffres_inventaire FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_anon" ON badges_debloques   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_anon" ON cartes_collection  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_anon" ON xp_history         FOR INSERT WITH CHECK (true);
CREATE POLICY "write_anon" ON messages           FOR INSERT WITH CHECK (true);

-- Tables admin : à terme, seul service_role doit écrire.
-- En attendant la migration serverless, on autorise les writes du client publishable :
CREATE POLICY "admin_write" ON scores_reels      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_write" ON globaux_reels     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_write" ON cotes_raw         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_write" ON equipes_pts       FOR ALL USING (true) WITH CHECK (true);
```

### État cible (post-migration serverless)

Une fois les écritures admin déplacées derrière `/api/admin/*` (PR de suivi), remplacer les policies `admin_write` ci-dessus par des `USING (false) WITH CHECK (false)` côté `anon`/`authenticated` — le client n'écrira plus du tout dans ces tables, seul `service_role` (qui *bypass* RLS) y aura accès depuis le serveur.

---

## 4. Dette de sécurité assumée

Ces points sont **connus** et **acceptés** pour la phase actuelle de l'app. Ils doivent être rouverts si l'app s'ouvre au-delà du cercle d'amis.

| # | Sujet | Risque | Plan |
|---|---|---|---|
| D-01 | Les écritures admin (`scores_reels`, `globaux_reels`, `cotes_raw`, `equipes_pts`) se font côté client avec la publishable key. Un attaquant qui connaît l'URL Supabase peut écrire directement. | Moyen — un visiteur malveillant peut altérer le tournoi | PR de suivi : `/api/admin/*` validant le token signé et utilisant `SUPABASE_SERVICE_KEY` côté serveur |
| D-02 | Pas de Supabase Auth → les `UPDATE joueurs` ne peuvent pas être limités à *soi-même* via RLS. Un joueur peut techniquement modifier les pronos d'un autre. | Moyen | Migrer vers Supabase Auth (gros chantier, à planifier) |
| D-03 | Le token admin est validé côté serveur uniquement à la connexion, pas à chaque action. | Faible — les actions admin restent côté client | Lié à D-01 : à régler en même temps |
| D-04 | Pas de rate-limit sur `/api/admin-auth` au-delà d'un délai constant de 300 ms en cas d'échec. | Faible — password fort + délai = brute-force impraticable en pratique | Ajouter un rate-limit Vercel Edge si abus constaté |
| D-05 | Pas de CSP/HSTS personnalisé. | Faible | À ajouter via `vercel.json` headers quand on stabilisera la structure |

---

## 5. Checklist de déploiement (PR #1)

- [ ] Générer un nouveau password admin avec `node scripts/hash-admin-password.js`
- [ ] Configurer `ADMIN_PASSWORD_HASH` et `ADMIN_TOKEN_SECRET` sur Vercel (Production + Preview)
- [ ] Vérifier que `SUPABASE_SERVICE_KEY` n'apparaît **nulle part** dans le bundle client (`grep` sur `index.html`)
- [ ] Appliquer le bloc SQL §3 dans Supabase et tester que l'app continue de fonctionner
- [ ] Tester la connexion admin sur la preview Vercel avant merge
- [ ] Mettre à jour ce document si une nouvelle table est ajoutée
