import { appDisplay, appPopulate } from './appContent.js';
import { appStart, changeAutoMaj, checkUpdate, manualUpdate, setOnlineBackup, startBackup } from './appLifeCycle.js';
import './components/load-spinner/loadSpinner.js';
import './components/pokemon-card/pokemonCard.js';
import './components/sync-progress/syncProgress.js';
import { DexDatalist } from './DexDatalist.js';
import { export2json, json2import } from './exportToJSON.js';
import { initFiltres, openFiltres } from './filtres.js';
import { Hunt } from './Hunt.js';
import { dataStorage, huntStorage, shinyStorage } from './localforage.js';
import { navigate, sectionActuelle } from './navigate.js';
import { Notif } from './notification.js';
import { setTheme, wait, warnBeforeDestruction } from './Params.js';
import { initSpriteViewer } from './spriteViewer.js';



//////////////
// NAVIGATION

// Active les liens de navigation
for (const link of Array.from(document.querySelectorAll('[data-section]')) as HTMLElement[]) {
  link.addEventListener('click', () => navigate(link.dataset.section || ''));
}

// Active le bouton retour / fermer
for (const bouton of Array.from(document.querySelectorAll('.bouton-retour')) as HTMLButtonElement[]) {
  bouton.addEventListener('click', () => history.back());
}



///////////////////////////////////
// FAB (filtres et nouvelle chasse)

// Active le FAB
document.querySelector('.fab')!.addEventListener('click', () => {
  // Filtres
  if (['mes-chromatiques', 'pokedex'].includes(sectionActuelle)) openFiltres();
  // Nouvelle chasse
  else if (sectionActuelle == 'chasses-en-cours') Hunt.build();
});

// L'obfuscator ramène en arrière quand on clique dessus
document.querySelector('.obfuscator')!.addEventListener('click', () => history.back());

// Surveille le champ de filtrage par espèce de Pokémon
{
  const input = document.querySelector('.menu-filtres')!.querySelector('[list="datalist-pokedex"]') as HTMLInputElement;
  input.addEventListener('input', async () => {
    DexDatalist.build(input.value);
  });
}



/////////////
// PARAMÈTRES

// Applique le paramètre sauvegardé au switch du thème
dataStorage.getItem('theme').then((theme?: string) => {
  const storedTheme = theme || 'system';
  const input = document.getElementById(`theme-${storedTheme}`) as HTMLInputElement;
  input.checked = true;
});

// Détecte le changement de paramètre de thème
for (const input of Array.from(document.querySelectorAll('input[name=theme]')) as HTMLInputElement[]) {
  input.addEventListener('change', () => setTheme(input.value));
}

// Applique le paramètre sauvegardé au switch des mises à jour auto
dataStorage.getItem('check-updates').then((value: boolean) => {
  const box = document.getElementById('switch-auto-maj') as HTMLInputElement;
  if (value === true) box.checked = true;
  else                box.checked = false;
});

// Détecte le changemet de paramètre de détection automatique des mises à jour
{
  const input = document.getElementById('switch-auto-maj')! as HTMLInputElement;
  input.addEventListener('change', () => changeAutoMaj(input.checked));
}

// Applique le paramètre sauvegardé au switch de la sauvegarde en ligne
dataStorage.getItem('online-backup').then((value: boolean) => {
  const box = document.getElementById('switch-online-backup')! as HTMLInputElement;
  if (value === true) {
    box.checked = true;
    document.getElementById('parametres')!.dataset.onlineBackup = '1';
  } else {
    box.checked = false;
  }
});

// Détecte le changement de paramètre de la sauvegarde en ligne
{
  const input = document.getElementById('switch-online-backup')! as HTMLInputElement;
  input.addEventListener('change', () => setOnlineBackup(input.checked));
}

// Applique l'info sauvegardée au badge indiquant le succès / échec de la dernière synchronisation des BDD
dataStorage.getItem('last-sync').then((value?: string) => {
  const params = document.querySelector('#parametres')! as HTMLElement;
  if (value === 'success') params.dataset.lastSync = 'success';
  else                     params.dataset.lastSync = 'failure';
});

// Détecte le clic sur l'état du dernier backup pour en lancer un nouveau
(document.querySelector('.info-backup.failure') as HTMLButtonElement).onclick = startBackup;
(document.querySelector('.info-backup.success') as HTMLButtonElement).onclick = startBackup;

// Détecte le clic (court ou long) sur le bouton de recherche de mise à jour
{
  let longClic: number | undefined;
  let needCheck = 1;
  const majButton = document.querySelector('.bouton-recherche-maj')!;

  for (const startEvent of ['mousedown', 'touchstart']) {
    let endEvent: string, cancelEvent: string;
    switch (startEvent) {
      case 'touchstart': endEvent = 'touchend'; cancelEvent = 'touchcancel';
      default:           endEvent = 'mouseup';  cancelEvent = 'mouseout';
    }

    majButton.addEventListener(startEvent, (event: Event) => {
      if (startEvent === 'mousedown' && (event as MouseEvent).button != 0) return;
      event.preventDefault();
      clearTimeout(longClic);
      longClic = setTimeout(() => { needCheck = 0; manualUpdate(); }, 3000);
  
      majButton.addEventListener(endEvent, () => { clearTimeout(longClic); if (needCheck) checkUpdate(true); });
      majButton.addEventListener(cancelEvent, () => clearTimeout(longClic));
    });
  }
}

// Détecte le clic sur le bouton d'export des données
document.querySelector('.bouton-export')!.addEventListener('click', () => {
  try {
    export2json();
  } catch (error) {
    const message = `Erreur pendant l'export' des données.`;
    console.error(message, error);
    new Notif(message).prompt();
  }
});

// Détecte le choix d'un fichier JSON d'import de données
const importInput = document.getElementById('pick-import-file') as HTMLInputElement;
importInput.addEventListener('change', async event => {
  try {
    await json2import(importInput.files?.[0]);
  } catch (message) {
    console.error(message);
    if (typeof message === 'string') new Notif(message).prompt();
  }
});

// Détecte le clic sur le bouton de suppression des données locales
const boutonSupprimer = document.querySelector('.bouton-supprimer-local')! as HTMLButtonElement;
boutonSupprimer.addEventListener('click', async event => {
  event.preventDefault();

  const userResponse = await warnBeforeDestruction(boutonSupprimer);
  if (userResponse) {
    boutonSupprimer.disabled = true;
    boutonSupprimer.innerHTML = 'Supprimer';

    const notification = new Notif('Suppression des données...', '', 'loading', Notif.maxDelay, () => {});
    notification.prompt();

    await Promise.all([shinyStorage.clear(), huntStorage.clear()]);
    await appPopulate(false);
    await appDisplay(false);
    await wait(1000);

    notification.hide();
    boutonSupprimer.disabled = false;
  }
});



// Initialise les filtres
initFiltres();

// Initialise le sprite-viewer
initSpriteViewer();



///////////////////////////////////////
// COMMUNICATION AVEC LE SERVICE WORKER
navigator.serviceWorker.addEventListener('message', async event => {
  // --- Réponse à HUNT-ADD-id, HUNT-EDIT-id ou HUNT-REMOVE-id ---
  if ('successfulDBUpdate' in event.data) {
    const huntid = event.data.huntid;
    const card = document.getElementById('hunt-' + huntid)!;

    if (event.data.successfulDBUpdate === true) {
      // On reçoit la confirmation du succès de l'ajout à la DB

      // La façon dont l'appli gère cette réponse dépend du moment où la confirmation est reçue.
      // 1️⃣ Si on reçoit la confirmation de suite après avoir contacté le sw (test = ❔)
      //// ✅ Visuellement, la chasse est en cours de "chargement" (data-loaded a été set par submitHunt)
      //// - ✅ On supprime la chasse de uploaded-hunts (liste des chasses à supprimer au prochain démarrage)
      //// - ✅ On supprime la chasse de huntStorage
      //// - ✅ On supprime la carte de la chasse
      //// - ✅ On met à jour le contenu de l'appli (et on notifie)
      // 2️⃣ Si on reçoit la confirmation pendant une prochaine visite (test = ❔)
      //// ✅ Visuellement, la chasse est en cours de chargement (car initialisée avec this.uploaded)
      //// ✅ On reproduit l'étape 1
      // 3️⃣ Si on reçoit la confirmation après avoir fermé l'application (test = ❔)
      //// - ✅ La chasse ne sera pas initialisée au prochain lancement (car elle est dans uploaded-hunts)
      //// - ✅ Les nouvelles données seront chargées au prochain lancement (car mises à jour dans la DB par le sw) - pas de notif

      // ✅ faire disparaître la carte de la chasse
      let uploadConfirmed = await dataStorage.getItem('uploaded-hunts');
      if (uploadConfirmed == null) uploadConfirmed = [];
      await dataStorage.setItem('uploaded-hunts', uploadConfirmed.filter((v: number) => v != huntid));
      card.remove();
      const keys = await huntStorage.keys();
      if (keys.length == 0) document.querySelector('#chasses-en-cours')!.classList.add('vide');
      // ✅ animation de chargement
      window.dispatchEvent(new Event('populate'));
    }
    else {
      // On reçoit la confirmation de l'échec de l'ajout à la DB
      // ✅ animer l'échec
      new Notif('Échec d\'envoi des données.').prompt();
      // ✅ laisser la carte de la chasse et désactiver son animation de chargement
      card.removeAttribute('data-loading');
      let uploadConfirmed = await dataStorage.getItem('uploaded-hunts');
      if (uploadConfirmed == null) uploadConfirmed = [];
      await dataStorage.setItem('uploaded-hunts', uploadConfirmed.filter((v: number) => v != huntid));
      const hunt = await huntStorage.getItem(huntid);
      hunt.uploaded = false;
      await huntStorage.setItem(huntid, hunt);
    }
  }

  // --- Réponse à COMPARE-BACKUP ---
  else if ('successfulBackupComparison' in event.data) {
    if ('noresponse' in event.data) return;

    const loaders = Array.from(document.querySelectorAll('sync-progress, sync-line'));
    const params = document.querySelector('#parametres') as HTMLElement;

    if (event.data.successfulBackupComparison === true) {
      // Toutes les chasses locales plus récentes que celles de la BDD ont été ajoutées / éditées
      loaders.forEach(loader => loader.setAttribute('state', 'success'));
      params.dataset.lastSync = 'success';

      window.dispatchEvent(new CustomEvent('populate', { detail: {
        modified: event.data.modified
      } }));
    }
    else {
      // Au moins une chasse n'a pas pu être ajoutée / éditée
      if (event.data.error !== true) new Notif(event.data.error).prompt();
      else new Notif('Erreur. Réessayez plus tard.').prompt();
      loaders.forEach(loader => loader.setAttribute('state', 'failure'));
      params.dataset.lastSync = 'failure';
    }
  }
});



//////////////////////////////////////
// ÉCOUTE DE L'EVENT CUSTOM 'POPULATE'
window.addEventListener('populate', async (_event: Event) => {
  const event = _event as CustomEvent;

  // On peuple l'application avec les nouvelles données
  const notification = new Notif('Mise à jour des données...', '', 'loading', Notif.maxDelay, () => {}, true);
  notification.prompt();
  await appPopulate(false, event.detail.modified);
  await appDisplay(false);
  notification.hide();
})



/////////////////////////////
// LANCEMENT DE L'APPLICATION

// Au rechargement de l'appli, indiquer qu'on est sur la section de départ
history.replaceState({ section: 'mes-chromatiques' }, '');

// Lancement de l'appli
appStart();