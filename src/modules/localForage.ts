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
  iterate(iteratorCallback: (value: any, key: string, iterationNumber: number) => any, callback?: () => any): Promise<any[]>;

  setDriver(names: string | string[]): void;
  config(options: object): void;

  ready(): Promise<any>;
  supports(name: string): boolean;

  createInstance(options: object): localForageAPI;
  dropInstance(options: object): Promise<any>;
}

declare const localforage: localForageAPI;



// Liste de shiny
const shinyStorage = localforage.createInstance({
  name: 'shinydex',
  storeName: 'shiny-list',
  driver: localforage.INDEXEDDB
});

// Données diverses
const dataStorage = localforage.createInstance({
  name: 'shinydex',
  storeName: 'misc',
  driver: localforage.INDEXEDDB
});

// Chasses en cours
const huntStorage = localforage.createInstance({
  name: 'shinydex',
  storeName: 'hunts',
  driver: localforage.INDEXEDDB
});

// Liste d'amis
const friendStorage = localforage.createInstance({
  name: 'shinydex',
  storeName: 'friend-list',
  driver: localforage.INDEXEDDB
});

// Liste de shiny d'un ami
const friendShinyStorage = localforage.createInstance({
  name: 'shinydex',
  storeName: 'friend-shiny-list',
  driver: localforage.INDEXEDDB
});

export { shinyStorage, dataStorage, huntStorage, friendStorage, friendShinyStorage };

