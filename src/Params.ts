import { dataStorage } from './localForage.js';
import { Notif } from './notification.js';



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
  
  easingStandard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  easingDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easingAccelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',

  spriteSize: 112,
  preferredImageFormat: <'webp' | 'png'> 'png',

  userUUID: ''
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


////////////////////////////////
// Pads a string with leading 0s
export function pad(s: string, long: number): string {
  let chaine = s;
  while (chaine.length < long)
    chaine = `0${chaine}`;
  return chaine;
}


/////////////////////////////////////////////////////////////////////////
// Vérifie si les images au format webp sont supportées par le navigateur
export async function webpSupport(): Promise<boolean> {
  const features = [
    'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', // lossy
    'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==' // alpha
  ];
  
  const results = await Promise.all(features.map(feature => {
    return new Promise(resolve => {
      const img = new Image();
      
      img.onload = function() {
        const result = (img.width > 0) && (img.height > 0);
        resolve(result);
      }
      
      img.onerror = function() { resolve(false); }
      
      img.src = 'data:image/webp;base64,' + feature;
    });
  }));
  
  return results.every(r => r === true);
}


//////////////////////
// Définition du thème
export async function setTheme(askedTheme?: string) {
  let html = document.documentElement;
  html.dataset.theme = askedTheme || '';

  // Thème par défaut
  const defaultTheme = 'dark';

  // Thème préféré selon l'OS
  let osTheme;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) osTheme = 'dark';
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) osTheme = 'light';

  // Thème appliqué (askedTheme > osTheme > defaultTheme)
  const theme = ['light', 'dark'].includes(askedTheme || '') ? askedTheme : (osTheme || defaultTheme);
  
  let themeColor = (theme == 'dark') ? 'rgb(34, 34, 34)' : 'rgb(224, 224, 224)';
  document.querySelector("meta[name=theme-color]")!.setAttribute('content', themeColor);

  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));

  await dataStorage.ready();
  return await dataStorage.setItem('theme', askedTheme);
}


export async function warnBeforeDestruction(bouton: Element, message: string = 'Supprimer définitivement ces données ?', icon: string = 'delete') {
  bouton.setAttribute('disabled', 'true');
  const warning = `Êtes-vous sûr ? ${message}`;

  const action = () => window.dispatchEvent(new Event('destructionconfirmed'));
  const notification = new Notif(warning, 'Confirmer', icon, 5000, action);

  const userResponse = await notification.prompt();
  bouton.removeAttribute('disabled');

  return userResponse;
}