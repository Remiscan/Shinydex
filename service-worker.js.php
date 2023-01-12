/* <?php

ob_start();
include __DIR__.'/backend/file-versions.php';
$json = ob_get_clean();

$fileVersions = json_decode($json, true);
$maxVersion = max($fileVersions);

?> */

importScripts('./ext/localforage.min.js');

// Data storage
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

const cachePrefix = 'remidex-sw';
const currentCacheName = `${cachePrefix}-<?=$maxVersion?>`;
const liveFileVersions = JSON.parse(`<?=json_encode($fileVersions, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)?>`);
const spritesCacheName = 'remidex-sw-sprites-v1';



///// EVENTS


// INSTALL
self.addEventListener('install', function(event) {
  console.log('[install] Installing service worker...');
  event.waitUntil(
    installFiles(event)
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
  console.log('[activate] Service worker active!');
});


// FETCH
self.addEventListener('fetch', function(event) {
  // Is it a sprite? Store small sprites in the sprites cache,
  // and respond to big sprites with the small sprites from cache if needed.
  const isSprite = event.request.url.match('images/pokemon-sprites/webp');
  const isSmallSprite = event.request.url.match('images/pokemon-sprites/webp/112');

  if (isSprite) {
    if (isSmallSprite) {
      // If it's a small sprite, respond from cache, and if not cached, from network and then cache it.
      event.respondWith(
        caches.open(spritesCacheName)
        .then(cache => cache.match(event.request)                       // 1. Look if the small sprite is in cache
          .then(matching => matching || fetch(event.request))           // 2. If not, fetch it online
          .then(response => cache.put(event.request, response.clone())  // 3. Store the fetched small sprite in cache
            .then(() => response)                                       // 4. Return the fetched small sprite
          )
        )
        .catch(error => console.error(error, event.request.url))
      )
    } else {
      // If it's a big sprite, respond from network, and if not available, from small sprites cache.
      const smallSpriteUrl = event.request.url.replace(new RegExp('webp/[0-9]+?/'), 'webp/112/');
      event.respondWith(
        fetch(event.request)                            // 1. Fetch the big sprite online
        .catch(error => caches.open(spritesCacheName)       // 2. If not found, look in the cache for the corresponding
          .then(cache => cache.match(smallSpriteUrl))   //    small sprite and return it
        )
        .catch(error => console.log(error, event.request.url))
      )
    }
  }
  
  // If it's not a sprite, respond with cache first, then network if uncached.
  else {
    event.respondWith(
      caches.open(currentCacheName)
      .then(cache => cache.match(event.request))                // 1. Look if the file is in cache
      .then(matching => matching || fetch(event.request))       // 2. If not, fetch it online
      .catch(error => console.error(error, event.request.url))
    )
  }
});


// MESSAGE
self.addEventListener('message', async function(event) {
  console.log('[sw] Message reçu :', event.data);
  const action = event.data?.action;

  switch (action) {
    case 'sync-backup': {
      const source = event.ports[0];

      event.waitUntil(
        syncBackup(false)
        .then(() => source.postMessage({ successfulBackupComparison: true, noresponse: true }))
        .catch(() => source.postMessage({ successfulBackupComparison: false, noresponse: true }))
      );
    } break;


    case 'force-update': {
      const source = event.ports[0];

      try {
        await self.skipWaiting();
        source.postMessage({ ready: true });
      } catch (error) {
        source.postMessage({ ready: false, error });
      }
    } break;


    case 'cache-all-sprites': {
      const source = event.ports[0];

      event.waitUntil(
        cacheAllSprites(source)
        .catch(error => console.error(error))
      );
    } break;


    case 'delete-all-sprites': {
      event.waitUntil(
        caches.open(spritesCacheName)
        .then(cache => cache.keys()
          .then(keys => Promise.all(keys.map(key => cache.delete(key))))
        )
        .catch(error => console.error(error))
      )
    }
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

  const newCache = await caches.open(currentCacheName);

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
      if (newVersion !== oldVersion || oldVersion === 0) {
        response = await fetch(request);
        console.log(`File ${file} updated (${oldVersion} => ${newVersion})`);
      }

      // If the locally installed file is already the most recent version
      else {
        response = (await caches.match(new Request(file))) ?? (await fetch(request));
      }

      if (!response.ok) throw Error(`[${action}] File download failed: (${request.url})`);
      await newCache.put(request, response);

      if (source) source.postMessage({ action: 'update-files', loaded: true, total: filesQuantity, url: file });
      return;
    }));

    console.log(`[${action}] File installation complete!`);
    deleteOldCaches(currentCacheName, action);
    dataStorage.setItem('file-versions', liveFileVersions);

    // Also initialize the sprites cache
    await caches.open(spritesCacheName);
    const shouldCacheAllSprites = await dataStorage.getItem('cache-all-sprites');
    if (shouldCacheAllSprites === true) {
      cacheAllSprites();
    }
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


/** Stores all sprites in the sprites cache. */
let cachingAllSprites = false;
async function cacheAllSprites(source) {
  if (cachingAllSprites) return;
  try {
    cachingAllSprites = true;

    let response = await fetch(`./backend/getAllSprites.php?date=${Date.now()}`);
    if (!(response.status === 200)) {
      throw new Error('Could not fetch list of sprites');
    }
    response = await response.json();

    const allSprites = (response['files'] ?? []).map(path => `${location.origin}/shinydex/images/pokemon-sprites/webp/112/${path}`);
    const allSpritesNumber = allSprites.length;
    const totalSize = Number(response['size']) || 0;

    const cache = await caches.open(spritesCacheName);
    const spritesAlreadyCached = (await cache.keys()).map(key => key.url);
    const spritesAlreadyCachedNumber = spritesAlreadyCached.length;

    if (spritesAlreadyCachedNumber === allSpritesNumber) {
      source?.postMessage({ action: 'cache-all-sprites', totalSize, progress: 1, progressWithErrors: 1, error: false });
      return;
    }

    const spritesToCache = allSprites.filter(sprite => !(spritesAlreadyCached.includes(sprite)));
    let spritesNewlyCachedNumber = 0;
    let spritesFailedToCache = 0;

    // Fetch sprits in groups, to avoid "insufficient resources" error
    const groupSize = 25;
    while (spritesToCache.length > 0) {
      const group = spritesToCache.splice(0, groupSize);

      await Promise.all(group.map(async sprite => {
        try {
          await cache.add(sprite);
          spritesNewlyCachedNumber++;
          const progress = (spritesAlreadyCachedNumber + spritesNewlyCachedNumber) / allSpritesNumber;
          const progressWithErrors = (spritesAlreadyCachedNumber + spritesNewlyCachedNumber + spritesFailedToCache) / allSpritesNumber;
          source?.postMessage({ action: 'cache-all-sprites', totalSize, progress, progressWithErrors, error: false });
          return sprite;
        } catch (error) {
          spritesFailedToCache++;
          const progress = (spritesAlreadyCachedNumber + spritesNewlyCachedNumber) / allSpritesNumber;
          const progressWithErrors = (spritesAlreadyCachedNumber + spritesNewlyCachedNumber + spritesFailedToCache) / allSpritesNumber;
          source?.postMessage({ action: 'cache-all-sprites', totalSize, progress, progressWithErrors, error: true });
        }
      }));
    }

    return;
  } catch (error) {
    console.error(error);
  } finally {
    cachingAllSprites = false;
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
        if (cache.startsWith(cachePrefix) && newCacheName !== cache && spritesCacheName !== cache) return caches.delete(cache);
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
  return;
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