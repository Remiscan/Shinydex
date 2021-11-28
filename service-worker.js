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
self.addEventListener('install', function(event)
{
  console.log('[install] Installation du service worker...');
  event.waitUntil(
    getData(true)
    .then(data => installData(data, 'install'))
    .catch(raison => console.log('[install] ' + raison))
    .then(() => {
      console.log('[install] Le service worker est bien installé !');
      return self.skipWaiting(); // force l'activation du service worker
    })
    .catch(error => console.error(error))
  )
});


// ACTIVATION
self.addEventListener('activate', function(event)
{
  console.log('[activate] Activation du service worker');
  event.waitUntil(self.clients.claim()); // force le service worker à prendre le contrôle de la page immédiatement
});


// FETCH
self.addEventListener('fetch', function(event)
{
  event.respondWith(
    caches.match(event.request)
    .then(matching => {
      return matching || fetch(event.request);
    })
    .catch(error => console.error(error))
  )
});


// MESSAGE
self.addEventListener('message', function(event) {
  console.log('[sw] Message reçu :', event.data);

  // FULL UPDATE
  if (event.data && event.data.action == 'update') {
    const source = event.source;

    event.waitUntil(
      getData()
      .then(data => installData(data, 'update', event))
      .catch(error => {
        source.postMessage({ loaded: false, erreur: true });
        console.error(error);
      })
    );
  }

  // COMPARE-BACKUP
  else if (event.data && event.data.action == 'sync-backup') {
    const source = event.ports[0];

    event.waitUntil(
      syncBackup(false)
      .then(() => source.postMessage({ successfulBackupComparison: true, noresponse: true }))
      .catch(() => source.postMessage({ successfulBackupComparison: false, noresponse: true }))
    );
  }
});


// SYNC
self.addEventListener('sync', function(event) {
  console.log('[sw] Requête SYNC reçue :', event.tag);

  if (event.tag == 'SYNC-BACKUP') {
    event.waitUntil(
      syncBackup()
    );
  }
});



///// FONCTIONS


// Récupérer les données du Rémidex
function getData() {
  // On récupère les données les plus récentes
  const promiseData = fetch('/remidex/backend/update.php?type=full&date=' + Date.now())
  .then(response => {
    if (response.status == 200)
      return response;
    else
      throw '[:(] Erreur ' + response.status + ' lors de la requête (mod_update.php)';
  })
  .then(response => response.json());

  // On récupère la liste des fichiers à mettre en cache
  const promiseFiles = fetch('cache.json?date=' + Date.now())
  .then(response => {
    if (response.status == 200)
      return response;
    else
      throw '[:(] Erreur ' + response.status + ' lors de la requête (cache.json)';
  })
  .then(response => response.json());

  // On récupère en parallèle les données et la liste des fichiers
  return Promise.all([promiseData, promiseFiles]);
}


// Installer les données du Rémidex
async function installData([data, files], action = 'install', event = null) {
  const newCACHE = PRE_CACHE + '-' + data['version-fichiers'];
  const totalFichiers = files.fichiers.length;

  try {
    // Mise à jour des données
    console.log(`[${action}] Installation des données...`);
    await Promise.all([dataStorage.ready(), shinyStorage.ready(), pokemonData.ready()]);
    await dataStorage.setItem('version-fichiers', Number(data['version-fichiers']));
    await dataStorage.setItem('pokemon-names', data['pokemon-names']);
    await dataStorage.setItem('pokemon-names-fr', data['pokemon-names-fr']);
    await Promise.all(
      data['pokemon-data'].map(pkmn => pokemonData.setItem(String(pkmn.dexid), pkmn))
    );
    console.log(`[${action}] Installation des données terminée !`);

    // Mise à jour des fichiers
    console.log(`[${action}] Mise en cache des fichiers :`, files.fichiers);
    const cache = await caches.open(newCACHE);
    await Promise.all(
      files.fichiers.map(async url => {
        if (url == './sprites.php') {
          await updateSprite();
        }
        else {
          const request = new Request(url, {cache: 'reload'});
          const response = await fetch(request);
          if (!response.ok)
            throw Error(`[${action}] Le fichier n\'a pas pu être récupéré... (${request.url})`);
          await cache.put(request, response);
        }
        
        if (event != null) {
          const source = event.source;
          source.postMessage({ loaded: true, total: totalFichiers, url: url });
        }
        return;
      })
    );
    console.log(`[${action}] Mise en cache des fichiers terminée !`);
  }

  // Si le nouveau cache n'a pas été complété, ou que les données n'ont pas pu être récupérées,
  // on supprime le nouveau cache.
  catch(error) {
    await caches.delete(newCACHE);
    console.error(error);
    throw Error(`[${action}] Installation annulée.`);
  }

  // Si le nouveau cache et les nouvelles données ont tous deux été correctement installés
  try {
    await deleteOldCaches(newCACHE, action);
    if (event != null) {
      const responsePORT = event.ports[0];
      responsePORT.postMessage({message: `[${action}] Installation de l'appli. terminée !`});
    }
  } catch(error) {
    throw error;
  }
}


// Supprimer tous les caches qui ne sont pas newCache
async function deleteOldCaches(newCache, action)
{
  try {
    const allCaches = await caches.keys();
    if (allCaches.length <= 1)
      throw 'Aucun cache redondant à supprimer';
    console.log('[' + action + '] Nettoyage des anciennes versions du cache');
    await Promise.all(
      allCaches.map(ceCache => {
        if (ceCache.startsWith(PRE_CACHE) && newCache != ceCache)
          return caches.delete(ceCache);
        else
          return;
      })
    );
    console.log('[' + action + '] Nettoyage terminé !');
    return '[' + action + '] Nettoyage terminé !';
  }
  catch (error) {
    return console.log(error);
  }
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


// Met à jour sprites.php dans le cache à partir des données locales.
// Pour mettre à jour sprites.php à partir des données en ligne, utiliser updateShinyData()
async function updateSprite(_version = null) {
  try {
    await Promise.all([shinyStorage.ready(), dataStorage.ready()]);

    let version = _version ||  await dataStorage.getItem('version-bdd') || 0;
    
    // On récupère et ordonne la liste des sprites à partir des données locales
    let keys = await shinyStorage.keys();
    keys = keys.sort((a, b) => a - b);
    let data = await Promise.all(keys.map(key => shinyStorage.getItem(key)));
    data = data.filter(shiny => !shiny.deleted);
    data = data.map(s => [s['numero_national'], s['forme'], s['id']]);

    // On envoie les données des sprites à sprites.php
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    let spriteRequest = new Request(`./sprites--${version}.php`, { method: 'POST', cache: 'reload', body: formData });
    
    const sprite = await fetch(spriteRequest);
    if (!sprite.ok)
      throw Error(`[update-sprite] Le fichier n\'a pas pu être récupéré... (${sprite.url})`);

    // On ouvre le cache
    const versionCache = await dataStorage.getItem('version-fichiers');
    const currentCACHE = PRE_CACHE + '-' + versionCache;
    const cache = await caches.open(currentCACHE);

    // On supprime les anciennes versions de sprites.php du cache
    const fichiersEnCache = await cache.keys();
    await Promise.all(fichiersEnCache.map(fichier => {
      if (fichier.url.match(/(.+)sprites--(.+).php$/)) return cache.delete(fichier);
      else return;
    }));

    // On place le nouveau sprites.php dans le cache
    spriteRequest = new Request(`./sprites--${version}.php`);
    return cache.put(spriteRequest, sprite);
  }

  catch(error) {
    console.error(error);
    throw error;
  }
}