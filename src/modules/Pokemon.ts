import { appStrings, isSupportedPokemonLang, pokemonData } from './jsonData.js';
import { pad } from './Params.js';



function getCurrentLang() { return document.documentElement.lang; }



export type Jeu = {
  uid: string, // id de la version précise du jeu
  id: string, // id du jeu (incluant versions alternatives)
  gen: number, // numéro de la génération du jeu
  hasCharm: boolean, // si le jeu contient le charme chroma
  originMark?: string, // numéro de la marque d'origine affichée sur les Pokémon capturés dans le jeu
};

const allGames: Jeu[] = [
  { uid: 'blue', gen: 1, id: 'rby', hasCharm: false, originMark: 'game-boy' },
  { uid: 'red', gen: 1, id: 'rby', hasCharm: false, originMark: 'game-boy' },
  { uid: 'yellow', gen: 1, id: 'rby', hasCharm: false, originMark: 'game-boy' },
  { uid: 'gold', gen: 2, id: 'gsc', hasCharm: false, originMark: 'game-boy' },
  { uid: 'silver', gen: 2, id: 'gsc', hasCharm: false, originMark: 'game-boy' },
  { uid: 'crystal', gen: 2, id: 'gsc', hasCharm: false, originMark: 'game-boy' },
  { uid: 'sapphire', gen: 3, id: 'rs', hasCharm: false },
  { uid: 'ruby', gen: 3, id: 'rs', hasCharm: false },
  { uid: 'emerald', gen: 3, id: 'emerald', hasCharm: false },
  { uid: 'firered', gen: 3, id: 'frlg', hasCharm: false },
  { uid: 'leafgreen', gen: 3, id: 'frlg', hasCharm: false },
  { uid: 'diamond', gen: 4, id: 'dp', hasCharm: false },
  { uid: 'pearl', gen: 4, id: 'dp', hasCharm: false },
  { uid: 'platinum', gen: 4, id: 'platinum', hasCharm: false },
  { uid: 'heartgold', gen: 4, id: 'hgss', hasCharm: false },
  { uid: 'soulsilver', gen: 4, id: 'hgss', hasCharm: false },
  { uid: 'black', gen: 5, id: 'bw', hasCharm: false },
  { uid: 'white', gen: 5, id: 'bw', hasCharm: false },
  { uid: 'black2', gen: 5, id: 'bw2', hasCharm: true },
  { uid: 'white2', gen: 5, id: 'bw2', hasCharm: true },
  { uid: 'x', gen: 6, id: 'xy', originMark: 'gen6', hasCharm: true },
  { uid: 'y', gen: 6, id: 'xy', originMark: 'gen6', hasCharm: true },
  { uid: 'omegaruby', gen: 6, id: 'oras', originMark: 'gen6', hasCharm: true },
  { uid: 'alphasapphire', gen: 6, id: 'oras', originMark: 'gen6', hasCharm: true },
  { uid: 'sun', gen: 7, id: 'sm', originMark: 'alola', hasCharm: true },
  { uid: 'moon', gen: 7, id: 'sm', originMark: 'alola', hasCharm: true },
  { uid: 'ultrasun', gen: 7, id: 'usum', originMark: 'alola', hasCharm: true },
  { uid: 'ultramoon', gen: 7, id: 'usum', originMark: 'alola', hasCharm: true },
  { uid: 'go', gen: 0, id: 'go', originMark: 'go', hasCharm: false },
  { uid: 'letsgopikachu', gen: 7.1, id: 'lgpe', originMark: 'lets-go', hasCharm: true },
  { uid: 'letsgoeevee', gen: 7.1, id: 'lgpe', originMark: 'lets-go', hasCharm: true },
  { uid: 'sword', gen: 8, id: 'swsh', originMark: 'galar', hasCharm: true },
  { uid: 'shield', gen: 8, id: 'swsh', originMark: 'galar', hasCharm: true },
  { uid: 'home', gen: 8, id: 'home', hasCharm: false },
  { uid: 'brilliantdiamond', gen: 8, id: 'bdsp', originMark: 'sinnoh-gen8', hasCharm: true },
  { uid: 'shiningpearl', gen: 8, id: 'bdsp', originMark: 'sinnoh-gen8', hasCharm: true },
  { uid: 'legendsarceus', gen: 8.1, id: 'pla', originMark: 'hisui', hasCharm: true },
  { uid: 'scarlet', gen: 9, id: 'sv', originMark: 'paldea', hasCharm: true },
  { uid: 'violet', gen: 9, id: 'sv', originMark: 'paldea', hasCharm: true },
  { uid: 'sleep', gen: 0, id: 'sleep', hasCharm: false },
  { uid: 'legendsza', gen: 9, id: 'za', hasCharm: true },
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
  { num: 9, start: 906, end: 1025}
];



/** Structure d'une Forme de Pokémon. */
export class Forme {
  dbid: string = '';
  name: {
    fr: string,
    en: string
  } = { fr: '', en: '' };
  form: number = 0;
  gender: string = 'mf';
  gigamax: boolean = false;
  candy: number = 0;
  hasBackside?: boolean;
  noShiny?: boolean;
  catchable?: boolean = true;

  constructor(forme: object = {}) {
    if ('dbid' in forme) this.dbid = String(forme.dbid);
    if ('name' in forme && typeof forme.name === 'object' && forme.name != null) {
      this.name = {
        fr: 'fr' in forme.name ? String(forme.name.fr ?? '') : '',
        en: 'en' in forme.name ? String(forme.name.en ?? '') : ''
      };
    }
    if ('form' in forme) this.form = Number(forme.form) || 0;
    if ('gender' in forme) this.gender = String(forme.gender);
    if ('gigamax' in forme) this.gigamax = Boolean(forme.gigamax);
    if ('candy' in forme) this.candy = Number(forme.candy) || 0;
    if ('hasBackside' in forme) this.hasBackside = Boolean(forme.hasBackside);
    if ('noShiny' in forme) this.noShiny = Boolean(forme.noShiny);
    if ('catchable' in forme) this.catchable = Boolean(forme.catchable);
  }
};



/** Structure d'un Pokémon. */
export type backendPokemon = typeof pokemonData[0];



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
  getName(lang = getCurrentLang()): string {
    if (!isSupportedPokemonLang(lang)) throw new Error('language-not-supported');
    return this.name[lang];
  }

  /**
   * @returns Nom d'une forme du Pokémon.
   */
  getFormeName(id: string = '', withName: boolean = true, lang = getCurrentLang()): string {
    if (!isSupportedPokemonLang(lang)) throw new Error('language-not-supported');
    const forme = this.formes.find(f => f.dbid === id);
    let name = this.getName(lang);
    if (withName) return forme?.name[lang].replace('{{name}}', name) || name;
    else          return forme?.name[lang].replace('{{name}}', '').trim() || appStrings[lang]?.['forme-base'];
  }

  /**
   * @returns Liste des noms de tous les Pokémon, dans l'ordre du Pokédex national.
   */
  static names(lang = getCurrentLang()): string[] {
    if (!isSupportedPokemonLang(lang)) throw new Error('language-not-supported');

    const cachedNames = Pokemon.#names[lang];
    if (cachedNames.length > 0) return cachedNames;

    const names: string[] = pokemonData.sort((a, b) => a.dexid - b.dexid).map(pkmn => pkmn.name[lang]);
    Pokemon.#names[lang] = names;
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
}