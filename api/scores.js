
// Vercel Function — scrape Flashscore et met à jour Supabase
// S'exécute automatiquement toutes les 5 minutes via cron

const SUPABASE_URL = 'https://hqhosgwebucwtqtnlbqg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O1tjA5w5G9jBQni9vA2wZg_NBKEu2jj';

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

// Liste des matchs CDM 2026 avec leurs équipes (pour faire la correspondance)
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
];

async function supabaseUpsert(matchId, s1, s2) {
  // Vérifier si le score existe déjà
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_reels?match_id=eq.${matchId}&select=match_id`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const existing = await checkRes.json();

  if (existing.length > 0) {
    // Mettre à jour
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
    // Insérer
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
  const trimmed = name.trim();
  return TEAM_MAP[trimmed] || trimmed;
}

function findMatch(team1, team2) {
  const t1 = normalizeTeam(team1);
  const t2 = normalizeTeam(team2);
  return MATCHS.find(m =>
    (m.name1 === t1 && m.name2 === t2) ||
    (m.name1 === t2 && m.name2 === t1)
  );
}

export default async function handler(req, res) {
  // Vérification cron secret (sécurité basique)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Scraper Flashscore via leur API non-officielle
    // Flashscore expose ses données via des requêtes XHR
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
    
    // Parser la réponse Flashscore (format propriétaire délimité par ~)
    // Format: ¬~AA÷matchId¬AD÷timestamp¬AE÷status¬AF÷score1¬AG÷score2¬AH÷team1¬AI÷team2
    const updated = [];
    const errors = [];
    
    // Regex pour extraire les matchs terminés (status = Terminé/FT)
    const matchRegex = /AA÷([^¬]+)¬.*?AE÷([^¬]+)¬.*?AF÷(\d+)¬AG÷(\d+)¬.*?AH÷([^¬]+)¬AI÷([^¬]+)/g;
    let match;
    
    while ((match = matchRegex.exec(text)) !== null) {
      const [, flashId, status, score1, score2, team1, team2] = match;
      
      // Ne traiter que les matchs terminés
      if (!['Terminé', 'FT', 'AP', 'AET'].includes(status)) continue;
      
      const cdmMatch = findMatch(team1, team2);
      if (!cdmMatch) continue;
      
      try {
        await supabaseUpsert(cdmMatch.id, parseInt(score1), parseInt(score2));
        updated.push(`Match ${cdmMatch.id}: ${team1} ${score1}-${score2} ${team2}`);
      } catch(e) {
        errors.push(`Erreur match ${cdmMatch.id}: ${e.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      updated: updated.length,
      matches: updated,
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
