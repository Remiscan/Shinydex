import { Pokemon, Shiny } from './Pokemon.js';



type ordre = 'catchTime' | 'shinyRate' | 'dexid' | 'species' | 'name' | 'game' | 'lastUpdate' | 'username';
const supportedOrdres: ordre[] = ['catchTime', 'shinyRate', 'dexid', 'species', 'name', 'game', 'lastUpdate', 'username'];

export function isOrdre(string: string): string is ordre {
  return supportedOrdres.includes(string as ordre);
}

export type filtrableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'corbeille' | 'partage' | 'chromatiques-ami';
const filtrableSections: filtrableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'corbeille', 'partage', 'chromatiques-ami'];

export function isFiltrableSection(string: string): string is filtrableSection {
  return filtrableSections.includes(string as filtrableSection);
}



/** Liste de filtres appliqués à une section. */
export class FilterList {
  mine: Set<boolean> = new Set();
  legit: Set<boolean> = new Set();
  order: ordre = 'catchTime';
  orderReversed: boolean = false;

  constructor(section: filtrableSection, formData?: FormData) {
    if (!formData) return;

    let defaultOrder: ordre;
    switch (section) {
      case 'chasses-en-cours':
        defaultOrder = 'lastUpdate';
        break;
      case 'partage':
        defaultOrder = 'username';
        break;
      default:
        defaultOrder = 'catchTime';
    }

    const order = String(formData.get('order'));
    this.order = isOrdre(order) ? order : defaultOrder;
    this.orderReversed = String(formData.get('orderReversed')) === 'true';

    for (const [prop, value] of formData.entries()) {
      if (prop.startsWith('filter-mine')) {
        if (value !== 'false') this.mine.add(value === 'true');
      } else if (prop.startsWith('filter-legit')) {
        if (value !== 'false') this.legit.add(value === 'false');
      }
    }
  }

  static isKey(string: string): string is keyof FilterList {
    return (string in (new FilterList('mes-chromatiques')));
  }
}


/** Liste de recherches appliquées à une section. */
export class Search {
  name: string = '';
  species: Set<number> = new Set();
  game: Set<string> = new Set();

  constructor(formData?: FormData) {
    if (!formData) return;

    for (const [prop, value] of formData.entries()) {
      if (prop === 'chip-nickname') {
        this.name = String(value);
      } else if (prop.startsWith('chip-species')) {
        this.species.add(parseInt(String(value)));
      } else if (prop.startsWith('chip-game')) {
        this.game.add(String(value));
      }
    }
  }

  static isKey(string: string): string is keyof Search {
    return (string in (new Search()));
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
  .forEach((card, ordre) => {
    if (!(card instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    card.style.setProperty(`--${order}-order`, String(ordre))
  });

  return;
}