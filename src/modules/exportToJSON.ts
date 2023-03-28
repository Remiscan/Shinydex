import { Hunt } from "./Hunt.js";
import { timestamp2date, wait } from "./Params.js";
import { Shiny } from "./Shiny.js";
import { dataStorage, huntStorage, localForageAPI, shinyStorage } from "./localForage.js";
import { Notif } from "./notification.js";
import { updateDataFormat, upgradeStorage } from "./upgradeStorage.js";



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

      const notification = new Notif('Mise à jour des données...', Notif.maxDelay, undefined, undefined, false);
      notification.prompt();
      notification.element?.classList.add('loading');
      notification.dismissable = false;
      const startTime = performance.now();

      let modifiedIds = new Set();
      await shinyStorage.ready();
      await Promise.all(
        importedData.shiny
        .map((shiny: any) => updateDataFormat(shiny))
        .map((shiny: any) => {
          modifiedIds.add(shiny.huntid);
          return shinyStorage.setItem(shiny.huntid, new Shiny(shiny))
        })
      );
      await huntStorage.ready();
      await Promise.all(
        importedData.hunts
        .map((hunt: any) => updateDataFormat(hunt))
        .map((hunt: any) => {
          modifiedIds.add(hunt.huntid);
          return huntStorage.setItem(hunt.huntid, new Hunt(hunt))
        })
      );

      await upgradeStorage();

      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['mes-chromatiques', 'chasses-en-cours', 'corbeille'],
          ids: [...modifiedIds],
          sync: true
        }
      }));

      const duration = performance.now() - startTime;
      await wait(Math.max(0, 1000 - duration));
      notification.dismissable = true;
      notification.remove();

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
    shiny: (await getItems(shinyStorage)).map(data => {
      const shiny = new Shiny(data);
      shiny.count = shiny.countWithoutNulls;
      return shiny;
    }),
    hunts: (await getItems(huntStorage)).map(data => {
      const hunt = new Hunt(data);
      hunt.count = hunt.countWithoutNulls;
      return hunt;
    })
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