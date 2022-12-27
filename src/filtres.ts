import { Pokemon, Shiny } from './Pokemon.js';
import { dataStorage } from './localForage.js';



type filtreDo = 'moi' | 'autre';
type filtreLegit = 'oui' | 'non';
type ordre = 'catchTime' | 'shinyRate' | 'dexid' | 'species' | 'name' | 'game' | 'lastUpdate' | 'username';
export type filtrableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'corbeille' | 'partage' | 'chromatiques-ami';
const filtrableSections: filtrableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'corbeille', 'partage', 'chromatiques-ami'];

type FiltresShiny = {
  mine: Set<'true' | 'false'>,
  legit: Set<'true' | 'false'>,
  order: ordre,
  orderReversed: boolean
};

const defaultFiltres: FiltresShiny = {
  mine: new Set(['true', 'false']),
  legit: new Set(['true', 'false']),
  order: 'catchTime',
  orderReversed: false
};

interface Filtres {
  mine: any;
  legit: any;
  game: any;
  species: any;
  name: any;
  order: ordre;
  orderReversed: boolean;
}

/** Liste de filtres appliqués à une section. */
export class ListeFiltres implements Filtres {
  mine: Set<filtreDo> = new Set();
  legit: Set<filtreLegit> = new Set();
  game: Set<string> = new Set();
  species: Set<number> = new Set();
  name: string = '';
  order: ordre = 'catchTime';
  orderReversed: boolean = false;

  constructor(section: filtrableSection, formData?: FormData) {
    if (!formData) return;

    let defaultOrder: ordre;
    switch (section) {
      case 'chasses-en-cours':
      case 'corbeille':
        defaultOrder = 'lastUpdate';
        break;
      case 'partage':
        defaultOrder = 'username';
        break;
      default:
        defaultOrder = 'catchTime';
    }

    for (const [prop, value] of formData.entries()) {
      if (prop === 'order') {
        this.order = value as ordre ?? defaultOrder;
      } else if (prop === 'ordre-reverse') {
        this.orderReversed = value === 'true';
      } else if (prop === 'chip-nickname') {
        this.name = value as string;
      } else if (prop.startsWith('filtre-do')) {
        if (value !== 'false') this.mine.add(value as filtreDo);
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



////////////////////////////////////////////////////////////////////
// Ordonner les cartes de Pokémon selon une certaine caractéristique
export async function orderCards(section: filtrableSection, pokemonList: Shiny[] = [], order: ordre): Promise<void> {
  const noms = await Pokemon.names();
  const lang = document.documentElement.getAttribute('lang') ?? 'fr';

  let orderedShiny = pokemonList.sort((s1, s2) => {
    const huntidComparison = s2.huntid > s1.huntid ? 1
                           : s2.huntid < s1.huntid ? -1
                           : 0;

    switch (order) {
      case 'game': {
        const allGames = Pokemon.jeux;
        const game1 = allGames.findIndex(g => g.uid === s1.game);
        const game2 = allGames.findIndex(g => g.uid === s2.game);
        return game2 - game1 || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'name': {
        const nom1 = s1.name || noms[s1.dexid];
        const nom2 = s2.name || noms[s2.dexid];
        return nom2.localeCompare(nom1, lang) || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'species': {
        const nom1 = noms[s1.dexid];
        const nom2 = noms[s2.dexid];
        return nom2.localeCompare(nom1, lang) || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'shinyRate': {
        return (s2.shinyRate || 0) - (s1.shinyRate || 0) || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'dexid': {
        return s2.dexid - s1.dexid || s2.catchTime - s1.catchTime || huntidComparison;
      }

      case 'catchTime': {
        return s2.catchTime - s1.catchTime || huntidComparison;
      }

      default: return huntidComparison;
    }
  });
  
  orderedShiny.map(shiny => document.querySelector(`#${section} [huntid="${shiny.huntid}"]`))
              .forEach((card, ordre) => (card as HTMLElement).style.setProperty(`--${order}-order`, String(ordre)));

  return;
}



/////////////////////////
// Initialise les filtres
export async function initFiltres() {
  // Si les filtres ne sont pas sauvegardés, on sauvegarde les filtres par défaut
  let savedFiltresMap: Map<filtrableSection, FiltresShiny> = await dataStorage.getItem('filtres');
  if (!savedFiltresMap) {
    savedFiltresMap = new Map([
      ['mes-chromatiques', {...defaultFiltres}]
    ]);
    await dataStorage.setItem('filtres', savedFiltresMap);
  }
}