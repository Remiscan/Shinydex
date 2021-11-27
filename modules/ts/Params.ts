import { dataStorage, shinyStorage, huntStorage, localForageAPI } from './localforage.js';


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
  spriteRegex: /sprites--(.+).php/,

  owidth: 0,
  oheight: 0,

  nombreADefer: {
    'mes-chromatiques': () => { return Math.ceil((Params.oheight ? Params.oheight : 0) / 126); },
    'pokedex': () => { 
      const iconWidth = 68 + 2 * (-2);
      const availWidth = Params.owidth - 2 * 8;
      const iconHeight = 56;
      const availHeight = Params.oheight - 56 - 5;
      const iconsPerRow = Math.floor(availWidth / iconWidth);
      const iconsPerCol = Math.floor(availHeight / iconHeight);
      const iconsPerScreen = iconsPerRow * iconsPerCol;
      const generationEnds = [151, 251, 386, 493, 649, 721, 809, 890];
      let visibleGens = 1;
      for (let gen of generationEnds) {
        if (gen < iconsPerScreen) visibleGens++;
      }
      return visibleGens;
    },
    'chasses-en-cours': () => { return Math.ceil((Params.oheight ? Params.oheight : 0) / 318); }
  }
};


/////////////////////////////////////////////////////////////////////
// Charge les CSS stylesheets à faire adopter par des éléments custom
type styleSheet = {
  url: string,
  content: string | null,
};

export const styleSheets: Map<string, { url: string, content: CSSStyleSheet | null }> = new Map([
  ['materialIcons', {
    url: './ext/material_icons.css',
    content: null
  }],
  ['pokesprite', {
    url: './ext/pokesprite.css',
    content: null
  }],
  ['iconsheet', {
    url: './images/iconsheet.css',
    content: null
  }]
]);

async function setStyleSheet(sheetId: string): Promise<CSSStyleSheet | null> {
  const sheet = styleSheets.get(sheetId);
  if (typeof sheet === 'undefined') throw 'Undefined stylesheet';
  if (sheet.content == null) {
    try {
      const tempSheet = new CSSStyleSheet();
      
      let css = await (await fetch(sheet.url)).text();
      tempSheet.replaceSync(css);
      sheet.content = tempSheet;
    }
    catch(error) {
      console.error(error);
      throw `Erreur de récupération du stylesheet (${sheet})`;
    }
  }
  return sheet.content;
}

// Utiliser uniquement si initStyleSheets() a déjà fini
export function getStyleSheet(sheetId: string): CSSStyleSheet {
  const sheet = styleSheets.get(sheetId);
  if (typeof sheet !== 'undefined' && sheet.content != null) return sheet.content;
  else throw `Impossible d'utiliser getStyleSheet() avant complétion de setStyleSheet()`;
}

// Initialise les stylesheets
export async function initStyleSheets() {
  if ('adoptedStyleSheets' in document)
    return Promise.all( Object.keys(styleSheets).map(sheet => setStyleSheet(sheet)) );
  else
    return;
}

// Insère les stylesheets dans le contexte demandé
export function adoptStyleSheets(context = document, sheetids = Object.keys(styleSheets), destination = document.head) {
  if ('adoptedStyleSheets' in context)
    context.adoptedStyleSheets = [...context.adoptedStyleSheets, ...sheetids.map(sheet => getStyleSheet(sheet))];
  else {
    const style = document.createElement('style');
    style.id = `adopted-stylesheets`;
    for (const sheetid of sheetids) {
      const sheet = styleSheets.get(sheetid);
      if (sheet != null) style.appendChild(document.createTextNode(`@import url('${sheet.url}');`));
    }
    destination.appendChild(style);
  }
}


///////////////////////////////////////////////////////
// Change le paramètre de vérification des mises à jour
export async function changeAutoMaj() {
  const checkbox = document.getElementById('switch-auto-maj') as HTMLInputElement;
  if (checkbox.checked) {
    checkbox.checked = false;
    await dataStorage.setItem('check-updates', 0);
  } else {
    checkbox.checked = true;
    await dataStorage.setItem('check-updates', 1);
  }
  return;
}


//////////////////////////////////////////
// Gère le redimensionnement de la fenêtre
let resizing = 0;

export function recalcOnResize() {
  const largeurPage = document.getElementById('largeur-fenetre') as HTMLElement;
  const hauteurPage = document.getElementById('hauteur-fenetre') as HTMLElement;

  // owidth = 100vw = largeur totale de la fenêtre, indépendamment de l'affichage ou non des barres de défilement
  const candidWidth = Number(window.getComputedStyle(largeurPage).width.replace('px', ''));
  if (Params.owidth != candidWidth)
    Params.owidth = candidWidth;

  // oheight = 100vh = hauteur totale de la fenêtre, indépendamment de l'affichage ou non de la barre d'URL (au moins pour Chrome)
  //   diffère de window.innerHeight qui dépend de la barre d'URL (et donc change tout le temps => problématique)
  const candidHeight = Number(window.getComputedStyle(hauteurPage).height.replace('px', ''));
  if (Params.oheight != candidHeight)
    Params.oheight = candidHeight;
}

// On détecte le redimensionnement
export function callResize() {
  clearTimeout(resizing);
  resizing = setTimeout(recalcOnResize, 100);
}


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
export function wait(time: number) { return new Promise(resolve => setTimeout(resolve, time)); }


/////////////////////////////////
// Convertit un timestamp en date
export function version2date(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toISOString().replace('T', ' ').replace(/\.[0-9]{3}Z/, '');
}


//////////////////////////////
// Exporte les données en JSON
export async function export2json() {
  const getItems = async (store: localForageAPI) => {
    await store.ready();
    const keys = await store.keys();
    const items = [];
    for (const key of keys) {
      items.push(await store.getItem(key));
    }
    return items;
  }
  const data = { shiny: await getItems(shinyStorage), hunts: await getItems(huntStorage) };
  const dataString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
  const a = document.createElement('A') as HTMLAnchorElement;
  a.href = dataString;
  await dataStorage.ready();
  a.download = `remidex-${version2date(Date.now() / 1000).replace(' ', '_')}.json`;
  a.setAttribute('style', 'position: absolute; width: 0; height: 0;');
  document.body.appendChild(a);
  a.click();
  a.remove();
}


////////////////////////////////////////////
// Récupère la version du spritesheet actuel
export async function getVersionSprite() {
  await dataStorage.ready();
  const versionFichiers = await dataStorage.getItem('version-fichiers');
  const cacheActuel = await caches.open(`remidex-sw-${versionFichiers}`);
  const versionsSprites = (await cacheActuel.keys()).map(req => req.url)
                                                    .filter(url => url.match(Params.spriteRegex))
                                                    .map(url => Number(url.match(Params.spriteRegex)?.[1]));
  return Math.max(...versionsSprites);
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