import { appDisplay, appPopulate } from './appContent.js';
import { dataStorage, huntStorage, pokemonData, shinyStorage } from './localforage.js';
import { Notif } from './notification.js';
import { upgradeStorage } from './upgradeStorage.js';



/////////////////////////////////////////////////////
// On enregistre le service worker
// et on le met à jour si la version du site a changé
let currentWorker: ServiceWorker | null;
let updateAvailable = 0;

async function initServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/remidex/service-worker.js');
    console.log('Le service worker a été enregistré', registration);

    // On détecte les mises à jour du service worker lui-même
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker!.addEventListener('statechange', () => {
        if (newWorker!.state == 'activated') {
          console.log('[sw] Service worker mis à jour');
          currentWorker = newWorker;
        }
      });
    });

    currentWorker = registration.installing || navigator.serviceWorker.controller || registration.active;
    return currentWorker;
  } catch(error) {
    console.error(error);
    throw null;
  }
}



/////////////////////////////////////////////////////////
// Démarre l'application (update? => populate => display)
export async function appStart() {
  if (!('serviceWorker' in navigator))
    throw 'Application non supportée.';

  // ÉTAPE 1 : on vérifie si l'application est installée localement
  let log;
  try {
    let filesInstalled = false;
    let dataInstalled = false;
    let serviceWorkerReady = navigator.serviceWorker.controller != null;

    // On initialise supportsWebp
    if (await webpSupport()) Params.preferredImageFormat = 'webp';

    // On vérifie si les données sont installées
    await Promise.all([dataStorage.ready(), shinyStorage.ready(), pokemonData.ready(), huntStorage.ready()]);
    const installedVersion = await dataStorage.getItem('version-fichiers');
    if (installedVersion !== null) dataInstalled = true;

    // On vérifie si les fichiers sont installés
    const keys = await caches.keys();
    const trueKeys = keys.filter(e => e.includes('remidex-sw-' + installedVersion));
    if (trueKeys.length >= 1) filesInstalled = true;

    if (filesInstalled && dataInstalled && serviceWorkerReady) {
      log = '[:)] L\'application est déjà installée localement.';
      initServiceWorker();
    } else {
      throw '[:(] L\'application n\'est pas installée localement';
    }
  }

  // ÉTAPE 2 : si la réponse est non, on installe l'application
  catch(error) {
    console.log(error);
    console.log('[:|] Préparation de l\'installation...');
    const loadMessage = document.getElementById('load-screen-message');
    if (loadMessage !== null) {
      loadMessage.innerText = 'Mise à jour...';
      loadMessage.style.display = 'block';
    }
    await initServiceWorker();
    log = await appUpdate();
  }

  try {
    console.log(log);
    console.log('[:)] Chargement de l\'application...');
    recalcOnResize();

    // ÉTAPE 3 : si la sauvegarde en ligne est activée, on met à jour les données locales
    const onlineBackup = await dataStorage.getItem('online-backup');
    if (onlineBackup) await waitBackup();

    // ÉTAPE 3.97 : on applique le thème
    await setTheme();
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => setTheme(undefined));
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => setTheme(undefined));
    } catch (e) {
      window.matchMedia('(prefers-color-scheme: dark)').addListener(event => setTheme(undefined));
      window.matchMedia('(prefers-color-scheme: light)').addListener(event => setTheme(undefined));
    }

    // ÉTAPE 3.98 : si des shiny marqués à 'destroy' sont stockés, on les supprime
    const shinyKeys = await shinyStorage.keys();
    const shinyMons = await Promise.all(
      shinyKeys.map(key => shinyStorage.getItem(key))
    );
    const toDestroy = shinyMons.filter(shiny => shiny.destroy === true);
    await Promise.all(
      toDestroy.map(shiny => shiny.huntid)
               .map(huntid => shinyStorage.removeItem(String(huntid)))
    );

    // ÉTAPE 3.99 : on met à jour la structure de la BDD locale si nécessaire
    try {
      await upgradeStorage();
    } catch (error) {
      const message = `Erreur pendant la mise à jour du format des données.`;
      console.error(message, error);
      new Notif(message).prompt();
    }

    // ÉTAPE 4 : on peuple l'application à partir des données locales
    log = await appPopulate();
    console.log(log);

    // ÉTAPE 5 : on affiche l'application
    log = await appDisplay();
    console.log(log);

    // Fini !! :)

    // ÉTAPE bonus : si nécessaire, on vérifie si l'application
    // peut être installée ou si une mise à jour est disponible
    checkInstall();
    const willCheckUpdate = await dataStorage.getItem('check-updates');
    if (willCheckUpdate == 1) {
      await navigator.serviceWorker.ready;
      await wait(1000);
      return checkUpdate();
    }
    else {
      return;
    }
  }

  // En cas d'erreur critique, on propose de réinstaller
  catch(error) {
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
  }
}



///////////////////////////
// Met à jour l'application
function appUpdate(update = false)
{
  const progressBar = document.querySelector('.progression-maj') as HTMLElement;
  progressBar.style.setProperty('--progression', '0');

  return new Promise((resolve, reject) => {
    if (typeof currentWorker === 'undefined' || currentWorker == null)
      return reject('[:(] Service worker indisponible');

    // On demande au service worker de mettre à jour l'appli' et on attend sa réponse
    const chan = new MessageChannel();

    // On se prépare à recevoir la réponse
    chan.port1.onmessage = function(event) {
      if (event.data.error) {
        console.error(event.data.error);
        reject('[:(] Erreur de contact du service worker');
      }
      else {
        if (update) {
          progressBar.style.setProperty('--progression', '1');
          setTimeout(function() { location.reload(); }, 100);
        }
        resolve('[:)] Installation terminée !');
      }
    }

    // On contacte le SW
    currentWorker.postMessage({ 'action': 'update' }, [chan.port2]);

    // On surveille l'avancée du SW grâce aux messages qu'il envoie
    let totalLoaded = 0;
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.loaded)
      {
        totalLoaded++;
        progressBar.style.setProperty('--progression', String(totalLoaded / (event.data.total + 1)));
      }
      else if (!event.data.loaded && event.data.erreur)
        reject('[:(] Certains fichiers n\'ont pas pu être récupérés');
    });
  });
}



////////////////////////////////////////
// Met à jour l'application manuellement
export async function manualUpdate()
{
  try {
    if (!navigator.onLine)
      throw 'Connexion internet indisponible';
    if (!('serviceWorker' in navigator))
      throw 'Service worker indisponible';

    document.querySelector('.notif-texte')!.innerHTML = 'Installation en cours...';
    document.getElementById('notification')!.classList.add('installing');
    const result = await appUpdate(true);
    return console.log(result);
  }
  catch (raison) {
    console.error(raison);
    document.getElementById('notification')!.classList.remove('installing');
    new Notif('Échec de mise à jour', 'Réessayer', 'update', 10000, manualUpdate).prompt();
  }
}



/////////////////////////////////////////////
// Vérifie la disponibilité d'une mise à jour
let checkingUpdate = 0;
export async function checkUpdate(checkNotification = false)
{
  const notif = document.getElementById('notification');
  if (notif!.classList.contains('on') || checkingUpdate)
    return;
  checkingUpdate = 1;
  const texteSucces = 'Mise à jour disponible...';
  const notifyMaj = async () => {
    checkingUpdate = 0;
    const updateNotif = new Notif(texteSucces, 'Installer', 'update', 10000, manualUpdate);
    const userActed = await updateNotif.prompt();
    if (userActed) {
      updateNotif.priorite = true;
      updateNotif.duree = Notif.maxDelay;
    }
  };

  try {
    if (!navigator.onLine)
      throw 'Pas de connexion internet';
    if (updateAvailable)
      notifyMaj();

    // On lance mod_update.php pour récupérer les données les plus récentes
    const response = await fetch('/remidex/mod_update.php?type=check&date=' + Date.now());
    if (response.status != 200)
      throw '[:(] Erreur ' + response.status + ' lors de la requête';
    const data = await response.json();

    const versionFichiers = await dataStorage.getItem('version-fichiers');

    if ((versionFichiers != data['version-fichiers']))
    {
      updateAvailable = 1;
      console.log('[:|] Mise à jour détectée');
      console.log('     Installé : fichiers v. ' + timestamp2date(versionFichiers));
      console.log('   Disponible : fichiers v. ' + timestamp2date(data['version-fichiers']));

      notifyMaj();
    }
    else
    {
      updateAvailable = 0;
      console.log('[:)] Aucune mise à jour disponible');
      console.log('     Installé : fichiers v. ' + timestamp2date(versionFichiers));
      throw 'Pas de mise à jour';
    }
  } catch(error) {
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
export async function setOnlineBackup()
{
  const checkbox = document.getElementById('switch-online-backup') as HTMLInputElement;
  if (checkbox.checked)
  {
    checkbox.checked = false;
    document.getElementById('parametres')!.removeAttribute('data-online-backup');
    await dataStorage.setItem('online-backup', 0);
  }
  else
  {
    checkbox.checked = true;
    document.getElementById('parametres')!.dataset.onlineBackup = '1';
    await dataStorage.setItem('online-backup', 1);
    await startBackup();
  }
  return;
}



// Demande au service worker de mettre à jour le sprite
export async function updateSprite(version = null) {
  const reg = await navigator.serviceWorker.ready;
  return new Promise((resolve, reject) => {
    const chan = new MessageChannel();

    chan.port1.onmessage = event => {
      if (event.data.error) {
        console.error(event.data.error);
        reject('[:(] Erreur de contact du service worker');
      }

      if ('successfulSpriteUpdate' in event.data) {
        if (event.data.successfulSpriteUpdate === true) resolve(event.data.version);
        else reject('[:(] Échec de la mise à jour du sprite');
      }
      else {
        reject('[:(] Message invalide reçu du service worker');
      }
    }

    chan.port1.onmessageerror = event => {
      reject('[:(] Erreur de communication avec le service worker');
    }
  
    const worker = currentWorker || reg.active;
    worker?.postMessage({ 'action': 'update-sprite', version }, [chan.port2]);
  });
}


// Démarre la procédure de backup

interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

declare global {
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager;
  }

  interface SyncEvent extends Event {
    readonly lastChance: boolean;
    readonly tag: string;
  }

  interface ServiceWorkerGlobalScopeEventMap {
    sync: SyncEvent;
  }
}

export async function startBackup() {
  const reg = await navigator.serviceWorker.ready;
  await reg.sync.register('SYNC-BACKUP');

  const loaders = Array.from(document.querySelectorAll('sync-progress, sync-line'));
  loaders.forEach(loader => loader.setAttribute('state', 'loading'));
}

// Démarre la procédure de backup et attend la réponse
async function waitBackup() {
  const reg = await navigator.serviceWorker.ready;
  return new Promise((resolve, reject) => {
    const chan = new MessageChannel();

    chan.port1.onmessage = event => {
      if (event.data.error) {
        console.error(event.data.error);
        reject('[:(] Erreur de contact du service worker');
      }

      if ('successfulBackupComparison' in event.data) {
        if (event.data.successfulBackupComparison === true) resolve(null);
        else reject('[:(] Échec de la synchronisation des BDD');
      }
      else {
        reject('[:(] Message invalide reçu du service worker');
      }
    }

    chan.port1.onmessageerror = event => {
      reject('[:(] Erreur de communication avec le service worker');
    }
  
    const worker = currentWorker || reg.active;
    worker?.postMessage({ 'action': 'compare-backup' }, [chan.port2]);
  });
}