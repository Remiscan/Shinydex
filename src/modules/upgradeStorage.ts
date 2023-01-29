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
    await shinyStorage.setItem(key, shiny);
  }

  // Update the structure of stored Hunts
  const huntKeys = await huntStorage.keys();
  for (const key of huntKeys) {
    const hunt = new Hunt(updateDataFormat(await huntStorage.getItem(key)));
    await huntStorage.setItem(key, hunt);
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



export function updateDataFormat(shiny: { [key: string]: any }): { [key: string]: any } {
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
  const newProperties: Map<string, any> = new Map([
    ['gene', '']
  ]);

  for (const [prop, defaultValue] of newProperties) {
    if (!shiny.hasOwnProperty(prop)) {
      shiny[prop] = defaultValue;
    }
  }

  // Delete properties that don't exist any more
  const oldProperties = ['userid', 'DO', 'horsChasse'];

  for (const prop of oldProperties) {
    if (shiny.hasOwnProperty(prop)) {
      delete shiny[prop];
    }
  }

  // Replace date by timestamp
  // (date will be formatted on display)
  if (shiny.hasOwnProperty('date')) {
    const timestamp = new Date(shiny.date).getTime();
    shiny['catchTime'] = Math.max(0, timestamp);
    delete shiny.date;
  }

  // Replace game names with game uid
  if (shiny.hasOwnProperty('game')) {
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
  }

  // Replace method names with method id
  if (shiny.hasOwnProperty('method')) {
    // Replace method names with updated versions
    const renames = new Map([
      ['Chaîne de captures', 'Combo Capture'],
      ['Raid Dynamax', 'Raid'],
      ['Sauvage (garanti)', 'Sauvage (chromatique garanti)'],
      ['Échangé', 'Échange'],
      ['Échangé (GTS)', 'Échange (GTS)'],
      ['Échangé (œuf)', 'Échange (œuf)'],
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
  }

  // Replace checkmark number with checkmark name
  if (shiny.hasOwnProperty('originMark') && typeof shiny['originMark'] === 'number') {
    const names = ['old', 'gen6', 'alola', 'game-boy', 'lets-go', 'go', 'galar', 'sinnoh-gen8', 'hisui', 'paldea'];
    shiny['originMark'] = names[shiny['originMark']];
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
    if (shiny['hacked'] >= 2) {
      shiny['method'] = 'hack';
    }
    delete shiny['hacked'];
  }

  return shiny;
}