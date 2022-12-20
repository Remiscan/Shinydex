/* <?php
require_once './backend/cache.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/_common/php/FilePath.php';
$cache = getCacheFiles();

$fileVersions = [];
foreach ($cache['fichiers'] as $file) {
  if ($file === './') $file = './index.php';
  $fileVersions[$file] = version([$file]);
}
?> */

importScripts('./ext/localforage.min.js');

// Data storage
//// Pokédex
const pokemonData = localforage.createInstance({
  name: 'remidex',
  storeName: 'pokemon-data',
  driver: localforage.INDEXEDDB
});
//// Shiny Pokémon
const shinyStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'shiny-list',
  driver: localforage.INDEXEDDB
});
//// Miscellaneous data
const dataStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'misc',
  driver: localforage.INDEXEDDB
});
//// Current hunts
const huntStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'hunts',
  driver: localforage.INDEXEDDB
});

const PRE_CACHE = 'remidex-sw';
const liveFileVersions = JSON.parse(`<?=json_encode($fileVersions, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)?>`);



///// EVENTS


// INSTALL
self.addEventListener('install', function(event) {
  console.log('[install] Installing service worker...');
  event.waitUntil(
    Promise.all([installData(event), installFiles(event)])
    .catch(raison => console.log('[install] ' + raison))
    .then(() => {
      console.log('[install] Service worker installed!');
      return true;
    })
    .catch(error => console.error(error))
  )
});


// ACTIVATE
self.addEventListener('activate', function(event) {
  console.log('[activate] Activating service worker...');
  event.waitUntil(self.clients.claim()); // makes the service worker take control of all clients
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
    case 'update-data': {
      try {
        await installData(event);
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



///// FUNCTIONS


/**
 * Installs all app files.
 * @param {Event|null} event - The event that caused the file installation.
 */
async function installFiles(event = null) {
  const localFileVersions = (await dataStorage.getItem('file-versions')) ?? {};
  const filesQuantity = Object.keys(liveFileVersions).length;

  const newCacheName = `${PRE_CACHE}-${Math.max(...Object.values(liveFileVersions))}`;
  const newCache = await caches.open(newCacheName);

  const source = event?.source || null;
  const action = event?.data?.action || 'install';

  try {
    console.log(`[${action}] Installing files...`);

    await Promise.all(Object.keys(liveFileVersions).map(async file => {
      const oldVersion = localFileVersions[file] ?? 0;
      const newVersion = liveFileVersions[file];

      let response;
      const request = new Request(file, { cache: 'no-store' });

      // If the online file is more recent than the locally installed file
      if (newVersion > oldVersion || oldVersion === 0) {
        response = await fetch(request);
      }

      // If the locally installed file is already the most recent version
      else {
        response = (await caches.match(new Request(url))) ?? (await fetch(request));
      }

      if (!response.ok) throw Error(`[${action}] File download failed: (${request.url})`);
      await newCache.put(request, response);

      if (source) source.postMessage({ action: 'update-files', loaded: true, total: filesQuantity, url: file });
      return;
    }));

    console.log(`[${action}] File installation complete!`);
    deleteOldCaches(newCacheName, action);
    dataStorage.setItem('file-versions', liveFileVersions);
  }

  // If there was an error while installing the new files, delete them
  // and keep the old cache.
  catch (error) {
    await caches.delete(newCache);
    console.log(`[${action}] File installation cancelled.`);
    throw error;
  }

  return;
}


/**
 * Installs app data.
 * @param {Event} event - The event that caused the data installation.
 */
async function installData(event = null) {
  const dataRequest = await fetch(`backend/update.php?type=full&date=${Date.now()}`);
  if (!dataRequest.ok) throw `[:(] Error ${response.status} while fetching update`;
  const data = await dataRequest.json();

  const action = event?.data?.action || 'install';

  try {
    console.log(`[${action}] Installing data...`);
    await Promise.all([dataStorage.ready(), pokemonData.ready()]);
    await dataStorage.setItem('pokemon-names', data['pokemon-names']);
    await dataStorage.setItem('pokemon-names-fr', data['pokemon-names-fr']);
    await Promise.all(
      data['pokemon-data'].map(pkmn => pokemonData.setItem(String(pkmn.dexid), pkmn))
    );
    console.log(`[${action}] Data installation complete!`);
  } catch (error) {
    console.error(error);
    throw Error(`[${action}] Data installation cancelled.`);
  }
}


/**
 * Deletes old caches.
 * @param {string} newCacheName - The new cache's name.
 * @param {'install'|'update'} action - The action during which the caches were removed.
 */
async function deleteOldCaches(newCacheName, action) {
  try {
    const allCaches = await caches.keys();
    if (allCaches.length <= 1) throw 'no-cache';

    console.log(`[${action}] Deleting old cached files`);
    await Promise.all(
      allCaches.map(cache => {
        if (cache.startsWith(PRE_CACHE) && newCacheName != cache) return caches.delete(cache);
        else return Promise.resolve();
      })
    );
    
    console.log(`[${action}] Cache cleanup complete!`);
  } catch (error) {
    if (error === 'no-cache') console.log('No old cache to delete');
    else                      console.error(error);
  }

  return;
}


/**
 * Compares and syncs data between local storage and online database.
 * @param {boolean} message - Whether to message sync progress to the client.
 * @returns {boolean} Whether the data sync was successful.
 */
async function syncBackup(message = true) {
  try {
    // On récupère les données locales
    await shinyStorage.ready();
    const keys = await shinyStorage.keys();
    const localData = await Promise.all(keys.map(key => shinyStorage.getItem(key)));

    await dataStorage.ready();
    const userUUID = await dataStorage.getItem('user-uuid');

    // On envoie les données locales au serveur
    const formData = new FormData();
    formData.append('local-data', JSON.stringify(localData.filter(shiny => !shiny.deleted)));
    formData.append('deleted-local-data', JSON.stringify(localData.filter(shiny => shiny.deleted)));
    formData.append('user-uuid', userUUID);
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