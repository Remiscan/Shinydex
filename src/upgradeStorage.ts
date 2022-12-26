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
    await huntStorage.setItem(key, hunt);
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
  const newProperties = new Map([
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
      for (const uid of Object.keys(gameStrings[lang])) {
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
      for (const id of Object.keys(methodStrings[lang])) {
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

  return shiny;
}