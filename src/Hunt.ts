import { frontendShiny, Pokemon, Shiny } from './Pokemon.js';
import { huntStorage, shinyStorage } from './localforage.js';



// Structure d'un Pokémon en cours de chasse tel que stocké dans la BDD locale
export interface huntedPokemon extends Omit<frontendShiny, 'id' | 'destroy'> {
  caught: boolean,
  uploaded: boolean,
}

const defaultHunt: huntedPokemon = {
  huntid: '',
  lastUpdate: 0,
  dexid: 0,
  forme: '',
  gene: '',
  surnom: '',
  methode: '',
  compteur: '',
  timeCapture: 0,
  jeu: '',
  ball: 'poke',
  notes: '',
  checkmark: 0,
  DO: false,
  charm: false,
  hacked: 0,
  horsChasse: false,
  deleted: false,
  caught: false,
  uploaded: false,
};

export class Hunt extends Shiny implements huntedPokemon {
  caught: boolean = false;
  uploaded: boolean = false;
  
  private constructor(pokemon: huntedPokemon = defaultHunt) {
    pokemon.huntid = pokemon.huntid || crypto.randomUUID();
    super(pokemon);
    Object.assign(this, {
      caught: pokemon.caught ?? false,
      uploaded: pokemon.uploaded ?? false
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
      hunt = new Hunt(data);
      if (!huntData) await huntStorage.setItem(huntid, hunt);
    } else {
      hunt = new Hunt();
    }
    
    return hunt;
  }
}


// Crée la datalist Jeux
export function initGamesDatalist() {
  const datalistJeux = document.getElementById('datalist-jeux')!;
  Pokemon.jeux.forEach(jeu => {
    datalistJeux.innerHTML += `<option value="${jeu.nom}">`;
  });
}