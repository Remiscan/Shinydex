// Types copiés de localforage.d.ts (v1.10.0)

interface LocalForageDbInstanceOptions {
    name?: string;

    storeName?: string;
}

interface LocalForageOptions extends LocalForageDbInstanceOptions {
    driver?: string | string[];

    size?: number;

    version?: number;

    description?: string;
}

interface LocalForageDbMethodsCore {
    getItem<T>(key: string, callback?: (err: any, value: T | null) => void): Promise<T | null>;

    getAllItems<T>(callback?: (err: any, values: T[]) => void): Promise<T[]>;

    setItem<T>(key: string, value: T, callback?: (err: any, value: T) => void): Promise<T>;

    setItems<T>(entries: [string, T][], callback?: (err: any, entries: [string, T][]) => void): Promise<boolean>;

    removeItem(key: string, callback?: (err: any) => void): Promise<void>;

    clear(callback?: (err: any) => void): Promise<void>;

    length(callback?: (err: any, numberOfKeys: number) => void): Promise<number>;

    key(keyIndex: number, callback?: (err: any, key: string) => void): Promise<string>;

    keys(callback?: (err: any, keys: string[]) => void): Promise<string[]>;

    iterate<T, U>(iteratee: (value: T, key: string, iterationNumber: number) => U,
            callback?: (err: any, result: U) => void): Promise<U>;
}

interface LocalForageDropInstanceFn {
    (dbInstanceOptions?: LocalForageDbInstanceOptions, callback?: (err: any) => void): Promise<void>;
}

interface LocalForageDriverMethodsOptional {
    dropInstance?: LocalForageDropInstanceFn;
}

// duplicating LocalForageDriverMethodsOptional to preserve TS v2.0 support,
// since Partial<> isn't supported there
interface LocalForageDbMethodsOptional {
    dropInstance: LocalForageDropInstanceFn;
}

interface LocalForageDriverDbMethods extends LocalForageDbMethodsCore, LocalForageDriverMethodsOptional {}

interface LocalForageDriverSupportFunc {
    (): Promise<boolean>;
}

interface LocalForageDriver extends LocalForageDriverDbMethods {
    _driver: string;

    _initStorage(options: LocalForageOptions): void;

    _support?: boolean | LocalForageDriverSupportFunc;
}

interface LocalForageSerializer {
    serialize<T>(value: T | ArrayBuffer | Blob, callback: (value: string, error: any) => void): void;

    deserialize<T>(value: string): T | ArrayBuffer | Blob;

    stringToBuffer(serializedString: string): ArrayBuffer;

    bufferToString(buffer: ArrayBuffer): string;
}

interface LocalForageDbMethods extends LocalForageDbMethodsCore, LocalForageDbMethodsOptional {}

export interface LocalForage extends LocalForageDbMethods {
    LOCALSTORAGE: string;
    WEBSQL: string;
    INDEXEDDB: string;

    /**
     * Set and persist localForage options. This must be called before any other calls to localForage are made, but can be called after localForage is loaded.
     * If you set any config values with this method they will persist after driver changes, so you can call config() then setDriver()
     * @param {LocalForageOptions} options?
     */
    config(options: LocalForageOptions): boolean;
    config(options: string): any;
    config(): LocalForageOptions;

    /**
     * Create a new instance of localForage to point to a different store.
     * All the configuration options used by config are supported.
     * @param {LocalForageOptions} options
     */
    createInstance(options: LocalForageOptions): LocalForage;

    driver(): string;

    /**
     * Force usage of a particular driver or drivers, if available.
     * @param {string} driver
     */
    setDriver(driver: string | string[], callback?: () => void, errorCallback?: (error: any) => void): Promise<void>;

    defineDriver(driver: LocalForageDriver, callback?: () => void, errorCallback?: (error: any) => void): Promise<void>;

    /**
     * Return a particular driver
     * @param {string} driver
     */
    getDriver(driver: string): Promise<LocalForageDriver>;

    getSerializer(callback?: (serializer: LocalForageSerializer) => void): Promise<LocalForageSerializer>;

    supports(driverName: string): boolean;

    ready(callback?: (error: any) => void): Promise<void>;
}

declare const localforage: LocalForage;



// Memory driver : stockage temporaire uniquement dans la RAM
const memoryStorage: Map<string,
  Map<string,
    Map<string, any>
  >
> = new Map();

function getMemoryStore<T = any>(databaseName: string, storeName: string): Map<string, T> | null {
  return memoryStorage.get(databaseName)?.get(storeName) || null;
}

function executeCallback(promise: Promise<any>, callback: ((err: any, result?: any) => void) | undefined) {
  if (callback) {
    promise.then(
      function(result) {
        callback(null, result);
      },
      function(error) {
        callback(error);
      }
    );
  }
}

const memoryDriver: LocalForageDriver = {
  _driver: 'memory',
  _support: true,

  _initStorage: function(options: LocalForageOptions) {
    if (!options.name) throw new Error('Database name is required');
    if (!options.storeName) throw new Error('Store name is required');

    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };

    const dbInfo: Record<string, any> = {};
    if (options) {
      for (var i in options) {
        dbInfo[i] = options[i as keyof typeof options];
      }
    }
    self._dbInfo = dbInfo;

    let database = memoryStorage.get(options.name);
    if (!database) {
      database = new Map();
      memoryStorage.set(options.name!, database);
    }

    let store = database.get(options.storeName);
    if (!store) {
      store = new Map();
      database.set(options.storeName!, store);
    }
    return Promise.resolve();
  },

  clear: function(callback) {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    var promise = new Promise<void>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          store.clear();
          resolve();
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  },

  getItem: function<T>(key: string, callback: (err: any, value: T | null) => void) {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    const promise = new Promise<T|null>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          const result = store.get(key) || null;
          resolve(result);
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  },

  getAllItems: function<T>(callback?: (err: any, values: T[]) => void): Promise<T[]> {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    const promise = new Promise<T[]>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore<T>(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          const result = Array.from(store.values());
          resolve(result);
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  },

  iterate: function<T, U>(
    iteratee: (value: T, key: string, iterationNumber: number) => U,
    callback?: (err: any, result: U) => void
  ): Promise<U> {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    const promise = new Promise<U>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore<T>(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          let i = 0;
          for (const [key, value] of store.entries()) {
            const result = iteratee(value, key, i);
            if (result !== void 0) {
              resolve(result);
              return result;
            }
          }
          resolve(null as U);
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  },

  key: function(n, callback) {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    const promise = new Promise<string>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          let i = 0;
          for (const key of store.keys()) {
            if (i === n) {
              return resolve(key);
            }
            i++;
          }
          return resolve('');
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  },

  keys: function(callback) {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    const promise = new Promise<string[]>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          return resolve(Array.from(store.keys()));
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  },

  length: function(callback) {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    const promise = new Promise<number>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          return resolve(store.size);
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  },

  removeItem: function(key, callback) {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    const promise = new Promise<void>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          store.delete(key);
          resolve();
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  },

  setItem: function<T>(key: string, value: T, callback: (err: any, value: T) => void) {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    const promise = new Promise<T>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          store.set(key, value);
          return resolve(value);
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  },

  setItems: function<T>(entries: [string, T][], callback?: (err: any, entries: [string, T][]) => void): Promise<boolean> {
    const self = this as unknown as LocalForage & { _dbInfo: Record<string, any> };
    const promise = new Promise<boolean>(function(resolve, reject) {
      self
        .ready()
        .then(function() {
          const store = getMemoryStore(self._dbInfo.name, self._dbInfo.storeName);
          if (!store) return reject(new Error('Store not found'));
          for (const [key, value] of entries) {
            store.set(key, value);
          }
          return resolve(true);
        })
        .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
  }
}

localforage.defineDriver(memoryDriver);



// Instances de localforage pour le Shinydex

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
  driver: 'memory'
});

export { dataStorage, friendShinyStorage, friendStorage, huntStorage, shinyStorage };

