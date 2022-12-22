import '../../_common/components/input-switch/input-switch.js';
import { Hunt } from './Hunt.js';
import { setTheme } from './Params.js';
import { populatableSection, populateHandler } from './appContent.js';
import { appStart, checkUpdate, setOnlineBackup } from './appLifeCycle.js';
import './components/corbeille-card/corbeilleCard.js';
import './components/hunt-card/huntCard.js';
import './components/load-spinner/loadSpinner.js';
import './components/pokemon-card/pokemonCard.js';
import './components/pokemon-sprite/pokemonSprite.js';
import './components/search-bar/searchBar.js';
import './components/shiny-stars/shinyStars.js';
import './components/shiny-switch/shinySwitch.js';
import './components/sprite-viewer/spriteViewer.js';
import './components/sync-line/syncLine.js';
import './components/sync-progress/syncProgress.js';
import { export2json, json2import } from './exportToJSON.js';
import { ListeFiltres } from './filtres.js';
import { dataStorage, huntStorage } from './localForage.js';
import { navLinkBubble, navigate, sectionActuelle } from './navigate.js';
import { Notif } from './notification.js';
import { backgroundSync } from './syncBackup.js';



//////////////
// NAVIGATION

// Active les liens de navigation
for (const link of Array.from(document.querySelectorAll('[data-section]')) as HTMLElement[]) {
  link.addEventListener('click', event => {
    event.preventDefault();
    navigate(link.dataset.section || '', event, JSON.parse(link.dataset.navData || '{}'));
  });
}

// Active les bulles sur les liens de navigation
for (const link of Array.from(document.querySelectorAll('.nav-link')) as HTMLElement[]) {
  for (const startEvent of ['mousedown', 'touchstart']) {
    link.addEventListener(startEvent, event => navLinkBubble(event, link));
  }
}

// Active le bouton retour / fermer
for (const bouton of Array.from(document.querySelectorAll('.bouton-retour')) as HTMLButtonElement[]) {
  bouton.addEventListener('click', event => {
    event.preventDefault();
    history.back();
  });
}

// L'obfuscator ramène en arrière quand on clique dessus
document.getElementById('obfuscator')!.addEventListener('click', () => history.back());



///////////////////////////////////
// FAB (filtres et nouvelle chasse)

// Active le FAB
document.querySelector('.fab')!.addEventListener('click', async () => {
  // Crée une nouvelle chasse
  if (['mes-chromatiques', 'pokedex', 'chasses-en-cours'].includes(sectionActuelle)) {
    if (sectionActuelle !== 'chasses-en-cours') {
      await navigate('chasses-en-cours', new Event('navigate'));
    }

    // Créer une nouvelle chasse ici
    const hunt = await Hunt.make();
    await huntStorage.setItem(hunt.huntid, hunt);

    /*const container = document.querySelector('#chasses-en-cours .section-contenu')!;
    const huntCard = document.createElement('hunt-card');
    huntCard.setAttribute('huntid', hunt.huntid);
    container.insertBefore(huntCard, container.firstChild);*/
    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['chasses-en-cours'],
        ids: [hunt.huntid],
      }
    }));
  }

  // Ajoute un nouvel ami
  else if (sectionActuelle === 'partage') {
    // Ajouter un nouvel ami ici
    await navigate('obfuscator', new Event('navigate'), { search: true, section: 'ajouter-ami' })
  }
});



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
(document.querySelector('.info-backup.failure') as HTMLButtonElement).onclick = backgroundSync;
(document.querySelector('.info-backup.success') as HTMLButtonElement).onclick = backgroundSync;

// Détecte le clic (court ou long) sur le bouton de recherche de mise à jour
{
  const majButton = document.querySelector('.bouton-recherche-maj')!;
  majButton.addEventListener('click', (event: Event) => {
    checkUpdate(true);
  });
}

// Détecte le clic sur le bouton d'export des données
document.querySelector('.bouton-export')!.addEventListener('click', () => {
  try {
    export2json();
  } catch (error) {
    const message = typeof error === 'string' ? error : `Erreur pendant l'export des données.`;
    console.error(error);
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
/*const boutonSupprimer = document.querySelector('.bouton-supprimer-local')! as HTMLButtonElement;
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
});*/



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
interface DataUpdateEvent extends CustomEvent {
  detail: {
    sections: populatableSection[];
    ids: string[];
    filtres?: ListeFiltres;
    ordre?: string;
    ordreReversed?: boolean;
  }
}

declare global {
  interface WindowEventMap {
    dataupdate: DataUpdateEvent;
  }
}

let dataUpdateNotification: Notif | null = null;
let dataUpdateNotificationCount = 0;
window.addEventListener('dataupdate', async (event: Event) => {
  console.log(event);

  // On peuple l'application avec les nouvelles données
  if (dataUpdateNotificationCount === 0) {
    dataUpdateNotificationCount++;
    dataUpdateNotification = new Notif('Mise à jour des données...', '', 'loading', Notif.maxDelay, () => {}, true);
    dataUpdateNotification.prompt();
  }
  const { sections, ids, filtres, ordre, ordreReversed } = (event as DataUpdateEvent).detail;
  for (const section of sections) {
    await populateHandler(section, ids, { filtres, ordre, ordreReversed });
  }
  if (dataUpdateNotificationCount === 1) dataUpdateNotification?.hide();
  dataUpdateNotificationCount--;

  // On demande une synchronisation des données
  //await backgroundSync();
});



/////////////////////////////
// LANCEMENT DE L'APPLICATION

// Au rechargement de l'appli, indiquer qu'on est sur la section de départ
history.replaceState({ section: 'mes-chromatiques' }, '');

// Lancement de l'appli
try {
  appStart();
} catch (error) {
  // Réagir ici à une erreur critique qui empêche le chargement de l'appli.
}