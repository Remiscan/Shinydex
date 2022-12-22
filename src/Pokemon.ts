import { pad } from './Params.js';
import { pokemonData } from './localForage.js';



type Jeu = {
  uid: string, // id de la version précise du jeu
  id: string, // id du jeu (incluant versions alternatives)
  gen: number, // numéro de la génération du jeu
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
  { uid: 'x', gen: 6, id: 'xy' },
  { uid: 'y', gen: 6, id: 'xy' },
  { uid: 'omegaruby', gen: 6, id: 'oras' },
  { uid: 'alphasapphire', gen: 6, id: 'oras' },
  { uid: 'sun', gen: 7, id: 'sm' },
  { uid: 'moon', gen: 7, id: 'sm' },
  { uid: 'ultrasun', gen: 7, id: 'usum' },
  { uid: 'ultramoon', gen: 7, id: 'usum' },
  { uid: 'go', gen: 0, id: 'go' },
  { uid: 'letsgopikachu', gen: 7.1, id: 'lgpe' },
  { uid: 'letsgoeevee', gen: 7.1, id: 'lgpe' },
  { uid: 'sword', gen: 8, id: 'swsh' },
  { uid: 'shield', gen: 8, id: 'swsh' },
  { uid: 'home', gen: 8, id: 'home' },
  { uid: 'brilliantdiamond', gen: 8, id: 'bdsp' },
  { uid: 'shiningpearl', gen: 8, id: 'bdsp' },
  { uid: 'legendsarceus', gen: 8.1, id: 'pla' },
  { uid: 'scarlet', gen: 9, id: 'sv' },
  { uid: 'violet', gen: 9, id: 'sv' }
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
  { id: 'reset', jeux: allGames.filter(g => g.gen >= 2), mine: true, charm: true },
  { id: 'pokeradar', jeux: allGames.filter(g => [4, 6].includes(g.gen) || g.id == 'bdsp'), mine: true, charm: true },
  { id: 'chainfishing', jeux: allGames.filter(g => g.gen == 6), mine: true, charm: true },
  { id: 'wildhorde', jeux: allGames.filter(g => g.id == 'xy'), mine: true, charm: true },
  { id: 'friendsafari', jeux: allGames.filter(g => g.id == 'xy'), mine: true, charm: true },
  { id: 'dexnavchain', jeux: allGames.filter(g => g.id == 'oras'), mine: true, charm: true },
  { id: 'soschain', jeux: allGames.filter(g => g.gen == 7), mine: true, charm: true },
  { id: 'ultrawormhole', jeux: allGames.filter(g => g.gen == 7), mine: true, charm: false },
  { id: 'catchcombo', jeux: allGames.filter(g => g.gen == 7.1), mine: true, charm: true },
  { id: 'battlebonus', jeux: allGames.filter(g => g.gen == 8), mine: true, charm: true },
  { id: 'raid', jeux: allGames.filter(g => g.id == 'swsh' || g.id == 'sv'), mine: true, charm: false },
  { id: 'dynamaxadventure', jeux: allGames.filter(g => g.gen == 8), mine: true, charm: true },
  { id: 'wildevent', jeux: allGames.filter(g => g.gen == 0), mine: true, charm: false },
  { id: 'wildalwaysshiny', jeux: allGames.filter(g => ['gs', 'hgss', 'bw2'].includes(g.id)), mine: true, charm: false },
  { id: 'glitch', jeux: allGames.filter(g => [1, 2].includes(g.gen)), mine: true, charm: false },
  { id: 'event', jeux: allGames, mine: false, charm: false },
  { id: 'trade', jeux: allGames, mine: false, charm: false },
  { id: 'gtstrade', jeux: allGames.filter(g => g.gen >= 4 && g.gen != 7.1), mine: false, charm: false },
  { id: "wondertrade", jeux: allGames.filter(g => g.gen >= 6 && g.gen != 7.1), mine: false, charm: false },
  { id: 'eggtrade', jeux: allGames.filter(g => g.gen >= 2 && g.gen != 7.1), mine: false, charm: false },
  { id: 'massoutbreak', jeux: allGames.filter(g => g.id == 'pla' || g.id == 'sv'), mine: true, charm: true },
  { id: 'massivemassoutbreak', jeux: allGames.filter(g => g.id == 'pla'), mine: true, charm: true },
];



/** Structure d'une Forme de Pokémon. */
export type Forme = {
  dbid: string,
  nom: string,
  form: number,
  gender: string,
  gigamax: boolean,
  candy: number,
  hasBackside?: boolean,
  noShiny?: boolean,
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



/** Structure d'un Pokémon shiny tel que stocké dans la BDD en ligne. */
interface backendShiny {
  id: number,
  huntid: string,
  userid: string,
  lastUpdate: string,
  dexid: number,
  forme: string,
  gene: string,
  surnom: string,
  methode: string,
  compteur: string,
  timeCapture: number,
  jeu: string,
  ball: string,
  notes: string,
  checkmark: number,
  DO: boolean,
  charm: boolean,
  hacked: number,
  horsChasse: boolean,
};

/** Structure d'un Pokémon shiny tel que stocké dans la BDD locale. */
export interface frontendShiny extends Omit<backendShiny, 'id' | 'lastUpdate' | 'userid'> {
  lastUpdate: number,
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
  public dexid: number;
  public name: {
    'fr': string,
    'en': string
  };
  public formes: Forme[];
  static #names: {
    fr: string[],
    en: string[]
  } = {
    fr: [],
    en: []
  };

  constructor(pkmn: backendPokemon) {
    this.dexid = pkmn.dexid;
    this.name = pkmn.name;
    this.formes = pkmn.formes;
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
  getName(lang = document.documentElement.getAttribute('lang')): string {
    return this.name[lang as nameLang ?? 'fr'];
  }

  /**
   * @returns Liste des noms anglais de tous les Pokémon, dans l'ordre du Pokédex national.
   */
  static async names(lang = document.documentElement.getAttribute('lang')): Promise<string[]> {
    const cachedNames = Pokemon.#names[lang as nameLang];
    if (cachedNames.length > 0) return cachedNames;

    const keys = (await pokemonData.keys()).sort((a, b) => Number(a) - Number(b));
    const names = [];
    for (const key of keys) {
      const pkmn = await pokemonData.getItem(key);
      const name = pkmn.name[lang as nameLang];
      names.push(name);
    }
    Pokemon.#names[lang as nameLang] = names;
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



class Shiny implements frontendShiny {
  // frontendShiny fields
  huntid: string = '';
  userid: string = '';
  lastUpdate: number = NaN;
  dexid: number = NaN;
  forme: string = '';
  gene: string = '';
  surnom: string = '';
  methode: string = '';
  compteur: string = '';
  timeCapture: number = NaN;
  jeu: string = '';
  ball: string = '';
  notes: string = '';
  checkmark: number = NaN;
  DO: boolean = false;
  charm: boolean = false;
  hacked: number = NaN;
  horsChasse: boolean = false;

  // additional fields
  deleted: boolean = false;
  destroy: boolean = false;

  constructor(shiny: frontendShiny) {
    Object.assign(this, shiny);
    this.deleted = Boolean(shiny.deleted);
  }

  /**
   * @returns Espèce du Pokémon.
   */
  async getEspece(): Promise<backendPokemon> {
    const pokemon = await pokemonData.getItem(String(this.dexid));
    if (pokemon == null) throw `Aucun Pokémon ne correspond à ce Shiny (${this.surnom} / ${this.forme})`;
    return pokemon;
  }

  /**
   * @returns Forme du Pokémon.
   */
  async getForme(): Promise<Forme> {
    const pokemon = await this.getEspece();

    const k = pokemon.formes.findIndex(p => p.dbid == this.forme);
    if (k == -1) throw `La forme de ce Shiny est invalide (${this.surnom} / ${pokemon.name.fr} / ${this.forme})`;
    return pokemon.formes[k];
  }

  /**
   * @returns Nom du Pokémon.
   */
  async getName(lang = document.documentElement.getAttribute('lang')): Promise<string> {
    try {
      const pokemon = await this.getEspece();
      return pokemon.name[lang as nameLang ?? 'fr'];
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
    let k = Shiny.methodes('notmine').findIndex(m => m.id == this.methode);
    if (k == -1) return true;
    else return false;
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
  get Jeu(): Jeu {
    let k = Pokemon.jeux.findIndex(p => p.uid == this.jeu);
    if (k == -1) throw `Jeu invalide (${this.jeu})`;

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
    const game = this.Jeu;
    const baseRate = (game.gen === 0) ? 450
                   : (game.gen <= 5) ? 8192
                   : 4096;

    const methodes = Shiny.methodes();

    let k = methodes.findIndex(p => p.id == this.methode);
    if (k == -1) throw `Méthode invalide (${this.methode})`;

    const methode = methodes[k];
    let rolls = 1;
    let bonusRolls = 0;
    let charmRolls = Number(this.charm) * 2;

    switch (methode.id) {
      case 'glitch':
      case 'wildalwaysshiny':
      case 'event':
        return 1;
      
      case 'masuda': {
        bonusRolls = (game.gen >= 5) ? 5 : 4;
        break;
      }
      
      case 'pokeradar': {
        const chain = Math.min(40, Math.max(0, Number(this.compteur)));
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
        const chain = Math.min(20, Number(this.compteur));
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
        const compteur = Number(this.compteur);
        const chainCoeff = (compteur >= 31) ? 3
                         : (compteur >= 21) ? 2
                         : (compteur >= 11) ? 1
                         : 0;
        bonusRolls = 4 * chainCoeff;
        break;
      }

      case 'ultrawormhole': {
        // this.compteur == au format { "distance": 30, "rings": 2 }
        const compteur = (this.compteur === '0') ? { distance: 0, rings: 0 }
                       : JSON.parse(this.compteur);
        let d = Math.min(9, Math.floor(compteur.distance) / 500 - 1);
        const odds = (compteur.rings == 3) ? (4 * d)
                   : (compteur.rings == 2) ? ((1 + 2 * d))
                   : (compteur.rings == 1) ? ((1 + d))
                   : 1;
        const rate = Math.round(100 / odds);
        return rate;
      }

      case 'wildevent': {
        // ???
        return Number(this.compteur);
      }

      case 'catchcombo': {
        // this.compteur == au format { "chain": 20, "lure": true }
        const compteur = (this.compteur === '0') ? { chain: 0, lure: false }
                       : JSON.parse(this.compteur);
        const lureRolls = (compteur.lure) ? 1 : 0;
        const chainRolls = (compteur.chain >= 31) ? 11
                         : (compteur.chain >= 21) ? 7
                         : (compteur.chain >= 11) ? 3
                         : 0
        bonusRolls = lureRolls + chainRolls;
        break;
      }

      case 'battlebonus': {
        const compteur = Number(this.compteur);
        const chainRolls = (compteur >= 500) ? 5
                         : (compteur >= 300) ? 4
                         : (compteur >= 200) ? 3
                         : (compteur >= 100) ? 2
                         : (compteur >= 50) ? 1
                         : 0;
        const brilliantChance = (compteur >= 500) ? 3
                              : (compteur >= 300) ? 3
                              : (compteur >= 200) ? 2.5
                              : (compteur >= 100) ? 2
                              : (compteur >= 50) ? 1.5
                              : 0;
        const rolls = 1 + charmRolls + chainRolls;
        let rate = Math.round(baseRate / rolls);
        rate = (brilliantChance / 100) * rate + ((100 - brilliantChance) / 100) * baseRate;
        rate = Math.round(rate);
        return rate;
      }

      case 'maxraidbattle': {
        return null;
      }

      case 'dynamaxadventure': {
        const rate = (charmRolls > 0) ? 100 : 300;
        return rate;
      }

      case 'massoutbreak': {
        bonusRolls = 25;
        break;
      }

      case 'massivemassoutbreak': {
        bonusRolls = 12;
        break;
      }
    }

    switch (game.id) {
      case 'pla': {
        charmRolls = Number(this.charm) * 3;
        const dexResearch = Number((JSON.parse(this.compteur)).dexResearch);
        bonusRolls += dexResearch === 2 ? 3 : dexResearch;
        break;
      }
    }

    rolls += charmRolls + bonusRolls;
    const rate = Math.round(baseRate / rolls);
    return rate;
  }
}

export { Pokemon, Shiny };

