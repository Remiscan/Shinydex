import { Pokemon } from './Pokemon.js';
import { Shiny } from './Shiny.js';
import { dataStorage, friendStorage, huntStorage, localForageAPI, shinyStorage } from './localForage.js';
// @ts-expect-error
import { queueable } from '../../_common/js/per-function-async-queue.js';
import { Hunt } from './Hunt.js';



type ordre = 'catchTime' | 'shinyRate' | 'dexid' | 'species' | 'name' | 'game' | 'creationTime' | 'username';
const supportedOrdres: ordre[] = ['catchTime', 'shinyRate', 'dexid', 'species', 'name', 'game', 'creationTime'];

export function isOrdre(string: string): string is ordre {
  return supportedOrdres.includes(string as ordre);
}

export type FiltrableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'corbeille' | 'partage' | 'chromatiques-ami';
export const filtrableSections: FiltrableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'corbeille', 'partage', 'chromatiques-ami'];
export const savedFiltersSections: FiltrableSection[] = ['mes-chromatiques'];
export function isFiltrableSection(string: string): string is FiltrableSection {
  return filtrableSections.includes(string as FiltrableSection);
}

export type SearchableSection = FiltrableSection | 'pokedex';
export const searchableSections: SearchableSection[] = [...filtrableSections, 'pokedex'];
export function isSearchableSection(string: string): string is SearchableSection {
  return searchableSections.includes(string as SearchableSection);
}




/** Liste de filtres appliqués à une section. */
export class FilterList {
  mine: Set<boolean> = new Set([true, false]);
  legit: Set<boolean> = new Set([true, false]);
  order: ordre = 'catchTime';
  orderReversed: boolean = false;

  constructor(section: FiltrableSection, data?: FormData | object) {
    let defaultOrder: ordre;
    switch (section) {
      case 'chasses-en-cours':
        defaultOrder = 'creationTime';
        break;
      case 'partage':
        defaultOrder = 'username';
        break;
      default:
        defaultOrder = 'catchTime';
    }
    this.order = defaultOrder;

    if (!data) return;

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
        if (!(data.mine.has(true))) this.mine.delete(true);
        if (!(data.mine.has(false))) this.mine.delete(false);
      }

      if ('legit' in data && data.legit instanceof Set) {
        if (!(data.legit.has(true))) this.legit.delete(true);
        if (!(data.legit.has(false))) this.legit.delete(false);
      }
    }
  }

  static isKey(string: string): string is keyof FilterList {
    return (string in (new FilterList('mes-chromatiques')));
  }
}


let saveFilters = async (section: FiltrableSection, filters: FilterList) => {
  const shouldSaveFilters = savedFiltersSections.includes(section);
  if (!shouldSaveFilters) return;

  const savedFilters = await dataStorage.getItem('filters');
  const filtersToSave = saveFilters instanceof Map ? savedFilters : new Map();
  filtersToSave.set(section, filters);
  await dataStorage.setItem('filters', filtersToSave);
};

saveFilters = queueable(saveFilters);
export { saveFilters };



export function filterSection(section: FiltrableSection, filters: FilterList = new FilterList(section)) {
  const element = document.querySelector(`section#${section}`);
  if (!element) return;
  element.setAttribute('data-filter-mine', [...filters.mine].map(f => String(f)).join(' '));
  element.setAttribute('data-filter-legit', [...filters.legit].map(f => String(f)).join(' '));
  element.setAttribute('data-order', filters.order);
  element.setAttribute('data-order-reversed', String(filters.orderReversed));
  updateCounters(section);
}



export function filterPokedex(dexids: Set<number>) {
  const generations = Pokemon.generations;
  const dexidMax = generations[generations.length - 1].end;
  for (let i = 1; i <= dexidMax; i++) {
    const icon = document.querySelector(`#pokedex [data-dexid="${i}"]`);
    if (dexids.has(i)) icon?.parentElement?.classList.add('got');
    else               icon?.parentElement?.classList.remove('got');
  }
}



/** Counts the number of cards that are displayed in a section. */
function countFilteredCards(section: FiltrableSection): [number, number, Set<number>] {
  const container = document.querySelector(`#${section}`);
  if (!(container instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

  const allCards = [...container.querySelectorAll('[huntid]')];
  const totalCount = allCards.length;

  let displayedCount = 0;
  const dexids: Set<number> = new Set();
  allCards.forEach(card => {
    if (getComputedStyle(card).display !== 'none') {
      displayedCount++;
      const dexid = Number(card.getAttribute('data-dexid'));
      if (!isNaN(dexid) && dexid > 0) dexids.add(dexid);
    }
  });

  return [displayedCount, totalCount, dexids];
}



/**
 * Displays or hide "list is empty" messages in a section when needed,
 * and updates that section's counter if it has one.
 */
export function updateCounters(section: FiltrableSection): void {
  const container = document.querySelector(`#${section}`);
  if (!(container instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

  const [displayedCount, totalCount, dexids] = countFilteredCards(section);
  if (totalCount > 0) container.classList.remove('vide');
  else                container.classList.add('vide');
  if (displayedCount > 0) container.classList.remove('vide-filtres');
  else                    container.classList.add('vide-filtres');

  const displayedCounter = container.querySelector('.compteur');
  if (displayedCounter) displayedCounter.innerHTML = String(displayedCount);

  if (section === 'mes-chromatiques') {
    const dexidsCounter = document.querySelector('#pokedex .compteur > .caught');
    if (dexidsCounter) dexidsCounter.innerHTML = String(dexids.size);
    filterPokedex(dexids);
  }
}



////////////////////////////////////////////////////////////////////
// Ordonner les cartes de Pokémon selon une certaine caractéristique
// et renvoie leurs huntids dans l'ordre.
async function orderPokemon(pokemonList: Shiny[] | Hunt[], order: ordre): Promise<string[]> {
  const noms = await Pokemon.names();
  const lang = document.documentElement.getAttribute('lang') ?? 'fr';

  let orderedShiny = pokemonList.sort((s1, s2) => {
    const huntidComparison = s1.huntid > s2.huntid ? 1
                           : s1.huntid < s2.huntid ? -1
                           : 0;

    switch (order) {
      case 'game': {
        const allGames = Pokemon.jeux;
        const game1 = allGames.findIndex(g => g.uid === s1.game);
        const game2 = allGames.findIndex(g => g.uid === s2.game);
        return game1 - game2 || s1.catchTime - s2.catchTime || huntidComparison;
      }

      case 'name': {
        const nom1 = s1.name || noms[s1.dexid] || '';
        const nom2 = s2.name || noms[s2.dexid] || '';
        return nom1.localeCompare(nom2, lang) || s1.catchTime - s2.catchTime || huntidComparison;
      }

      case 'species': {
        const nom1 = noms[s1.dexid] || '';
        const nom2 = noms[s2.dexid] || '';
        return nom1.localeCompare(nom2, lang) || s1.catchTime - s2.catchTime || huntidComparison;
      }

      case 'shinyRate': {
        return (s1.shinyRate || 0) - (s2.shinyRate || 0) || s1.catchTime - s2.catchTime || huntidComparison;
      }

      case 'dexid': {
        return s1.dexid - s2.dexid || s1.catchTime - s2.catchTime || huntidComparison;
      }

      case 'catchTime': {
        return s1.catchTime - s2.catchTime || huntidComparison;
      }

      case 'creationTime': {
        return s1.creationTime - s2.creationTime || huntidComparison;
      }

      default: return huntidComparison;
    }
  });

  return orderedShiny.map(shiny => shiny.huntid);
}



/** 
 * Computes the order of cards when comparing all cards is needed,
 * i.e. when knowing the properties of the card itself isn't enough to quantize its order among all cards.
 */
export async function computedOrders(section: FiltrableSection, ids: string[]): Promise<void> {
  let dataStore: localForageAPI;
  let dataClass: (typeof Shiny) | (typeof Hunt);
  switch (section) {
    case 'mes-chromatiques':
      dataStore = shinyStorage;
      dataClass = Shiny;
      break;
    case 'chasses-en-cours':
      dataStore = huntStorage;
      dataClass = Hunt;
      break;
    case 'chromatiques-ami':
      dataStore = friendStorage;
      dataClass = Shiny;
      break;
    case 'corbeille':
      dataStore = huntStorage;
      dataClass = Hunt;
      break;
    case 'partage':
      dataStore = dataStorage;
      break;
  }

  if (!dataStore || section === 'partage') return;

  const pokemonList = (await Promise.all(ids.map(id => dataStore.getItem(id)))).map(pkmn => new dataClass(pkmn));
  const cardsMap = new Map(pokemonList.map(pkmn => [pkmn.huntid, document.querySelector(`#${section} [huntid="${pkmn.huntid}"]`)]));

  await Promise.all(supportedOrdres.map(async order => {
    const orderedHuntids = await orderPokemon(pokemonList, order);
    for (let k = 0; k < orderedHuntids.length; k++) {
      const huntid = orderedHuntids[k];
      const card = cardsMap.get(huntid);
      if (!(card instanceof HTMLElement)) continue;
      card.style.setProperty(`--${order}-order`, String(k));
    }
  }));
}