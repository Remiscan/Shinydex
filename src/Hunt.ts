import { Shiny, frontendShiny } from './Pokemon.js';
import { huntStorage, shinyStorage } from './localForage.js';



// Structure d'un Pokémon en cours de chasse tel que stocké dans la BDD locale
export interface huntedPokemon extends Omit<frontendShiny, 'id' | 'destroy'> {
  caught: boolean,
}

const defaultHunt: huntedPokemon = {
  huntid: '',
  lastUpdate: 0,

  dexid: 0,
  forme: '',
  game: '',
  method: '',
  count: { encounters: 0 },
  charm: false,

  catchTime: 0,
  name: '',
  ball: 'poke',
  gene: '',
  originMark: '',
  hacked: 0,

  notes: '',
  
  deleted: false,
  caught: false,
};

export class Hunt extends Shiny implements huntedPokemon {
  caught: boolean = false;
  uploaded: boolean = false;
  
  private constructor(pokemon: huntedPokemon = {...defaultHunt}) {
    pokemon.huntid = pokemon.huntid || crypto.randomUUID();
    super(pokemon);
    Object.assign(this, {
      caught: pokemon.caught ?? false,
    });
  }


  /**
   * Crée une Hunt (de toute pièce, ou à partir d'une Hunt ou d'un Shiny déjà existant)
   * @param huntid - L'id de la Hunt / du Shiny déjà existant.
   * @returns La Hunt ainsi créée.
   */
  static async make(huntid?: string): Promise<Hunt> {
    let hunt: Hunt;

    if (huntid) {
      const huntData = await huntStorage.getItem(huntid);
      const data = huntData ?? (await shinyStorage.getItem(huntid));
      if (data == null) throw `No hunt or shiny Pokémon found with huntid ${huntid}`;
      hunt = new Hunt(data);
      if (!huntData) await huntStorage.setItem(huntid, hunt);
    } else {
      hunt = new Hunt();
    }
    
    return hunt;
  }


  get orderedKeys(): Set<keyof Hunt> {
    return new Set(['dexid', 'forme', 'game', 'method', 'count', ...(Object.keys(this) as Array<keyof Hunt>)]);
  }
}