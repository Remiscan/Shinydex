declare const localforage;

// Pokédex
const pokemonData = localforage.createInstance({
  name: 'remidex',
  storeName: 'pokemon-data',
  driver: localforage.INDEXEDDB
});

// Liste de shiny
const shinyStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'shiny-list',
  driver: localforage.INDEXEDDB
});

// Données diverses
const dataStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'misc',
  driver: localforage.INDEXEDDB
});

// Chasses en cours
const huntStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'hunts',
  driver: localforage.INDEXEDDB
});

export { pokemonData, shinyStorage, dataStorage, huntStorage };