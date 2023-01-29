import { Params, getCookie, loadAllImages, timestamp2date, wait } from './Params.js';
import { Pokemon } from './Pokemon.js';
import { Settings } from './Settings.js';
import { PopulatableSection, cleanUpRecycleBin, initPokedex, populator } from './appContent.js';
import * as Auth from './auth.js';
import { FilterMenu } from './components/filter-menu/filterMenu.js';
import { dataStorage, huntStorage, shinyStorage } from './localForage.js';
import { Notif } from './notification.js';
import { backgroundSync } from './syncBackup.js';
import { setTheme } from './theme.js';
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
          
          const updateNotif = new Notif('Mise à jour installée !', Notif.maxDelay, 'Actualiser', updateHandler, false);
          window.dispatchEvent(new Event('updateinstalled'));
          const userActed = await updateNotif.prompt();
          if (userActed) updateNotif.element?.classList.add('loading');
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
    const message = `Erreur pendant la vérification des données.`;
    console.error(error);
    new Notif(message).prompt();
  }

  // ---

  // ÉTAPE 2 : on nettoie les données locales

  logPerf('Étape 2');

  // Si des shiny marqués à 'destroy' sont stockés depuis plus d'un mois, on les supprime (sans await)
  cleanUpRecycleBin();

  // On met à jour la structure de la BDD locale si nécessaire
  try {
    if (lastStorageUpgrade < cacheVersion * 1000) await upgradeStorage();
  } catch (error) {
    const message = `Erreur pendant la mise à jour du format des données.`;
    console.error(message, error);
    new Notif(message).prompt();
  }

  // ---

  // ÉTAPE 3 : on peuple l'application à partir des données locales

  logPerf('Étape 3');

  try {
    Pokemon.names(); // met en cache les noms des Pokémon
    logPerf('init Pokémon data');

    const sectionsToPopulate: PopulatableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'corbeille'];
    await Promise.all([
      initPokedex(),
      ...sectionsToPopulate.map(async section => {
        await populator[section]();
        document.querySelector(`#${section}`)?.classList.remove('loading');
        if (section === 'mes-chromatiques') {
          document.querySelector(`#pokedex`)?.classList.remove('loading');
        }
      })
    ]);
    logPerf('populate');

    const filterMenus = document.querySelectorAll('filter-menu');
    await Promise.all([...filterMenus].map(menu => {
      if (!(menu instanceof FilterMenu)) throw new TypeError(`Expecting FilterMenu`);
      const section = menu.getAttribute('data-section') ?? '';
      menu.setAttribute('section', section);
      menu.removeAttribute('data-section');
      return menu.init();
    }));
    logPerf('init filters');
  } catch (error) {
    const message = `Erreur pendant la préparation du contenu de l'application.`;
    console.error(message, error);
    new Notif(message).prompt();
  }

  // ---

  // ÉTAPE 4 : on affiche l'application

  logPerf('Étape 4');

  // Préparation du thème
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => setTheme(undefined));
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => setTheme(undefined));
  } catch (e) {
    window.matchMedia('(prefers-color-scheme: dark)').addListener(event => setTheme(undefined));
    window.matchMedia('(prefers-color-scheme: light)').addListener(event => setTheme(undefined));
  }

  // On pré-charge les icônes
  try {
    await loadAllImages([`./images/iconsheet.webp`, `./images/pokemonsheet.webp`]);
    logPerf('loadAllImages');
  } catch (error) {
    console.error(`Erreur de chargement d'image`, error);
  }

  console.log('[:)] Chargement terminé !');

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
  await wait(byeLoad);
  loadScreen.remove();

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
  Auth.init();
  const loggedIn = getCookie('loggedin') === 'true';
  if (loggedIn) await backgroundSync();

  // Si la sauvegarde en ligne est activée, on met à jour les données locales
  /*const onlineBackup = await dataStorage.getItem('online-backup');
  if (onlineBackup) {
    try {
      await immediateSync();
    } catch (error) {
      const message = `Erreur de synchronisation des données.`;
      console.error(message, error);
      new Notif(message).prompt();
    }
  }*/

  // ---

  // ÉTAPE 7 : on vérifie si l'application peut être installée

  checkInstall();

  // ---

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

  const texteSucces = 'Mise à jour disponible...';
  const notifyMaj = async () => {
    checkingUpdate = false;
    if (updateNotification) updateNotification.remove();
    updateNotification = new Notif(texteSucces, undefined, 'Installer', () => {
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
    if (!navigator.onLine) throw 'Pas de connexion internet';
    if (updateAvailable) return notifyMaj();

    const installedFiles = await dataStorage.getItem('file-versions');
    const cacheVersion = Math.max(...Object.values(installedFiles).map(v => Number(v)));
  
    // On lance mod_update.php pour récupérer les données les plus récentes
    const response = await fetch(`/shinydex/backend/file-versions.php?date=${Date.now()}`);
    if (response.status != 200)
      throw '[:(] Erreur ' + response.status + ' lors de la requête';
    const liveFiles = await response.json();

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
      throw 'Pas de mise à jour';
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