/* <?php

// Get file versions to install

ob_start();
include __DIR__.'/backend/actions/get-file-versions.php';
$json = ob_get_clean();

$fileVersions = json_decode($json, true);
$maxVersion = max($fileVersions);


// Include FrontendShiny class and its toBackend() method

echo '*'.'/';
ob_start();
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/dist/modules/ShinyBackend.js';
$body = ob_get_clean();
echo preg_replace('/^export /m', '', $body);
echo '/'.'*';

?> */

importScripts('./ext/localforage.min.js');

// Data storage
//// Shiny Pokémon
const shinyStorage = localforage.createInstance({
  name: 'shinydex',
  storeName: 'shiny-list',
  driver: localforage.INDEXEDDB
});
//// Hunts
const huntStorage = localforage.createInstance({
  name: 'shinydex',
  storeName: 'hunts',
  driver: localforage.INDEXEDDB
});
//// Miscellaneous data
const dataStorage = localforage.createInstance({
  name: 'shinydex',
  storeName: 'misc',
  driver: localforage.INDEXEDDB
});

const cachePrefix = 'shinydex-sw';
const currentCacheName = `${cachePrefix}-<?=$maxVersion?>`;
const liveFileVersions = JSON.parse(`<?=json_encode($fileVersions, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)?>`);
const spritesCacheName = 'shinydex-sw-sprites-v1';



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

  const swOrigin = location.origin;
  const requestOrigin = new URL(event.request.url).origin;

  // Shinydex files are cached
  if (swOrigin === requestOrigin) {
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
          .catch(error => console.error(error, event.request))
        )
      } else {
        // If it's a big sprite, respond from network, and if not available, from small sprites cache.
        const smallSpriteUrl = event.request.url.replace(new RegExp('webp/[0-9]+?/'), 'webp/112/');
        event.respondWith(
          fetch(event.request)                            // 1. Fetch the big sprite online
          .catch(error => caches.open(spritesCacheName)       // 2. If not found, look in the cache for the corresponding
            .then(cache => cache.match(smallSpriteUrl))   //    small sprite and return it
          )
          .catch(error => console.log(error, event.request))
        )
      }
    }
    
    // If it's not a sprite, respond with cache first, then network if uncached.
    else {
      event.respondWith(
        caches.open(currentCacheName)
        .then(cache => cache.match(event.request))                // 1. Look if the file is in cache
        .then(matching => matching || fetch(event.request))       // 2. If not, fetch it online
        .catch(error => console.error(error, event.request))
      )
    }
  }

  // External files are not cached
  else {
    event.respondWith(
      fetch(event.request)
      .catch(error => console.error(error, event.request))
    )
  }
});


// MESSAGE
self.addEventListener('message', async function(event) {
  console.log('[sw] Message reçu :', event.data);
  const action = event.data?.action;

  switch (action) {
    case 'sync-backup': {
      event.waitUntil(
        syncBackup()
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


// PERIODIC SYNC
self.addEventListener('periodicsync', function(event) {
  console.log('[sw] Requête PERIODIC SYNC reçue :', event.tag);

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

    let response = await fetch(`./backend/endpoint.php?request=get-all-sprites&date=${Date.now()}`);
    if (!(response.status === 200)) {
      throw new Error('Could not fetch list of sprites');
    }

    let response2 = response.clone();
    try {
      response = await response.json();
    } catch {
      response = await response2.text();
      throw new Error('Invalid json:', response);
    }

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
  try {
    // Tell the app a data sync is starting
    if (message) {
      const clients = await self.clients.matchAll();
      clients.map(client => client.postMessage('startBackupSync'));
    }

    // Get local data
    await Promise.all([shinyStorage.ready(), huntStorage.ready()]);
    const localData = await Promise.all(
      (await shinyStorage.keys())
      .map(async key => {
        const shiny = await shinyStorage.getItem(key);
        return (new FrontendShiny(shiny)).toBackend();
      })
    );
    const deletedLocalData = (await Promise.all(
      (await huntStorage.keys())
      .map(async key => {
        const hunt = await huntStorage.getItem(key);
        if ('deleted' in hunt && hunt.deleted && !hunt.destroy) return (new FrontendShiny(hunt)).toBackend();
        else return null;
      })
    ))
    .filter(pkmn => pkmn != null);

    // Send local data to the backend
    const formData = new FormData();
    formData.append('local-data', JSON.stringify(localData));
    formData.append('deleted-local-data', JSON.stringify(deletedLocalData));
    formData.append('signin-code-verifier', await dataStorage.getItem('session-code-verifier'));

    const response = await fetch('/shinydex/backend/endpoint.php?request=sync-backup&date=' + Date.now(), {
      method: 'POST',
      body: formData
    });
    if (response.status != 200)
      throw new Error('[:(] Erreur ' + response.status + ' lors de la requête');

    let data;
    let response2 = response.clone();
    try {
      data = await response.json();
    } catch {
      data = await response2.text();
      throw new Error(`Invalid json: ${data}`);
    }
    
    console.log('[sync-backup] Response from server:', data);

    if ('error' in data) throw new Error(data.error);

    // Update local data with newer online data
    const toSet = [...data['to_insert_local'], ...data['to_update_local']];
    await Promise.all(
      toSet.map(shiny => {
        const feShiny = new FrontendShiny(shiny);
        return shinyStorage.setItem(String(shiny.huntid), feShiny);
      })
    );

    const toDelete = [...data['to_delete_local']];
    await Promise.all(
      toDelete.map(async shiny => {
        const storedShiny = await shinyStorage.getItem(shiny.huntid);
        if (storedShiny) {
          storedShiny.lastUpdate = shiny.lastUpdate;
          storedShiny.deleted = true;
          storedShiny.destroy = true;
          await huntStorage.setItem(shiny.huntid, storedShiny);
          return shinyStorage.removeItem(shiny.huntid);
        } else {
          const storedHunt = await huntStorage.getItem(shiny.huntid);
          if (storedHunt) {
            storedHunt.destroy = true;
            return huntStorage.setItem(shiny.huntid, storedHunt);
          }
        }
      })
    );

    const toRestore = [...data['to_restore_local']];
    await Promise.all(
      toRestore.map(shiny => huntStorage.removeItem(shiny.huntid))
    );

    // List of inserted / updated / deleted huntids
    const modifiedHuntids = new Set([
      ...data['to_insert_local'].map(shiny => String(shiny.huntid)),
      ...data['to_update_local'].map(shiny => String(shiny.huntid)),
      ...data['to_delete_local'].map(shiny => String(shiny.huntid)),
      ...data['to_restore_local'].map(shiny => String(shiny.huntid)),
    ]);

    // Send data back to the app
    await dataStorage.setItem('last-sync-state', 'success');

    if (message) {
      const clients = await self.clients.matchAll();
      clients.map(client => client.postMessage({
        successfulBackupSync: true,
        quantity: data['results'].length,
        modified: [...modifiedHuntids],
        error: !(data['results'].every(r => r === true))
      }));
    }

    return true;
  }

  catch(error) {
    console.error(error);
    await dataStorage.setItem('last-sync-state', 'failure');

    if (message) {
      const clients = await self.clients.matchAll();
      clients.map(client => client.postMessage({ successfulBackupSync: false, error }));
    }
    
    return false;
  }
}