// @ts-ignore
import { queueable } from '../../../_common/js/per-function-async-queue/mod.js';
import { Hunt } from './Hunt.js';
import { noAccent } from './Params.js';
import { Pokemon } from './Pokemon.js';
import { Shiny } from './Shiny.js';
import { isSupportedPokemonLang, pokemonData } from './jsonData.js';
import { dataStorage, friendShinyStorage, friendStorage, huntStorage, shinyStorage } from './localForage.js';
import { getCurrentLang } from './translation.js';



export type ordre = 'catchTime' | 'shinyRate' | 'dexid' | 'species' | 'name' | 'game' | 'creationTime' | 'username';
export const supportedOrdres: ordre[] = ['catchTime', 'shinyRate', 'dexid', 'species', 'name', 'game', 'creationTime'];

export function isOrdre(string: string): string is ordre {
  return supportedOrdres.includes(string as ordre);
}

export type PopulatableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'partage' | 'chromatiques-ami' | 'corbeille';
export const populatableSections: PopulatableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'partage', 'chromatiques-ami', 'corbeille'];
export function isPopulatableSection(string: string): string is PopulatableSection {
  return populatableSections.includes(string as PopulatableSection);
}

export type FiltrableSection = 'mes-chromatiques' | 'corbeille' | 'chromatiques-ami';
export const filtrableSections: FiltrableSection[] = ['mes-chromatiques', 'corbeille', 'chromatiques-ami'];
export const savedFiltersSections: FiltrableSection[] = ['mes-chromatiques'];
export function isFiltrableSection(string: string): string is FiltrableSection {
  return filtrableSections.includes(string as FiltrableSection);
}

export type OrderableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'corbeille' | 'partage' | 'chromatiques-ami';
export const orderableSections: OrderableSection[] = ['mes-chromatiques', 'corbeille', 'chromatiques-ami'];
export function isOrderableSection(string: string): string is FiltrableSection {
  return filtrableSections.includes(string as FiltrableSection);
}

export type SearchableSection = 'mes-chromatiques' | 'pokedex' | 'chasses-en-cours' | 'corbeille' | 'partage' | 'chromatiques-ami';
export const searchableSections: SearchableSection[] = ['mes-chromatiques', 'pokedex', 'chasses-en-cours', 'corbeille', 'partage', 'chromatiques-ami'];
export function isSearchableSection(string: string): string is SearchableSection {
  return searchableSections.includes(string as SearchableSection);
}


export type DataClass<Section extends PopulatableSection>
  = Section extends 'mes-chromatiques' ? typeof Shiny
  : Section extends 'chasses-en-cours' ? typeof Hunt
  : Section extends 'corbeille' ? typeof Hunt
  : Section extends 'chromatiques-ami' ? typeof Shiny
  : undefined;

const dataClassMap: { [S in PopulatableSection]: DataClass<S> } = {
  'mes-chromatiques': Shiny,
  'chasses-en-cours': Hunt,
  'corbeille': Hunt,
  'chromatiques-ami': Shiny,
  'partage': undefined,
};

export function getDataClass<S extends PopulatableSection>(section: S): DataClass<S> {
  return dataClassMap[section];
}


export type DataStore<Section extends PopulatableSection>
  = Section extends 'mes-chromatiques' ? typeof shinyStorage
  : Section extends 'chasses-en-cours' ? typeof huntStorage
  : Section extends 'corbeille' ? typeof huntStorage
  : Section extends 'chromatiques-ami' ? typeof friendShinyStorage
  : Section extends 'partage' ? typeof friendStorage
  : undefined;

const dataStoreMap: { [S in PopulatableSection]: DataStore<S> } = {
  'mes-chromatiques': shinyStorage,
  'chasses-en-cours': huntStorage,
  'corbeille': huntStorage,
  'chromatiques-ami': friendShinyStorage,
  'partage': friendStorage,
}

export function getDataStore<S extends PopulatableSection>(section: S): DataStore<S> {
  return dataStoreMap[section];
}


export type CardTagName<Section extends PopulatableSection>
  = Section extends 'mes-chromatiques' ? 'shiny-card'
  : Section extends 'chasses-en-cours' ? 'hunt-card'
  : Section extends 'corbeille' ? 'corbeille-card'
  : Section extends 'chromatiques-ami' ? 'friend-shiny-card'
  : Section extends 'partage' ? 'friend-card'
  : undefined;

const cardTagNameMap: { [S in PopulatableSection]: CardTagName<S> } = {
  'mes-chromatiques': 'shiny-card',
  'chasses-en-cours': 'hunt-card',
  'corbeille': 'corbeille-card',
  'chromatiques-ami': 'friend-shiny-card',
  'partage': 'friend-card',
}

export function getCardTagName<S extends PopulatableSection>(section: S): CardTagName<S> {
  return cardTagNameMap[section];
}


/** Liste de filtres appliqués à une section. */
export class FilterList {
  mine: Set<boolean> = new Set([true, false]);
  legit: Set<boolean> = new Set([true, false]);
  caught: Set<boolean> = new Set([true, false]);
  order: ordre = 'catchTime';
  orderReversed: boolean = false;

  constructor(section: FiltrableSection | OrderableSection, data?: FormData | object) {
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
        } else if (prop.startsWith('filter-caught')) {
          const [x, key, val] = prop.split('-');
          if (value === 'false') this.caught.delete(val === 'true');
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

      if ('caught' in data && data.caught instanceof Set) {
        if (!(data.caught.has(true))) this.caught.delete(true);
        if (!(data.caught.has(false))) this.caught.delete(false);
      }
    }
  }

  static isKey(string: string): string is keyof FilterList {
    return (string in (new FilterList('mes-chromatiques')));
  }
}


/**
 * Saves user chosen filters to data storage.
 */
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

  const elements = [element];
  if (section === 'mes-chromatiques') {
    const pokedex = document.querySelector(`section#pokedex`);
    if (pokedex) elements.push(pokedex);
  }

  for (const element of elements) {
    element.setAttribute('data-filter-mine', [...filters.mine].map(f => String(f)).join(' '));
    element.setAttribute('data-filter-legit', [...filters.legit].map(f => String(f)).join(' '));
    element.setAttribute('data-filter-caught', [...filters.caught].map(f => String(f)).join(' '));
    element.setAttribute('data-order', filters.order);
    element.setAttribute('data-order-reversed', String(filters.orderReversed));
  }

  updateCounters(section);
}



/** 
 * Displays the Pokédex icons corresponding to the passed IDs as caught, others as uncaught.
 */
export function filterPokedex(dexids: dexidSet, caughtFormsMap: formesMap) {
  const allDexIcons = document.querySelectorAll(`#pokedex [dexid], #pokedex [data-replaces="dex-icon"][data-dexid]`);
  allDexIcons.forEach(icon => {
    const i = Number(icon.getAttribute('dexid') ?? icon.getAttribute('data-dexid') ?? 0);
    if (dexids.has(i)) {
      icon.setAttribute('data-caught', 'true');
      const caughtForms = caughtFormsMap.get(i) ?? new Set();
      if (caughtForms.has('')) {
        caughtForms.add('emptystring');
        caughtForms.delete('');
      }
      icon.setAttribute('data-caught-forms', [...caughtForms.values()].join(' '));
    } else {
      icon.setAttribute('data-caught', 'false');
      icon.setAttribute('data-caught-forms', '');
    }
  });
}



export type ShinyFilterData = {
  mine: boolean,
  legit: boolean,
  species: string,
  dexid: number,
  name: string,
  game: string,
  form: string
};

export type FilterMap = Map<string, ShinyFilterData>;

/**
 * Computes the filters corresponding to each card in a section.
 */
export async function computeFilters(section: FiltrableSection | OrderableSection, data: Array<Shiny|Hunt> | null = null): Promise<FilterMap> {
  if (!isFiltrableSection(section)) return new Map();

  const dataStore = getDataStore(section);

  const filterMap: FilterMap = new Map();
  if (!data) {
    const keys = await dataStore.keys();
    data = (await Promise.all(keys.map(async key => new Shiny(await dataStore.getItem(key)))));
  }
  data.forEach(s => filterMap.set(s.huntid, computeShinyFilters(s)));

  return filterMap;
}

/** Computes the filters corresponding to one Shiny Pokémon. */
export function computeShinyFilters(shiny: Shiny): ShinyFilterData {
  let species = '';
  const lang = getCurrentLang();
  const pokemon = pokemonData[shiny.dexid];
  if (isSupportedPokemonLang(lang)) species = noAccent(pokemon.name[lang] || '').toLowerCase();

  return {
    mine: shiny.mine,
    legit: shiny.legit,
    species: species,
    dexid: shiny.dexid,
    name: noAccent(shiny.name || species || '').toLowerCase(),
    game: shiny.game,
    form: shiny.forme
  };
}



/** Counts the number of cards that are displayed in a section. */
type dexidSet = Set<number>;
type formesMap = Map< number, Set<string> >;
function countVisibleCards(section: PopulatableSection): [number, number, dexidSet, formesMap] {
  const container = document.querySelector(`#${section}`);
  if (!(container instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

  let cardAttribute: string;
  switch (section) {
    case 'partage':
      cardAttribute = 'username';
      break;
    default:
      cardAttribute = 'huntid';
  }

  const allCards = [...container.querySelectorAll(`[${cardAttribute}], [data-replaces][data-${cardAttribute}]`)];
  const totalCount = allCards.length;

  const sectionFilters = {
    mine: new Set(container.getAttribute('data-filter-mine')?.split(' ') ?? []),
    legit: new Set(container.getAttribute('data-filter-legit')?.split(' ') ?? [])
  };

  let displayedCount = 0;
  const dexids: dexidSet = new Set();
  const caughtFormsMap: formesMap = new Map();
  allCards.forEach(card => {
    const cardFilters = {
      mine: card.getAttribute('data-mine') ?? '',
      legit: card.getAttribute('data-legit') ?? ''
    };
    if (sectionFilters.mine.has(cardFilters.mine) && sectionFilters.legit.has(cardFilters.legit)) {
      displayedCount++;
      const dexid = Number(card.getAttribute('data-dexid'));
      const forme = card?.getAttribute('data-form') ?? '';
      caughtFormsMap.set(dexid, new Set([...caughtFormsMap.get(dexid) ?? [], forme]));
      if (!isNaN(dexid) && dexid > 0) dexids.add(dexid);
    }
  });

  return [displayedCount, totalCount, dexids, caughtFormsMap];
}



/**
 * Displays or hide "list is empty" messages in a section when needed,
 * and updates that section's counter if it has one.
 */
export function updateCounters(section: PopulatableSection): void {
  const container = document.querySelector(`#${section}`);
  if (!(container instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

  const [displayedCount, totalCount, dexids, caughtForms] = countVisibleCards(section);

  // Display "section is empty" message
  if (totalCount > 0) container.classList.remove('vide');
  else                container.classList.add('vide');

  // Display "no data corresponds to these filters" message
  if (isFiltrableSection(section)) {
    if (displayedCount > 0) container.classList.remove('vide-filtres');
    else                    container.classList.add('vide-filtres');
  } else {
    container.classList.remove('vide-filtres');
  }

  const displayedCounter = container.querySelector('.compteur');
  if (displayedCounter) displayedCounter.innerHTML = String(displayedCount);

  if (section === 'mes-chromatiques') {
    const dexidsCounter = document.querySelector('#pokedex .compteur > .caught');
    if (dexidsCounter) dexidsCounter.innerHTML = String(dexids.size);
    filterPokedex(dexids, caughtForms);
  }
}



////////////////////////////////////////////////////////////////////
// Ordonner les cartes de Pokémon selon une certaine caractéristique
// et renvoie leurs huntids dans l'ordre.
async function orderPokemon<DataClass extends Shiny | Hunt>(pokemonList: Map<string, DataClass>, order: ordre): Promise<string[]> {
  const noms = await Pokemon.names();
  const lang = getCurrentLang();

  let orderedShiny = pokemonList.values().toArray().sort((s1, s2) => {
    const huntidComparison = s1.huntid > s2.huntid ? 1
                           : s1.huntid < s2.huntid ? -1
                           : 0;
    const catchTimeComparison = -1 * (s1.catchTime - s2.catchTime);
    const creationTimeComparison = -1 * (s1.creationTime - s2.creationTime);

    switch (order) {
      case 'game': {
        const allGames = Pokemon.jeux;
        const game1 = allGames.findIndex(g => g.uid === s1.game);
        const game2 = allGames.findIndex(g => g.uid === s2.game);
        return -1 * (game1 - game2) || catchTimeComparison || creationTimeComparison || huntidComparison;
      }

      case 'name': {
        const nom1 = s1.name || noms[s1.dexid] || '';
        const nom2 = s2.name || noms[s2.dexid] || '';
        return nom1.localeCompare(nom2, lang) || catchTimeComparison || creationTimeComparison || huntidComparison;
      }

      case 'species': {
        const nom1 = noms[s1.dexid] || '';
        const nom2 = noms[s2.dexid] || '';
        return nom1.localeCompare(nom2, lang) || catchTimeComparison || creationTimeComparison || huntidComparison;
      }

      case 'shinyRate': {
        return -1 * ((s1.shinyRate || 0) - (s2.shinyRate || 0)) || catchTimeComparison || creationTimeComparison || huntidComparison;
      }

      case 'dexid': {
        return s1.dexid - s2.dexid || catchTimeComparison || creationTimeComparison || huntidComparison;
      }

      case 'catchTime': {
        return catchTimeComparison || creationTimeComparison || huntidComparison;
      }

      case 'creationTime': {
        return creationTimeComparison || huntidComparison;
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
export type OrderMap = Map<ordre, string[]>;
export async function computeOrders<DataClass extends Shiny | Hunt>(section: OrderableSection, data: Map<string, DataClass> | null = null): Promise<OrderMap> {
  const dataStore = getDataStore<typeof section>(section);
  const dataClass = getDataClass<typeof section>(section) as Constructor<DataClass> | undefined;

  const orderMap: OrderMap = new Map();

  await Promise.all(supportedOrdres.map(async order => {
    let orderedKeys: string[];

    // Actually order the keys associated to the requested section's data
    switch (section) {
      case 'partage':
        const keys = await dataStore.keys();
        const lang = getCurrentLang();
        orderedKeys = keys.sort((a, b) => a.localeCompare(b, lang));
        break;

      case 'mes-chromatiques':
      case 'chasses-en-cours':
      case 'corbeille':
      case 'chromatiques-ami':
        if (!data) {
          data = new Map();
          const items = await dataStore.getAllItems();
          items.forEach(async item => {
            if (!('huntid' in item)) return;
            if (typeof dataClass === 'undefined') data!.set(item.huntid, item);
            else data!.set(item.huntid, new dataClass(item));
          });
        }
        orderedKeys = await orderPokemon(data, order);
        break;
    }

    orderMap.set(order, orderedKeys);
  }));

  return orderMap;
}



/** Changes the order of cards in the DOM to fit their visual order. */
export async function orderCards(section: OrderableSection, orderMap?: OrderMap, order?: ordre, reversed?: boolean) {
  const sectionElement = document.querySelector(`#${section}`);
  if (!(sectionElement instanceof HTMLElement)) throw new TypeError('Expecting HTMLElement');

  if (orderMap == null) orderMap = await computeOrders(section);
  if (order == null) {
    const tempOrder = sectionElement?.getAttribute('data-order') ?? '';
    if (!isOrdre(tempOrder)) return;
    order = tempOrder;
  }
  if (reversed == null) reversed = sectionElement?.getAttribute('data-order-reversed') === 'true';

  const orderedIds = orderMap.get(order) ?? [];
  if (reversed) orderedIds.reverse();

  let elementAttribute: string;
  switch (section) {
    case 'partage':
      elementAttribute = 'username';
      break;

    case 'mes-chromatiques':
    case 'chasses-en-cours':
    case 'corbeille':
    case 'chromatiques-ami':
      elementAttribute = 'huntid';
      break;
  }
  
  const orderedCards = orderedIds.map(id => {
    return sectionElement.querySelector(`[${elementAttribute}="${id}"], [data-replaces][data-${elementAttribute}="${id}"]`);
  });

  let i = 0;
  for (const card of orderedCards) {
    (card as HTMLElement)?.style.setProperty('--order', String(i));
    card?.parentElement?.appendChild(card);
    i++;
  }
}