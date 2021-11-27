import { shinyStorage, dataStorage } from './localforage.js';



export async function upgradeStorage() {
  const lastStorageUpgrade = Number(await dataStorage.getItem('last-storage-upgrade'));
  const versionFichiers = await dataStorage.getItem('version-fichiers');

  if (lastStorageUpgrade > versionFichiers) return;

  const keys = await shinyStorage.keys();
  for (const key of keys) {
    const shiny = await shinyStorage.getItem(key);

    // Rename properties whose name changed
    const renames = new Map([
      ['last_update', 'lastUpdate'],
      ['numero_national', 'dexid'],
      ['forme', 'formid'],
      ['origin', 'checkmark'],
      ['monjeu', 'DO'],
      ['aupif', 'horsChasse'],
    ]);

    for (const [oldName, newName] of renames) {
      if (shiny.hasOwnProperty(oldName)) {
        shiny[newName] = shiny[oldName];
        delete shiny[oldName];
      }
    }

    // Replace date by timestamp
    // (date will be formatted on display)
    if (shiny.hasOwnProperty('date')) {
      const timestamp = new Date(shiny.date).getTime();
      shiny.timeCapture = Math.max(0, timestamp);
      delete shiny.date;
    }

    // Store the updated data
    await shinyStorage.setItem(key, shiny);
  }

  await dataStorage.setItem('last-storage-upgrade', Date.now());
  return;
}