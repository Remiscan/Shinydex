import { SqliteClient, SqlValue } from '../../ext/sqlite/index.js';

const sqliteWorkerPath = '/shinydex/ext/sqlite/src/sqlite-worker.mjs';
const database = '/shinydex.sqlite';

const sqlite = new SqliteClient(database, sqliteWorkerPath);
await sqlite.init();

const pokemonTableColumns = /*sql*/`
  \`id\` INTEGER PRIMARY KEY,
  \`huntid\` varchar(36) NOT NULL UNIQUE,
  \`creationTime\` varchar(13) NOT NULL DEFAULT '0',
  \`lastUpdate\` varchar(13) NOT NULL DEFAULT '0',

  \`dexid\` int(4) NOT NULL,
  \`forme\` varchar(50),
  \`game\` varchar(50) NOT NULL,
  \`method\` varchar(50) NOT NULL,
  \`count\` text,
  \`charm\` tinyint(1) NOT NULL DEFAULT 0,

  \`catchTime\` varchar(13) NOT NULL DEFAULT '0',
  \`name\` varchar(50),
  \`ball\` varchar(50) NOT NULL DEFAULT 'poke',
  \`gene\` varchar(50),
  \`originalTrainer\` tinyint(1) NOT NULL DEFAULT 1,

  \`notes\` text
`;

try {
  // Create shiny_pokemon table, to store the user's shiny Pokémon
  await sqlite.executeSql(/*sql*/`
    CREATE TABLE IF NOT EXISTS \`shiny_pokemon\` (
      ${pokemonTableColumns}
    );
  `);

  // Create hunts table, to store the user's hunts
  await sqlite.executeSql(/*sql*/`
    CREATE TABLE IF NOT EXISTS \`hunts\` (
      ${pokemonTableColumns},
      \`caught\` tinyint(1) NOT NULL DEFAULT 0,
      \`deleted\` tinyint(1) NOT NULL DEFAULT 0,
      \`destroy\` tinyint(1) NOT NULL DEFAULT 0
    );
  `);

  // Create friend_shiny_pokemon table, to store a friend's shiny Pokémon
  await sqlite.executeSql(/*sql*/`
    CREATE TABLE IF NOT EXISTS \`friend_shiny_pokemon\` (
      ${pokemonTableColumns}
    );
  `);

  //await sqlite.executeSql(/*sql*/`
  /*  INSERT INTO shiny_pokemon (
      huntid, userid, dexid, forme, game, method, \`name\`
    )VALUES (?,?,?,?,?,?,?)
  `, ['dqsdqs', 'gdsgds', 128, 'female', 'x', 'wild', 'roberto']);*/
} catch (error) {
  console.error(error);
}

export default sqlite;



class PokemonTableInterface {
  table: string = '';
  key: string = 'huntid';
  constructor(table: string) {
    if (this.constructor == PokemonTableInterface) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.table = table;
  }


  async initialize(): Promise<SqlValue[][]> {
    throw new Error("Method 'initialize()' must be implemented.");
  }


  async getItem(key: string): Promise<SqlValue[]> {
    const result = await sqlite.executeSql(/*sql*/`
      SELECT * FROM \`${this.table}\` WHERE \`${this.key}\` = ${key} LIMIT 1
    `);
    return result[0];
  }


  async getItems(keys: string[] | null = null): Promise<SqlValue[][]> {
    if (!keys) {
      return sqlite.executeSql(/*sql*/`
        SELECT * FROM \`${this.table}\`
      `);
    }

    return sqlite.executeSql(/*sql*/`
      SELECT * FROM \`${this.table}\` WHERE \`${this.key}\` IN (${keys.join(', ')})
    `);
  }


  async setItem(key: string, data: unknown): Promise<SqlValue[][]> {
    throw new Error("Method 'setItem()' must be implemented.");
  }


  async removeItem(key: string) {
    return sqlite.executeSql(/*sql*/`
      DELETE FROM \`${this.table}\` WHERE \`${this.key}\` = ${key} LIMIT 1
    `);
  }


  async clear() {
    return sqlite.executeSql(/*sql*/`
      DELETE FROM \`${this.table}\`
    `);
  }


  async length() {
    const rows = await this.getItems();
    return rows.length;
  }


  /*async keys() {
    const rows = await this.getItems();
    return rows.map(row => row[this.key]);
  }*/
}


class ShinyStorage extends PokemonTableInterface {
  constructor() {
    super('shiny_pokemon');
  }


  async initialize() {
    return sqlite.executeSql(/*sql*/`
      CREATE TABLE IF NOT EXISTS \`shiny_pokemon\` (
        ${pokemonTableColumns}
      );
    `);
  }

  async setItem(key: string, data: unknown) {
    return sqlite.executeSql(/*sql*/`
      INSERT INTO \`shiny_pokemon\` (
        huntid,
        columns
      ) VALUES (
        val1,
        vals
      ) ON CONFLICT do UPDATE SET 
        huntid = '',
        columns = ''
    `);
  }
}