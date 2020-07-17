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


/////////////////////////////////////////////////////////
// Change le paramètre de sauvegarde des données en ligne
export async function changeOnlineBackup()
{
  const checkbox = document.getElementById('switch-online-backup');
  if (checkbox.checked)
  {
    checkbox.checked = false;
    document.getElementById('parametres').removeAttribute('data-online-backup');
    await dataStorage.setItem('online-backup', 0);
  }
  else
  {
    checkbox.checked = true;
    document.getElementById('parametres').dataset.onlineBackup = '1';

    // Changement de paramètre détecté ! L'application passe du mode offline au mode online.
    // Il est possible que certaines données locales n'aient pas été envoyées dans la base de données.
    // Plan de remédiation à ce problème (par une requête SYNC au service worker) :
    // --- Dans l'appli ---
    // ✅ Désactiver le switch-online-backup
    checkbox.disabled = true;
    // ✅ Afficher une notification de chargement
    notify('Sauvegarde des données...', '', 'loading', () => {}, 999999999);
    // ✅ Envoyer une requête sync avec tag COMPARE-BACKUP
    const reg = await navigator.serviceWorker.ready;
    console.log('[compare-backup] Activation du backup en ligne demandée au sw');
    try {
      // On demande au service worker de mettre à jour l'appli' et on attend sa réponse
      const chan = new MessageChannel();

      // On contacte le SW
      navigator.serviceWorker.controller.postMessage({ 'action': 'compare-backup' }, [chan.port2]);

      // On se prépare à recevoir la réponse
      await new Promise((resolve, reject) => {
        chan.port1.onmessage = function(event) {
          if (event.data.error) {
            console.error(event.data.error);
            reject('[:(] Erreur de contact du service worker');
          }
          else {
            progressBar.style.setProperty('--progression', 1);
            resolve('[:)] Backup terminé !');
          }
        }
      });
    }
    catch(error) {
      unNotify();
      console.error(error);
      notify('Erreur. Réessayez plus tard.');
      checkbox.disabled = false;
      checkbox.checked = false;
    }
    // ✅ Attendre la réponse du sw
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
  const d = new Date(timestamp * 1000);
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