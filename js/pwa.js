// ════════════════════════════════════════════════════════════
// CDM 2026 — js/pwa.js
// Logique d'installation PWA (beforeinstallprompt + service worker)
// Extrait de index.html lignes 5750-5818 (PR #3 refactor JS)
// ════════════════════════════════════════════════════════════

// ══ PWA INSTALL ══
let deferredPrompt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = /android/i.test(navigator.userAgent);
const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

function initPWA() {
  if (isInStandalone) return; // Déjà installée
  const dismissed = localStorage.getItem('pwa-dismissed');
  if (dismissed) return;

  if (isIOS) {
    // iPhone — on affiche après 2 secondes
    setTimeout(() => {
      document.getElementById('pwa-sub').textContent = "Ouvre-la comme une vraie app sur ton iPhone";
      document.getElementById('pwa-install-btn').textContent = "Voir comment";
      const pwaBanner=document.getElementById('pwa-banner');if(pwaBanner)pwaBanner.classList.remove('hidden');
    }, 2000);
  } else {
    // Android / Desktop — attendre l'event beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const pwaSub=document.getElementById('pwa-sub'); if(pwaSub) pwaSub.textContent = isAndroid ? "Ajoute-la sur ton écran d'accueil Android" : "Installe-la sur ton ordinateur";
      setTimeout(() => {
        const b=document.getElementById('pwa-banner');if(b)b.classList.remove('hidden');
      }, 2000);
    });
    // Si déjà installée sur Android
    window.addEventListener('appinstalled', () => {
      closePwaBanner();
      deferredPrompt = null;
    });
  }
}

function handleInstall() {
  if (isIOS) {
    const pwam=document.getElementById('pwa-modal');if(pwam)pwam.classList.remove('hidden');
  } else if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      closePwaBanner();
    });
  }
}

function closePwaBanner() {
  const pwab=document.getElementById('pwa-banner');if(pwab)pwab.classList.add('hidden');
  localStorage.setItem('pwa-dismissed', '1');
}

function closePwaModal() {
  const pwam2=document.getElementById('pwa-modal');if(pwam2)pwam2.classList.add('hidden');
  closePwaBanner();
}

initPWA();

// NB : l'appel init() (bootstrap de l'app) qui était placé ici dans le
// code original a été déplacé à la fin du <script> inline d'index.html
// pour qu'il s'exécute APRÈS la définition de la fonction init.

// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

