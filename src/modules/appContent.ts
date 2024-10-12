import { Hunt } from './Hunt.js';
import { Pokemon } from './Pokemon.js';
import { Shiny } from './Shiny.js';
import { friendCard } from './components/friend-card/friendCard.js';
import { huntCard } from './components/hunt-card/huntCard.js';
import { shinyCard } from './components/shiny-card/shinyCard.js';
import { PopulatableSection, ShinyFilterData, computeFilters, computeOrders, getCardTagName, getDataClass, getDataStore, isOrdre, orderCards, populatableSections, updateCounters } from './filtres.js';
import { clearElementStorage, lazyLoadSection, virtualizedSections } from './lazyLoading.js';
import { friendStorage, huntStorage, shinyStorage } from './localForage.js';
import { animateCards } from './navigate.js';
import { getString } from './translation.js';



type PopulatorOptions = {
  animate?: boolean;
}



async function populateHandler(section: PopulatableSection, _ids?: string[], options: PopulatorOptions = {}): Promise<PromiseSettledResult<string>[]> {
  const dataStore = getDataStore(section);
  const dataClass = getDataClass(section);

  const sectionElement = document.querySelector(`#${section}`);
  const isCurrentSection = document.body.matches(`[data-section-actuelle~="${section}"]`);

  const allIds = await dataStore.keys();
  const ids = _ids ?? allIds;

  const allData: Shiny[] | Hunt[] = await Promise.all(allIds.map(async id => {
    const item = await dataStore.getItem(id);
    if (typeof dataClass === 'undefined') return item;
    else return new dataClass(item);
  }));

  const orderMap = await computeOrders(section, allData);
  const currentOrder = sectionElement?.getAttribute('data-order') ?? '';
  const reversed = sectionElement?.getAttribute('data-order-reversed') === 'true';

  // Populate cards in the order currently selected
  let orderedIds = ids;
  if (isOrdre(currentOrder)) {
    const orderedStoredIds = orderMap.get(currentOrder) ?? [];
    orderedIds = [
      ...orderedStoredIds.filter(id => ids.includes(id)),
      ...ids.filter(id => !(orderedStoredIds.includes(id)))
    ];
  }

  let populated: PromiseSettledResult<string>[];
  switch (section) {
    case 'partage':
      populated = await populateFriendsList(orderedIds);
      break;

    case 'mes-chromatiques':
    case 'chasses-en-cours':
    case 'chromatiques-ami':
    case 'corbeille': {
      const orderedData = orderedIds.map(id => allData.find(d => d.huntid === id) ?? id);
      populated = await populateFromData(section, orderedData);
    } break;
  }

  // Order all cards (newly populated + older cards) in the order currently selected
  if (isOrdre(currentOrder)) {
    await orderCards(section, orderMap, currentOrder, reversed);
  }

  // Update counters with number of displayed cards
  // (in setTimeout because it needs to run after styles have been applied to the populated cards)
  setTimeout(() => {
    updateCounters(section);
    
    sectionElement?.classList.remove('loading');
    if (section === 'mes-chromatiques') {
      document.querySelector(`#pokedex`)?.classList.remove('loading');
    }

    const virtualize = virtualizedSections.includes(section) && 
      (isCurrentSection || sectionElement?.getAttribute('data-lazy-loaded') === 'true');
    if (virtualize) lazyLoadSection(section);

    if (options.animate) animateCards(section);
  });

  return populated;
}

export const populator = Object.fromEntries(populatableSections.map(section => {
  return [section, (ids?: string[], options?: PopulatorOptions) => populateHandler(section, ids, options)];
}));



export async function populateFromData(
  section: Exclude<PopulatableSection, 'partage'>,
  dataList: Array<Shiny | string> | Array<Hunt | string>,
): Promise<PromiseSettledResult<string>[]> {
  const sectionElement = document.querySelector(`#${section}`)!;
  const conteneur = (sectionElement.querySelector(`.liste-cartes`) ?? sectionElement.querySelector(`.section-contenu`))!;
  const virtualize = virtualizedSections.includes(section);

  const elementName = getCardTagName(section);
  const dataStore = getDataStore(section);
  const dataClass = getDataClass(section);

  /* Que faire selon l'état des données du Pokémon ?
   * (à ignorer = "à supprimer" si section != corbeille, inverse sinon)
  |------------|-------------|----------------------------|--------------------------|
  |            | DANS LA BDD | DANS LA BDD MAIS À IGNORER | ABSENT DE LA BDD         |
  |------------|-------------|----------------------------|--------------------------|
  | AVEC CARTE |    Éditer   |         Supprimer          |         Supprimer        |
  |------------|-------------|----------------------------|--------------------------|
  | SANS CARTE |    Créer    |          Ignorer           |            N/A           |
  |------------|-------------|----------------------------|--------------------------|
  */

  // Traitons les cartes :

  const cardsToCreate: Element[] = [];
  const allCards = [...document.querySelectorAll(`${elementName}[huntid], div[data-replaces="${elementName}"][data-huntid]`)];
  const allCardsIds = allCards.map(c => c.getAttribute('huntid') ?? c.getAttribute('data-huntid'));
  const filterMap = await computeFilters(section);

  const results = await Promise.allSettled(dataList.map(async pkmn => {
    const huntid = typeof pkmn === 'string' ? pkmn : pkmn.huntid;
    const pkmnInDB = pkmn != null && typeof pkmn === 'object';
    const pkmnObj = new dataClass(pkmnInDB ? pkmn : {});
    const pkmnInDBButDeleted = pkmnInDB && 'deleted' in pkmnObj && pkmnObj.deleted
    const ignoreCondition = section === 'corbeille' ? !pkmnInDBButDeleted : pkmnInDBButDeleted;

    const cardIndex = allCardsIds.findIndex(id => id === huntid);
    let card: Element | undefined = allCards[cardIndex];

    // ABSENT DE LA BDD ou PRÉSENT MAIS À IGNORER = Supprimer (manuellement)
    if (!pkmnInDB || ignoreCondition) {
      if (card) {
        (card as HTMLElement & {obsolete: boolean}).obsolete = true;
        card.remove();
        clearElementStorage(section, huntid);
      }
    }

    // DANS LA BDD et À NE PAS IGNORER
    else {
      if (card == null) {
        // DANS LA BDD & SANS CARTE = Créer
        if (virtualize) {
          card = document.createElement('div') as HTMLElement;
          card.setAttribute('data-replaces', elementName);
          card.setAttribute('data-huntid', huntid);
          card.classList.add('surface', 'surface-container-highest');
        } else {
          card = document.createElement(elementName) as shinyCard | huntCard;
          card.setAttribute('huntid', huntid);
        }
        card.setAttribute('role', 'listitem');
        
        const cardFilters = filterMap.get(huntid);
        if (cardFilters) {
          for (const [filter, value] of Object.entries(cardFilters)) {
            card?.setAttribute(`data-${filter}`, String(cardFilters[filter as keyof ShinyFilterData]));
          }
        }
        cardsToCreate.push(card);
      } else {
        // DANS LA BDD & AVEC CARTE = Éditer
        if (!virtualize) await (card as shinyCard | huntCard).dataToContent();
        else {
          if (card instanceof shinyCard || card instanceof huntCard) {
            card.dataToContent();
            card.needsRefresh = false;
          } else {
            card.setAttribute('data-needs-refresh', 'true');
          }
        }
      }
    }

    return Promise.resolve(huntid);
  }));

  // Évite un bref moment où une carte est affichée en même temps que le message de section vide
  if (sectionElement.classList.contains('vide') && cardsToCreate.length > 0) {
    sectionElement.classList.remove('vide');
  }

  // Plaçons les cartes sur la page
  // (après la préparation pour optimiser le temps d'exécution)
  for (const card of cardsToCreate) {
    conteneur.appendChild(card);
  }

  return results;
}


/** Populates the friends list. */
async function populateFriendsList(usernames: string[]): Promise<PromiseSettledResult<string>[]> {
  const sectionElement = document.querySelector(`#partage`)!;
  const conteneur = sectionElement.querySelector(`.liste-cartes`)!;

  const elementName = 'friend-card';
  const dataStore = friendStorage;

  // Traitons les cartes

  const cardsToCreate: Array<friendCard> = [];
  const results = await Promise.allSettled(usernames.map(async username => {
    const pkmnList = await dataStore.getItem(username);
    const friendInDB = pkmnList != null && Array.isArray(pkmnList);

    let card: friendCard | null = document.querySelector(`${elementName}[username="${username}"]`);

    // ABSENT DE LA BDD = Supprimer (manuellement)
    if (!friendInDB) {
      card?.remove();
    }

    // DANS LA BDD
    else {
      if (card == null) {
        // DANS LA BDD & SANS CARTE = Créer
        card = document.createElement(elementName) as friendCard;
        card.setAttribute('username', username);
        card.setAttribute('role', 'listitem');
        cardsToCreate.push(card);
      } else {
        // DANS LA BDD & AVEC CARTE = Éditer
        await card.dataToContent();
      }
    }

    return Promise.resolve(username);
  }));

  // Plaçons les cartes sur la page
  // (après la préparation pour optimiser le temps d'éxecution)

  // Évite un bref moment où une carte est affichée en même temps que le message de section vide
  if (sectionElement?.classList.contains('vide') && cardsToCreate.length > 0) {
    sectionElement.classList.remove('vide');
  }

  await Promise.all(cardsToCreate.map(async card => {
    conteneur.appendChild(card);
    //lazyLoad(card, 'manual');
  }));

  return results;
}


/** Initialise le Pokédex. */
let pokedexInitialized = false;
export function initPokedex() {
  if (pokedexInitialized) return;

  // Observer le redimensionnement du Pokédex et passer la valeur en pixels
  const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      if (!(entry.target instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
      const width = entry.contentBoxSize[0].inlineSize;
      if (width === 0) continue;
      const icons = entry.target.children.length;
      const columns = (width - 8) / (44 + 8);
      const rows = Math.ceil(icons / columns);
      entry.target.style.setProperty('--rows', String(rows));
    }
  });

  const genBlockTemplate = document.createElement('template');
  genBlockTemplate.innerHTML = /*html*/`
    <div class="pokedex-gen surface surface-container-low"></div>
  `;

  const pokedex = new DocumentFragment();

  const generations = Pokemon.generations;
  for (const gen of generations) {
    const genBlock = genBlockTemplate.content.cloneNode(true) as DocumentFragment;
    const genContainer = genBlock.querySelector('.pokedex-gen')!;

    const genHeader = document.createElement('h2');
    genHeader.className = 'pokedex-gen-header title-medium surface surface-container-high';
    genHeader.innerHTML = `<span data-string="pokedex-gen-title">${getString('pokedex-gen-title')}</span> ${gen.num}`;
    genContainer?.appendChild(genHeader);

    for (let i = gen.start; i <= gen.end; i++) {
      const pkmnIcon = document.createElement('div');
      pkmnIcon.setAttribute('data-replaces', 'dex-icon');
      pkmnIcon.setAttribute('data-dexid', String(i));
      genContainer?.appendChild(pkmnIcon);
    }

    pokedex.appendChild(genBlock);
    observer.observe(genContainer);
  }

  // Peuple le Pokédex
  const section = document.querySelector('#pokedex');
  if (!(section instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
  const conteneur = section.querySelector('.liste-cartes');
  if (!(conteneur instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
  conteneur.appendChild(pokedex);

  // Peuple le compteur total de Pokémon dans le Pokédex
  const totalPokemon = generations[generations.length - 1].end;
  const totalCounter = section.querySelector('.compteur > .total');
  if (totalCounter) totalCounter.innerHTML = String(totalPokemon);

  pokedexInitialized = true;
  lazyLoadSection('pokedex');
  return;
}


/** Removes Pokémon deleted more than 30 days ago from the recycle bin. */
export async function cleanUpRecycleBin() {
  const month = 1000 * 60 * 60 * 24 * 30;
  try {
    await huntStorage.ready();
    const keys = await huntStorage.keys();
    await Promise.all(
      keys.map(async key => {
        const shiny = new Hunt(await huntStorage.getItem(key));
        if (shiny.destroy && shiny.lastUpdate + month < Date.now()) {
          return await shinyStorage.removeItem(shiny.huntid);
        }
      })
    );
  } catch (error) {
    console.error(`Erreur pendant le nettoyage de la corbeille.`, error);
  }
}