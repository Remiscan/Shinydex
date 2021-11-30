import { dataStorage, huntStorage, shinyStorage } from './localforage.js';



export async function upgradeStorage(fromJSON: boolean = false): Promise<void> {
  const lastStorageUpgrade = Number(await dataStorage.getItem('last-storage-upgrade'));
  const versionFichiers = await dataStorage.getItem('version-fichiers');

  if (lastStorageUpgrade > versionFichiers && !fromJSON) return;

  // Update the structure of stored shiny Pokémon
  const shinyKeys = await shinyStorage.keys();
  for (const key of shinyKeys) {
    const shiny = toNewFormat(await shinyStorage.getItem(key));
    await shinyStorage.setItem(key, shiny);
  }

  // Update the structure of stored Hunts
  const huntKeys = await shinyStorage.keys();
  for (const key of huntKeys) {
    const hunt = toNewFormat(await huntStorage.getItem(key));
    await shinyStorage.setItem(key, hunt);
  }

  // Remove old filters
  const filtres = await dataStorage.getItem('filtres');
  if (!(filtres instanceof Map)) await dataStorage.removeItem('filtres');

  // Delete old, now obsolete stored items
  await dataStorage.removeItem('version-bdd');

  await dataStorage.setItem('last-storage-upgrade', Date.now());
  return;
}



function toNewFormat(shiny: { [key: string]: any }): { [key: string]: any } {
  // Rename properties whose name changed
  const renames = new Map([
    ['last_update', 'lastUpdate'],
    ['numero_national', 'dexid'],
    ['forme', 'formid'],
    ['origin', 'checkmark'],
    ['monjeu', 'DO'],
    ['aupif', 'horsChasse'],
    ['description', 'notes'],
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

  return shiny;
}