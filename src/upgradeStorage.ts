import { dataStorage, huntStorage, shinyStorage } from './localForage.js';
// @ts-expect-error
import gameStrings from '../strings/games.json' assert { type: 'json' };
// @ts-expect-error
import methodStrings from '../strings/methods.json' assert { type: 'json' };



export async function upgradeStorage(): Promise<void> {
  // Update the structure of stored shiny Pokémon
  const shinyKeys = await shinyStorage.keys();
  for (const key of shinyKeys) {
    const shiny = toNewFormat(await shinyStorage.getItem(key));
    await shinyStorage.setItem(key, shiny);
  }

  // Update the structure of stored Hunts
  const huntKeys = await huntStorage.keys();
  for (const key of huntKeys) {
    const hunt = toNewFormat(await huntStorage.getItem(key));
    await shinyStorage.setItem(key, hunt);
  }

  // Remove old filters
  const filtres = await dataStorage.getItem('filtres');
  if (!(filtres instanceof Map) || filtres.get('mes-chromatiques') == null) {
    await dataStorage.removeItem('filtres');
  }

  // Delete old, now obsolete stored items
  await dataStorage.removeItem('version-bdd');
  await dataStorage.removeItem('version-fichiers');
  await dataStorage.removeItem('pokemon-names');
  await dataStorage.removeItem('pokemon-names-fr');
  await dataStorage.removeItem('pokemon-names-en');
  await dataStorage.removeItem('check-updates');

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

  if (shiny.hasOwnProperty('jeu')) {
    // Replace game names with accented versions
    const renames = new Map([
      ['Emeraude', 'Émeraude'],
      ['Let\'s Go Evoli', 'Let\'s Go Évoli'],
      ['Epee', 'Épée'],
      ['Ultra Soleil', 'Ultra-Soleil'],
      ['Ultra Lune', 'Ultra-Lune'],
      ['GO', 'Pokémon GO'],
      ['Légendes Arceus', 'Légendes Pokémon : Arceus'],
    ]);
    const newName = renames.get(shiny.jeu);
    if (newName) shiny.jeu = newName;

    // Replace game names with game uid
    gameStringsLoop:
    for (const lang of Object.keys(gameStrings)) {
      for (const uid of Object.keys(gameStrings[lang])) {
        if (gameStrings[lang][uid] === shiny.jeu) {
          shiny.jeu = uid;
          break gameStringsLoop;
        }
      }
    }
  }

  if (shiny.hasOwnProperty('methode')) {
    // Replace method names with updated versions
    const renames = new Map([
      ['Chaîne de captures', 'Combo Capture'],
      ['Raid Dynamax', 'Raid'],
      ['Sauvage (garanti)', 'Sauvage (chromatique garanti)'],
      ['Échangé', 'Échange'],
      ['Échangé (GTS)', 'Échange (GTS)'],
      ['Échangé (œuf)', 'Échange (œuf)'],
    ]);
    const newName = renames.get(shiny.methode);
    if (newName) shiny.methode = newName;

    // Replace method names with method id
    methodStringsLoop:
    for (const lang of Object.keys(methodStrings)) {
      for (const id of Object.keys(methodStrings[lang])) {
        if (methodStrings[lang][id] === shiny.methode) {
          shiny.methode = id;
          break methodStringsLoop;
        }
      }
    }
  }

  return shiny;
}