import { appPopulate, appDisplay } from './mod_appContent.js';
import { recalcOnResize } from './mod_Params.js';
import { notify } from './mod_notification.js';
import { Pokemon } from './mod_Pokemon.js';

/////////////////////////////////////////////////////
// On enregistre le service worker
// et on le met à jour si la version du site a changé
let currentWorker;
let appCached;
let appChargee;
let isStarted = 0;
let updateAvailable = 0;

export function initServiceWorker()
{
  if ('serviceWorker' in navigator)
  {
    if (navigator.serviceWorker.controller != null)
    {
      currentWorker = navigator.serviceWorker.controller;
      isStarted = 1;
      console.log('[sw] Démarrage...');
      appStart();
    }

    navigator.serviceWorker.register('service-worker.js')
    .then(registration => {
      console.log('Le service worker a été enregistré', registration);
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state == 'activated')
          {
            console.log('[sw] Service worker mis à jour');
            currentWorker = newWorker;
          }
        });
      });
      return registration.installing || navigator.serviceWorker.controller || registration.active;
    })
    .then(sw => {
      currentWorker = sw;
      if (!isStarted)
      {
        console.log('[sw] Démarrage...');
        appStart();
      }
      else if (appChargee === true && localStorage.getItem('remidex/check-updates') == 1)
        checkUpdate();
    })
    .catch(error => {
      console.error(error);
      if (!isStarted)
      {
        console.log('[non-sw] Démarrage...');
        appStart();
      }
    })
  }
}



/////////////////////////////////////////////////////////
// Démarre l'application (update? => populate => display)
function appStart()
{
  // Étape 1 : on vérifie si l'application est installée localement

  caches.keys()
  .then(keys => {
    const trueKeys = keys.filter(e => e.includes('remidex'));
    return trueKeys.length;
  })
  .then(result => {
    if (result >= 1 && localStorage.getItem('remidex/version') !== null)
    {
      appCached = true;
      return '[:)] L\'application est déjà installée localement.';
    }
    else
    {
      appCached = false;
      throw '[:(] L\'application n\'est pas installée localement';
    }
  })

  // Étape 2 : si la réponse est non, on installe l'application
  //   si l'installation est impossible, on arrête et on retentera une fois le service worker disponible

  .catch(raison => {
    console.log(raison);
    console.log('[:|] Préparation de l\'installation...');
    return appUpdate();
  })

  // Étape 3 : on peuple l'application à partir de localStorage

  .then(result => {
    appChargee = 'loading';
    console.log(result);
    console.log('[:)] Chargement de l\'application...');
    recalcOnResize();
    return appPopulate();
  })

  // En cas d'erreur critique, on propose de réinstaller

  .catch(error => {
    throw '[:(] Erreur critique de chargement';
  })

  // Étape 4 : on affiche l'application
  
  .then(result => {
    console.log(result);
    return appDisplay();
  })

  // Fini !! :)

  .then(result => {
    appChargee = 'loaded';
    console.log(result);
    if (typeof currentWorker !== 'undefined' && currentWorker != null)
    {
      checkInstall();
      if (localStorage.getItem('remidex/check-updates') == 1)
        return checkUpdate();
    }
    appChargee = true;
  })

  .catch(error => {
    console.error(error);
    appChargee = false;
    if (error == '[:(] Erreur critique de chargement')
    {
      const forceUpdateNow = () => {
        const allStorage = Object.keys(localStorage).filter(s => s.startsWith('remidex/'));
        allStorage.forEach(s => localStorage.removeItem(s));
        manualUpdate(true);
      };
      document.getElementById('load_screen').remove();
      return notify('Échec critique du chargement...', 'Réinstaller', 'refresh', forceUpdateNow, 2147483647);
    }
    else if (error != '[:(] Service worker indisponible')
    {
      return notify('Échec du chargement...', 'Réessayer', 'refresh', () => { location.reload() }, 2147483647);
    }
  });
}



///////////////////////////
// Met à jour l'application
function appUpdate(update = false, force = false)
{
  const version = Date.now()
  return new Promise((resolve, reject) => {
    if (typeof currentWorker === 'undefined' || currentWorker == null)
      return reject('[:(] Service worker indisponible');

    // On lance mod_update.php pour récupérer les données les plus récentes
    fetch('mod_update.php?type=full&date=' + Date.now() + '&force=' + force)
    .then(response => {
      if (response.status == 200)
        return response;
      else
        throw '[:(] Erreur ' + response.status + ' lors de la requête';
    })
    .then(response => { return response.json(); })
    .then(data => {
      // On demande au service worker de mettre à jour le cache et on attend sa réponse
      console.log('[:|] Installation des fichiers...');

      // On se prépare à contacter le SW
      const chan = new MessageChannel();

      // À la réception de la réponse du SW
      chan.port1.onmessage = function(event)
      {
        if (event.data.error)
        {
          console.error(event.data.error);
          reject('[:(] Erreur de contact du service worker');
        }
        else
        {
          console.log('[:)] Fichiers correctement installés !');
          console.log('[:|] Installation des données...');
          localStorage.setItem('remidex/version-fichiers', data['version-fichiers']);
          localStorage.setItem('remidex/version', data['version']);
          localStorage.setItem('remidex/version-bdd', data['version-bdd']);
          localStorage.setItem('remidex/data-shinies', JSON.stringify(data['data-shinies']));
          localStorage.setItem('remidex/pokemon-data', JSON.stringify(data['pokemon-data']));
          Pokemon.updatePokemonData();
          if (update)
          {
            document.querySelector('.progression-maj').style.setProperty('--progression', 1);
            setTimeout(function() { location.reload(true); }, 100);
          }
          resolve('[:)] Installation terminée !');
        }
      }

      // On contacte le SW
      currentWorker.postMessage({'action': 'update', 'version': version}, [chan.port2]);

      // On surveille l'avancée du SW grâce aux messages qu'il envoie
      let totalLoaded = 0;
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.loaded)
        {
          totalLoaded++;
          document.querySelector('.progression-maj').style.setProperty('--progression', totalLoaded / (event.data.total + 1));
        }
        else if (!event.data.loaded && event.data.erreur)
          reject('[:(] Certains fichiers n\'ont pas pu être récupérés');
      });
    })
  })
}



////////////////////////////////////////
// Met à jour l'application manuellement
export function manualUpdate(force = false)
{
  return new Promise((resolve, reject) => {
    if (!navigator.onLine)
      reject('Connexion internet indisponible');
    if ('serviceWorker' in navigator)
      resolve();
    else
      reject('Service worker indisponible');
  })
  .then(() => {
    notify('Mise à jour forcée...');
    document.getElementById('notification').classList.add('installing');
    return appUpdate(true, force);
  })
  .then(result => console.log(result))
  .catch(raison => {
    console.error(raison);
    document.getElementById('notification').classList.remove('installing');
    notify('Échec de mise à jour', 'Réessayer', 'update', manualUpdate, 10000);
  });
}



/////////////////////////////////////////////
// Vérifie la disponibilité d'une mise à jour
let checkingUpdate = 0;
export function checkUpdate(checkNotification = false)
{
  const notif = document.getElementById('notification');
  if (notif.classList.contains('on') || checkingUpdate)
    return;
  checkingUpdate = 1;
  const texteSucces = 'Mise à jour disponible...';

  return new Promise((resolve, reject) => {
    if (!navigator.onLine)
      return reject('Pas de connexion internet');
    if (updateAvailable)
      return resolve(texteSucces);

    // On lance mod_update.php pour récupérer les données les plus récentes
    fetch('mod_update.php?type=check&date=' + Date.now())
    .then(response => {
      if (response.status == 200)
        return response;
      else
        throw '[:(] Erreur ' + response.status + ' lors de la requête';
    })
    .then(response => { return response.json(); })
    .then(data => {
      if ((localStorage.getItem('remidex/version-fichiers') != data['version-fichiers']) || (localStorage.getItem('remidex/version-bdd') != data['version-bdd']))
      {
        updateAvailable = 1;
        console.log('[:|] Mise à jour détectée');
        console.log('     Installé : fichiers v. ' + localStorage.getItem('remidex/version-fichiers') + ', bdd v. ' + localStorage.getItem('remidex/version-bdd'));
        console.log('   Disponible : fichiers v. ' + data['version-fichiers'] + ', bdd v. ' + data['version-bdd']);
        return texteSucces;
      }
      else
      {
        updateAvailable = 0;
        console.log('[:)] Aucune mise à jour disponible');
        console.log('     Installé : fichiers v. ' + localStorage.getItem('remidex/version-fichiers') + ', bdd v. ' + localStorage.getItem('remidex/version-bdd'));
        throw 'Pas de mise à jour';
      }
    })
    .then(result => resolve(result))
    .catch(error => reject(error))
  })
  .then(result => {
    notify(result, 'Installer', 'update', manualUpdate, 10000);
    checkingUpdate = 0;
  })
  .catch(error => {
    if (checkNotification)
      notify(error);
    checkingUpdate = 0;
  });
}



/////////////////////////////////////////
// Vérifie si l'appli peut être installée
function checkInstall()
{
  let installPrompt;
  const installBouton = document.getElementById('install-bouton');

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    installBouton.classList.add('on');

    installBouton.addEventListener('click', e => {
      installBouton.classList.remove('on');
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