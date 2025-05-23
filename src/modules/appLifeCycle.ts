import { Params, timestamp2date, wait } from './Params.js';
import { Pokemon } from './Pokemon.js';
import { Settings } from './Settings.js';
import { cleanUpRecycleBin, initPokedex, populator } from './appContent.js';
import * as Auth from './auth.js';
import { callBackend } from './callBackend.js';
import { BottomSheet } from './components/bottomSheet.js';
import { FilterMenu } from './components/filter-menu/filterMenu.js';
import { getAndNotifyCongratulations, initFeedLoader } from './feed.js';
import { PopulatableSection } from './filtres.js';
import { dataStorage, huntStorage, shinyStorage } from './localForage.js';
import { sections } from './navigate.js';
import { Notif } from './notification.js';
import { scrollObserver, setTheme } from './theme.js';
import { getString } from './translation.js';
import { upgradeStorage } from './upgradeStorage.js';



declare global {
  interface Window {
    tempsChargementDebut: number
  }
}



/////////////////////////////////////////////////////
// On enregistre le service worker
// et on le met à jour si la version du site a changé
async function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('/shinydex/service-worker.js.php');
    console.log('Le service worker a été enregistré', registration);

    window.addEventListener('updatecheck', event => {
      registration.update();
    });

    registration.addEventListener('updatefound', () => {
      const oldWorker = registration.active;
      const newWorker = registration.installing;
      let updating = false;

      newWorker?.addEventListener('statechange', async event => {
        const updateHandler = async () => {
          await new Promise((resolve, reject) => {
            const chan = new MessageChannel();
    
            chan.port1.onmessage = event => {
              if (event.data.error) {
                console.error(event.data.error);
                reject('[:(] Erreur de contact du service worker.');
              }
    
              if (event.data.ready) {
                console.log('[:)] Nouvelle version prête !');
                resolve(true);
              } else {
                reject('[:(] Nouvelle version pas prête.');
              }
            };
    
            chan.port1.onmessageerror = event => {
              reject('[:(] Erreur de communication avec le service worker.');
            };
    
            updating = true;
            newWorker.postMessage({ 'action': 'force-update' }, [chan.port2]);
          });
        };

        if (newWorker.state == 'installed') {
          console.log('[sw] Service worker mis à jour');
          
          const updateNotif = new Notif(getString('notif-update-installed'), Notif.maxDelay, getString('notif-update-installed-label'), updateHandler, false);
          window.dispatchEvent(new Event('updateinstalled'));

          if (oldWorker !== null) {
            const userActed = await updateNotif.prompt();
            if (userActed) updateNotif.element?.classList.add('loading');
          }
        }

        else if (newWorker.state == 'activated') {
          if (updating) return location.reload();
        }
      });
    });

    return navigator.serviceWorker.controller;
  } catch(error) {
    console.error(error);
    throw null;
  }
}



/////////////////////////////////////////////////////////
// Démarre l'application (update? => populate => display)
export async function appStart() {
  let perfLog = true;
  const logPerf = (message: string) => {
    if (perfLog) {
      const tempsChargement = performance.now() - window.tempsChargementDebut;
      console.log(message, tempsChargement);
    }
  };

  // ---

  // ÉTAPE 1 : on vérifie si l'application est installée localement

  logPerf('Étape 1');

  // On vérifie si les données sont installées
  await Promise.all([dataStorage.ready(), shinyStorage.ready(), huntStorage.ready()]);
  const pokemonReleaseDate = new Date('1996-02-27').getTime();
  let fileVersions = {}
  let cacheVersion = pokemonReleaseDate;
  let areFilesInstalled = false, isServiceWorkerReady = false;
  let lastStorageUpgrade = 0;
  try {
    [fileVersions, lastStorageUpgrade] = await Promise.all([
      dataStorage.getItem('file-versions').then(vers => vers ?? {}),
      dataStorage.getItem('last-storage-upgrade').then(ver => Number(ver)),
      Settings.restore(),
    ]);
    cacheVersion = Math.max(...Object.values(fileVersions).map(v => Number(v)));
    if (cacheVersion < 0) cacheVersion = pokemonReleaseDate;

    // On vérifie si les fichiers sont installés
    areFilesInstalled = await caches.has(`shinydex-sw-${cacheVersion}`);

    // On vérifie si le service worker est prêt
    isServiceWorkerReady = 'serviceWorker' in navigator && navigator.serviceWorker.controller != null;
  } catch (error) {
    const message = getString('error-verifying-data');
    console.error(error);
    new Notif(message).prompt();
  } finally {
    // Au rechargement de l'appli, indiquer qu'on est sur la section de départ
    // (après Settings.restore, notamment pour que charger la page chromatiques-ami affiche bien le pseudo)
    history.replaceState({}, '');
  }

  // ---

  // ÉTAPE 2 : on nettoie les données locales

  logPerf('Étape 2');

  // Si des shiny marqués à 'destroy' sont stockés depuis plus d'un mois, on les supprime (sans await)
  cleanUpRecycleBin();

  // On met à jour la structure de la BDD locale si nécessaire
  try {
    // @ts-expect-error
    const upgradeStorageModuleVersion = Number(fileVersions['./dist/modules/upgradeStorage.js']) * 1000 ?? 0;
    if (lastStorageUpgrade < upgradeStorageModuleVersion) await upgradeStorage();
  } catch (error) {
    const message = getString('error-updating-data-format');
    console.error(message, error);
    new Notif(message).prompt();
  }

  // ---

  // ÉTAPE 3 : on peuple l'application à partir des données locales

  logPerf('Étape 3');

  try {
    Pokemon.names(); // met en cache les noms des Pokémon
    logPerf('init Pokémon data');

    const filterMenus = document.querySelectorAll('filter-menu');
    await Promise.all([...filterMenus].map(menu => {
      return menu instanceof FilterMenu
        ? menu.init()
        : new Promise(resolve => menu.addEventListener('initialized', resolve, { once: true }));
    }));
    logPerf('init filters');

    Settings.initChangeHandler(); // toujours après Settings.restore()

    // On efface l'écran de chargement
    const loadScreen = document.getElementById('load-screen')!;
    const byeLoad = loadScreen.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], {
      duration: 100,
      easing: Params.easingStandard,
      fill: 'forwards'
    });
    wait(byeLoad).then(() => loadScreen.remove());

    const sectionsToPopulate: PopulatableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'corbeille', 'partage'];

    let startSection = sections.find(s => {
      return Object.values(s.urls)
        .includes(new URL(location.href).pathname.split('/')[2]);
    }) ?? sections[0];

    await Promise.all([
      initPokedex(),
      ...sectionsToPopulate.map(section => populator[section](undefined, {
        animate: section === startSection.nom
      }))
    ]);

    logPerf('populate');
  } catch (error) {
    const message = getString('error-preparing-content');
    console.error(message, error);
    new Notif(message).prompt();
  }

  // ---

  // ÉTAPE 4 : on affiche l'application

  logPerf('Étape 4');

  const scrollDetector = document.querySelector('#mes-chromatiques .scroll-detector');
  if (scrollDetector) scrollObserver.observe(scrollDetector);

  // Préparation du thème
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => setTheme(undefined));
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => setTheme(undefined));
  } catch (e) {
    window.matchMedia('(prefers-color-scheme: dark)').addListener(event => setTheme(undefined));
    window.matchMedia('(prefers-color-scheme: light)').addListener(event => setTheme(undefined));
  }

  // On pré-charge les icônes
  /*try {
    await loadAllImages([`./images/iconsheet.webp`]);
    logPerf('loadAllImages');
  } catch (error) {
    console.error(`Erreur de chargement d'image`, error);
  }*/

  console.log('[:)] Chargement terminé !');
  console.log('[:)] Bienvenue sur le Shinydex !');

  // ---

  // ÉTAPE 5 : si la réponse est oui, on passe à la suite ;
  //           si la réponse est non, on installe l'application

  logPerf('Étape 5');

  if (areFilesInstalled && isServiceWorkerReady) {
    console.log('[:)] L\'application est déjà installée localement.');
    initServiceWorker();
  } else {
    console.log('[:(] L\'application n\'est pas installée localement.');
    console.log('[:|] Préparation de l\'installation...');
    try {
      await initServiceWorker();
    } catch (error) {
      console.log('Error while loading the service worker', error);
    }
  }

  document.getElementById('version-fichiers')!.innerHTML = timestamp2date(cacheVersion * 1000);
  window.dispatchEvent(new Event('appready'));


  // ---

  // ÉTAPE 6 : gestion de la connexion de l'utilisateur et de la synchronisation de ses données

  logPerf('Étape 6');

  const afterAuthInit = async (signedIn: boolean) => {
    if (signedIn) getAndNotifyCongratulations();
  }

  if (navigator.onLine) {
    Auth.init()
    .then(afterAuthInit);
  } else {
    window.addEventListener('online', event => {
      Auth.init()
      .then(afterAuthInit)
    }, { once: true });
  }

  // Active le flux public
  initFeedLoader();

  // Affiche l'état de la dernière synchronisation dans les paramètres
  const lastSyncState = await dataStorage.getItem('last-sync-state');
  const lastSyncTime = await dataStorage.getItem('last-sync-time');
  if (['success', 'failure'].includes(lastSyncState)) document.body.setAttribute('data-last-sync', lastSyncState);
  const syncTimeContainer = document.querySelector('[data-sync-time-container]');
  if (typeof lastSyncTime === 'number' && lastSyncTime > 0 && syncTimeContainer instanceof HTMLElement) {
    const date = new Date(lastSyncTime);
    syncTimeContainer.innerHTML = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }

  // ---

  // ÉTAPE 7 : on vérifie si l'application peut être installée

  // Make storage persistent
  if (navigator.storage && navigator.storage.persist) {
    let persistent = await navigator.storage.persisted();
    if (!persistent) {
      persistent = await navigator.storage.persist();
    }
    console.log(`${persistent ? '[:)]' : '[:(]'} Storage ${persistent ? 'is' : 'is NOT'} persistent.`);
  }
  checkInstall();

  // ---

  // ÉTAPE 8 : si le changelog a changé, on l'ouvre
  
  const shouldChangelogBeDisplayed = await dataStorage.getItem('changelog-may-open');
  if (shouldChangelogBeDisplayed) {
    const lastViewedChangelogHash = await dataStorage.getItem('last-viewed-changelog-hash');
    const currentChangelogHash = document.querySelector<HTMLElement>('#changelog')?.dataset.changelogHash;
    if (lastViewedChangelogHash !== currentChangelogHash) {
      await wait(500).then(() => {
        openChangelog();
        dataStorage.removeItem('changelog-may-open');
      });
    }
  }

  // TERMINÉ :)
  return;
}



/////////////////////////////////////////////
// Vérifie la disponibilité d'une mise à jour
let checkingUpdate = false;
let updateAvailable = false;
let updateNotification: Notif;
export async function checkUpdate(checkNotification = false) {
  if (checkingUpdate) return;
  checkingUpdate = true;

  const texteSucces = getString('notif-update-available');
  const notifyMaj = async () => {
    checkingUpdate = false;
    if (updateNotification) updateNotification.remove();
    updateNotification = new Notif(texteSucces, undefined, getString('notif-update-available-label'), () => {
      window.dispatchEvent(new Event('updatecheck'));
    });
    const userActed = await updateNotification.prompt();
    if (userActed) {
      updateNotification.element?.classList.add('loading');
      updateNotification.dismissable = false;

      window.addEventListener('updateinstalled', event => {
        updateNotification.dismissable = true;
        updateNotification.remove();
      });
    }
  };

  try {
    if (!navigator.onLine) throw new Error(getString('error-no-connection'));
    if (updateAvailable) return notifyMaj();

    const installedFiles = await dataStorage.getItem('file-versions');
    const cacheVersion = Math.max(...Object.values(installedFiles).map(v => Number(v)));
    const liveFiles = await callBackend('get-file-versions');

    const updatedFiles = Object.entries(liveFiles).filter(file => {
      const [path, liveVersion] = file;
      const installedVersion = installedFiles[path];
      return liveVersion !== installedVersion;
    });

    if (updatedFiles.length > 0) {
      const maxVersion = Math.max(...Object.values(liveFiles).map(v => Number(v)));
      updateAvailable = true;
      console.log('[:|] Mise à jour détectée');
      console.log('     Installé : fichiers v. ' + timestamp2date(cacheVersion * 1000));
      console.log('   Disponible : fichiers v. ' + timestamp2date(maxVersion * 1000));
      console.log('     Modifiés :', Object.fromEntries(updatedFiles));

      return notifyMaj();
    } else {
      updateAvailable = false;
      console.log('[:)] Aucune mise à jour disponible');
      console.log('     Installé : fichiers v. ' + timestamp2date(cacheVersion * 1000));
      throw getString('notif-no-update');
    }
  }
  
  catch(error) {
    if (checkNotification && typeof error === 'string') {
      if (updateNotification) updateNotification.remove();
      updateNotification = new Notif(error);
      updateNotification.prompt();
    }
    checkingUpdate = false;
  }
}



/////////////////////////////////////////
// Vérifie si l'appli peut être installée
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function checkInstall() {
  let installPrompt: BeforeInstallPromptEvent | null;
  const installBouton = document.querySelector('[data-action="install-app"]');
  if (!(installBouton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);

  window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    installPrompt = e;
    installBouton.classList.remove('off');

    installBouton.addEventListener('click', e => {
      installBouton.classList.add('off');
      if (installPrompt == null) return;
      installPrompt.prompt();
      installPrompt.userChoice
      .then(choix => {
        if (choix.outcome === 'accepted')
          console.log('[app] Installation acceptée !');
        else
          console.log('[app] Installation refusée');
          installPrompt = null;
      });
    });
  });

  window.addEventListener('appinstalled', e => {
    console.log('[app] Installation terminée !');
  });
}



/////////////////////
// Ouvre le changelog
export async function openChangelog() {
  const changelogSheet = document.querySelector('#changelog');
  if (changelogSheet instanceof BottomSheet) {
    changelogSheet.show();
    const changelogHash = changelogSheet.dataset.changelogHash;
    if (changelogHash) {
      await dataStorage.ready();
      await dataStorage.setItem('last-viewed-changelog-hash', changelogHash);
    }
  }
}