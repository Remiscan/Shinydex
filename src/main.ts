import '../../_common/components/input-slider/input-slider.js';
import '../../_common/components/input-switch/input-switch.js';
import { Hunt } from './Hunt.js';
import { Settings } from './Settings.js';
import { PopulatableSection, populator } from './appContent.js';
import { appStart, checkUpdate } from './appLifeCycle.js';
import './components/corbeille-card/corbeilleCard.js';
import './components/filter-menu/filterMenu.js';
import './components/hunt-card/huntCard.js';
import './components/loadSpinner.js';
import './components/search-box/searchBox.js';
import './components/shiny-card/shinyCard.js';
import './components/shinyStars.js';
import './components/sprite-viewer/spriteViewer.js';
import './components/syncLine.js';
import './components/syncProgress.js';
import { export2json, json2import } from './exportToJSON.js';
import { huntStorage } from './localForage.js';
import { navLinkBubble, navigate, sectionActuelle } from './navigate.js';
import { Notif } from './notification.js';



//////////////
// NAVIGATION

// Active les liens de navigation
const navLinksList = [
  ...document.querySelectorAll('[data-nav-section]'),
  ...[...document.querySelectorAll('search-box')].map(sb => sb.shadowRoot?.querySelector('[part="filter-icon"]'))
];
for (const link of navLinksList) {
  if (!(link instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
  link.addEventListener('click', event => {
    event.preventDefault();
    navigate(link.dataset.navSection || '', event, JSON.parse(link.dataset.navData || '{}'));
  });
}

// Active les bulles sur les liens de navigation
for (const link of Array.from(document.querySelectorAll('.nav-link'))) {
  if (!(link instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
  link.addEventListener('pointerdown', event => navLinkBubble(event, link));
}

// Active le bouton retour / fermer
for (const bouton of Array.from(document.querySelectorAll('.bouton-retour'))) {
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
    const hunt = await Hunt.getOrMake();
    await huntStorage.setItem(hunt.huntid, hunt);

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

// Détecte les changements de paramètres
const settingsForm = document.querySelector('form[name="app-settings"]');
if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
settingsForm.addEventListener('change', event => {
  const formData = new FormData(settingsForm);
  const settings = new Settings(formData);
  settings.apply();
  settings.save();
});

/*
// Applique l'info sauvegardée au badge indiquant le succès / échec de la dernière synchronisation des BDD
dataStorage.getItem('last-sync').then((value?: string) => {
  const params = document.querySelector('#parametres');
  if (!(params instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
  if (value === 'success') params.dataset.lastSync = 'success';
  else                     params.dataset.lastSync = 'failure';
});

// Détecte le clic sur l'état du dernier backup pour en lancer un nouveau
const backgroundSyncTriggers = [document.querySelector('.info-backup.failure'), document.querySelector('.info-backup.success')];
backgroundSyncTriggers.forEach(element => {
  if (!(element instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
  element.onclick = backgroundSync;
});
*/

// Détecte le clic sur le bouton de recherche de mise à jour
{
  const majButton = document.querySelector('[data-action="check-update"]')!;
  majButton.addEventListener('click', (event: Event) => {
    checkUpdate(true);
  });
}

// Détecte le clic sur le bouton d'export des données
document.querySelector('[data-action="export-json"]')!.addEventListener('click', () => {
  try {
    export2json();
  } catch (error) {
    const message = typeof error === 'string' ? error : `Erreur pendant l'export des données.`;
    console.error(error);
    new Notif(message).prompt();
  }
});

// Détecte le clic sur le bouton associé à l'input d'import des données
const importInput = document.getElementById('pick-import-file');
document.querySelector('[data-action="import-json"]')!.addEventListener('click', () => {
  importInput?.click();
});

// Détecte le choix d'un fichier JSON d'import de données
if (!(importInput instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
importInput.addEventListener('change', async event => {
  try {
    await json2import(importInput.files?.[0]);
  } catch (message) {
    console.error(message);
    if (typeof message === 'string') new Notif(message).prompt();
  }
});

// Détecte le clic sur le bouton de suppression des données locales
/*const boutonSupprimer = document.querySelector('[data-action="delete-local-data"]');
if (!(boutonSupprimer instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
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
  // --- Réponse à COMPARE-BACKUP ---
  if ('successfulBackupComparison' in event.data) {
    if ('noresponse' in event.data) return;

    const loaders = Array.from(document.querySelectorAll('sync-progress, sync-line'));
    const params = document.querySelector('#parametres');
    if (!(params instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

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
    sections: PopulatableSection[];
    ids: string[];
  }
}

declare global {
  interface WindowEventMap {
    dataupdate: DataUpdateEvent;
  }
}

window.addEventListener('dataupdate', async (event: DataUpdateEvent) => {
  console.log(event);

  // On peuple l'application avec les nouvelles données
  const { sections, ids } = event.detail;
  for (const section of sections) {
    await populator[section](ids);
  }

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