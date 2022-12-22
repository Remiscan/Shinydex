import { Params, loadAllImages, setTheme, timestamp2date, wait, webpSupport } from './Params.js';
import { backendPokemon } from './Pokemon.js';
import { initPokedex, populateHandler } from './appContent.js';
import { initFiltres } from './filtres.js';
import { dataStorage, huntStorage, pokemonData, shinyStorage } from './localForage.js';
import { Notif } from './notification.js';
import { backgroundSync } from './syncBackup.js';
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
  try {
    const registration = await navigator.serviceWorker.register('/shinydex/service-worker.js.php');
    console.log('Le service worker a été enregistré', registration);

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
          
          const updateNotif = new Notif('Mise à jour installée', 'Actualiser', 'update', Notif.maxDelay, updateHandler);
          const userActed = await updateNotif.prompt();
          if (userActed) {
            updateNotif.priorite = true;
            updateNotif.duree = Notif.maxDelay;
            document.getElementById('notification')!.classList.add('installing');
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



//////////////////////////////////////////////////////////////////////
// On récupère les données des Pokémon et on les stocke dans indexedDB
async function initPokemonData() {
  await dataStorage.ready();
  const fileVersion = (await dataStorage.getItem('file-versions'))['./data/pokemon.json'];
  const dataVersion = await dataStorage.getItem('pokemon-data-version');

  if (fileVersion === dataVersion) return;

  try {
    // @ts-ignore
    const pokemonDataModule = await import('../data/pokemon.json', { assert: { type: 'json' }});
    // @ts-expect-error
    const data = pokemonDataModule.default;

    console.log(`[:)] Préparation des données...`);
    await pokemonData.ready();
    await Promise.all(
      data.map((pkmn: backendPokemon) => pokemonData.setItem(String(pkmn.dexid), pkmn))
    );
    await dataStorage.setItem('pokemon-data-version', fileVersion);
    console.log(`[:)] Préparation des données terminée !`);
  } catch (error) {
    console.error(error);
    throw Error(`[:()] Préparation des données échouée.`);
  }
}



/////////////////////////////////////////////////////////
// Démarre l'application (update? => populate => display)
export async function appStart() {
  if (!('serviceWorker' in navigator)) throw 'Application non supportée.';

  // ---

  // ÉTAPE 1 : on vérifie si l'application est installée localement

  // On initialise supportsWebp
  if (await webpSupport()) Params.preferredImageFormat = 'webp';

  // On vérifie si les données sont installées
  await Promise.all([dataStorage.ready(), shinyStorage.ready(), pokemonData.ready(), huntStorage.ready()]);
  const installedFiles = await dataStorage.getItem('file-versions');
  const cacheVersion = Math.max(...Object.values(installedFiles).map(v => Number(v)));

  // On vérifie si les fichiers sont installés
  const cacheKeys = (await caches.keys()).filter(e => e.includes(`remidex-sw-${cacheVersion}`));
  const filesInstalled = cacheKeys.length >= 1;

  // On vérifie si le service worker est prêt
  const serviceWorkerReady = navigator.serviceWorker.controller != null;

  // ---

  // ÉTAPE 2 : si la réponse est oui, on passe à la suite ;
  //           si la réponse est non, on installe l'application

  if (filesInstalled && serviceWorkerReady) {
    console.log('[:)] L\'application est déjà installée localement.');
    initServiceWorker();
  } else {
    console.log('[:(] L\'application n\'est pas installée localement.');
    console.log('[:|] Préparation de l\'installation...');
    const loadMessage = document.getElementById('load-screen-message');
    if (loadMessage !== null) {
      loadMessage.innerText = 'Mise à jour...';
      loadMessage.style.display = 'block';
    }
    await initServiceWorker();
  }

  console.log('[:)] Chargement de l\'application...');

  // ---

  // ÉTAPE 3 : si la sauvegarde en ligne est activée, on met à jour les données locales

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

  // ÉTAPE 4 : on nettoie les données locales

  // Si des shiny marqués à 'destroy' sont stockés depuis plus d'un mois, on les supprime
  const shinyKeys = await shinyStorage.keys();
  const shinyMons = await Promise.all(
    shinyKeys.map(key => shinyStorage.getItem(key))
  );
  const month = 1000 * 60 * 60 * 24 * 30;
  const toDestroy = shinyMons.filter(shiny => shiny.destroy === true && shiny.lastUpdate + month < Date.now());
  await Promise.all(
    toDestroy.map(shiny => shiny.huntid)
             .map(huntid => shinyStorage.removeItem(huntid))
  );

  // On met à jour la structure de la BDD locale si nécessaire
  try {
    const lastStorageUpgrade = Number(await dataStorage.getItem('last-storage-upgrade'));
    if (lastStorageUpgrade < cacheVersion) await upgradeStorage();
  } catch (error) {
    const message = `Erreur pendant la mise à jour du format des données.`;
    console.error(message, error);
    new Notif(message).prompt();
  }

  // ---

  // ÉTAPE 5 : on peuple l'application à partir des données locales
  try {
    await initPokemonData();
    await initFiltres('mes-chromatiques');
    await initPokedex();
    await populateHandler('mes-chromatiques');
    await populateHandler('chasses-en-cours');
    await populateHandler('corbeille');
    // await initAmis();
  } catch (error) {
    console.error(error);
  }

  // ---

  // ÉTAPE 6 : on affiche l'application

  // Préparation du thème
  const theme = await dataStorage.getItem('theme');
  await setTheme(theme);
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => setTheme(undefined));
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => setTheme(undefined));
  } catch (e) {
    window.matchMedia('(prefers-color-scheme: dark)').addListener(event => setTheme(undefined));
    window.matchMedia('(prefers-color-scheme: light)').addListener(event => setTheme(undefined));
  }

  // On affiche la version de l'appli
  const tempsChargement = performance.now() - window.tempsChargementDebut;
  document.getElementById('version-tempschargement')!.innerHTML = String(Math.round(tempsChargement));
  document.getElementById('version-fichiers')!.innerHTML = timestamp2date(await dataStorage.getItem('version-fichiers'));

  // On pré-charge les icônes
  try {
    await loadAllImages([`./ext/pokesprite.png`]);
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

  // ÉTAPE 7 : on vérifie si l'application peut être installée

  checkInstall();

  return;

  // En cas d'erreur critique, on propose de réinstaller
  /*catch(error) {
    console.error(error);

    async function forceUpdateNow() {
      await Promise.all([ dataStorage.clear(), shinyStorage.clear(), pokemonData.clear() ]);
      await caches.keys()
            .then(keys => keys.filter(k => k.startsWith('remidex-sw')))
            .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      manualUpdate();
    };
    document.getElementById('load-screen')!.remove();
    return new Notif('Échec critique du chargement...', 'Réinitialiser', 'refresh', Notif.maxDelay, forceUpdateNow, true).prompt();
  }*/
}



/////////////////////////////////////////////
// Vérifie la disponibilité d'une mise à jour
let checkingUpdate = 0;
let updateAvailable = 0;
export async function checkUpdate(checkNotification = false) {
  const notif = document.getElementById('notification');
  if (notif!.classList.contains('on') || checkingUpdate)
    return;
  checkingUpdate = 1;

  const texteSucces = 'Mise à jour disponible...';
  const notifyMaj = async () => {
    checkingUpdate = 0;
    const updateNotif = new Notif(texteSucces, 'Installer', 'update', 10000, () => location.reload());
    const userActed = await updateNotif.prompt();
    if (userActed) {
      updateNotif.priorite = true;
      updateNotif.duree = Notif.maxDelay;
    }
  };

  try {
    if (!navigator.onLine) throw 'Pas de connexion internet';
    if (updateAvailable) return notifyMaj();

    const installedFiles = await dataStorage.getItem('file-versions');
    const cacheVersion = Math.max(...Object.values(installedFiles).map(v => Number(v)));
  
    // On lance mod_update.php pour récupérer les données les plus récentes
    const response = await fetch(`/shinydex/backend/update.php?type=check&from=${cacheVersion}&date=${Date.now()}`);
    if (response.status != 200)
      throw '[:(] Erreur ' + response.status + ' lors de la requête';
    const data = await response.json();

    if ((cacheVersion != data['version-fichiers'])) {
      updateAvailable = 1;
      console.log('[:|] Mise à jour détectée');
      console.log('     Installé : fichiers v. ' + timestamp2date(cacheVersion * 1000));
      console.log('   Disponible : fichiers v. ' + timestamp2date(data['version-fichiers'] * 1000));
      console.log('     Modifiés :', data['liste-fichiers-modifies']);

      return notifyMaj();
    } else {
      updateAvailable = 0;
      console.log('[:)] Aucune mise à jour disponible');
      console.log('     Installé : fichiers v. ' + timestamp2date(cacheVersion * 1000));
      throw 'Pas de mise à jour';
    }
  }
  
  catch(error) {
    if (checkNotification && typeof error === 'string')
      new Notif(error).prompt();
    checkingUpdate = 0;
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
  const installBouton = document.getElementById('install-bouton')!;

  window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    installPrompt = e;
    installBouton.classList.add('on');

    installBouton.addEventListener('click', e => {
      installBouton.classList.remove('on');
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



/////////////////////////////////////////////////////////
// Change le paramètre de sauvegarde des données en ligne
export async function setOnlineBackup(checked: boolean): Promise<void> {
  if (checked) {
    document.getElementById('parametres')!.dataset.onlineBackup = '1';
    await dataStorage.setItem('online-backup', 1);
    await backgroundSync();
  } else {
    document.getElementById('parametres')!.removeAttribute('data-online-backup');
    await dataStorage.setItem('online-backup', 0);
  }
}