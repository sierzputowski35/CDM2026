// Vercel Function — scrape Flashscore et met à jour Supabase
// S'exécute automatiquement toutes les 5 minutes via cron

// ─────────────────────────────────────────────────────────────────
// FIX #4 : Les clés ne sont PLUS hardcodées dans le code source.
// Définir ces variables dans le Dashboard Vercel :
//   Settings → Environment Variables
//   SUPABASE_URL  = https://hqhosgwebucwtqtnlbqg.supabase.co
//   SUPABASE_KEY  = sb_publishable_O1tjA5w5G9jBQni9vA2wZg_NBKEu2jj
//   CRON_SECRET   = (une chaîne aléatoire de votre choix)
// ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Correspondance entre les noms Flashscore et nos noms d'équipes
const TEAM_MAP = {
  'Mexique': 'Mexique', 'Mexico': 'Mexique',
  'Afrique du Sud': 'Afrique du Sud', 'South Africa': 'Afrique du Sud',
  'Corée du Sud': 'Corée du Sud', 'South Korea': 'Corée du Sud', 'Korea Republic': 'Corée du Sud',
  'Tchéquie': 'Tchéquie', 'Czech Republic': 'Tchéquie', 'Czechia': 'Tchéquie',
  'Canada': 'Canada',
  'Italie': 'Italie', 'Italy': 'Italie',
  'Suisse': 'Suisse', 'Switzerland': 'Suisse',
  'Qatar': 'Qatar',
  'Brésil': 'Brésil', 'Brazil': 'Brésil',
  'Maroc': 'Maroc', 'Morocco': 'Maroc',
  'Écosse': 'Écosse', 'Scotland': 'Écosse',
  'Haïti': 'Haïti', 'Haiti': 'Haïti',
  'États-Unis': 'États-Unis', 'USA': 'États-Unis', 'United States': 'États-Unis',
  'Paraguay': 'Paraguay',
  'Australie': 'Australie', 'Australia': 'Australie',
  'Turquie': 'Turquie', 'Turkey': 'Turquie', 'Türkiye': 'Turquie',
  'Allemagne': 'Allemagne', 'Germany': 'Allemagne',
  "Côte d'Ivoire": "Côte d'Ivoire", 'Ivory Coast': "Côte d'Ivoire",
  'Équateur': 'Équateur', 'Ecuador': 'Équateur',
  'Curaçao': 'Curaçao', 'Curacao': 'Curaçao',
  'Pays-Bas': 'Pays-Bas', 'Netherlands': 'Pays-Bas', 'Holland': 'Pays-Bas',
  'Japon': 'Japon', 'Japan': 'Japon',
  'Suède': 'Suède', 'Sweden': 'Suède',
  'Tunisie': 'Tunisie', 'Tunisia': 'Tunisie',
  'Belgique': 'Belgique', 'Belgium': 'Belgique',
  'Égypte': 'Égypte', 'Egypt': 'Égypte',
  'Iran': 'Iran',
  'Nouvelle-Zélande': 'Nouvelle-Zélande', 'New Zealand': 'Nouvelle-Zélande',
  'Espagne': 'Espagne', 'Spain': 'Espagne',
  'Cap-Vert': 'Cap-Vert', 'Cape Verde': 'Cap-Vert',
  'Arabie saoudite': 'Arabie saoudite', 'Saudi Arabia': 'Arabie saoudite',
  'Uruguay': 'Uruguay',
  'France': 'France',
  'Sénégal': 'Sénégal', 'Senegal': 'Sénégal',
  'Norvège': 'Norvège', 'Norway': 'Norvège',
  'Bolivie': 'Bolivie', 'Bolivia': 'Bolivie',
  'Argentine': 'Argentine', 'Argentina': 'Argentine',
  'Algérie': 'Algérie', 'Algeria': 'Algérie',
  'Autriche': 'Autriche', 'Austria': 'Autriche',
  'Jordanie': 'Jordanie', 'Jordan': 'Jordanie',
  'Portugal': 'Portugal',
  'Colombie': 'Colombie', 'Colombia': 'Colombie',
  'Ouzbékistan': 'Ouzbékistan', 'Uzbekistan': 'Ouzbékistan',
  'Irak': 'Irak', 'Iraq': 'Irak',
  'Angleterre': 'Angleterre', 'England': 'Angleterre',
  'Croatie': 'Croatie', 'Croatia': 'Croatie',
  'Ghana': 'Ghana',
  'Panama': 'Panama',
};

// Liste des matchs CDM 2026
// FIX #3 : L'ID 82 (manquant dans la version originale) est maintenant présent
const MATCHS = [
  {id:1,  name1:'Mexique',       name2:'Afrique du Sud'},
  {id:2,  name1:'Corée du Sud',  name2:'Tchéquie'},
  {id:3,  name1:'Mexique',       name2:'Corée du Sud'},
  {id:4,  name1:'Afrique du Sud',name2:'Tchéquie'},
  {id:5,  name1:'Mexique',       name2:'Tchéquie'},
  {id:6,  name1:'Afrique du Sud',name2:'Corée du Sud'},
  {id:7,  name1:'Canada',        name2:'Italie'},
  {id:8,  name1:'Canada',        name2:'Qatar'},
  {id:9,  name1:'Italie',        name2:'Suisse'},
  {id:10, name1:'Suisse',        name2:'Qatar'},
  {id:11, name1:'Canada',        name2:'Suisse'},
  {id:12, name1:'Italie',        name2:'Qatar'},
  {id:13, name1:'Brésil',        name2:'Maroc'},
  {id:14, name1:'Écosse',        name2:'Haïti'},
  {id:15, name1:'Brésil',        name2:'Écosse'},
  {id:16, name1:'Maroc',         name2:'Haïti'},
  {id:17, name1:'Brésil',        name2:'Haïti'},
  {id:18, name1:'Écosse',        name2:'Maroc'},
  {id:19, name1:'États-Unis',    name2:'Paraguay'},
  {id:20, name1:'Australie',     name2:'Turquie'},
  {id:21, name1:'États-Unis',    name2:'Australie'},
  {id:22, name1:'Paraguay',      name2:'Turquie'},
  {id:23, name1:'États-Unis',    name2:'Turquie'},
  {id:24, name1:'Australie',     name2:'Paraguay'},
  {id:25, name1:'Allemagne',     name2:"Côte d'Ivoire"},
  {id:26, name1:'Équateur',      name2:'Curaçao'},
  {id:27, name1:'Allemagne',     name2:'Curaçao'},
  {id:28, name1:"Côte d'Ivoire", name2:'Équateur'},
  {id:29, name1:'Allemagne',     name2:'Équateur'},
  {id:30, name1:'Curaçao',       name2:"Côte d'Ivoire"},
  {id:31, name1:'Pays-Bas',      name2:'Japon'},
  {id:32, name1:'Suède',         name2:'Tunisie'},
  {id:33, name1:'Pays-Bas',      name2:'Suède'},
  {id:34, name1:'Japon',         name2:'Tunisie'},
  {id:35, name1:'Pays-Bas',      name2:'Tunisie'},
  {id:36, name1:'Suède',         name2:'Japon'},
  {id:37, name1:'Belgique',      name2:'Égypte'},
  {id:38, name1:'Iran',          name2:'Nouvelle-Zélande'},
  {id:39, name1:'Belgique',      name2:'Iran'},
  {id:40, name1:'Égypte',        name2:'Nouvelle-Zélande'},
  {id:41, name1:'Belgique',      name2:'Nouvelle-Zélande'},
  {id:42, name1:'Iran',          name2:'Égypte'},
  {id:43, name1:'Espagne',       name2:'Cap-Vert'},
  {id:44, name1:'Arabie saoudite',name2:'Uruguay'},
  {id:45, name1:'Espagne',       name2:'Arabie saoudite'},
  {id:46, name1:'Cap-Vert',      name2:'Uruguay'},
  {id:47, name1:'Espagne',       name2:'Uruguay'},
  {id:48, name1:'Arabie saoudite',name2:'Cap-Vert'},
  {id:49, name1:'France',        name2:'Sénégal'},
  {id:50, name1:'Norvège',       name2:'Bolivie'},
  {id:51, name1:'France',        name2:'Norvège'},
  {id:52, name1:'Sénégal',       name2:'Bolivie'},
  {id:53, name1:'France',        name2:'Bolivie'},
  {id:54, name1:'Norvège',       name2:'Sénégal'},
  {id:55, name1:'Argentine',     name2:'Algérie'},
  {id:56, name1:'Autriche',      name2:'Jordanie'},
  {id:57, name1:'Argentine',     name2:'Autriche'},
  {id:58, name1:'Algérie',       name2:'Jordanie'},
  {id:59, name1:'Argentine',     name2:'Jordanie'},
  {id:60, name1:'Autriche',      name2:'Algérie'},
  {id:61, name1:'Portugal',      name2:'Colombie'},
  {id:62, name1:'Ouzbékistan',   name2:'Irak'},
  {id:63, name1:'Portugal',      name2:'Ouzbékistan'},
  {id:64, name1:'Colombie',      name2:'Irak'},
  {id:65, name1:'Portugal',      name2:'Irak'},
  {id:66, name1:'Colombie',      name2:'Ouzbékistan'},
  {id:67, name1:'Angleterre',    name2:'Croatie'},
  {id:68, name1:'Ghana',         name2:'Panama'},
  {id:69, name1:'Angleterre',    name2:'Ghana'},
  {id:70, name1:'Croatie',       name2:'Panama'},
  {id:71, name1:'Angleterre',    name2:'Panama'},
  {id:72, name1:'Ghana',         name2:'Croatie'},
  // Phases finales — 16es
  {id:73, name1:'1er Groupe A',  name2:'2e Groupe B'},
  {id:74, name1:'1er Groupe C',  name2:'2e Groupe F'},
  {id:75, name1:'1er Groupe E',  name2:'3e repêché'},
  {id:76, name1:'1er Groupe F',  name2:'2e Groupe C'},
  {id:77, name1:'1er Groupe I',  name2:'3e repêché'},
  {id:78, name1:'1er Groupe D',  name2:'3e repêché'},
  {id:79, name1:'1er Groupe B',  name2:'2e Groupe A'},
  {id:80, name1:'1er Groupe L',  name2:'3e repêché'},
  {id:81, name1:'1er Groupe G',  name2:'3e repêché'},
  // FIX #3 : ID 82 manquant dans la version originale — ajouté ici
  {id:82, name1:'2e Groupe I',   name2:'2e Groupe E'},
  {id:83, name1:'1er Groupe H',  name2:'2e Groupe J'},
  {id:84, name1:'2e Groupe K',   name2:'2e Groupe L'},
  {id:85, name1:'1er Groupe B',  name2:'3e repêché'},
  {id:86, name1:'2e Groupe D',   name2:'2e Groupe G'},
  {id:87, name1:'1er Groupe J',  name2:'2e Groupe H'},
  {id:88, name1:'1er Groupe K',  name2:'3e repêché'},
  // 8es, Quarts, Demis, Finale
  {id:89, name1:'Vainqueur 16e #1', name2:'Vainqueur 16e #2'},
  {id:90, name1:'Vainqueur 16e #3', name2:'Vainqueur 16e #4'},
  {id:91, name1:'Vainqueur 16e #5', name2:'Vainqueur 16e #6'},
  {id:92, name1:'Vainqueur 16e #7', name2:'Vainqueur 16e #8'},
  {id:93, name1:'Vainqueur 8e #1',  name2:'Vainqueur 8e #2'},
  {id:94, name1:'Vainqueur 8e #3',  name2:'Vainqueur 8e #4'},
  {id:95, name1:'Vainqueur 8e #5',  name2:'Vainqueur 8e #6'},
  {id:96, name1:'Vainqueur 8e #7',  name2:'Vainqueur 8e #8'},
  {id:97, name1:'Vainqueur QF #1',  name2:'Vainqueur QF #2'},
  {id:98, name1:'Vainqueur QF #3',  name2:'Vainqueur QF #4'},
  {id:99, name1:'Finaliste 1',      name2:'Finaliste 2'},
];

// ─────────────────────────────────────────────────────────────────
// Helpers Supabase
// ─────────────────────────────────────────────────────────────────
async function supabaseUpsert(matchId, s1, s2) {
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_reels?match_id=eq.${matchId}&select=match_id`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const existing = await checkRes.json();

  if (existing.length > 0) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/scores_reels?match_id=eq.${matchId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ s1: String(s1), s2: String(s2) })
      }
    );
  } else {
    await fetch(
      `${SUPABASE_URL}/rest/v1/scores_reels`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ match_id: matchId, s1: String(s1), s2: String(s2) })
      }
    );
  }
}

function normalizeTeam(name) {
  if (!name) return '';
  return TEAM_MAP[name.trim()] || name.trim();
}

function findMatch(team1, team2) {
  const t1 = normalizeTeam(team1);
  const t2 = normalizeTeam(team2);
  return MATCHS.find(m =>
    (m.name1 === t1 && m.name2 === t2) ||
    (m.name1 === t2 && m.name2 === t1)
  );
}

// ─────────────────────────────────────────────────────────────────
// FIX #5 : Parser Flashscore robuste — champ par champ
// La regex originale supposait un ordre fixe des champs, ce qui la
// rendait cassante si Flashscore modifiait le format.
// Ici on extrait d'abord chaque bloc de match, puis on parse chaque
// champ individuellement, indépendamment de son ordre.
// ─────────────────────────────────────────────────────────────────
function parseFlashscoreResponse(text) {
  const results = [];

  // Séparer la réponse en blocs de matchs (délimiteur standard Flashscore)
  const blocks = text.split('¬~');

  for (const block of blocks) {
    if (!block.includes('AA÷')) continue;

    // Extraire chaque champ comme une paire clé=valeur
    const fields = {};
    const parts = block.split('¬');
    for (const part of parts) {
      const divider = part.indexOf('÷');
      if (divider === -1) continue;
      const key = part.substring(0, divider);
      const val = part.substring(divider + 1);
      fields[key] = val;
    }

    // On a besoin de : statut (AE), score1 (AF), score2 (AG), équipe1 (AH), équipe2 (AI)
    const status = fields['AE'] || '';
    const score1 = fields['AF'];
    const score2 = fields['AG'];
    const team1  = fields['AH'];
    const team2  = fields['AI'];

    // Vérifications minimales
    if (!team1 || !team2 || score1 === undefined || score2 === undefined) continue;
    if (!['Terminé', 'FT', 'AP', 'AET'].includes(status)) continue;

    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);
    if (isNaN(s1) || isNaN(s2)) continue;

    results.push({ team1, team2, s1, s2 });
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────
// Handler principal (Vercel Serverless Function)
// ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // FIX #4 : Vérification du secret cron via variable d'environnement
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Vérification que les variables d'environnement sont bien définies
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Variables d\'environnement SUPABASE_URL et SUPABASE_KEY manquantes. Les configurer dans Vercel → Settings → Environment Variables.',
    });
  }

  try {
    const response = await fetch(
      'https://www.flashscore.fr/x/req/m_1_219',
      {
        headers: {
          'X-Fsign': 'SW9D1eZo',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
          'Referer': 'https://www.flashscore.fr/',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Flashscore HTTP ${response.status}`);
    }

    const text = await response.text();

    // FIX #5 : Utilisation du parser robuste
    const parsedMatches = parseFlashscoreResponse(text);

    const updated = [];
    const skipped = [];
    const errors  = [];

    for (const { team1, team2, s1, s2 } of parsedMatches) {
      const cdmMatch = findMatch(team1, team2);
      if (!cdmMatch) {
        skipped.push(`${team1} vs ${team2} — non trouvé dans MATCHS`);
        continue;
      }
      try {
        await supabaseUpsert(cdmMatch.id, s1, s2);
        updated.push(`Match ${cdmMatch.id}: ${team1} ${s1}-${s2} ${team2}`);
      } catch (e) {
        errors.push(`Erreur match ${cdmMatch.id}: ${e.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      updated: updated.length,
      matches: updated,
      skipped,
      errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
