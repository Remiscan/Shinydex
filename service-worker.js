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
  //console.log('[fetch] Le service worker récupère l\'élément ' + event.request.url);
  // Si l'élément est un sprite (non mis en cache par le sw), on le récupère sur le réseau
  if (event.request.url.match(/(.+)\/poke_(capture|icon)_(.+)/))
  {
    event.respondWith(
      fetch(event.request)
      .catch(error => console.error(error))
    )
  }
  // On récupère le contenu dans le cache, et s'il n'y est pas, sur le réseau
  else
  {
    event.respondWith(
      caches.match(event.request)
      .then(matching => {
        return matching || fetch(event.request);
      })
      .catch(error => console.error(error))
    )
  }
});


// MESSAGE
self.addEventListener('message', function(event) {
  // UPDATE
  if (event.data.action == 'update')
  {
    console.log('[update] Mise à jour de l\'application demandée...');
    const source = event.source;

    event.waitUntil(
      getData(event.data.force)
      .then(data => installData(data, 'update', event))
      .catch(error => {
        source.postMessage({ loaded: false, erreur: true });
        console.error(error);
      })
    );
  }
});


// SYNC
self.addEventListener('sync', async function(event) {
  const PRE_HUNT_ADD = 'HUNT-ADD-';
  const PRE_HUNT_EDIT = 'HUNT-EDIT-';
  const PRE_HUNT_DELETE = 'HUNT-DELETE-';
  // Upload d'une chasse dans la BDD en ligne
  if (event.tag.startsWith(PRE_HUNT_ADD)) {
    const huntid = event.tag.replace(PRE_HUNT_ADD, '');
    return await sendHunt(huntid);
  }
  // Édition d'une chasse dans la BDD en ligne
  // (code identique pour l'instant, le serveur différencie entre ADD et EDIT)
  else if (event.tag.startsWith(PRE_HUNT_EDIT)) {
    const huntid = event.tag.replace(PRE_HUNT_EDIT, '');
    return await sendHunt(huntid);
  }
  // Suppression d'une chasse dans la BDD en ligne
  else if (event.tag.startsWith(PRE_HUNT_DELETE)) {
    const huntid = event.tag.replace(PRE_HUNT_DELETE, '');
    return await deleteHunt(huntid);
  }
});



///// FONCTIONS


// Récupérer les données du Rémidex
function getData() {
  // On récupère les données les plus récentes
  const promiseData = fetch('/remidex/mod_update.php?type=full&date=' + Date.now())
  .then(response => {
    if (response.status == 200)
      return response;
    else
      throw '[:(] Erreur ' + response.status + ' lors de la requête (mod_update.php)';
  })
  .then(response => response.json());

  // On récupère la liste des fichiers à mettre en cache
  const promiseFiles = fetch('cache.json?' + Date.now())
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
  // On commence par mettre à jour les fichiers :
  // - en cas de succès, on mettra à jour les données
  // - sinon, on supprimera le nouveau cache, ce qui laissera l'ancien cache et les anciennes données
  const versionMax = Math.max(data['version-fichiers'], data['version-bdd']);
  const newCACHE = PRE_CACHE + '-' + versionMax;
  const totalFichiers = files.fichiers.length;

  try {
    // Mise à jour des fichiers
    console.log(`[${action}] Mise en cache des fichiers :`, files.fichiers);
    const cache = await caches.open(newCACHE);
    await Promise.all(
      files.fichiers.map(async url => {
        const request = new Request(url, {cache: 'reload'});
        const response = await fetch(request);
        if (!response.ok)
          throw Error(`[${action}] Le fichier n\'a pas pu être récupéré...`, request.url);
        if (event != null) {
          const source = event.source;
          source.postMessage({ loaded: true, total: totalFichiers, url: request.url });
        }
        return cache.put(request, response);
      })
    );
    console.log(`[${action}] Mise en cache des fichiers terminée !`);

    // Mise à jour des données
    console.log(`[${action}] Installation des données...`);
    await Promise.all([dataStorage.ready(), shinyStorage.ready(), pokemonData.ready()]);
    await dataStorage.setItem('version-fichiers', data['version-fichiers']);
    await dataStorage.setItem('version-bdd', data['version-bdd']);
    await dataStorage.setItem('version', versionMax);
    await Promise.all(
      data['data-shinies'].map(shiny => shinyStorage.setItem(String(shiny.id), shiny))
    );
    await Promise.all(
      data['pokemon-data'].map(pkmn => pokemonData.setItem(String(pkmn.dexid), pkmn))
    );
    console.log(`[${action}] Installation des données terminée !`);
  }

  // Si le nouveau cache n'a pas été complété, ou que les données n'ont pas pu être récupérées,
  // on supprime le nouveau cache.
  catch(error) {
    await caches.delete(newCACHE);
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


// Envoie une chasse de la BDD locale vers la BDD en ligne
async function sendHunt(huntid) {
  try {
    const hunt = await huntStorage.getItem(huntid);

    const formData = new FormData();
    formData.append('hunt', JSON.stringify(hunt));
    formData.append('mdp', await dataStorage.getItem('mdp-bdd'));

    console.log(JSON.stringify(hunt));

    const response = await fetch('mod_sendHuntToDb.php', {
      method: 'POST',
      body: formData
    });
    if (response.status != 200)
      throw '[:(] Erreur ' + response.status + ' lors de la requête';
    const data = response.json();

    if (data['mdp'] == false)
      throw '[:(] Mauvais mot de passe...';
    
    // Traiter la réponse et vérifier le bon ajout à la BDD
    console.log('Réponse reçue du serveur :', data);
    if (data['stored-data'] == false)
      throw '[:(] Chasse non stockée dans la BDD...';
    
    if (
      parseInt(data['stored-data']['numero_national']) == hunt.dexid
      && data['stored-data']['forme'] == hunt.forme
      && data['stored-data']['surnom'] == hunt.surnom
      && data['stored-data']['methode'] == hunt.methode
      && data['stored-data']['compteur'] == hunt.compteur
      && data['stored-data']['date'] == hunt.date
      && data['stored-data']['jeu'] == hunt.jeu
      && data['stored-data']['ball'] == hunt.ball
      && data['stored-data']['description'] == hunt.description
      && parseInt(data['stored-data']['origin']) == hunt.origin
      && parseInt(data['stored-data']['monjeu']) == hunt.monjeu
      && parseInt(data['stored-data']['charm']) == hunt.charm
      && parseInt(data['stored-data']['hacked']) == hunt.hacked
      && parseInt(data['stored-data']['aupif']) == hunt.aupif
    ) {
      // La chasse est bien dans la BDD,
      // on peut la supprimer de indexedDB.
      return await huntStorage.removeItem(huntid);
    } else {
      console.log(
        parseInt(data['stored-data']['numero_national']) == hunt.dexid,
        data['stored-data']['forme'] == hunt.forme,
        data['stored-data']['surnom'] == hunt.surnom,
        data['stored-data']['methode'] == hunt.methode,
        data['stored-data']['compteur'] == hunt.compteur,
        data['stored-data']['date'] == hunt.date,
        data['stored-data']['jeu'] == hunt.jeu,
        data['stored-data']['ball'] == hunt.ball,
        data['stored-data']['description'] == hunt.description,
        parseInt(data['stored-data']['origin']) == hunt.origin,
        parseInt(data['stored-data']['monjeu']) == hunt.monjeu,
        parseInt(data['stored-data']['charm']) == hunt.charm,
        parseInt(data['stored-data']['hacked']) == hunt.hacked,
        parseInt(data['stored-data']['aupif']) == hunt.aupif
      );
      throw '[:(] Erreur de copie pendant la sauvegarde de la chasse...';
    }

  } catch(error) {
    console.error(error);
    return;
  }
}


// Supprime un shiny de la BDD à partir de l'édition de sa chasse en local
async function deleteHunt(huntid) {
  // Cette fonction n'est pas implémentée pour l'instant.
  return;
}