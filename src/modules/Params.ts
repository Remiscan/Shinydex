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
  layoutMedium: 720,
  layoutLarge: 1140,
  currentLayout: 'mobile', // 'mobile', 'medium', 'large'
  
  easingStandard: 'cubic-bezier(.2, 0, 0, 1)',
  easingDecelerate: 'cubic-bezier(0, 0, 0, 1)',
  easingAccelerate: 'cubic-bezier(.3, 0, 1, 1)',
  easingEmphasizedStandard: 'cubic-bezier(.3, 0, 0, 1)',
  easingEmphasizedDecelerate: 'cubic-bezier(.05, .7, .1, 1)',
  easingEmphasizedAccelerate: 'cubic-bezier(.3, 0, .8, .15)',

  spriteSize: 112,
  defaultLang: 'fr',

  codeVerifier: '',

  msPerDay: 1000 * 60 * 60 * 24,
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


/////////////////////////////////////////////////////////
// Calcule le nombre de jours de différence entre 2 dates
export function dateDifference(a: Date, b: Date) {
  const date1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const date2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((date2 - date1) / Params.msPerDay);
}



//////////////////////////////////////////////////
// Supprime les accents d'une chaîne de caractères
export function noAccent(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


/////////////////////////////////////////////////////////////////
// Met en majuscule la première lettre d'une chaîne de caractères
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


////////////////////////////////
// Pads a string with leading 0s
export function pad(s: string, long: number): string {
  let chaine = s;
  while (chaine.length < long)
    chaine = `0${chaine}`;
  return chaine;
}

export function Uint8ArrayToHexString(values: Uint8Array) {
  return Array.from(values)
              .map(values => values.toString(16).padStart(2, '0'))
              .join('');
}

export async function sha256(string: string) {
  const encoder = new TextEncoder();
  const shaValues = await crypto.subtle.digest('SHA-256', encoder.encode(string));
  return Uint8ArrayToHexString(new Uint8Array(shaValues));
}

export function base64UrlEncode(string: string) {
  return btoa(string).replace(/\+/g, '-')
                     .replace(/\//g, '_')
                     .replace(/=+$/, '');
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

/////////////////////////////////////
// Définit la taille du layout actuel
export function setCurrentLayout() {
  const width = window.innerWidth;
  Params.currentLayout = width >= Params.layoutLarge ? 'large' :
                         width >= Params.layoutMedium ? 'medium' :
                         'mobile';
}