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



/**
 * Envoie une demande de synchronication au service worker,
 * qui sera effectuée dans le background.
 */
async function backgroundSync(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;

  const status = await navigator.permissions.query({
    // @ts-expect-error
    name: 'background-sync',
  });
  if (status.state !== 'granted') throw new Error('Background sync permission not granted');

  return reg.sync.register('SYNC-BACKUP');
}


/**
 * Envoie une demande de synchronisation périodique au service worker,
 * qui sera effectuée dans le background.
 * @param enabled - `true` pour activer la synchronisation périodique, `false` pour la désactiver.
 */
async function periodicSync(enabled: boolean): Promise<void> {
  const reg = await navigator.serviceWorker.ready;

  const status = await navigator.permissions.query({
    // @ts-expect-error
    name: 'periodic-background-sync',
  });
  if (status.state !== 'granted') return;

  try {
    if ('periodicSync' in reg && reg.periodicSync && typeof reg.periodicSync === 'object') {
      if (enabled && 'register' in reg.periodicSync && typeof reg.periodicSync.register === 'function') {
        return reg.periodicSync.register('SYNC-BACKUP', {
          minInterval: 24 * 60 * 60 * 1000 // 1 jour
        });
      } else if (!enabled && 'unregister' in reg.periodicSync && typeof reg.periodicSync.unregister === 'function') {
        return reg.periodicSync.unregister('SYNC-BACKUP');
      }
    }
  } catch (error) {
    console.error(error);
  }
}


/**
 * Envoie une demande de synchronisation au service worker,
 * et attend confirmation du résultat.
 * @returns 
 */
export async function immediateSync(): Promise<true | string> {
  const worker = (await navigator.serviceWorker.ready).active;
  return new Promise((resolve, reject) => {
    const chan = new MessageChannel();

    chan.port1.onmessage = event => {
      if (event.data.error) {
        console.error(event.data.error);
        reject('[:(] Erreur de contact du service worker.');
      }

      if ('successfulBackupSync' in event.data) {
        if (event.data.successfulBackupSync === true) resolve(true);
        else reject('[:(] Échec de la synchronisation des BDD.');
      } else {
        reject('[:(] Message invalide reçu du service worker.');
      }
    };

    chan.port1.onmessageerror = event => {
      reject('[:(] Erreur de communication avec le service worker.');
    };

    if (worker == null) {
      reject('[:(] Aucun service worker actif.');
    } else {
      worker.postMessage({ 'action': 'sync-backup' }, [chan.port2]);
    }
  });
}


/**
 * Demande une synchronisation des données,
 * en background si possible, immédiate sinon.
 */
export async function requestSync() {
  try {
    if ('SyncManager' in window) {
      try {
        console.log('Requesting background data sync');
        return await backgroundSync();
      } catch (error) {
        console.log('Background sync failed', error);
        console.log('Trying immediate data sync instead');
        return await immediateSync();
      }
    } else {
      console.log('Requesting immediate data sync');
      return await immediateSync();
    }
  } catch (error) {
    console.error(error);
  }
}