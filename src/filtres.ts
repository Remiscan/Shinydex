import { Pokemon, Shiny } from './Pokemon.js';
import { dataStorage, friendStorage, huntStorage, localForageAPI, pokemonData, shinyStorage } from './localForage.js';



type filtreDo = 'moi' | 'autre';
type filtreLegit = 'oui' | 'non';
type ordre = 'date' | 'rate' | 'dex' | 'species' | 'name' | 'game' | 'added' | 'username';
export type filtrableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'corbeille' | 'partage' | 'chromatiques-ami';
const filtrableSections: filtrableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'corbeille', 'partage', 'chromatiques-ami'];

interface Filtres {
  do: any;
  legit: any;
  game: any;
  species: any;
  name: any;
}

/** Liste de filtres appliqués à une section. */
export class ListeFiltres implements Filtres {
  do: Set<filtreDo> = new Set();
  legit: Set<filtreLegit> = new Set();
  game: Set<string> = new Set();
  species: Set<number> = new Set();
  name: string = '';
  ordre: ordre = 'date';
  ordreReverse: boolean = false;

  constructor(formData?: FormData) {
    if (!formData) return;
    for (const [prop, value] of formData.entries()) {
      if (prop === 'ordre') {
        this.ordre = value as ordre;
      } else if (prop === 'ordre-reverse') {
        this.ordreReverse = value === 'on';
      } else if (prop === 'chip-nickname') {
        this.name = value as string;
      } else if (prop.startsWith('filtre-do')) {
        if (value !== 'false') this.do.add(value as filtreDo);
      } else if (prop.startsWith('filtre-legit')) {
        if (value !== 'false') this.legit.add(value as filtreLegit);
      } else if (prop.startsWith('chip-species')) {
        this.species.add(parseInt(value as string));
      } else if (prop.startsWith('chip-game')) {
        this.game.add(value as string);
      }
    }
  }
}

/** Liste de filtres correspondant à un Pokémon. */
export class PokemonFiltres implements Filtres {
  do: filtreDo;
  legit: filtreLegit;
  game: string;
  species: number;
  name: string;

  constructor(shiny: Shiny) {
    const conditionMien = shiny.mine;
    this.do = conditionMien ? 'moi' : 'autre';
    this.legit = shiny.hacked > 0 ? 'non' : 'oui';
    this.game = shiny.jeuObj.uid;
    this.species = shiny.dexid;
    this.name = shiny.name;
  }
}


////////////////////////////////////////////////////////
// Vérifie si un Pokémon correspond aux filtres demandés
async function filterPokemon(filtres: ListeFiltres, shiny: Shiny): Promise<boolean> {
  const filtresPokemon = new PokemonFiltres(shiny);
  for (const [key, value] of Object.entries(filtresPokemon)) {
    const filtresValues = filtres[key as keyof Filtres];
    if (typeof filtresValues === 'string' && !filtresValues.includes(value)) return false;
    else if (typeof filtresValues !== 'string' && filtresValues.size > 0 && !filtresValues.has(value as never)) return false;
  }

  return true;
}


///////////////////////////////////////////////////////////
// Vérifie quels Pokémon correspondent aux filtres demandés
async function filterAllPokemon(section: string, filtres: ListeFiltres): Promise<Shiny[]> {
  const corresponding: Shiny[] = [];

  let dataStore: localForageAPI; // base de données
  switch (section) {
    case 'chasses-en-cours':
      dataStore = huntStorage;
      break;
    case 'chromatiques-ami':
      dataStore = friendStorage;
      break;
    case 'corbeille':
      dataStore = huntStorage;
      break;
    default:
      dataStore = shinyStorage;
  }

  const pkmnList = await Promise.all((await dataStore.keys()).map(async key => await dataStore.getItem(key)));

  for (const pkmn of pkmnList) {
    const shiny = new Shiny(pkmn);
    if (await filterPokemon(filtres, shiny)) corresponding.push(shiny);
  }
  return corresponding;
}


/////////////////////////////////////////////////////////
// Filtre les cartes des Pokémon et les icônes du Pokédex
export async function filterCards(section: filtrableSection, ids: string[] = [], _filtres?: ListeFiltres): Promise<number> {
  const filtres = _filtres ?? (await dataStorage.getItem('filtres')).get(section) ?? new ListeFiltres();

  const filteredPokemon = await filterAllPokemon(section, filtres);
  const correspondingids = filteredPokemon.map(shiny => shiny.huntid); // liste de Pokémon individuels correspondant aux filtres
  const dexids = filteredPokemon.map(shiny => shiny.dexid); // liste d'espèces de Pokémon correspondant aux filtres
  const keptCards: Element[] = [];
  const hiddenCards: Element[] = [];

  const container = document.querySelector(`#${section}`)!;
  const compteur = correspondingids.length; // nombre de cartes affichées après application des filtres
  
  // Filtre les cartes des Pokémon
  const allCards = container.querySelectorAll('[huntid]');
  allCards.forEach(card => {
    const id = card.getAttribute('huntid')!;
    if (correspondingids.includes(id)) {
      card.classList.remove('filtered');
      keptCards.push(card);
    } else {
      card.classList.add('filtered');
      hiddenCards.push(card);
    }
  });

  // Affiche un message si la section est vide
  if (compteur === 0) container.classList.add('vide');
  else                container.classList.remove('vide');

  if (section === 'mes-chromatiques') {
    // Filtre les icônes du Pokédex
    const dexIcons = document.querySelectorAll('#pokedex .pkmnicon');
    dexIcons.forEach(icon => {
      const id = Number(icon.getAttribute('data-dexid') ?? '0');
      if (dexids.includes(id)) icon.classList.add('got');
      else                     icon.classList.remove('got');
    });

    // Met à jour le compteur du Pokédex
    const compteurDex = dexids.length;
    document.querySelector('#pokedex .compteur > .caught')!.innerHTML = String(compteurDex);
    document.querySelector('#pokedex .compteur > .total')!.innerHTML = String((await pokemonData.keys()).length - 1);

    // Met à jour le compteur de chromatiques
    document.querySelector('#mes-chromatiques .compteur')!.innerHTML = String(compteur);
    (document.querySelector('#mes-chromatiques .section-contenu') as HTMLElement).style.setProperty('--compteur', String(compteur));
  }

  return compteur;
}



////////////////////////////////////////////////////////////////////
// Ordonner les cartes de Pokémon selon une certaine caractéristique
export async function orderCards(section: filtrableSection, filteredPokemon: Shiny[] = [], _filtres?: ListeFiltres): Promise<void> {
  const filtres: ListeFiltres = _filtres ?? (await dataStorage.getItem('filtres')).get(section) ?? new ListeFiltres();
  const ordre = filtres.ordre;
  const reversed = filtres.ordreReverse;

  const noms = await Pokemon.names();

  let orderedShiny = filteredPokemon.sort((s1, s2) => {
    const huntidComparison = s2.huntid > s1.huntid ? 1
                           : s2.huntid < s1.huntid ? -1
                           : 0;

    switch (ordre) {
      case 'game': {
        return s2.game.localeCompare(s1.game, 'fr') || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'name': {
        const nom1 = s1.name || noms[s1.dexid];
        const nom2 = s2.name || noms[s2.dexid];
        return nom2.localeCompare(nom1, 'fr') || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'species': {
        const nom1 = noms[s1.dexid];
        const nom2 = noms[s2.dexid];
        return nom2.localeCompare(nom1, 'fr') || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'rate': {
        return (s2.shinyRate || 0) - (s1.shinyRate || 0) || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'dex': {
        return s2.dexid - s1.dexid || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'date': {
        return s2.catchTime - s1.catchTime || huntidComparison;
      }

      default: return huntidComparison;
    }
  });

  if (reversed) orderedShiny = orderedShiny.reverse();
  
  orderedShiny.map(shiny => document.querySelector(`#${section} [huntid="${shiny.huntid}"]`))
              .forEach((card, ordre) => (card as HTMLElement).style.setProperty('--order', String(ordre)));

  return;
}



/////////////////////////
// Initialise les filtres
export async function initFiltres() {
  // Si les filtres ne sont pas sauvegardés, on sauvegarde les filtres par défaut
  let savedFiltresMap: Map<filtrableSection, ListeFiltres> = await dataStorage.getItem('filtres');
  if (!savedFiltresMap) {
    savedFiltresMap = new Map(
      filtrableSections.map(section => [section as filtrableSection, new ListeFiltres()])
    );
    await dataStorage.setItem('filtres', savedFiltresMap);
  }
}