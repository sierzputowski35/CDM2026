// ════════════════════════════════════════════════════════════
// CDM 2026 — js/badge-unlock.js
// TÂCHE 8 — Animation d'overlay au déblocage d'un badge
// Extrait de index.html lignes 6035-6088 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ══ TÂCHE 8 — BADGE UNLOCK ══
function showBadgeUnlock(emoji, name) {
  const overlay = document.getElementById('badge-unlock-overlay');
  const icon = document.getElementById('badge-unlock-icon');
  const nameEl = document.getElementById('badge-unlock-name');
  icon.textContent = emoji;
  nameEl.textContent = name;
  // Replay animation by forcing reflow
  icon.style.animation = 'none'; icon.offsetHeight; icon.style.animation = '';
  nameEl.style.animation = 'none'; nameEl.offsetHeight; nameEl.style.animation = '';
  overlay.classList.remove('hidden');
  if(navigator.vibrate) navigator.vibrate([100,50,100,50,200]);
  // PR #8 (Sprint 3) — particules dorées canvas pendant ~2s
  if (window.Juice) Juice.badgeParticles(overlay);
  setTimeout(closeBadgeUnlock, 4000);
}
function closeBadgeUnlock() {
  document.getElementById('badge-unlock-overlay')?.classList.add('hidden');
}

function calcPlayerStats(joueur){
  let pts=0,exact=0,bonDiff=0,bonVainqueur=0,rate=0,total=0;
  const prog=joueur.pronostics||{};
  for(const m of MATCHS){
    const real=allScores[m.id];if(!real)continue;
    const p=prog[m.id];total++;
    if(!p){rate++;continue;}
    const p1=parseInt(p.s1),p2=parseInt(p.s2),r1=parseInt(real.s1),r2=parseInt(real.s2);
    if(isNaN(p1)||isNaN(p2)){rate++;continue;}
    const pts_m=computeMatchPts(m,p,real);
    if(pts_m!==null)pts+=pts_m;
    if(p1===r1&&p2===r2){exact++;}
    else{
      const rw=r1>r2?1:r1<r2?2:0,pw=p1>p2?1:p1<p2?2:0;
      if(rw!==pw){rate++;}
      else if(r1-r2===p1-p2){bonDiff++;}
      else{bonVainqueur++;}
    }
  }
  const glob=joueur.globaux||{};
  for(const g of GLOBAUX_DEF){
    const real=allGlobaux[g.id];if(!real)continue;
    const val=glob[g.id];if(!val)continue;
    if(val.trim().toLowerCase()===real.trim().toLowerCase()){
      if(g.id==='vainqueur')pts+=15;
      else if(g.id==='finaliste')pts+=10;
      else if(g.id==='troisieme')pts+=8;
      else if(g.liste){const item=g.liste.find(x=>x.nom.toLowerCase()===val.trim().toLowerCase());pts+=(item?item.pts:10);}
      else if(g.type==='equipe'){const e=EQUIPES.find(x=>x.nom.toLowerCase()===val.trim().toLowerCase());pts+=(e?e.pts:10);}
      else pts+=10;
    }
  }
  return{pts,exact,bonDiff,bonVainqueur,rate,total};
}


