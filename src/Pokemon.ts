import { pad } from './Params.js';
import { dataStorage, pokemonData } from './localForage.js';



type Jeu = {
  uid: string, // id de la version précise du jeu
  id: string, // id du jeu (incluant versions alternatives)
  gen: number, // numéro de la génération du jeu
  originMark?: string, // numéro de la marque d'origine affichée sur les Pokémon capturés dans le jeu
};

const allGames: Jeu[] = [
  { uid: 'blue', gen: 1, id: 'rb' },
  { uid: 'red', gen: 1, id: 'rb' },
  { uid: 'yellow', gen: 1, id: 'yellow' },
  { uid: 'gold', gen: 2, id: 'gs' },
  { uid: 'silver', gen: 2, id: 'gs' },
  { uid: 'crystal', gen: 2, id: 'crystal' },
  { uid: 'sapphire', gen: 3, id: 'rs' },
  { uid: 'ruby', gen: 3, id: 'rs' },
  { uid: 'emerald', gen: 3, id: 'emerald' },
  { uid: 'firered', gen: 3, id: 'frlg' },
  { uid: 'leafgreen', gen: 3, id: 'frlg' },
  { uid: 'diamond', gen: 4, id: 'dp' },
  { uid: 'pearl', gen: 4, id: 'dp' },
  { uid: 'platinum', gen: 4, id: 'platinum' },
  { uid: 'heartgold', gen: 4, id: 'hgss' },
  { uid: 'soulsilver', gen: 4, id: 'hgss' },
  { uid: 'black', gen: 5, id: 'bw' },
  { uid: 'white', gen: 5, id: 'bw' },
  { uid: 'black2', gen: 5, id: 'bw2' },
  { uid: 'white2', gen: 5, id: 'bw2' },
  { uid: 'x', gen: 6, id: 'xy', originMark: 'gen6' },
  { uid: 'y', gen: 6, id: 'xy', originMark: 'gen6' },
  { uid: 'omegaruby', gen: 6, id: 'oras', originMark: 'gen6' },
  { uid: 'alphasapphire', gen: 6, id: 'oras', originMark: 'gen6' },
  { uid: 'sun', gen: 7, id: 'sm', originMark: 'alola' },
  { uid: 'moon', gen: 7, id: 'sm', originMark: 'alola' },
  { uid: 'ultrasun', gen: 7, id: 'usum', originMark: 'alola' },
  { uid: 'ultramoon', gen: 7, id: 'usum', originMark: 'alola' },
  { uid: 'go', gen: 0, id: 'go', originMark: 'go' },
  { uid: 'letsgopikachu', gen: 7.1, id: 'lgpe', originMark: 'lets-go' },
  { uid: 'letsgoeevee', gen: 7.1, id: 'lgpe', originMark: 'lets-go' },
  { uid: 'sword', gen: 8, id: 'swsh', originMark: 'galar' },
  { uid: 'shield', gen: 8, id: 'swsh', originMark: 'galar' },
  { uid: 'home', gen: 8, id: 'home' },
  { uid: 'brilliantdiamond', gen: 8, id: 'bdsp', originMark: 'sinnoh-gen8' },
  { uid: 'shiningpearl', gen: 8, id: 'bdsp', originMark: 'sinnoh-gen8' },
  { uid: 'legendsarceus', gen: 8.1, id: 'pla', originMark: 'hisui' },
  { uid: 'scarlet', gen: 9, id: 'sv', originMark: 'paldea' },
  { uid: 'violet', gen: 9, id: 'sv', originMark: 'paldea' }
];



type Generation = {
  num: number, // numéro de la génération
  start: number, // numéro du premier Pokémon de la génération dans le dex national
  end: number, // numéro du dernier Pokémon de la génération dans le dex national
};

const generations: Generation[] = [
  { num: 1, start: 1, end: 151 },
  { num: 2, start: 152, end: 251 },
  { num: 3, start: 252, end: 386 },
  { num: 4, start: 387, end: 493 },
  { num: 5, start: 494, end: 649 },
  { num: 6, start: 650, end: 721 },
  { num: 7, start: 722, end: 809 },
  { num: 8, start: 810, end: 905 },
];



export type Methode = {
  id: string, // id de la méthode
  jeux: Jeu[], // liste de jeux dans lesquels la méthode s'applique
  mine: boolean, // si le Pokémon obtenu porte mon DO ou non
  charm: boolean, // si le Charme Chroma influe sur cette méthode
};

const allMethodes: Methode[] = [
  { id: 'wild', jeux: allGames, mine: true, charm: true },
  { id: 'egg', jeux: allGames.filter(g => ![1, 7.1, 0].includes(g.gen)), mine: true, charm: true },
  { id: 'masuda', jeux: allGames.filter(g => g.gen >= 4 && g.gen != 7.1 && g.gen != 8.1), mine: true, charm: true },
  { id: 'fixedencounter', jeux: allGames.filter(g => g.id === 'sv'), mine: true, charm: false },
  { id: 'reset', jeux: allGames.filter(g => g.gen >= 2), mine: true, charm: true },
  { id: 'pokeradar', jeux: allGames.filter(g => [4, 6].includes(g.gen) || g.id == 'bdsp'), mine: true, charm: true },
  { id: 'chainfishing', jeux: allGames.filter(g => g.gen == 6), mine: true, charm: true },
  { id: 'wildhorde', jeux: allGames.filter(g => g.id == 'xy'), mine: true, charm: true },
  { id: 'friendsafari', jeux: allGames.filter(g => g.id == 'xy'), mine: true, charm: true },
  { id: 'dexnavchain', jeux: allGames.filter(g => g.id == 'oras'), mine: true, charm: true },
  { id: 'soschain', jeux: allGames.filter(g => g.gen == 7), mine: true, charm: true },
  { id: 'ultrawormhole', jeux: allGames.filter(g => g.gen == 7), mine: true, charm: false },
  { id: 'battlebonus', jeux: allGames.filter(g => g.gen == 8), mine: true, charm: true },
  { id: 'raid', jeux: allGames.filter(g => g.id == 'swsh' || g.id == 'sv'), mine: true, charm: false },
  { id: 'dynamaxadventure', jeux: allGames.filter(g => g.gen == 8), mine: true, charm: true },
  { id: 'massoutbreak', jeux: allGames.filter(g => g.id == 'pla' || g.id == 'sv'), mine: true, charm: true },
  { id: 'massivemassoutbreak', jeux: allGames.filter(g => g.id == 'pla'), mine: true, charm: true },
  
  { id: 'wildevent', jeux: allGames.filter(g => g.gen == 0), mine: true, charm: false },
  { id: 'wildalwaysshiny', jeux: allGames.filter(g => ['gs', 'hgss', 'bw2'].includes(g.id)), mine: true, charm: false },
  { id: 'glitch', jeux: allGames.filter(g => [1, 2].includes(g.gen)), mine: true, charm: false },
  { id: 'event', jeux: allGames, mine: false, charm: false },

  { id: 'trade', jeux: allGames, mine: false, charm: false },
  { id: 'gtstrade', jeux: allGames.filter(g => g.gen >= 4 && g.gen != 7.1), mine: false, charm: false },
  { id: 'wondertrade', jeux: allGames.filter(g => g.gen >= 6 && g.gen != 7.1), mine: false, charm: false },
  { id: 'eggtrade', jeux: allGames.filter(g => g.gen >= 2 && g.gen != 7.1), mine: false, charm: false },
];



/** Structure d'une Forme de Pokémon. */
export class Forme {
  dbid: string = '';
  nom: string = '';
  form: number = 0;
  gender: string = 'mf';
  gigamax: boolean = false;
  candy: number = 0;
  hasBackside?: boolean;
  noShiny?: boolean;

  constructor(forme: object = {}) {
    if ('dbid' in forme) this.dbid = String(forme.dbid);
    if ('nom' in forme) this.nom = String(forme.nom);
    if ('form' in forme) this.form = Number(forme.form) || 0;
    if ('gender' in forme) this.gender = String(forme.gender);
    if ('gigamax' in forme) this.gigamax = Boolean(forme.gigamax);
    if ('candy' in forme) this.candy = Number(forme.candy) || 0;
    if ('hasBackside' in forme) this.hasBackside = Boolean(forme.hasBackside);
    if ('noShiny' in forme) this.noShiny = Boolean(forme.noShiny);
  }
};



/** Structure d'un Pokémon. */
export interface backendPokemon {
  dexid: number,
  name: {
    'fr': string,
    'en': string
  },
  formes: Forme[],
};

type nameLang = keyof backendPokemon['name'];
const supportedLangs: Array<nameLang> = ['fr', 'en'];
function isNameLang(string: string): string is nameLang {
  return supportedLangs.includes(string as nameLang);
}



export class Count {
  'encounters': number = 0;
  'usum-distance'?: number;
  'usum-rings'?: number;
  'lgpe-catchCombo'?: number;
  'lgpe-lure'?: number;
  'lgpe-nextSpawn'?: number;
  'swsh-dexKo'?: number;
  'pla-dexResearch'?: number;
  'sv-outbreakCleared'?: number;
  'sv-sparklingPower'?: number;

  constructor(obj: object) {
    if ('encounters' in obj) this['encounters'] = Number(obj['encounters']) || 0;
    if ('usum-distance' in obj) this['usum-distance'] = Number(obj['usum-distance']) || 0;
    if ('usum-rings' in obj) this['usum-rings'] = Number(obj['usum-rings']) || 0;
    if ('lgpe-catchCombo' in obj) this['lgpe-catchCombo'] = Number(obj['lgpe-catchCombo']) || 0;
    if ('lgpe-lure' in obj) this['lgpe-lure'] = Number(obj['lgpe-lure']) || 0;
    if ('lgpe-nextSpawn' in obj) this['lgpe-nextSpawn'] = Number(obj['lgpe-nextSpawn']) || 0;
    if ('swsh-dexKo' in obj) this['swsh-dexKo'] = Number(obj['swsh-dexKo']) || 0;
    if ('pla-dexResearch' in obj) this['pla-dexResearch'] = Number(obj['pla-dexResearch']) || 0;
    if ('sv-outbreakCleared' in obj) this['sv-outbreakCleared'] = Number(obj['sv-outbreakCleared']) || 0;
    if ('sv-sparklingPower' in obj) this['sv-sparklingPower'] = Number(obj['sv-sparklingPower']) || 0;
  }
};



/** Structure d'un Pokémon shiny tel que stocké dans la BDD en ligne. */
interface backendShiny {
  id: number,
  huntid: string,
  lastUpdate: string,

  dexid: number,
  forme: string,
  game: string,
  method: string,
  count: string,
  charm: boolean,

  catchTime: string,
  name: string,
  ball: string,
  gene: string,
  originMark: string,
  hacked: number,

  notes: string,
};

/** Structure d'un Pokémon shiny tel que stocké dans la BDD locale. */
export interface frontendShiny extends Omit<backendShiny, 'id' | 'lastUpdate' | 'count' | 'catchTime'> {
  lastUpdate: number,
  count: Count,
  catchTime: number,
  deleted?: boolean,
  destroy?: boolean,
}



type SpriteOptions = {
  shiny: boolean,
  backside?: boolean,
  size: number,
  format: 'webp' | 'png'
};



class Pokemon {
  public dexid: number = 0;
  public name: {
    'fr': string,
    'en': string
  } = {
    'fr': '',
    'en': ''
  };
  public formes: Forme[] = [];

  static #names: {
    'fr': string[],
    'en': string[]
  } = {
    'fr': [],
    'en': []
  };

  constructor(pkmn: object = {}) {
    if ('dexid' in pkmn) this.dexid = Number(pkmn.dexid) || 0;
    if ('name' in pkmn && typeof pkmn.name === 'object' && pkmn.name != null) {
      this.name = {
        fr: 'fr' in pkmn.name ? String(pkmn.name.fr) : '',
        en: 'en' in pkmn.name ? String(pkmn.name.en) : ''
      };
    }
    if ('formes' in pkmn && Array.isArray(pkmn.formes)) {
      this.formes = pkmn.formes.map(forme => new Forme(forme));
    }
  }

  /**
   * Récupère le sprite d'un Pokémon.
   * @param forme - Forme demandée.
   * @param options
   * @param options.shiny - Si le Pokémon est shiny.
   * @param options.backside - Si le Pokémon est de dos (uniquement Mustébouée, Mustéflott, Keunotor, Poussifeu et Maraiste).
   * @param options.size - Taille du sprite en pixels (jusqu'à 512).
   * @param options.format - Format du sprite (png ou webp);
   * @returns URL du sprite.
   */
  getSprite(forme: Forme, { shiny = false, backside = undefined, size = 512, format = 'png' }: SpriteOptions): string {
    const shinySuffix = shiny ? 'r' : 'n';
    const side = (typeof forme.hasBackside !== 'undefined' && backside === true) ? 'b' : 'f';

    // Alcremie shiny forms are all the same
    const formToConsider = (shiny && this.dexid === 869) ? 0 : forme.form;

    const spriteCaracs = [
      pad(this.dexid.toString(), 4),
      pad(formToConsider.toString(), 3),
      forme.gender,
      forme.gigamax ? 'g' : 'n',
      pad(forme.candy.toString(), 8),
      side,
      shinySuffix
    ];

    let spriteUrl = `/shinydex/pokemon-sprite-${spriteCaracs.join('_')}-${size}.${format}`;

    if (typeof forme.noShiny !== 'undefined' && forme.noShiny === true && shiny === true)
      spriteUrl = this.getSprite(forme, { shiny: false, size, format });

    return spriteUrl;
  }

  /**
   * Donne le numéro de la génération auquel ce Pokémon appartient.
   */
  get gen(): number | undefined {
    const gens = Pokemon.generations;
    for (let gen of gens) {
      if (this.dexid >= gen.start && this.dexid <= gen.end) return gen.num;
    }
  }

  /**
   * @returns Nom du Pokémon.
   */
  getName(lang = document.documentElement.getAttribute('lang') ?? 'fr'): string {
    if (!isNameLang(lang)) throw new Error('language-not-supported');
    const _lang = supportedLangs.includes(lang) ? lang : 'fr';
    return this.name[_lang];
  }

  /**
   * @returns Liste des noms de tous les Pokémon, dans l'ordre du Pokédex national.
   */
  static async names(lang = document.documentElement.getAttribute('lang') ?? 'fr'): Promise<string[]> {
    if (!isNameLang(lang)) throw new Error('language-not-supported');
    const _lang = supportedLangs.includes(lang) ? lang : 'fr';

    const cachedNames = Pokemon.#names[_lang];
    if (cachedNames.length > 0) return cachedNames;

    const keys = (await pokemonData.keys()).sort((a, b) => Number(a) - Number(b));
    const names: string[] = [];
    for (const key of keys) {
      const pkmn = await pokemonData.getItem(key);
      const name = pkmn.name[_lang];
      names.push(name);
    }
    Pokemon.#names[_lang] = names;
    return names;
  }

  /**
   * @returns Liste des jeux vidéo Pokémon.
   */
  static get jeux(): Jeu[] {
    return allGames;
  }

  /**
   * @returns Liste des générations de Pokémon.
   */
  static get generations() {
    return generations;
  }

  /** Récupère les données de tous les Pokémon et leurs formes et les stocke dans indexedDB. */
  static async initData() {
    await dataStorage.ready();
    const fileVersion = (await dataStorage.getItem('file-versions'))['./data/pokemon.json'];
    const dataVersion = await dataStorage.getItem('pokemon-data-version');
  
    if (fileVersion === dataVersion) return;
  
    try {
      // @ts-ignore
      const pokemonDataModule = await import('../data/pokemon.json', { assert: { type: 'json' }});
      // @ts-expect-error
      const data = pokemonDataModule.default;
  
      console.log(`[:)] Préparation des données...`);
      await pokemonData.ready();
      await Promise.all(
        data.map((pkmn: backendPokemon) => pokemonData.setItem(String(pkmn.dexid), pkmn))
      );
      await dataStorage.setItem('pokemon-data-version', fileVersion);
      console.log(`[:)] Préparation des données terminée !`);
    } catch (error) {
      console.error(error);
      throw Error(`[:()] Préparation des données échouée.`);
    }
  }
}



class Shiny implements frontendShiny {
  // frontendShiny fields
  huntid: string = crypto.randomUUID();
  lastUpdate: number = 0;

  dexid: number = 0;
  forme: string = '';
  game: string = '';
  method: string = '';
  count: Count = new Count({ encounters: 0 });
  charm: boolean = false;

  catchTime: number = 0;
  name: string = '';
  ball: string = '';
  gene: string = '';
  originMark: string = '';
  hacked: number = 0;
  
  notes: string = '';

  // additional fields
  deleted: boolean = false;
  destroy: boolean = false;

  constructor(shiny: object = {}) {
    if (typeof shiny !== 'object') throw new Error('Invalid argument');

    if ('huntid' in shiny) this.huntid = String(shiny.huntid);
    if ('lastUpdate' in shiny) this.lastUpdate = Number(shiny.lastUpdate) || 0;

    if ('dexid' in shiny) this.dexid = Number(shiny.dexid) || 0;
    if ('forme' in shiny) this.forme = String(shiny.forme);
    if ('game' in shiny) this.game = String(shiny.game);
    if ('method' in shiny) this.method = String(shiny.method);
    if ('count' in shiny && typeof shiny.count === 'object' && shiny.count != null && 'encounters' in shiny.count) {
      this.count = new Count(shiny.count);
    }
    if ('charm' in shiny) this.charm = Boolean(shiny.charm);

    if ('catchTime' in shiny) this.catchTime = Number(shiny.catchTime) || 0;
    if ('name' in shiny) this.name = String(shiny.name);
    if ('ball' in shiny) this.ball = String(shiny.ball);
    if ('gene' in shiny) this.gene = String(shiny.gene);
    if ('originMark' in shiny) this.originMark = String(shiny.originMark);
    if ('hacked' in shiny) this.hacked = Number(shiny.hacked) || 0;

    if ('notes' in shiny) this.notes = String(shiny.notes);

    if ('deleted' in shiny) this.deleted = Boolean(shiny.deleted);
    if ('destroy' in shiny) this.destroy = Boolean(shiny.destroy);
  }

  /**
   * @returns Espèce du Pokémon.
   */
  async getEspece(): Promise<backendPokemon> {
    const pokemon = await pokemonData.getItem(String(this.dexid));
    if (pokemon == null) throw `Aucun Pokémon ne correspond à ce Shiny (${this.name} / ${this.forme})`;
    return pokemon;
  }

  /**
   * @returns Forme du Pokémon.
   */
  async getForme(): Promise<Forme> {
    const pokemon = await this.getEspece();

    const k = pokemon.formes.findIndex(p => p.dbid == this.forme);
    if (k == -1) throw `La forme de ce Shiny est invalide (${this.name} / ${pokemon.name.fr} / ${this.forme})`;
    return pokemon.formes[k];
  }

  /**
   * @returns Nom du Pokémon.
   */
  async getName(lang = document.documentElement.getAttribute('lang') ?? 'fr'): Promise<string> {
    try {
      if (!isNameLang(lang)) throw new Error('language-not-supported');
      const _lang = supportedLangs.includes(lang) ? lang : 'fr';
      const pokemon = await this.getEspece();
      return pokemon.name[_lang];
    } catch (error) { 
      console.error(error);
      return 'error';
    }
  }

  /**
   * @param options - Options du sprite demandé.
   * @returns URL du sprite.
   */
  async getSprite(options: SpriteOptions): Promise<string> {
    try {
      const pokemon = await this.getEspece();
      const forme = await this.getForme();
      return (new Pokemon(pokemon)).getSprite(forme, options);
    } catch (error) {
      console.error(error);
      return 'error';
    }
  }

  /**
   * @returns Si le Pokémon chromatique a été trouvé par moi.
   */
  get mine(): boolean {
    let k = Shiny.methodes('notmine').findIndex(m => m.id == this.method);
    if (k == -1) return true;
    else return false;
  }

  get appliedOriginMark(): string {
    if (this.hacked) return ''; // Hacked Pokémon don't deserve an origin mark
    if (!this.mine) return this.originMark; // Traded Pokémon can have been born on earlier games

    const jeu = this.jeuObj;
    if (jeu.gen === 1 || jeu.gen === 2) return this.originMark; // gen 1 & 2 games could come from 3DS Virtual Console
    else if (jeu.originMark) return jeu.originMark;
    else return 'old';
  }

  /**
   * @returns Liste des méthodes de shasse.
   */
  static get allMethodes(): Methode[] {
    return allMethodes;
  }

  /**
   * @returns Jeu dans lequel le Pokémon a été capturé.
   */
  get jeuObj(): Jeu {
    let k = Pokemon.jeux.findIndex(p => p.uid == this.game);
    if (k == -1) throw `Jeu invalide (${this.game})`;

    return Pokemon.jeux[k];
  }

  /**
   * @param option - Sélecteur de méthodes à considérer.
   * @returns Liste des méthodes concernées par le sélécteur choisi.
   */
  static methodes(option?: string): Methode[] {
    const allMethodes = Shiny.allMethodes;
    switch (option) {
      case 'charmless':
        return allMethodes.filter(m => m.charm == false);
      case 'mine':
        return allMethodes.filter(m => m.mine == true);
      case 'notmine':
        return allMethodes.filter(m => m.mine == false);
      default:
        return allMethodes;
    }
  }

  /**
   * @returns Les chances que le Pokémon avait d'être chromatique.
   */
  get shinyRate(): number | null {
    // Taux de base
    const game = this.jeuObj;
    const baseRate = (game.gen === 0) ? 450
                   : (game.gen <= 5) ? 8192
                   : 4096;

    const methodes = Shiny.methodes();

    let k = methodes.findIndex(p => p.id == this.method);
    if (k == -1) throw `Méthode invalide (${this.method})`;

    const methode = methodes[k];
    let rolls = 1;
    let bonusRolls = 0;
    let charmRolls = Number(game.gen >= 5) * Number(this.charm) * 2;

    switch (methode.id) {
      case 'wild': {
        if (game.id === 'lgpe') {
          const lureRolls = this.count['lgpe-lure'] ? 1 : 0;
          const combo = this.count['lgpe-catchCombo'] || 0;
          const chainRolls = (combo >= 31) ? 11
                          : (combo >= 21) ? 7
                          : (combo >= 11) ? 3
                          : 0
          bonusRolls = lureRolls + chainRolls;
        }

        else if (game.id === 'swsh') {
          const dexKo = this.count['swsh-dexKo'] || 0;
          if (!dexKo) break;

          const chainRolls = (dexKo >= 500) ? 5
                           : (dexKo >= 300) ? 4
                           : (dexKo >= 200) ? 3
                           : (dexKo >= 100) ? 2
                           : (dexKo >= 50) ? 1
                           : 0;
          const brilliantChance = (dexKo >= 500) ? 3
                                : (dexKo >= 300) ? 3
                                : (dexKo >= 200) ? 2.5
                                : (dexKo >= 100) ? 2
                                : (dexKo >= 50) ? 1.5
                                : 0;
          const rolls = 1 + charmRolls + chainRolls;
          let rate = Math.round(baseRate / rolls);
          rate = (brilliantChance / 100) * rate + ((100 - brilliantChance) / 100) * baseRate;
          rate = Math.round(rate);
          return rate;
        }

        break;
      }

      case 'glitch':
      case 'wildalwaysshiny':
      case 'event':
        return 1;
      
      case 'masuda': {
        bonusRolls = (game.gen >= 8) ? 6 : (game.gen >= 5) ? 5 : 4;
        break;
      }
      
      case 'pokeradar': {
        const chain = Math.min(40, Math.max(0, this.count.encounters));
        let odds = 0;
        switch (game.id) {
          case 'dp':
          case 'platinum':
          case 'xy': 
            odds = Math.ceil(65535 / (8200 - chain * 200));
            break;

          case 'bdsp':
            odds = chain < 30 ? 16 + chain
                 : chain < 36 ? 20 + chain
                 : chain === 36 ? 30 + chain
                 : 82 << (chain - 37);
            break;
          
        }
        const rate = 65536 / odds;
        return Math.round(rate);
      }
      
      case 'chainfishing': {
        const chain = Math.min(20, this.count.encounters);
        bonusRolls = 2 * chain;
        break;
      }
      
      case 'dexnavchain': {
        // compliqué...
        break;
      }

      case 'friendsafari': {
        bonusRolls = 4;
        break;
      }

      case 'soschain': {
        const compteur = this.count.encounters;
        const chainCoeff = (compteur >= 31) ? 3
                         : (compteur >= 21) ? 2
                         : (compteur >= 11) ? 1
                         : 0;
        bonusRolls = 4 * chainCoeff;
        break;
      }

      case 'ultrawormhole': {
        // this.compteur == au format { "distance": 30, "rings": 2 }
        let d = Math.min(9, Math.floor(this.count['usum-distance'] || 0) / 500 - 1);
        const rings = this.count['usum-rings'] || 0;
        const odds = (rings == 3) ? (4 * d)
                   : (rings == 2) ? ((1 + 2 * d))
                   : (rings == 1) ? ((1 + d))
                   : 1;
        const rate = Math.round(100 / odds);
        return rate;
      }

      case 'wildevent': {
        // ???
        return null;
      }

      case 'raid': {
        if (game.id === 'swsh') return null;
        else if (game.id === 'sv') return Math.round(4103.05);
      }

      case 'dynamaxadventure': {
        const rate = (charmRolls > 0) ? 100 : 300;
        return rate;
      }

      case 'massoutbreak': {
        if (game.id === 'pla') bonusRolls = 25;
        else if (game.id === 'sv') bonusRolls = this.count['sv-outbreakCleared'] || 0;
        break;
      }

      case 'massivemassoutbreak': {
        bonusRolls = 12;
        break;
      }

      case 'fixedencounter': {
        return baseRate;
      }
    }

    switch (game.id) {
      case 'pla': {
        charmRolls = Number(this.charm) * 3;
        const dexResearch = this.count['pla-dexResearch'] || 0;
        bonusRolls += dexResearch === 2 ? 3 : dexResearch;
        break;
      }

      case 'sv': {
        const sparklingPower = this.count['sv-sparklingPower'] || 0;
        bonusRolls += sparklingPower;
      } break;
    }

    if (game.gen >= 8 && ['egg', 'masuda'].includes(methode.id)) {
      // If any other bonus is applied, skip the first shiny roll
      if (charmRolls || bonusRolls) bonusRolls--;
    }

    rolls += (charmRolls || 0) + (bonusRolls || 0);
    const rate = Math.round(baseRate / rolls);
    return rate;
  }
}

export { Pokemon, Shiny };

