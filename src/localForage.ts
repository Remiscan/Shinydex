export interface localForageAPI {
  INDEXEDDB: string;
  WEBSQL: string;
  LOCALSTORAGE: string;

  getItem(key: string, callback?: () => any): Promise<any>;
  setItem(key: string, value: any, callback?: () => any): Promise<any>;
  removeItem(key: string, callback?: () => any): Promise<any>;
  clear(callback?: () => any): Promise<any>;
  length(callback?: () => any): Promise<number>;
  key(index: number, callback?: () => any): Promise<any>;
  keys(callback?: () => any): Promise<string[]>;
  iterate(iteratorCallback: () => any, callback?: () => any): Promise<any[]>;

  setDriver(names: string | string[]): void;
  config(options: object): void;

  ready(): Promise<any>;
  supports(name: string): boolean;

  createInstance(options: object): localForageAPI;
  dropInstance(options: object): Promise<any>;
}

declare const localforage: localForageAPI;



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

// Liste de shiny d'un ami
const friendStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'friend-shiny-list',
  driver: localforage.INDEXEDDB
});

export { pokemonData, shinyStorage, dataStorage, huntStorage, friendStorage };

