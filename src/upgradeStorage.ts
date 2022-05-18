import { dataStorage, huntStorage, shinyStorage } from './localforage.js';



export async function upgradeStorage(): Promise<void> {
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
    ['formid', 'forme'],
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

  // Add properties that didn't exist before
  const newProperties = new Map([
    ['gene', '']
  ]);

  for (const [prop, defaultValue] of newProperties) {
    if (!shiny.hasOwnProperty(prop)) {
      shiny[prop] = defaultValue;
    }
  }

  // Replace date by timestamp
  // (date will be formatted on display)
  if (shiny.hasOwnProperty('date')) {
    const timestamp = new Date(shiny.date).getTime();
    shiny.timeCapture = Math.max(0, timestamp);
    delete shiny.date;
  }

  // Replace game names with accented versions
  if (shiny.hasOwnProperty('jeu')) {
    const renames = new Map([
      ['Emeraude', 'Émeraude'],
      ['Let\'s Go Evoli', 'Let\'s Go Évoli'],
      ['Epee', 'Épée']
    ]);
    const newName = renames.get(shiny.jeu);
    if (newName)  shiny.jeu = newName;
  }

  return shiny;
}