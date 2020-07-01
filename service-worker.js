var PRE_CACHE = 'remidex-sw';

///// EVENTS

// INSTALLATION
self.addEventListener('install', function(event)
{
  console.log('[install] Début de l\'installation du service worker...');
  event.waitUntil(
    caches.open(PRE_CACHE)
    .then(cache => {
      // On récupère le contenu du fichier cache.json
      return fetch('cache.json?' + Date.now())
      .then(response => {
        return response.json();
      })
      .then(jsondata => {
        // Ensuite, on ajoute au cache la liste des fichiers du cache.json
        console.log('[install] Mise en cache des fichiers listés dans cache.json : ', jsondata.fichiers);
        return Promise.all(
          jsondata.fichiers.map(url => {
            let request = new Request(url, {cache: 'reload'});
            return fetch(request)
            .then(response => {
              if (!response.ok)
                throw Error('[install] Le fichier n\'a pas pu être récupéré...');
              return cache.put(request, response);
            })
          })
        )
      })
    })
    .then(() => {
      console.log('[install] Tous les fichiers sont dans le cache !');
      return deleteOldCaches(PRE_CACHE, 'install');
    })
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
  console.log('[activate] Définition de ce service worker comme service worker actif de cette page');
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
self.addEventListener('message', function(event)
{
  var source = event.source; // client source du message

  // UPDATE
  if (event.data.action == 'update')
  {
    var newCACHE = PRE_CACHE + '-' + event.data.version;
    var responsePORT = event.ports[0];
    console.log('[update] Mise à jour du cache demandée...');
    event.wainUntil(
      caches.open(newCACHE)
      .then(cache => {
        // On récupère le contenu du fichier cache.json
        return fetch('cache.json?' + Date.now())
        .then(response => {
          return response.json();
        })
        .then(jsondata => {
          // Ensuite, on ajoute au cache la liste des fichiers du cache.json
          console.log('[update] Mise en cache des fichiers listés dans cache.json : ', jsondata.fichiers);
          var totalFichiers = jsondata.fichiers.length;
          return Promise.all(
            jsondata.fichiers.map(url => {
              let request = new Request(url, {cache: 'reload'});
              return fetch(request)
              .then(response => {
                if (!response.ok)
                  throw Error('[update] Le fichier n\'a pas pu être récupéré...', request.url);
                source.postMessage({loaded: true, total: totalFichiers, url: request.url});
                return cache.put(request, response);
              })
            })
          )
        })
      })
      .then(() => {
        console.log('[update] Mise à jour du cache terminée !');
        // Supprimons les vieux caches
        return deleteOldCaches(newCACHE, 'update')
        .catch(raison => console.log('[update] ' + raison))
        .then(() => {
          responsePORT.postMessage({message: '[update] Nettoyage terminé !'});
        })
      })
      .catch(error => {
        source.postMessage({loaded: false, erreur: true});
        console.error(error);
        return caches.delete(newCACHE)
        .then(() => 
          console.log('[:(] Mise à jour annulée')
        );
      })
    )
  }
});

///// FONCTIONS

// Supprimer tous les caches qui ne sont pas newCache
function deleteOldCaches(newCache, action)
{
  return caches.keys()
  .then(allCaches => {
    if (allCaches.length <= 1)
      throw 'Aucun cache redondant à supprimer';
    console.log('[' + action + '] Nettoyage des anciennes versions du cache');
    return Promise.all(
      allCaches.map(ceCache => {
        if (ceCache.startsWith(PRE_CACHE) && newCache != ceCache)
          return caches.delete(ceCache);
      })
    )
    .then(() => {
      console.log('[' + action + '] Nettoyage terminé !');
      return '[' + action + '] Nettoyage terminé !';
    })
  })
  .catch(error => console.log(error));
}