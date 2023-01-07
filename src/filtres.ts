import { Pokemon, Shiny } from './Pokemon.js';
import { dataStorage } from './localForage.js';
// @ts-expect-error
import { queueable } from '../../_common/js/per-function-async-queue.js';



type ordre = 'catchTime' | 'shinyRate' | 'dexid' | 'species' | 'name' | 'game' | 'lastUpdate' | 'username';
const supportedOrdres: ordre[] = ['catchTime', 'shinyRate', 'dexid', 'species', 'name', 'game', 'lastUpdate', 'username'];

export function isOrdre(string: string): string is ordre {
  return supportedOrdres.includes(string as ordre);
}

export type FiltrableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'corbeille' | 'partage' | 'chromatiques-ami';
export const filtrableSections: FiltrableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'corbeille', 'partage', 'chromatiques-ami'];
export const savedFiltersSections: FiltrableSection[] = ['mes-chromatiques'];

export function isFiltrableSection(string: string): string is FiltrableSection {
  return filtrableSections.includes(string as FiltrableSection);
}



/** Liste de filtres appliqués à une section. */
export class FilterList {
  mine: Set<boolean> = new Set([true, false]);
  legit: Set<boolean> = new Set([true, false]);
  order: ordre = 'catchTime';
  orderReversed: boolean = false;

  constructor(section: FiltrableSection, data?: FormData | object) {
    if (!data) return;

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
    this.order = defaultOrder;

    if (data instanceof FormData) {
      const order = String(data.get('order'));
      this.order = isOrdre(order) ? order : defaultOrder;
      this.orderReversed = String(data.get('orderReversed')) === 'true';

      for (const [prop, value] of data.entries()) {
        if (prop.startsWith('filter-mine')) {
          const [x, key, val] = prop.split('-');
          if (value === 'false') this.mine.delete(val === 'true');
        } else if (prop.startsWith('filter-legit')) {
          const [x, key, val] = prop.split('-');
          if (value === 'false') this.legit.delete(val === 'true');
        }
      }
    } else {
      const order = 'order' in data && String(data.order);
      if (order) this.order = isOrdre(order) ? order : defaultOrder;
      if ('orderReversed' in data) this.orderReversed = Boolean(data.orderReversed);
      
      if ('mine' in data && data.mine instanceof Set) {
        if (data.mine.has(true)) this.mine.add(true);
        if (data.mine.has(false)) this.mine.add(false);
      }

      if ('legit' in data && data.legit instanceof Set) {
        if (data.legit.has(true)) this.legit.add(true);
        if (data.legit.has(false)) this.legit.add(false);
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


type SectionsFilterMap = Map<FiltrableSection, FilterList>;
export const currentFilters: SectionsFilterMap = new Map();



export async function initFilters() {
  let savedFilters = await dataStorage.getItem('filters');
  for (const section of filtrableSections) {
    if (savedFilters && savedFilters.get(section)) {
      currentFilters.set(section, new FilterList(section, savedFilters.get(section)));
    } else {
      currentFilters.set(section, new FilterList(section));
    }
  }
}


let saveFilters = async () => {
  const savedFilters: typeof currentFilters = new Map();
  for (const section of savedFiltersSections) {
    const toSave = currentFilters.get(section) ?? new FilterList(section);
    savedFilters.set(section, toSave);
  }
  await dataStorage.setItem('filters', savedFilters);
};

saveFilters = queueable(saveFilters);
export { saveFilters };



////////////////////////////////////////////////////////////////////
// Ordonner les cartes de Pokémon selon une certaine caractéristique
export async function orderCards(section: FiltrableSection, pokemonList: Shiny[] = [], order: ordre): Promise<void> {
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



/** Counts the number of cards that are displayed in a section. */
function countFilteredCards(section: FiltrableSection): number[] {
  const container = document.querySelector(`#${section}`);
  if (!(container instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

  const allCards = [...container.querySelectorAll('[huntid]')];
  const totalCount = allCards.length;

  let displayedCount = 0;
  const dexids = new Set();
  allCards.forEach(card => {
    if (getComputedStyle(card).display !== 'none') displayedCount++;
    const dexid = Number(card.getAttribute('data-dexid'));
    if (!isNaN(dexid) && dexid > 0) dexids.add(dexid);
  });
  const dexidsCount = dexids.size;

  return [displayedCount, totalCount, dexidsCount];
}



/**
 * Displays or hide "list is empty" messages in a section when needed,
 * and updates that section's counter if it has one.
 */
export function updateCounters(section: FiltrableSection): void {
  const container = document.querySelector(`#${section}`);
  if (!(container instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

  const [displayedCount, totalCount, dexidsCount] = countFilteredCards(section);
  if (totalCount > 0) container.classList.remove('vide');
  else                container.classList.add('vide');
  if (displayedCount > 0) container.classList.remove('vide-filtres');
  else                    container.classList.add('vide-filtres');

  const displayedCounter = container.querySelector('.compteur');
  if (displayedCounter) displayedCounter.innerHTML = String(displayedCount);

  if (section === 'mes-chromatiques') {
    const dexidsCounter = document.querySelector('#pokedex .compteur > .caught');
    if (dexidsCounter) dexidsCounter.innerHTML = String(dexidsCount);
  }
}



/** 
 * Computes the order of cards when comparing all cards is needed,
 * i.e. when knowing the properties of the card itself isn't enough to quantize its order among all cards.
 */
export function computedHardOrders(section: FiltrableSection): void {
  const container = document.querySelector(`#${section}`);
  if (!container) return;
  const allCards = [...container.querySelectorAll('[huntid]')];
  const lang = document.documentElement.getAttribute('lang') ?? 'fr';

  // Species (alphabetical) order
  allCards.sort((cardA, cardB) => {
    const speciesA = cardA.getAttribute('data-species') ?? '';
    const speciesB = cardB.getAttribute('data-species') ?? '';
    return speciesB.localeCompare(speciesA, lang);
  }).map((card, k) => {
    if (!(card instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    card.style.setProperty('--species-order', String(k));
  });

  // Name (alphabetical) order
  allCards.sort((cardA, cardB) => {
    const nameA = cardA.getAttribute('data-name') ?? '';
    const nameB = cardB.getAttribute('data-name') ?? '';
    return nameB.localeCompare(nameA, lang);
  }).map((card, k) => {
    if (!(card instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    card.style.setProperty('--name-order', String(k));
  });
}