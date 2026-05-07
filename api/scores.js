const SUPABASE_URL = 'https://hqhosgwebucwtqtnlbqg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O1tjA5w5G9jBQni9vA2wZg_NBKEu2jj';

const TEAM_MAP = {
  'Mexico': 'Mexique', 'Mexique': 'Mexique',
  'South Africa': 'Afrique du Sud', 'Afrique du Sud': 'Afrique du Sud',
  'South Korea': 'Corée du Sud', 'Korea Republic': 'Corée du Sud', 'Corée du Sud': 'Corée du Sud',
  'Czech Republic': 'Tchéquie', 'Czechia': 'Tchéquie', 'Tchéquie': 'Tchéquie',
  'Canada': 'Canada', 'Italy': 'Italie', 'Italie': 'Italie',
  'Switzerland': 'Suisse', 'Suisse': 'Suisse', 'Qatar': 'Qatar',
  'Brazil': 'Brésil', 'Brésil': 'Brésil',
  'Morocco': 'Maroc', 'Maroc': 'Maroc',
  'Scotland': 'Écosse', 'Écosse': 'Écosse',
  'Haiti': 'Haïti', 'Haïti': 'Haïti',
  'USA': 'États-Unis', 'United States': 'États-Unis', 'États-Unis': 'États-Unis',
  'Paraguay': 'Paraguay', 'Australia': 'Australie', 'Australie': 'Australie',
  'Turkey': 'Turquie', 'Türkiye': 'Turquie', 'Turquie': 'Turquie',
  'Germany': 'Allemagne', 'Allemagne': 'Allemagne',
  "Ivory Coast": "Côte d'Ivoire", "Côte d'Ivoire": "Côte d'Ivoire",
  'Ecuador': 'Équateur', 'Équateur': 'Équateur',
  'Curacao': 'Curaçao', 'Curaçao': 'Curaçao',
  'Netherlands': 'Pays-Bas', 'Pays-Bas': 'Pays-Bas',
  'Japan': 'Japon', 'Japon': 'Japon',
  'Sweden': 'Suède', 'Suède': 'Suède',
  'Tunisia': 'Tunisie', 'Tunisie': 'Tunisie',
  'Belgium': 'Belgique', 'Belgique': 'Belgique',
  'Egypt': 'Égypte', 'Égypte': 'Égypte',
  'Iran': 'Iran', 'New Zealand': 'Nouvelle-Zélande', 'Nouvelle-Zélande': 'Nouvelle-Zélande',
  'Spain': 'Espagne', 'Espagne': 'Espagne',
  'Cape Verde': 'Cap-Vert', 'Cap-Vert': 'Cap-Vert',
  'Saudi Arabia': 'Arabie saoudite', 'Arabie saoudite': 'Arabie saoudite',
  'Uruguay': 'Uruguay', 'France': 'France',
  'Senegal': 'Sénégal', 'Sénégal': 'Sénégal',
  'Norway': 'Norvège', 'Norvège': 'Norvège',
  'Bolivia': 'Bolivie', 'Bolivie': 'Bolivie',
  'Argentina': 'Argentine', 'Argentine': 'Argentine',
  'Algeria': 'Algérie', 'Algérie': 'Algérie',
  'Austria': 'Autriche', 'Autriche': 'Autriche',
  'Jordan': 'Jordanie', 'Jordanie': 'Jordanie',
  'Portugal': 'Portugal', 'Colombia': 'Colombie', 'Colombie': 'Colombie',
  'Uzbekistan': 'Ouzbékistan', 'Ouzbékistan': 'Ouzbékistan',
  'Iraq': 'Irak', 'Irak': 'Irak',
  'England': 'Angleterre', 'Angleterre': 'Angleterre',
  'Croatia': 'Croatie', 'Croatie': 'Croatie',
  'Ghana': 'Ghana', 'Panama': 'Panama',
};

const MATCHS = [
  {id:1,n1:'Mexique',n2:'Afrique du Sud'},{id:2,n1:'Corée du Sud',n2:'Tchéquie'},
  {id:3,n1:'Mexique',n2:'Corée du Sud'},{id:4,n1:'Afrique du Sud',n2:'Tchéquie'},
  {id:5,n1:'Mexique',n2:'Tchéquie'},{id:6,n1:'Afrique du Sud',n2:'Corée du Sud'},
  {id:7,n1:'Canada',n2:'Italie'},{id:8,n1:'Canada',n2:'Qatar'},
  {id:9,n1:'Italie',n2:'Suisse'},{id:10,n1:'Suisse',n2:'Qatar'},
  {id:11,n1:'Canada',n2:'Suisse'},{id:12,n1:'Italie',n2:'Qatar'},
  {id:13,n1:'Brésil',n2:'Maroc'},{id:14,n1:'Écosse',n2:'Haïti'},
  {id:15,n1:'Brésil',n2:'Écosse'},{id:16,n1:'Maroc',n2:'Haïti'},
  {id:17,n1:'Brésil',n2:'Haïti'},{id:18,n1:'Écosse',n2:'Maroc'},
  {id:19,n1:'États-Unis',n2:'Paraguay'},{id:20,n1:'Australie',n2:'Turquie'},
  {id:21,n1:'États-Unis',n2:'Australie'},{id:22,n1:'Paraguay',n2:'Turquie'},
  {id:23,n1:'États-Unis',n2:'Turquie'},{id:24,n1:'Australie',n2:'Paraguay'},
  {id:25,n1:'Allemagne',n2:"Côte d'Ivoire"},{id:26,n1:'Équateur',n2:'Curaçao'},
  {id:27,n1:'Allemagne',n2:'Curaçao'},{id:28,n1:"Côte d'Ivoire",n2:'Équateur'},
  {id:29,n1:'Allemagne',n2:'Équateur'},{id:30,n1:'Curaçao',n2:"Côte d'Ivoire"},
  {id:31,n1:'Pays-Bas',n2:'Japon'},{id:32,n1:'Suède',n2:'Tunisie'},
  {id:33,n1:'Pays-Bas',n2:'Suède'},{id:34,n1:'Japon',n2:'Tunisie'},
  {id:35,n1:'Pays-Bas',n2:'Tunisie'},{id:36,n1:'Suède',n2:'Japon'},
  {id:37,n1:'Belgique',n2:'Égypte'},{id:38,n1:'Iran',n2:'Nouvelle-Zélande'},
  {id:39,n1:'Belgique',n2:'Iran'},{id:40,n1:'Égypte',n2:'Nouvelle-Zélande'},
  {id:41,n1:'Belgique',n2:'Nouvelle-Zélande'},{id:42,n1:'Iran',n2:'Égypte'},
  {id:43,n1:'Espagne',n2:'Cap-Vert'},{id:44,n1:'Arabie saoudite',n2:'Uruguay'},
  {id:45,n1:'Espagne',n2:'Arabie saoudite'},{id:46,n1:'Cap-Vert',n2:'Uruguay'},
  {id:47,n1:'Espagne',n2:'Uruguay'},{id:48,n1:'Arabie saoudite',n2:'Cap-Vert'},
  {id:49,n1:'France',n2:'Sénégal'},{id:50,n1:'Norvège',n2:'Bolivie'},
  {id:51,n1:'France',n2:'Norvège'},{id:52,n1:'Sénégal',n2:'Bolivie'},
  {id:53,n1:'France',n2:'Bolivie'},{id:54,n1:'Norvège',n2:'Sénégal'},
  {id:55,n1:'Argentine',n2:'Algérie'},{id:56,n1:'Autriche',n2:'Jordanie'},
  {id:57,n1:'Argentine',n2:'Autriche'},{id:58,n1:'Algérie',n2:'Jordanie'},
  {id:59,n1:'Argentine',n2:'Jordanie'},{id:60,n1:'Autriche',n2:'Algérie'},
  {id:61,n1:'Portugal',n2:'Colombie'},{id:62,n1:'Ouzbékistan',n2:'Irak'},
  {id:63,n1:'Portugal',n2:'Ouzbékistan'},{id:64,n1:'Colombie',n2:'Irak'},
  {id:65,n1:'Portugal',n2:'Irak'},{id:66,n1:'Colombie',n2:'Ouzbékistan'},
  {id:67,n1:'Angleterre',n2:'Croatie'},{id:68,n1:'Ghana',n2:'Panama'},
  {id:69,n1:'Angleterre',n2:'Ghana'},{id:70,n1:'Croatie',n2:'Panama'},
  {id:71,n1:'Angleterre',n2:'Panama'},{id:72,n1:'Ghana',n2:'Croatie'},
];

function normalize(name) {
  return TEAM_MAP[name ? name.trim() : ''] || (name ? name.trim() : '');
}

function findMatch(t1, t2) {
  const a = normalize(t1), b = normalize(t2);
  return MATCHS.find(m => (m.n1===a && m.n2===b) || (m.n1===b && m.n2===a));
}

async function upsertScore(id, s1, s2) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal'
  };
  await fetch(`${SUPABASE_URL}/rest/v1/scores_reels`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ match_id: id, s1: String(s1), s2: String(s2) })
  });
}

module.exports = async function handler(req, res) {
  try {
    // Scraper l'API non-officielle de Flashscore
    const r = await fetch('https://d.flashscore.com/x/feed/f_2_219_2_en_1', {
      headers: {
        'X-Fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.flashscore.fr/',
        'Accept': '*/*',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    });

    if (!r.ok) {
      return res.status(200).json({ success: false, error: `HTTP ${r.status}`, timestamp: new Date().toISOString() });
    }

    const text = await r.text();
    const updated = [];

    // Format Flashscore: segments séparés par ¬
    // Chercher les matchs terminés avec scores
    // Pattern: ~AA÷ID¬...¬DC÷FT¬...¬DE÷SCORE1¬DF÷SCORE2¬...¬WU÷TEAM1¬WV÷TEAM2
    const segments = text.split('~AA÷');
    
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      
      // Statut du match (FT = terminé, AET = après prolongations, AP = après penalties)
      const statusMatch = seg.match(/DC÷([^¬]+)/);
      if (!statusMatch) continue;
      const status = statusMatch[1];
      if (!['FT', 'AET', 'AP', 'Finished'].includes(status)) continue;
      
      // Scores
      const s1Match = seg.match(/DE÷(\d+)/);
      const s2Match = seg.match(/DF÷(\d+)/);
      if (!s1Match || !s2Match) continue;
      
      // Équipes
      const t1Match = seg.match(/WU÷([^¬]+)/);
      const t2Match = seg.match(/WV÷([^¬]+)/);
      if (!t1Match || !t2Match) continue;
      
      const match = findMatch(t1Match[1], t2Match[1]);
      if (!match) continue;
      
      await upsertScore(match.id, parseInt(s1Match[1]), parseInt(s2Match[1]));
      updated.push(`[${match.id}] ${t1Match[1]} ${s1Match[1]}-${s2Match[1]} ${t2Match[1]}`);
    }

    return res.status(200).json({
      success: true,
      updated: updated.length,
      matches: updated,
      raw_length: text.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(200).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};
