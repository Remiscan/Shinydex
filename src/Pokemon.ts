import { dataStorage, pokemonData } from './localforage.js';
import { pad } from './Params.js';



type Jeu = {
  nom: string, // nom du jeu en FR
  gen: number, // numéro de la génération du jeu
  id: string, // id du jeu
};

const allGames: Jeu[] = [
  { nom: 'Bleue', gen: 1, id: 'rb' },
  { nom: 'Rouge', gen: 1, id: 'rb' },
  { nom: 'Jaune', gen: 1, id: 'yellow' },
  { nom: 'Or', gen: 2, id: 'gs' },
  { nom: 'Argent', gen: 2, id: 'gs' },
  { nom: 'Cristal', gen: 2, id: 'crystal' },
  { nom: 'Saphir', gen: 3, id: 'rs' },
  { nom: 'Rubis', gen: 3, id: 'rs' },
  { nom: 'Emeraude', gen: 3, id: 'emerald' },
  { nom: 'Rouge Feu', gen: 3, id: 'frlg' },
  { nom: 'Vert Feuille', gen: 3, id: 'frlg' },
  { nom: 'Diamant', gen: 4, id: 'dp' },
  { nom: 'Perle', gen: 4, id: 'dp' },
  { nom: 'Platine', gen: 4, id: 'platinum' },
  { nom: 'Or HeartGold', gen: 4, id: 'hgss' },
  { nom: 'Argent SoulSilver', gen: 4, id: 'hgss' },
  { nom: 'Noire', gen: 5, id: 'bw' },
  { nom: 'Noire 2', gen: 5, id: 'bw2' },
  { nom: 'X', gen: 6, id: 'xy' },
  { nom: 'Y', gen: 6, id: 'xy' },
  { nom: 'Rubis Oméga', gen: 6, id: 'oras' },
  { nom: 'Saphir Alpha', gen: 6, id: 'oras' },
  { nom: 'Soleil', gen: 7, id: 'sm' },
  { nom: 'Lune', gen: 7, id: 'sm' },
  { nom: 'Ultra Soleil', gen: 7, id: 'usum' },
  { nom: 'Ultra Lune', gen: 7, id: 'usum' },
  { nom: 'GO', gen: 0, id: 'go' },
  { nom: 'Let\'s Go Pikachu', gen: 7.1, id: 'lgpe' },
  { nom: 'Let\'s Go Evoli', gen: 7.1, id: 'lgpe' },
  { nom: 'Epee', gen: 8, id: 'swsh' },
  { nom: 'Bouclier', gen: 8, id: 'swsh' },
  { nom: 'Home', gen: 8, id: 'home' },
  { nom: 'Diamant Étincelant', gen: 8, id: 'bdsp' },
  { nom: 'Perle Scintillante', gen: 8, id: 'bdsp' }
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
  { num: 8, start: 810, end: 898 },
];



export type Methode = {
  nom: string, // nom de la méthode en FR
  jeux: Jeu[], // liste de jeux dans lesquels la méthode s'applique
  mine: boolean, // si le Pokémon obtenu porte mon DO ou non
  charm: boolean, // si le Charme Chroma influe sur cette méthode
};

const allMethodes: Methode[] = [
  { nom: 'Sauvage', jeux: allGames, mine: true, charm: true },
  { nom: 'Œuf', jeux: allGames.filter(g => ![1, 7.1, 0].includes(g.gen)), mine: true, charm: true },
  { nom: 'Masuda', jeux: allGames.filter(g => g.gen >= 4 && g.gen != 7.1), mine: true, charm: true },
  { nom: 'Reset', jeux: allGames.filter(g => g.gen >= 2), mine: true, charm: true },
  { nom: 'Pokéradar', jeux: allGames.filter(g => [4, 6].includes(g.gen)), mine: true, charm: true },
  { nom: 'Pêche à la chaîne', jeux: allGames.filter(g => g.gen == 6), mine: true, charm: true },
  { nom: 'Sauvage (horde)', jeux: allGames.filter(g => g.id == 'xy'), mine: true, charm: true },
  { nom: 'Safari des Amis', jeux: allGames.filter(g => g.id == 'xy'), mine: true, charm: true },
  { nom: 'Chaîne au Navi-Dex', jeux: allGames.filter(g => g.id == 'oras'), mine: true, charm: true },
  { nom: 'Chaîne SOS', jeux: allGames.filter(g => g.gen == 7), mine: true, charm: true },
  { nom: 'Ultra-Brèche', jeux: allGames.filter(g => g.gen == 7), mine: true, charm: false },
  { nom: 'Chaîne de captures', jeux: allGames.filter(g => g.gen == 7.1), mine: true, charm: true },
  { nom: 'Bonus de combats', jeux: allGames.filter(g => g.gen == 8), mine: true, charm: true },
  { nom: 'Raid Dynamax', jeux: allGames.filter(g => g.gen == 8), mine: true, charm: false },
  { nom: 'Expédition Dynamax', jeux: allGames.filter(g => g.gen == 8), mine: true, charm: true },
  { nom: 'Sauvage (évènement)', jeux: allGames.filter(g => g.gen == 0), mine: true, charm: false },
  { nom: 'Sauvage (garanti)', jeux: allGames.filter(g => ['gs', 'hgss', 'bw2'].includes(g.id)), mine: true, charm: false },
  { nom: 'Glitch', jeux: allGames.filter(g => [1, 2].includes(g.gen)), mine: true, charm: false },
  { nom: 'Distribution', jeux: allGames, mine: false, charm: false },
  { nom: 'Échangé', jeux: allGames, mine: false, charm: false },
  { nom: 'Échangé (GTS)', jeux: allGames.filter(g => g.gen >= 4 && g.gen != 7.1), mine: false, charm: false },
  { nom: 'Échange miracle', jeux: allGames.filter(g => g.gen >= 6 && g.gen != 7.1), mine: false, charm: false },
  { nom: 'Échangé (œuf)', jeux: allGames.filter(g => g.gen >= 2 && g.gen != 7.1), mine: false, charm: false }
];



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



interface backendPokemon {
  dexid: number,
  name: string,
  namefr: string,
  formes: Forme[],
};



// Structure d'un Pokémon shiny tel que stocké dans la BDD en ligne
interface backendShiny {
  id: number,
  huntid: string,
  lastUpdate: string,
  dexid: number,
  formid: string,
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

// Structure d'un Pokémon shiny tel que stocké dans la BDD locale
export interface frontendShiny extends Omit<backendShiny, 'id' | 'lastUpdate'> {
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
  public name: string;
  public namefr: string;
  public formes: Forme[];

  constructor(pkmn: backendPokemon) {
    this.dexid = pkmn.dexid;
    this.name = pkmn.name;
    this.namefr = pkmn.namefr;
    this.formes = pkmn.formes;
  }

  getSprite(forme: Forme, { shiny = false, backside = undefined, size = 512, format = 'png' }: SpriteOptions): string {
    const shinySuffix = shiny ? 'r' : 'n';

    const side = (typeof forme.hasBackside !== 'undefined' && typeof backside !== 'undefined' && backside === true) ? 'b' : 'f';

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

    let spriteUrl = `/remidex/pokemon-sprite-${spriteCaracs.join('_')}-${size}.${format}`;

    if (typeof forme.noShiny !== 'undefined' && forme.noShiny === true && shiny === true)
      spriteUrl = this.getSprite(forme, { shiny: false, size, format });

    return spriteUrl;
  }

  get gen(): number | undefined {
    const gens = Pokemon.generations;
    for (let gen of gens) {
      if (this.dexid >= gen.start && this.dexid <= gen.end) return gen.num;
    }
  }

  static async names(): Promise<string[]> {
    await dataStorage.ready();
    return await dataStorage.getItem('pokemon-names');
  }

  static async namesfr(): Promise<string[]> {
    await dataStorage.ready();
    return await dataStorage.getItem('pokemon-names-fr');
  }

  static get jeux(): Jeu[] {
    return allGames;
  }

  static get generations() {
    return generations;
  }
}



class Shiny implements frontendShiny {
  // frontendShiny fields
  huntid: string = '';
  lastUpdate: number = NaN;
  dexid: number = NaN;
  formid: string = '';
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

  async getEspece(): Promise<backendPokemon> {
    const pokemon = await pokemonData.getItem(String(this.dexid));
    if (pokemon == null) throw `Aucun Pokémon ne correspond à ce Shiny (${this.surnom} / ${this.formid})`;
    return pokemon;
  }

  async getForme(): Promise<Forme> {
    const pokemon = await this.getEspece();

    const k = pokemon.formes.findIndex(p => p.dbid == this.formid);
    if (k == -1) throw `La forme de ce Shiny est invalide (${this.surnom} / ${pokemon.namefr} / ${this.formid})`;
    return pokemon.formes[k];
  }

  async getName(): Promise<string> {
    try {
      const pokemon = await this.getEspece();
      return pokemon.name;
    } catch (error) { 
      console.error(error);
      return 'error';
    }
  }

  async getNamefr(): Promise<string> {
    try {
      const pokemon = await this.getEspece();
      return pokemon.namefr;
    } catch (error) { 
      console.error(error);
      return 'error';
    }
  }

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

  get mine() {
    let k = Shiny.methodes('notmine').findIndex(m => m.nom == this.methode);
    if (k == -1) return true;
    else return false;
  }

  static get allMethodes() {
    return allMethodes;
  }

  get Jeu() {
    let k = Pokemon.jeux.findIndex(p => p.nom == this.jeu);
    if (k == -1) throw `Jeu invalide (${this.jeu})`;

    return Pokemon.jeux[k];
  }

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

  get shinyRate(): number | null {
    // Taux de base
    const game = this.Jeu;
    const baseRate = (game.gen === 0) ? 450
                   : (game.gen <= 5) ? 8192
                   : 4096;

    const methodes = Shiny.methodes();

    let k = methodes.findIndex(p => p.nom == this.methode);
    if (k == -1) throw `Méthode invalide (${this.methode})`;

    const methode = methodes[k];
    let rolls = 1;
    let bonusRolls = 0;
    let charmRolls = Number(this.charm) * 2;

    switch (methode.nom) {
      case 'Glitch':
      case 'Sauvage (garanti)':
      case 'Distribution':
        return 1;
      
      case 'Masuda': {
        bonusRolls = (game.gen >= 5) ? 5 : 4;
        break;
      }
      
      case 'Pokéradar': {
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
      
      case 'Pêche à la chaîne': {
        const chain = Math.min(20, Number(this.compteur));
        bonusRolls = 2 * chain;
        break;
      }
      
      case 'Chaîne au Navi-Dex': {
        // compliqué...
        break;
      }

      case 'Safari des Amis': {
        bonusRolls = 4;
        break;
      }

      case 'Chaîne SOS': {
        const compteur = Number(this.compteur);
        const chainCoeff = (compteur >= 31) ? 3
                         : (compteur >= 21) ? 2
                         : (compteur >= 11) ? 1
                         : 0;
        bonusRolls = 4 * chainCoeff;
        break;
      }

      case 'Ultra-Brèche': {
        // this.compteur == au format { "distance": 30, "rings": 2 }
        const compteur = (this.compteur === '0') ? { distance: 0, rings: 0 }
                       : JSON.parse(this.compteur);
        let d = Math.min(9, Math.floor(compteur.distance) / 500 - 1);
        const odds = (compteur.rings == 3) ? (4 * d)
                   : (compteur.rings == 2) ? ((1 + 2 * d))
                   : (compteur.rings == 1) ? ((1 + d))
                   : 1;
        const rate = Math.round(100 / odds);
        return rate
      }

      case 'Sauvage (évènement)': {
        // ???
        return Number(this.compteur);
      }

      case 'Chaîne de captures': {
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

      case 'Bonus de combats': {
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

      case 'Raid Dynamax': {
        return null;
      }

      case 'Expédition Dynamax': {
        const rate = (charmRolls > 0) ? 100 : 300;
        return rate;
      }
    }

    rolls += charmRolls + bonusRolls;
    const rate = Math.round(baseRate / rolls);
    return rate;
  }
}

export { Pokemon, Shiny };

