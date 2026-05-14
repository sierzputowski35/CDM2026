// ════════════════════════════════════════════════════════════
// CDM 2026 — js/data/flags.js
// Table FLAG_CODES : code pays → emoji drapeau
// Extrait de index.html lignes 1306-1331 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ══════════════════════════════════════════
// FLAG SYSTEM
// ══════════════════════════════════════════
const FLAG_CODES = {
  'France':'fr','Brésil':'br','Allemagne':'de','Espagne':'es','Portugal':'pt',
  'Argentine':'ar','Angleterre':'gb-eng','Bosnie-Herzégovine':'ba','Maroc':'ma','Sénégal':'sn',
  'Japon':'jp','États-Unis':'us','Mexique':'mx','Canada':'ca','Australie':'au',
  'Croatie':'hr','Pays-Bas':'nl','Belgique':'be','Uruguay':'uy','Colombie':'co',
  'Ghana':'gh','Cameroun':'cm','Corée du Sud':'kr','Suisse':'ch','Pologne':'pl',
  'Danemark':'dk','Serbie':'rs','Écosse':'gb-sct','Norvège':'no','Haïti':'ht',
  'DR Congo':'cd','Panama':'pa','Équateur':'ec','Paraguay':'py','Afrique du Sud':'za',
  'Algérie':'dz','Arabie saoudite':'sa','Autriche':'at','Cap-Vert':'cv',
  'Côte d\'Ivoire':'ci','Curaçao':'cw','Égypte':'eg','Iran':'ir','Irak':'iq',
  'Jordanie':'jo','Nouvelle-Zélande':'nz','Ouzbékistan':'uz','Qatar':'qa',
  'Suède':'se','Tchéquie':'cz','Tunisie':'tn','Turquie':'tr',
};

function flagHTML(country, size) {
  size = size || 'md';
  const code = FLAG_CODES[country] || 'un';
  const dims = { sm: '40px', md: '52px', lg: '72px' };
  const w = dims[size] || dims.md;
  const h = size === 'lg' ? '48px' : size === 'sm' ? '28px' : '36px';
  return `<div class="flag-wrap flag-${size}" style="width:${w};height:${h}"><img src="https://flagcdn.com/w80/${code}.png" srcset="https://flagcdn.com/w160/${code}.png 2x" alt="${country}" class="flag-img" loading="lazy"><div class="flag-shine"></div><div class="flag-gloss"></div></div>`;
}

