import { Hunt } from './Hunt.js';
import { Shiny } from './Shiny.js';
import { gameStrings, isSupportedGameID, isSupportedLang, isSupportedMethodID, methodStrings } from './jsonData.js';
import { dataStorage, huntStorage, localForageAPI, shinyStorage } from './localForage.js';



declare const localforage: localForageAPI;



export async function upgradeStorage(): Promise<void> {
  // Update the structure of stored shiny Pokémon
  const shinyKeys = await shinyStorage.keys();
  for (const key of shinyKeys) {
    const shiny = new Shiny(updateDataFormat(await shinyStorage.getItem(key)));
    await shinyStorage.setItem(shiny.huntid, shiny);
    if (key !== shiny.huntid) {
      await shinyStorage.removeItem(key);
    }
  }

  // Update the structure of stored Hunts
  const huntKeys = await huntStorage.keys();
  for (const key of huntKeys) {
    const hunt = new Hunt(updateDataFormat(await huntStorage.getItem(key)));
    await huntStorage.setItem(hunt.huntid, hunt);
    if (key !== hunt.huntid) {
      await huntStorage.removeItem(key);
    }
  }

  // Delete old, now obsolete stored items
  await dataStorage.removeItem('version-bdd');
  await dataStorage.removeItem('version-fichiers');
  await dataStorage.removeItem('pokemon-names');
  await dataStorage.removeItem('pokemon-names-fr');
  await dataStorage.removeItem('pokemon-names-en');
  await dataStorage.removeItem('uploaded-hunts');
  await dataStorage.removeItem('check-updates');
  await dataStorage.removeItem('online-backup');
  await dataStorage.removeItem('theme');
  await dataStorage.removeItem('filtres');
  await dataStorage.removeItem('ordre');
  await dataStorage.removeItem('ordre-reverse');

  // Delete old unused databases
  localforage.dropInstance({
    name: 'shinydex',
    storeName: 'pokemon-data'
  });

  await dataStorage.setItem('last-storage-upgrade', Date.now());
  return;
}



export function updateDataFormat(shiny: { [key: string]: unknown }): { [key: string]: unknown } {
  // Rename properties whose name changed
  const renames = new Map([
    ['last_update', 'lastUpdate'],
    ['numero_national', 'dexid'],
    ['formid', 'forme'],
    ['origin', 'checkmark'],
    ['monjeu', 'DO'],
    ['aupif', 'horsChasse'],
    ['description', 'notes'],
    ['jeu', 'game'],
    ['methode', 'method'],
    ['compteur', 'count'],
    ['timeCapture', 'catchTime'],
    ['surnom', 'name'],
    ['checkmark', 'originMark']
  ]);

  for (const [oldName, newName] of renames) {
    if (shiny.hasOwnProperty(oldName)) {
      shiny[newName] = shiny[oldName];
      delete shiny[oldName];
    }
  }

  // Add properties that didn't exist before
  const newProperties: Map<string, unknown> = new Map([
    ['gene', '']
  ]);

  for (const [prop, defaultValue] of newProperties) {
    if (!shiny.hasOwnProperty(prop)) {
      shiny[prop] = defaultValue;
    }
  }

  if (
    // if shiny has no huntid
    !shiny.hasOwnProperty('huntid') ||
    // or if it has invalid huntid
    typeof shiny['huntid'] !== 'string' ||
    !shiny['huntid'].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  ) {
    // generate new huntid
    shiny['huntid'] = crypto.randomUUID();
  }

  // Delete properties that don't exist any more
  const oldProperties = ['userid', 'DO', 'horsChasse', 'originMark'];

  for (const prop of oldProperties) {
    if (shiny.hasOwnProperty(prop)) {
      delete shiny[prop];
    }
  }

  // Replace date by timestamp
  // (date will be formatted on display)
  if (shiny.hasOwnProperty('date')) {
    let timestamp: number = 0;
    if (typeof shiny.date === 'string' || typeof shiny.date === 'number') {
      timestamp = new Date(shiny.date).getTime();
    }
    shiny['catchTime'] = Math.max(0, timestamp);
    delete shiny.date;
  }

  // Replace game names with game uid
  if (shiny.hasOwnProperty('game')) {
    if (typeof shiny.game === 'string') {
      // Replace game names with accented versions
      const renames = new Map([
        ['Emeraude', 'Émeraude'],
        ['Let\'s Go Evoli', 'Let\'s Go Évoli'],
        ['Epee', 'Épée'],
        ['Ultra Soleil', 'Ultra-Soleil'],
        ['Ultra Lune', 'Ultra-Lune'],
        ['GO', 'Pokémon GO'],
        ['Légendes Arceus', 'Légendes Pokémon : Arceus'],
        ['Home', 'Pokémon Home']
      ]);
      const newName = renames.get(shiny['game']);
      if (newName) shiny['game'] = newName;

      // Replace game names with game uid
      gameStringsLoop:
      for (const lang of Object.keys(gameStrings)) {
        if (!isSupportedLang(lang)) continue;
        for (const uid of Object.keys(gameStrings[lang])) {
          if (!isSupportedGameID(uid)) continue;
          if (gameStrings[lang][uid] === shiny['game']) {
            shiny['game'] = uid;
            break gameStringsLoop;
          }
        }
      }
    } else {
      shiny['game'] = 'null';
    }
  }

  // Replace method names with method id
  if (shiny.hasOwnProperty('method')) {
    if (typeof shiny.method === 'string') {
      // Replace method names with updated versions
      const renames = new Map([
        ['Chaîne de captures', 'Combo Capture'],
        ['Raid Dynamax', 'Raid'],
        ['Sauvage (garanti)', 'Sauvage (chromatique garanti)'],
        ['Échangé', 'Échange'],
        ['Échangé (GTS)', 'Échange'],
        ['Échangé (œuf)', 'Échange'],
        ['Masuda', 'Œuf (Masuda)'],
        ['Combo Capture', 'Sauvage'],
        ['Bonus de combats', 'Sauvage']
      ]);
      const newName = renames.get(shiny['method']);
      if (newName) shiny['method'] = newName;

      // Replace method names with method id
      methodStringsLoop:
      for (const lang of Object.keys(methodStrings)) {
        if (!isSupportedLang(lang)) continue;
        for (const id of Object.keys(methodStrings[lang])) {
          if (!isSupportedMethodID(id)) continue;
          if (methodStrings[lang][id] === shiny['method']) {
            shiny['method'] = id;
            break methodStringsLoop;
          }
        }
      }

      // Convert old methods into new data
      if (shiny['method'] === 'trade') {
        shiny['method'] = "unknown";
        shiny['originalTrainer'] = false;
      }
    } else {
      shiny['method'] = 'unknown';
    }
  }

  // Replace compteur string by object
  if (shiny.hasOwnProperty('count') && typeof shiny['count'] === 'string') {
    const count = JSON.parse(shiny['count']);
    if (typeof count === 'number') shiny['count'] = { 'encounters': count };
    else {
      const renames = new Map([
        ['distance', 'usum-distance'],
        ['rings', 'usum-rings'],
        ['chain', 'lgpe-catchCombo'],
        ['lure', 'lgpe-lure'],
        ['dexResearch', 'pla-dexResearch'],
      ]);

      for (const [oldName, newName] of renames) {
        if (count.hasOwnProperty(oldName)) {
          const value = Number(count[oldName]) || 0;
          if (value) count[newName] = value;
          delete count[oldName];
        }
      }

      count['encounters'] = Number(count.count) || 0;
      shiny['count'] = count;
    }
  }

  // Add creationTime if needed
  if (!(shiny.hasOwnProperty('creationTime'))) {
    shiny['creationTime'] = shiny['catchTime'] ?? shiny['lastUpdate'] ?? Date.now();
  }

  // Translate old hacked property to method if needed
  if (shiny.hasOwnProperty('hacked')) {
    if (typeof shiny.hacked === 'number' && shiny['hacked'] >= 2) {
      shiny['method'] = 'hack';
    }
    delete shiny['hacked'];
  }

  return shiny;
}