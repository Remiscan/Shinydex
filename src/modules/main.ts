import 'remiscan-logo';
import '../../../_common/components/input-slider/input-slider.js';
import '../../../_common/components/input-switch/input-switch.js';
import { Friend } from './Friend.js';
import { Hunt } from './Hunt.js';
import { setCurrentLayout } from './Params.js';
import { populator } from './appContent.js';
import { appStart, checkUpdate } from './appLifeCycle.js';
import * as Auth from './auth.js';
import { callBackend } from './callBackend.js';
import { BottomSheet } from './components/bottomSheet.js';
import './components/corbeille-card/corbeilleCard.js';
import './components/dexIcon.js';
import './components/filter-menu/filterMenu.js';
import './components/friend-card/friendCard.js';
import './components/friend-shiny-card/friendShinyCard.js';
import './components/hunt-card/huntCard.js';
import './components/loadSpinner.js';
import './components/radioGroup.js';
import './components/search-box/searchBox.js';
import './components/shiny-card/shinyCard.js';
import './components/shinyStars.js';
import './components/sprite-viewer/spriteViewer.js';
import './components/syncLine.js';
import './components/syncProgress.js';
import { export2json, json2import } from './exportToJSON.js';
import { PopulatableSection } from './filtres.js';
import { dataStorage, friendStorage, huntStorage, shinyStorage } from './localForage.js';
import { navLinkBubble, navigate, sectionActuelle } from './navigate.js';
import { Notif, warnBeforeDestruction } from './notification.js';
import { immediateSync, requestSync } from './syncBackup.js';
import { getString } from './translation.js';
import { SpriteViewer } from './components/sprite-viewer/spriteViewer.js';



//////////////
// NAVIGATION

// Active les liens de navigation
const navLinksList = [
  ...document.querySelectorAll('[data-nav-section]')
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



///////////////////////////////////
// FAB (filtres et nouvelle chasse)

// Active le FAB
const fabs = document.querySelectorAll('.fab');
for (const fab of fabs) {
  fab.addEventListener('click', async (event) => {
    const isSpriteViewerFab = fab.id === 'sprite-viewer-fab';
    // Crée une nouvelle chasse
    if (['mes-chromatiques', 'pokedex', 'chasses-en-cours'].includes(sectionActuelle) || isSpriteViewerFab) {
      let dexid: number | undefined;
      if (isSpriteViewerFab) {
        event?.preventDefault();
        const dialog = document.querySelector('#sprite-viewer');
        if (!(dialog instanceof HTMLDialogElement)) throw new TypeError('Expecting HTMLDialogElement');

        const viewer = dialog.querySelector('sprite-viewer');
        if (!(viewer instanceof SpriteViewer)) throw new TypeError('Expecting SpriteViewer');

        dexid = Number(viewer.getAttribute('dexid')) ?? undefined;
        viewer.close();
      }

      if (sectionActuelle !== 'chasses-en-cours') {
        await navigate('chasses-en-cours', new Event('navigate'));
      }
  
      // Créer une nouvelle chasse ici
      const hunt = await Hunt.getOrMake();
      if (dexid) hunt.dexid = dexid;
      await huntStorage.setItem(hunt.huntid, hunt);
  
      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['chasses-en-cours'],
          ids: [hunt.huntid],
          sync: false
        }
      }));
    }
  
    // Ajoute un nouvel ami
    else if (sectionActuelle === 'partage') {
      //await navigate('user-search', new Event('click'), {});
      event.stopPropagation();
      const userSearchSheet = document.querySelector('#user-search');
      if (userSearchSheet instanceof BottomSheet) userSearchSheet.show();
    }
  });
}



///////////////
// AJOUT D'AMIS

// Active le bouton de recherche d'utilisateur
{
  const form = document.querySelector('form[name="user-search"]') as HTMLFormElement;
  const addFriendSheet = form.closest('bottom-sheet') as BottomSheet;

  form.addEventListener('submit', async event => {
    event.preventDefault();

    // Get username from form
    const username = String((new FormData(form)).get('username') ?? '');
    if (username.length === 0 || username.length > 30) return;

    // Ask backend if that username matches a public user
    const response = await callBackend('get-friend-data', { username, scope: 'partial' }, false);
    if (sectionActuelle === 'user-search') {
      history.back();
    }

    if ('matches' in response && response.matches === true) {
      // Add the requested user to the friends list
      const friend = new Friend(username, response.pokemon);
      await friend.save();

      // Populate friends list
      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['partage'],
          ids: [username],
          sync: true
        }
      }));

      addFriendSheet.close();
      new Notif(getString('notif-added-friend').replace('{user}', username)).prompt();
    } else {
      addFriendSheet.close();
      new Notif(getString('error-no-profile').replace('{user}', username)).prompt();
    }
  });

  addFriendSheet?.dialog?.addEventListener('close', () => {
    form.reset();
  });
}



/////////////
// PARAMÈTRES

// Détecte le clic sur l'état du dernier backup pour en lancer un nouveau
const syncTriggers = [...document.querySelectorAll('[data-action="sync-now"]')];
syncTriggers.forEach(element => {
  if (!(element instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
  element.addEventListener('click', event => {
    immediateSync();
  });
});

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
    const message = typeof error === 'string' ? error : getString('error-export');
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
{
  const button = document.querySelector('[data-action="delete-local-data"]');
  if (!(button instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
  button.addEventListener('click', async event => {
    const userResponse = await warnBeforeDestruction(button, getString('notif-local-data-will-be-deleted'));
    if (!userResponse) return;

    button.disabled = true;
    button.tabIndex = -1;

    const ids = [...(await shinyStorage.keys()), ...(await huntStorage.keys())];
    const friends = [...(await friendStorage.keys())];
    await Promise.all([shinyStorage.clear(), huntStorage.clear(), friendStorage.clear(), dataStorage.removeItem('user-profile')]);

    new Notif(getString('notif-deleted-data')).prompt();

    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['mes-chromatiques', 'chasses-en-cours', 'corbeille'],
        ids: ids,
        sync: false
      }
    }));

    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['partage'],
        ids: friends,
        sync: false
      }
    }));

    button.disabled = false;
    button.tabIndex = 0;
  });
}

// Détecte le clic sur le bouton de suppression des données en ligne
{
  const button = document.querySelector('[data-action="delete-backup"]');
  if (!(button instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
  button.addEventListener('click', async event => {
    const userResponse = await warnBeforeDestruction(button, getString('notif-online-data-will-be-deleted'));
    if (!userResponse) return;

    button.disabled = true;
    button.tabIndex = -1;

    try {
      await callBackend('delete-user-data', undefined, true);
      Auth.signOutCallback();
      new Notif(getString('notif-deleted-online-data')).prompt();
    } catch (error) {
      console.error(error);
      new Notif(getString('error-deleting-online-data')).prompt();
    }

    button.disabled = false;
    button.tabIndex = 0;
  });
}

// Détecte le clic sur le bouton d'ouverture du changelog
{
  const button = document.querySelector('[data-action="open-changelog"]');
  if (!(button instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
  button.addEventListener('click', event => {
    event.stopPropagation();
    const changelogSheet = document.querySelector('#changelog');
    if (changelogSheet instanceof BottomSheet) changelogSheet.show();
  });
}

// Met à jour l'identifiant du layout actuel quand la fenêtre change de taille
window.addEventListener('resize', setCurrentLayout);
window.addEventListener('orientationchange', setCurrentLayout);



///////////////////////////////////////
// COMMUNICATION AVEC LE SERVICE WORKER
navigator.serviceWorker.addEventListener('message', async event => {
  if (event.data === 'startBackupSync') {
    const loaders = Array.from(document.querySelectorAll('sync-progress, sync-line'));
    loaders.forEach(loader => loader.setAttribute('state', 'loading'));

    const syncTime = Date.now();
    await dataStorage.setItem('last-sync-time', syncTime);
    const syncTimeContainer = document.querySelector('[data-sync-time-container]');
    if (syncTimeContainer instanceof HTMLElement) {
      const date = new Date(syncTime);
      syncTimeContainer.innerHTML = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };
    document.body.setAttribute('data-last-sync', 'loading');
  }
  
  // --- Réponse à SYNC-BACKUP ---
  else if ('successfulBackupSync' in event.data) {
    const loaders = Array.from(document.querySelectorAll('sync-progress, sync-line'));

    if (event.data.successfulBackupSync === true) {
      loaders.forEach(loader => loader.setAttribute('state', 'success'));
      document.body.setAttribute('data-last-sync', 'success');

      if ('modifiedPokemon' in event.data) {
        window.dispatchEvent(new CustomEvent('dataupdate', {
          detail: {
            sections: ['mes-chromatiques', 'chasses-en-cours', 'corbeille'],
            ids: event.data.modifiedPokemon,
            sync: false
          }
        }));
      }

      if ('modifiedFriends' in event.data) {
        window.dispatchEvent(new CustomEvent('dataupdate', {
          detail: {
            sections: ['partage'],
            ids: event.data.modifiedFriends,
            sync: false
          }
        }));
      }
    } else {
      loaders.forEach(loader => loader.setAttribute('state', 'failure'));
      document.body.setAttribute('data-last-sync', 'failure');
    }
  }
});



//////////////////////////////////////
// ÉCOUTE DE L'EVENT CUSTOM 'POPULATE'
interface DataUpdateEvent extends CustomEvent {
  detail: {
    sections: PopulatableSection[];
    ids: string[];
    sync?: boolean;
  }
}

declare global {
  interface WindowEventMap {
    dataupdate: DataUpdateEvent;
  }
}

window.addEventListener('dataupdate', async (event: DataUpdateEvent) => {
  // On peuple l'application avec les nouvelles données
  const { sections, ids, sync } = event.detail;
  console.log(`Populating sections [${(sections ?? []).join(', ')}] with IDs [${(ids ?? ['all']).join(', ')}] ${sync ? 'with sync' : ''}`);
  for (const section of sections) {
    if (section !== 'chromatiques-ami' && Array.isArray(ids) && ids.length === 0) continue;
    await populator[section](ids);
  }

  // On demande une synchronisation des données
  if (Auth.loggedIn && sync) await requestSync();
});



/////////////////////////////
// LANCEMENT DE L'APPLICATION

// Lancement de l'appli
try {
  setCurrentLayout();
  appStart();
} catch (error) {
  // Réagir ici à une erreur critique qui empêche le chargement de l'appli.
}