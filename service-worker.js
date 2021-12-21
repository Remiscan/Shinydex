importScripts('./ext/localforage.min.js');

// Stockage de données
//// Pokédex
const pokemonData = localforage.createInstance({
  name: 'remidex',
  storeName: 'pokemon-data',
  driver: localforage.INDEXEDDB
});
//// Liste de shiny
const shinyStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'shiny-list',
  driver: localforage.INDEXEDDB
});
//// Données diverses
const dataStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'misc',
  driver: localforage.INDEXEDDB
});
//// Chasses en cours
const huntStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'hunts',
  driver: localforage.INDEXEDDB
});

const PRE_CACHE = 'remidex-sw';



///// EVENTS


// INSTALLATION
self.addEventListener('install', function(event) {
  console.log('[install] Installation du service worker...');
  event.waitUntil(
    Promise.all([installData(event), installFiles(event)])
    .catch(raison => console.log('[install] ' + raison))
    .then(() => {
      console.log('[install] Le service worker est bien installé !');
      return self.skipWaiting(); // force l'activation du service worker
    })
    .catch(error => console.error(error))
  )
});


// ACTIVATION
self.addEventListener('activate', function(event) {
  console.log('[activate] Activation du service worker');
  event.waitUntil(self.clients.claim()); // force le service worker à prendre le contrôle de la page immédiatement
});


// FETCH
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
    .then(matching => {
      return matching || fetch(event.request);
    })
    .catch(error => console.error(error))
  )
});


// MESSAGE
self.addEventListener('message', async function(event) {
  console.log('[sw] Message reçu :', event.data);
  const source = event.source;
  const action = event.data?.action;

  switch (action) {
    case 'update-files': {
      try {
        if (event.data?.partial) {
          await dataStorage.ready();
          const localVersion = await dataStorage.getItem('version-fichiers');
          await installFiles(event, localVersion);
        } else {
          await installFiles(event);
        }
        console.log(`[${action}] Installation des fichiers terminée !`);
        source.postMessage({ action, complete: true });
      } catch (error) {
        console.error(error);
        source.postMessage({ action, error });
      }
    } break;

    case 'update-data': {
      try {
        await installData(event);
        console.log(`[${action}] Installation des données terminée !`);
        source.postMessage({ action, complete: true });
      } catch (error) {
        console.error(error);
        source.postMessage({ action, error });
      }
    } break;

    case 'sync-backup': {
      const source = event.ports[0];

      event.waitUntil(
        syncBackup(false)
        .then(() => source.postMessage({ successfulBackupComparison: true, noresponse: true }))
        .catch(() => source.postMessage({ successfulBackupComparison: false, noresponse: true }))
      );
    } break;
  }
});


// SYNC
self.addEventListener('sync', function(event) {
  console.log('[sw] Requête SYNC reçue :', event.tag);

  switch (event.tag) {
    case 'SYNC-BACKUP': {
      event.waitUntil(
        syncBackup()
      );
    } break;
  }
});



///// FONCTIONS


// Installer les fichiers de l'application
async function installFiles(event = null, localVersion = 0) {
  const [versionRequest, filesRequest] = await Promise.all([
    fetch(`backend/update.php?type=check&from=${localVersion}&date=${Date.now()}`),
    fetch(`cache.json.php?date=${Date.now()}`)
  ]);
  if (!filesRequest.ok) throw `[:(] Erreur ${response.status} lors de la requête (cache.json.php)`;

  const versionData = await versionRequest.json();
  const version = versionData['version-fichiers'];

  const files = (await filesRequest.json()).fichiers;
  const modifiedFiles = versionData['liste-fichiers-modifies'];

  const newCACHE = `${PRE_CACHE}-${version}`;
  const source = event?.source || null;
  const action = event?.data?.action || 'install';

  const filesToInstall = action === 'update-files' ? modifiedFiles : files;

  try {
    console.log(`[${action}] Mise en cache des fichiers :`, filesToInstall);
    const cache = await caches.open(newCACHE);
    await Promise.all(files.map(async url => {
      let response;
      const request = new Request(url, { cache: 'no-store' });

      if (filesToInstall.includes(url)) {
        response = await fetch(request);
      } else {
        response = (await caches.match(new Request(url))) ?? (await fetch(request));
      }
      
      //const request = new Request(url, { cache: 'reload' });
      //const response = await fetch(request);
      if (!response.ok) throw Error(`[${action}] Un fichier n\'a pas pu être récupéré : (${request.url})`);
      await cache.put(request, response);

      if (source) source.postMessage({ action: 'update-files', loaded: true, total: filesToInstall.length, url: url });
      return;
    }));
    console.log(`[${action}] Mise en cache des fichiers terminée !`);
    deleteOldCaches(newCACHE, action);
  }

  // Si le nouveau cache n'a pas été complété, ou que les données n'ont pas pu être récupérées,
  // on supprime le nouveau cache.
  catch (error) {
    await caches.delete(newCACHE);
    console.log(`[${action}] Installation des fichiers annulée.`);
    throw error;
  }
  
  return;
}


// Installer les données de l'application
async function installData(event = null) {
  const dataRequest = await fetch(`backend/update.php?type=full&date=${Date.now()}`);
  if (!dataRequest.ok) throw `[:(] Erreur ${response.status} lors de la requête (update.php)`;
  const data = await dataRequest.json();

  const action = event?.data?.action || 'install';

  try {
    console.log(`[${action}] Installation des données...`);
    await Promise.all([dataStorage.ready(), pokemonData.ready()]);
    await dataStorage.setItem('version-fichiers', Number(data['version-fichiers']));
    await dataStorage.setItem('pokemon-names', data['pokemon-names']);
    await dataStorage.setItem('pokemon-names-fr', data['pokemon-names-fr']);
    await Promise.all(
      data['pokemon-data'].map(pkmn => pokemonData.setItem(String(pkmn.dexid), pkmn))
    );
    console.log(`[${action}] Installation des données terminée !`);
  } catch (error) {
    console.error(error);
    throw Error(`[${action}] Installation des données annulée.`);
  }
}


// Supprimer tous les caches qui ne sont pas newCache
async function deleteOldCaches(newCache, action) {
  try {
    const allCaches = await caches.keys();
    if (allCaches.length <= 1) throw 'no-cache';

    console.log(`[${action}] Nettoyage des anciennes versions du cache`);
    await Promise.all(
      allCaches.map(ceCache => {
        if (ceCache.startsWith(PRE_CACHE) && newCache != ceCache) return caches.delete(ceCache);
        else return Promise.resolve();
      })
    );
    
    console.log(`[${action}] Nettoyage terminé !`);
  } catch (error) {
    if (error === 'no-cache') console.log('Aucun cache redondant à supprimer');
    else                      console.error(error);
  }

  return;
}


// Compare et synchronise les bases de données locale et en ligne
async function syncBackup(message = true) {
  try {
    // On récupère les données locales
    await shinyStorage.ready();
    const keys = await shinyStorage.keys();
    const localData = await Promise.all(keys.map(key => shinyStorage.getItem(key)));

    // On envoie les données locales au serveur
    const formData = new FormData();
    formData.append('local-data', JSON.stringify(localData.filter(shiny => !shiny.deleted)));
    formData.append('deleted-local-data', JSON.stringify(localData.filter(shiny => shiny.deleted)));
    formData.append('mdp', await dataStorage.getItem('mdp-bdd'));

    const response = await fetch('/remidex/backend/syncBackup.php?date=' + Date.now(), {
      method: 'POST',
      body: formData
    });
    if (response.status != 200)
      throw '[:(] Erreur ' + response.status + ' lors de la requête';
    const data = await response.json();

    if (data['mdp'] == false)
      throw '[:(] Mauvais mot de passe...';
    
    // Vérifier si le serveur a réussi sa mission
    console.log('[sync-backup] Réponse reçue du serveur :', data);

    if (data['error'] == true) throw data['response'];

    // Mettons à jour les données locales obsolètes
    const toSet = [...data['inserts-local'], ...data['updates-local']];
    await Promise.all(
      toSet.map(shiny => shinyStorage.setItem(String(shiny.huntid), shiny))
    );
    const toDelete = [...data['deletions-local']];
    const prepareForDeletion = async huntid => {
      // Au lieu d'effacer directement les shiny de la base de données locale,
      // on les marque "à détruire" au prochain démarrage de l'appli,
      // pour ne pas rendre obsolète le spritesheet en pleine utilisation de l'appli
      const shiny = await shinyStorage.getItem(String(huntid));
      shiny.destroy = true;
      await shinyStorage.setItem(String(huntid), shiny);
      return;
    };
     await Promise.all(
      toDelete.map(huntid => prepareForDeletion(huntid))
    );

    // Récupérons la liste des huntid créés / modifiés / supprimés
    const modified = [
      ...data['inserts-local'].map(shiny => String(shiny.huntid)),
      ...data['updates-local'].map(shiny => String(shiny.huntid)),
      ...data['deletions-local'].map(huntid => String(huntid)),
      ...data['inserts'].map(shiny => String(shiny.huntid)),
      ...data['updates'].map(shiny => String(shiny.huntid))
    ];

    // Transmettons les informations à l'application
    await dataStorage.setItem('last-sync', 'success');
    if (!message) return true;
    const clients = await self.clients.matchAll();
    clients.map(client => client.postMessage({
      successfulBackupComparison: true,
      quantity: data['results'].length,
      modified
    }));
    return true;
  }

  catch(error) {
    console.error(error);
    await dataStorage.setItem('last-sync', 'failure');
    if (!message) throw false;
    const clients = await self.clients.matchAll();
    clients.map(client => client.postMessage({ successfulBackupComparison: false, error }));
    return false;
  }
}