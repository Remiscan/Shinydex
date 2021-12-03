import { huntedPokemon } from "./Hunt.js";
import { dataStorage, huntStorage, localForageAPI, shinyStorage } from "./localforage.js";
import { Notif } from "./notification.js";
import { timestamp2date, wait } from "./Params.js";
import { frontendShiny } from "./Pokemon.js";
import { upgradeStorage } from "./upgradeStorage.js";



//////////////////////////////////////////////////////////
// Peuple l'application avec les données d'un fichier JSON
export async function json2import(file: File | Blob | undefined): Promise<string> {
  if (file == null) return 'Aucun fichier choisi';

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', async (event: ProgressEvent)  => {
      const importedData = typeof reader.result === 'string' ? JSON.parse(reader.result) : reader.result;
      if (!('shiny' in importedData) || !('hunts' in importedData))
        return reject(`Le fichier importé n'est pas structuré correctement.`);

      const notification = new Notif('Mise à jour des données...', '', 'loading', Notif.maxDelay, () => {});
      notification.prompt();
      const startTime = performance.now();

      await shinyStorage.ready();
      await Promise.all(
        importedData.shiny.map((shiny: frontendShiny) => shinyStorage.setItem(shiny.huntid, shiny))
      );
      await huntStorage.ready();
      await Promise.all(
        importedData.hunts.map((hunt: huntedPokemon) => huntStorage.setItem(hunt.huntid, hunt))
      );

      await upgradeStorage(true);

      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['mes-chromatiques', 'chasses-en-cours', 'corbeille'],
          ids: [
            ...importedData.shiny.map((shiny: frontendShiny) => shiny.huntid),
            ...importedData.hunts.map((hunt: huntedPokemon) => hunt.huntid)
          ]
        }
      }));

      const duration = performance.now() - startTime;
      await wait(Math.max(0, 1000 - duration));
      notification.hide();

      return resolve(`Fichier correctement importé !`);
    });
    reader.readAsText(file);
  });
}



//////////////////////////////
// Exporte les données en JSON
export async function export2json(): Promise<void> {
  const getItems = async (store: localForageAPI): Promise<any[]> => {
    await store.ready();
    const keys = await store.keys();
    const items = [];
    for (const key of keys) {
      items.push(await store.getItem(key));
    }
    return items;
  };

  const data = {
    shiny: await getItems(shinyStorage),
    hunts: await getItems(huntStorage)
  };
  const dataString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;

  const a = document.createElement('A') as HTMLAnchorElement;
  a.href = dataString;
  await dataStorage.ready();
  a.download = `shinydex-${timestamp2date(Date.now()).replace(' ', '_')}.json`;
  a.setAttribute('style', 'position: absolute; width: 0; height: 0;');
  document.body.appendChild(a);

  a.click();
  a.remove();

  return;
}