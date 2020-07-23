import { notify, unNotify } from './mod_notification.js';

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

  owidth: false,
  oheight: false,

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
export const styleSheets = {
  pokesprite: {
    url: './ext/pokesprite.css',
    content: null
  },
  iconsheet: {
    url: './images/iconsheet.css',
    content: null
  },
  pokemonCard: {
    url: './modules/comp_pokemonCard.css',
    content: null
  }
};

async function setStyleSheet(sheet) {
  if (styleSheets[sheet].content == null) {
    try {
      const tempSheet = new CSSStyleSheet();
      let css = await fetch(styleSheets[sheet].url);
      css = await css.text();
      tempSheet.replaceSync(css);
      styleSheets[sheet].content = tempSheet;
    }
    catch(error) {
      console.error(error);
      throw `Erreur de récupération du stylesheet (${sheet})`;
    }
  }
  return styleSheets[sheet].content;
}

// Utiliser uniquement si initStyleSheets() a déjà fini
export function getStyleSheet(sheet) {
  if (styleSheets[sheet].content != null) return styleSheets[sheet].content;
  else throw `Impossible d'utiliser getStyleSheet() avant complétion de setStyleSheet()`;
}

// Initialise les stylesheets
export async function initStyleSheets() {
  return Promise.all(
    Object.keys(styleSheets).map(sheet => setStyleSheet(sheet))
  );
}


///////////////////////////////////////////////////////
// Change le paramètre de vérification des mises à jour
let settingClicked = false;
export async function changeAutoMaj()
{
  const checkbox = document.getElementById('switch-auto-maj');
  if (checkbox.checked)
  {
    checkbox.checked = false;
    await dataStorage.setItem('check-updates', 0);
  }
  else
  {
    checkbox.checked = true;
    await dataStorage.setItem('check-updates', 1);
    /*if (!settingClicked)
    {
      settingClicked = true;
      setTimeout(function() { settingClicked = false }, 100);
      checkUpdate();
    }*/
  }
  return;
}


//////////////////////////////
// Sauvegarde le mdp de la BDD
export async function saveDBpassword()
{
  return await dataStorage.setItem('mdp-bdd', document.getElementById('mdp-bdd').value);
}


//////////////////////////////////////////
// Gère le redimensionnement de la fenêtre
let resizing = false;

export function recalcOnResize() {
  const largeurPage = document.getElementById('largeur-fenetre');
  const hauteurPage = document.getElementById('hauteur-fenetre');

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
export function loadAllImages(liste)
{
  let promises = [];
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
export function wait(time) { return new Promise(resolve => setTimeout(resolve, time)); }


/////////////////////////////////
// Convertit un timestamp en date
export function version2date(timestamp) {
  const d = new Date(timestamp);
  return d.toISOString().replace('T', ' ').replace(/\.[0-9]{3}Z/, '');
}


//////////////////////////////
// Exporte les données en JSON
export async function export2json() {
  const getItems = async store => {
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
  const a = document.createElement('A');
  a.href = dataString;
  await dataStorage.ready();
  a.download = `remidex-${version2date(Date.now() / 1000).replace(' ', '_')}.json`;
  a.style = 'position: absolute; width: 0; height: 0;';
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
  let versionSprite = await cacheActuel.keys();
  versionSprite = versionSprite.map(req => req.url)
                               .filter(url => url.match(Params.spriteRegex))
                               .map(url => Number(url.match(Params.spriteRegex)[1]));
  versionSprite = Math.max(...versionSprite);
  return versionSprite;
}