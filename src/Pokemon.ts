import { pad } from './Params.js';
import { dataStorage, pokemonData } from './localForage.js';



export type Jeu = {
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
export const supportedLangs: Array<nameLang> = ['fr', 'en'];
export function isNameLang(string: string): string is nameLang {
  return supportedLangs.includes(string as nameLang);
}



export type SpriteOptions = {
  shiny: boolean,
  backside?: boolean,
  size: number,
  format: 'webp' | 'png'
};



export class Pokemon {
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

    const names: string[] = await Promise.all(
      (await pokemonData.keys())
      .sort((a, b) => Number(a) - Number(b))
      .map(async (key, dexid) => {
        const pkmn = await pokemonData.getItem(key);
        return pkmn.name[_lang];
      })
    );

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
    
  
    try {
      await Promise.all([dataStorage.ready(), pokemonData.ready()]);
      const [fileVersion, dataVersion] = await Promise.all([
        dataStorage.getItem('file-versions').then(versions => versions?.['./data/pokemon.json'] ?? []),
        dataStorage.getItem('pokemon-data-version').then(version => Number(version) || 0),
      ]);
    
      if (fileVersion === dataVersion) return;

      // @ts-ignore
      const data = await import('../data/pokemon.json', { assert: { type: 'json' }}).then(module => module.default);
  
      console.log(`[:)] Préparation des données...`);
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