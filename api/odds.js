// api/odds.js
// Vercel Serverless Function — Sync côtes The Odds API → Supabase
// Cron : toutes les 4 heures (configuré dans vercel.json)

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Mapping nom équipe CDM 2026 → variantes possibles dans The Odds API
const TEAM_ALIASES = {
  'États-Unis':       ['United States', 'USA', 'US'],
  'Corée du Sud':     ['South Korea', 'Korea Republic'],
  "Côte d'Ivoire":    ['Ivory Coast', "Cote d'Ivoire"],
  'Arabie saoudite':  ['Saudi Arabia'],
  'Écosse':           ['Scotland'],
  'Équateur':         ['Ecuador'],
  'Nouvelle-Zélande': ['New Zealand'],
  'Pays-Bas':         ['Netherlands'],
  'Afrique du Sud':   ['South Africa'],
  'Allemagne':        ['Germany'],
  'Brésil':           ['Brazil'],
  'Espagne':          ['Spain'],
  'France':           ['France'],
  'Argentine':        ['Argentina'],
  'Portugal':         ['Portugal'],
  'Angleterre':       ['England'],
  'Belgique':         ['Belgium'],
  'Croatie':          ['Croatia'],
  'Maroc':            ['Morocco'],
  'Sénégal':          ['Senegal'],
  'Tunisie':          ['Tunisia'],
  'Algérie':          ['Algeria'],
  'Égypte':           ['Egypt'],
  'Autriche':         ['Austria'],
  'Suisse':           ['Switzerland'],
  'Turquie':          ['Turkey', 'Türkiye'],
  'Norvège':          ['Norway'],
  'Suède':            ['Sweden'],
  'Japon':            ['Japan'],
  'Australie':        ['Australia'],
  'Colombie':         ['Colombia'],
  'Ouzbékistan':      ['Uzbekistan'],
  'Bolivie':          ['Bolivia'],
  'Irak':             ['Iraq'],
  'Jordanie':         ['Jordan'],
  'Cap-Vert':         ['Cape Verde'],
  'Tchéquie':         ['Czech Republic', 'Czechia'],
};

function normalizeTeam(name) {
  const lower = name.toLowerCase().trim();
  for (const [cdmName, aliases] of Object.entries(TEAM_ALIASES)) {
    if (aliases.some(a => a.toLowerCase() === lower)) return cdmName;
  }
  return name;
}

export default async function handler(req, res) {
  // Vérification du secret cron
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.ODDS_API_KEY) {
    return res.status(500).json({ error: 'ODDS_API_KEY manquante' });
  }

  try {
    // Appel The Odds API — 1 requête = tous les matchs CDM restants
    const oddsRes = await fetch(
      'https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/' +
      '?apiKey=' + process.env.ODDS_API_KEY +
      '&regions=eu' +
      '&markets=h2h' +
      '&oddsFormat=decimal' +
      '&bookmakers=bet365,unibet,pinnacle'
    );

    if (!oddsRes.ok) {
      const errText = await oddsRes.text();
      console.error('Odds API error:', oddsRes.status, errText);
      return res.status(502).json({ error: 'Odds API unavailable', detail: errText });
    }

    const oddsData = await oddsRes.json();
    const remaining = oddsRes.headers.get('x-requests-remaining');
    console.log(`Odds API — requêtes restantes ce mois : ${remaining}`);

    if (!Array.isArray(oddsData) || oddsData.length === 0) {
      return res.json({ ok: true, updated: 0, message: 'Aucun match CDM disponible' });
    }

    const upserts = [];

    for (const event of oddsData) {
      const homeNorm = normalizeTeam(event.home_team);
      const awayNorm = normalizeTeam(event.away_team);

      let sumHome = 0, sumDraw = 0, sumAway = 0, count = 0;

      for (const bookmaker of (event.bookmakers || [])) {
        const h2h = bookmaker.markets?.find(m => m.key === 'h2h');
        if (!h2h) continue;

        const home = h2h.outcomes?.find(o => o.name === event.home_team)?.price;
        const away = h2h.outcomes?.find(o => o.name === event.away_team)?.price;
        const draw = h2h.outcomes?.find(o => o.name === 'Draw')?.price;

        if (home && away && draw) {
          sumHome += home;
          sumDraw += draw;
          sumAway += away;
          count++;
        }
      }

      if (count === 0) continue;

      const cote1 = Math.round((sumHome / count) * 100) / 100;
      const coteN = Math.round((sumDraw / count) * 100) / 100;
      const cote2 = Math.round((sumAway / count) * 100) / 100;

      upserts.push({
        home_team: homeNorm,
        away_team: awayNorm,
        cote1,
        coteN,
        cote2,
        source: 'the-odds-api',
        updated_at: new Date().toISOString(),
      });
    }

    if (upserts.length > 0) {
      const { error } = await sb
        .from('cotes_raw')
        .upsert(upserts, { onConflict: 'home_team,away_team' });

      if (error) {
        console.error('Supabase upsert error:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    return res.json({
      ok: true,
      updated: upserts.length,
      remaining,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
