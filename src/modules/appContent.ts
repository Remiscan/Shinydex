import { Hunt } from './Hunt.js';
import { Pokemon } from './Pokemon.js';
import { Shiny } from './Shiny.js';
import { friendCard } from './components/friend-card/friendCard.js';
import { huntCard } from './components/hunt-card/huntCard.js';
import { shinyCard } from './components/shiny-card/shinyCard.js';
import { PopulatableSection, ShinyFilterData, applyOrders, computeFilters, computedNamesOrderLang, getCardTagName, getDataClass, getDataStore, populatableSections, recomputeLexicographicalOrdersOnLangChange, updateCounters } from './filtres.js';
import { clearElementStorage, lazyLoadSection, virtualizedSections } from './lazyLoading.js';
import { friendStorage, huntStorage } from './localForage.js';
import { animateCards } from './navigate.js';
import { getCurrentLang, getString } from './translation.js';



type PopulatorOptions = {
  animate?: boolean;
}



async function populateHandler(section: PopulatableSection, requestedIds?: string[], options: PopulatorOptions = {}): Promise<Array<string>> {
  const start = performance.now();
  console.log(`Populating section ${section}...`);

  const dataStore = getDataStore(section);
  const dataClass = getDataClass<typeof section>(section);

  const sectionElement = document.querySelector(`#${section}`);
  const isCurrentSection = document.body.matches(`[data-section-actuelle~="${section}"]`);

  let ids: Set<string> = new Set(requestedIds ?? []);

  const allData = new Map();
  await dataStore.iterate((data, key) => {
    if (!requestedIds) ids.add(key);
    allData.set(key, data);
  });

  const lang = getCurrentLang();
  if (lang !== computedNamesOrderLang) {
    await recomputeLexicographicalOrdersOnLangChange(lang);
  }

  let populated: Array<string>;
  switch (section) {
    case 'partage':
      populated = await populateFriendsList(ids);
      break;

    case 'mes-chromatiques':
      await shinyCard.updateCaughtCache();
    case 'chasses-en-cours':
    case 'chromatiques-ami':
    case 'corbeille': {
      const requestedData: any[] = [];
      for (const id of ids) {
        requestedData.push(allData.get(id) ?? id);
      }
      populated = await populateFromData(section, requestedData);
    } break;
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

  console.log(`Section ${section} populated in ${performance.now() - start} ms.`);
  return populated;
}

export const populator = Object.fromEntries(populatableSections.map(section => {
  return [section, (ids?: string[], options?: PopulatorOptions) => populateHandler(section, ids, options)];
}));



export async function populateFromData(
  section: Exclude<PopulatableSection, 'partage'>,
  dataList: Array<Shiny | string> | Array<Hunt | string>,
): Promise<Array<string>> {
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
  const allCards: Map<string, HTMLElement> = new Map();
  document.querySelectorAll<HTMLElement>(`${elementName}[huntid], div[data-replaces="${elementName}"][data-huntid]`).forEach(c => {
    const id = c.getAttribute('huntid') ?? c.getAttribute('data-huntid');
    if (id) allCards.set(id, c);
  });
  const filterMap = await computeFilters(section);

  const results: string[] = [];
  for (const pkmn of dataList) {
    const huntid = typeof pkmn === 'string' ? pkmn : pkmn.huntid;
    const pkmnInDB = pkmn != null && typeof pkmn === 'object';
    const pkmnObj = (pkmn instanceof dataClass) ? pkmn : new dataClass(pkmnInDB ? pkmn : {});
    const pkmnInDBButDeleted = pkmnInDB && 'deleted' in pkmnObj && pkmnObj.deleted
    const ignoreCondition = section === 'corbeille' ? !pkmnInDBButDeleted : pkmnInDBButDeleted;

    let card: HTMLElement | undefined = allCards.get(huntid);

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
          card = document.createElement('div');
          card.setAttribute('data-replaces', elementName);
          card.setAttribute('data-huntid', huntid);
          card.classList.add('surface', 'surface-container-highest');
        } else {
          const sCard = document.createElement(elementName) as shinyCard | huntCard;
          sCard.setAttribute('huntid', huntid);
          const pkmnInstancePromise = (pkmn instanceof dataClass) ? Promise.resolve(pkmn) : undefined;
          sCard.dataToContent(pkmnInstancePromise);
          card = sCard;
        }
        applyOrders(card, pkmnObj);
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
        const pkmnInstancePromise = (pkmn instanceof dataClass) ? Promise.resolve(pkmn) : undefined;
        if (!virtualize) (card as shinyCard | huntCard).dataToContent(pkmnInstancePromise);
        else {
          if (card instanceof shinyCard || card instanceof huntCard) {
            card.dataToContent(pkmnInstancePromise);
            card.needsRefresh = false;
          } else {
            card.setAttribute('data-needs-refresh', 'true');
          }
        }
      }
    }

    results.push(huntid);
  }

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
async function populateFriendsList(usernames: Set<string>): Promise<Array<string>> {
  const sectionElement = document.querySelector(`#partage`)!;
  const conteneur = sectionElement.querySelector(`.liste-cartes`)!;

  const elementName = 'friend-card';
  const dataStore = friendStorage;

  // Traitons les cartes

  const cardsToCreate: Array<friendCard> = [];
  const results: string[] = [];
  await dataStore.iterate((pkmnList, username) => {
    if (!usernames.has(username)) return;
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
        card.dataToContent();
      }
    }

    results.push(username);
  });

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
    const toRemove: Array<string> = [];
    await huntStorage.iterate((item, key) => {
      const hunt = new Hunt(item);
      if (hunt.destroy && hunt.lastUpdate + month < Date.now()) {
        toRemove.push(key);
      }
    });
    await Promise.all(toRemove.map(key => huntStorage.removeItem(key)));
  } catch (error) {
    console.error(`Erreur pendant le nettoyage de la corbeille.`, error);
  }
}