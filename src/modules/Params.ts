


declare global {
  interface CSSStyleSheet {
    replaceSync: (text: string) => void
  }

  interface Document {
    adoptedStyleSheets: CSSStyleSheet[]
  }

  interface ShadowRoot {
    adoptedStyleSheets: CSSStyleSheet[]
  }
}



//////////////////////
// Constantes globales
export const Params = {
  layoutPC: 960,
  layoutPClarge: 1140,
  layoutPCcomplet: 1600,
  
  easingStandard: 'cubic-bezier(.2, 0, 0, 1)',
  easingDecelerate: 'cubic-bezier(0, 0, 0, 1)',
  easingAccelerate: 'cubic-bezier(.3, 0, 1, 1)',
  easingEmphasizedStandard: 'cubic-bezier(.3, 0, 0, 1)',
  easingEmphasizedDecelerate: 'cubic-bezier(.05, .7, .1, 1)',
  easingEmphasizedAccelerate: 'cubic-bezier(.3, 0, .8, .15)',

  spriteSize: 112,
  defaultLang: 'fr'
};





///////////////////////////////////////
// Charge toutes les images d'une liste
export function loadAllImages(liste: string[]): Promise<number[]> {
  let promises: Promise<number>[] = [];
  liste.forEach((e, k) => {
    promises[k] = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = function() { resolve(k) }
      img.onerror = function() { reject(k) }
      img.src = e;
    });
  });
  return Promise.all(promises);
}


////////////
// Sync wait
export function wait(time: number | Animation): Promise<any> { 
  if (time instanceof Animation) {
    if (time.playState === 'finished') return Promise.resolve();
    return new Promise(resolve => time.addEventListener('finish', resolve));
  } else if (typeof time === 'number') {
    return new Promise(resolve => setTimeout(resolve, time));
  } else {
    return Promise.resolve();
  }
}


/////////////////////////////////
// Convertit un timestamp en date
export function timestamp2date(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toISOString().replace('T', ' ').replace(/\.[0-9]{3}Z/, '');
}


//////////////////////////////////////////////////
// Supprime les accents d'une chaîne de caractères
export function noAccent(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


////////////////////////////////
// Pads a string with leading 0s
export function pad(s: string, long: number): string {
  let chaine = s;
  while (chaine.length < long)
    chaine = `0${chaine}`;
  return chaine;
}


////////////////////////////
// Récupère tous les cookies
export function getCookies(): { [key: string]: string } {
  return Object.fromEntries(document.cookie.split(';').map(e => e.trim().split('=')));
}

/////////////////////////////////
// Récupère un cookie particulier
export function getCookie(name: string): string {
  const cookies = getCookies();
  return cookies[name];
}


//////////////////////////////////////////////////////////
// Promise résolue quand l'appli est prête à être affichée
export const appIsReady = new Promise(resolve => {
  window.addEventListener('appready', resolve);
});