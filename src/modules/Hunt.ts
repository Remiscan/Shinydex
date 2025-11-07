import { Shiny } from './Shiny.js';
import { huntStorage, shinyStorage } from './localForage.js';



// Structure d'un Pokémon en cours de chasse tel que stocké dans la BDD locale
export interface huntedPokemon extends Shiny {
  caught: boolean,
  hasEvolved: boolean,
}

export class Hunt extends Shiny implements huntedPokemon {
  caught: boolean = false;
  hasEvolved: boolean = false;
  deleted?: boolean = false;
  destroy?: boolean = false;
  
  constructor(shiny: object = {}) {
    super(shiny);
    if ('caught' in shiny) this.caught = Boolean(shiny.caught);
    if ('hasEvolved' in shiny) this.hasEvolved = Boolean(shiny.hasEvolved);
    if ('deleted' in shiny) this.deleted = Boolean(shiny.deleted);
    if ('destroy' in shiny) this.destroy = Boolean(shiny.destroy);
  }


  /**
   * Crée une Hunt (de toute pièce, ou à partir d'une Hunt ou d'un Shiny déjà existant)
   * @param huntid - L'id de la Hunt / du Shiny déjà existant.
   * @returns La Hunt ainsi créée.
   */
  static async getOrMake(huntid?: string): Promise<Hunt> {
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


  isEmpty(): boolean {
    return !(
      this.dexid > 0
      && this.game != ''
      && this.game != 'null'
    );
  }


  get orderedKeys(): Set<keyof Hunt> {
    return new Set(['dexid', 'forme', 'game', 'method', 'count', ...(Object.keys(this) as Array<keyof Hunt>)]);
  }
}