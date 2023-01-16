import { Forme, Jeu, Pokemon, SpriteOptions, backendPokemon, isNameLang, supportedLangs } from './Pokemon.js';
import { pokemonData } from './localForage.js';



export type Methode = {
  id: string, // id de la méthode
  jeux: Jeu[], // liste de jeux dans lesquels la méthode s'applique
  mine: boolean, // si le Pokémon obtenu porte mon DO ou non
  charm: boolean, // si le Charme Chroma influe sur cette méthode
};

const allGames = Pokemon.jeux;
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
  { id: 'event', jeux: allGames, mine: false, charm: false },

  { id: 'trade', jeux: allGames, mine: false, charm: false },
  { id: 'gtstrade', jeux: allGames.filter(g => g.gen >= 4 && g.gen != 7.1), mine: false, charm: false },
  { id: 'wondertrade', jeux: allGames.filter(g => g.gen >= 6 && g.gen != 7.1), mine: false, charm: false },
  { id: 'eggtrade', jeux: allGames.filter(g => g.gen >= 2 && g.gen != 7.1), mine: false, charm: false },

  { id: 'glitch', jeux: allGames.filter(g => [1, 2].includes(g.gen)), mine: true, charm: false },
  { id: 'hack', jeux: allGames, mine: false, charm: false },
];



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
  creationTime: string,
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

  notes: string,

  deleted: boolean,
};

/** Structure d'un Pokémon shiny tel que stocké dans la BDD locale. */
export interface frontendShiny extends Omit<backendShiny, 'id' | 'creationTime' | 'lastUpdate' | 'count' | 'catchTime' | 'deleted'> {
  creationTime: number,
  lastUpdate: number,
  count: Count,
  catchTime: number,
  deleted?: boolean,
  destroy?: boolean
}



export class Shiny implements frontendShiny {
  // frontendShiny fields
  readonly huntid: string = crypto.randomUUID();
  readonly creationTime: number = Date.now();
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
  
  notes: string = '';

  deleted?: boolean = false;
  destroy?: boolean = false;

  constructor(shiny: object = {}) {
    if (typeof shiny !== 'object') throw new Error('Invalid argument');

    if ('huntid' in shiny) this.huntid = String(shiny.huntid);
    if ('creationTime' in shiny) this.creationTime = Number(shiny.creationTime) || this.creationTime;
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
    try {
      if (!this.game || !this.method) return ''; // If game or method wasn't set, we can't compute an origin mark
      if (this.method === 'hack') return ''; // Hacked Pokémon don't deserve an origin mark
      if (!this.mine) return this.originMark; // Traded Pokémon can have been born on earlier games

      const jeu = this.jeuObj;
      if (jeu.gen === 1 || jeu.gen === 2) return this.originMark; // gen 1 & 2 games could come from 3DS Virtual Console
      else if (jeu.originMark) return jeu.originMark;
      else return 'old';
    } catch (error) {
      return '';
    }
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
    try {
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
    } catch (error) {
      return null;
    }
  }
}