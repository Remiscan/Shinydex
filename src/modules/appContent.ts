import { Hunt } from './Hunt.js';
import { Pokemon } from './Pokemon.js';
import { Shiny } from './Shiny.js';
import { friendCard } from './components/friend-card/friendCard.js';
import { huntCard } from './components/hunt-card/huntCard.js';
import { shinyCard } from './components/shiny-card/shinyCard.js';
import { computeOrders, isOrdre, orderCards, supportedOrdres, updateCounters } from './filtres.js';
import { friendShinyStorage, friendStorage, huntStorage, localForageAPI, shinyStorage } from './localForage.js';
import { navigate } from './navigate.js';
import { Notif } from './notification.js';



export type PopulatableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'partage' | 'chromatiques-ami' | 'corbeille';
const populatableSections: PopulatableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'partage', 'chromatiques-ami', 'corbeille'];

async function populateHandler(section: PopulatableSection, _ids?: string[]): Promise<PromiseSettledResult<string>[]> {
  let dataStore: localForageAPI; // base de données
  switch (section) {
    case 'mes-chromatiques':
      dataStore = shinyStorage;
      break;
    case 'chasses-en-cours':
      dataStore = huntStorage;
      break;
    case 'partage':
      dataStore = friendStorage;
      break;
    case 'chromatiques-ami':
      dataStore = friendShinyStorage;
      break;
    case 'corbeille':
      dataStore = huntStorage;
      break;
  }

  const sectionElement = document.querySelector(`#${section}`);
  const orderMap = await computeOrders(section);
  const currentOrder = sectionElement?.getAttribute('data-order') ?? '';
  const reversed = sectionElement?.getAttribute('data-order-reversed') === 'true';

  const allIds = await dataStore.keys();
  const ids = _ids ?? allIds;

  // Populate cards in the order currently selected
  let orderedIds = ids;
  if (isOrdre(currentOrder)) {
    const orderedStoredIds = orderMap.get(currentOrder) ?? [];
    orderedIds = [
      ...orderedStoredIds.filter(id => ids.includes(id)),
      ...ids.filter(id => !(orderedStoredIds.includes(id)))
    ];
  }

  const populated = await populateFromData(section, orderedIds);

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
  });

  return populated;
}

export const populator = Object.fromEntries(populatableSections.map(section => {
  return [section, (ids?: string[]) => populateHandler(section, ids)];
}));



export async function populateFromData(section: PopulatableSection, ids: string[]): Promise<PromiseSettledResult<string>[]> {
  if (section === 'partage') return populateFriendsList(ids);

  const sectionElement = document.querySelector(`#${section}`)!;
  const conteneur = sectionElement.querySelector(`.section-contenu`)!;

  let elementName: string; // Nom de l'élément de carte
  let dataStore: localForageAPI; // Base de données
  let dataClass: (typeof Shiny) | (typeof Hunt);
  switch (section) {
    case 'mes-chromatiques':
      elementName = 'shiny-card';
      dataStore = shinyStorage;
      dataClass = Shiny;
      break;
    case 'chasses-en-cours':
      elementName = 'hunt-card';
      dataStore = huntStorage;
      dataClass = Hunt;
      break;
    case 'chromatiques-ami':
      elementName = 'friend-shiny-card';
      dataStore = friendShinyStorage;
      dataClass = Shiny;
      break;
    case 'corbeille':
      elementName = 'corbeille-card';
      dataStore = huntStorage;
      dataClass = Hunt;
      break;
  }

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

  const cardsToCreate: Array<shinyCard | huntCard> = [];

  const orderMap = await computeOrders(section);

  const setOrders = (card: shinyCard | huntCard, id: string) => {
    supportedOrdres.forEach(order => {
      const orderedKeys = orderMap.get(order);
      const k = orderedKeys?.findIndex((i: string) => i === id);
      if (k === -1) {
        console.log('This should not happen');
      }
      card.style.setProperty(`--${order}-order`, String(k));
    });
  };

  const results = await Promise.allSettled(ids.map(async huntid => {
    const pkmn = await dataStore.getItem(huntid);
    const pkmnInDB = pkmn != null && typeof pkmn === 'object';
    const pkmnObj = new dataClass(pkmnInDB ? pkmn : {});
    const pkmnInDBButDeleted = pkmnInDB && 'deleted' in pkmnObj && pkmnObj.deleted
    const ignoreCondition = section === 'corbeille' ? !pkmnInDBButDeleted : pkmnInDBButDeleted;

    let card: shinyCard | huntCard | null = document.querySelector(`${elementName}[huntid="${huntid}"]`);

    // ABSENT DE LA BDD ou PRÉSENT MAIS À IGNORER = Supprimer (manuellement)
    if (!pkmnInDB || ignoreCondition) {
      card?.remove();
    }

    // DANS LA BDD et À NE PAS IGNORER
    else {
      if (card == null) {
        // DANS LA BDD & SANS CARTE = Créer
        card = document.createElement(elementName) as shinyCard | huntCard;
        card.setAttribute('huntid', huntid);
        setOrders(card, huntid);
        cardsToCreate.push(card);
      } else {
        // DANS LA BDD & AVEC CARTE = Éditer
        setOrders(card, huntid);
        await card.dataToContent();
      }
    }

    return Promise.resolve(huntid);
  }));

  // Évite un bref moment où une carte est affichée en même temps que le message de section vide
  if (conteneur.parentElement?.classList.contains('vide') && cardsToCreate.length > 0) {
    conteneur.parentElement.classList.remove('vide');
  }

  // Plaçons les cartes sur la page
  // (après la préparation pour optimiser le temps d'exécution)
  for (const card of cardsToCreate) {
    conteneur.appendChild(card);
    if (section === 'chasses-en-cours') {
      await card.dataToContent();
      //lazyLoad(card);
    }
    //lazyLoad(card, 'manual');
  }

  // Ordonnons les cartes déjà présentes et non touchées
  const untouchedIDs = (await dataStore.keys()).filter(key => !(ids.includes(key)));
  untouchedIDs.forEach(id => {
    const card: shinyCard | huntCard | null = document.querySelector(`${elementName}[huntid="${id}"]`);
    if (card) setOrders(card, id);
  })

  return results;
}


/** Populates the friends list. */
async function populateFriendsList(usernames: string[]): Promise<PromiseSettledResult<string>[]> {
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
  const conteneur = document.querySelector('#partage > .section-contenu')!;

  // Évite un bref moment où une carte est affichée en même temps que le message de section vide
  if (conteneur.parentElement?.classList.contains('vide') && cardsToCreate.length > 0) {
    conteneur.parentElement.classList.remove('vide');
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

  let gensToPopulate = [];
  const generations = Pokemon.generations;

  for (const gen of generations) {
    let monsToPopulate = [];
    const genConteneur = document.createElement('div');
    genConteneur.classList.add('pokedex-gen', 'surface', 'variant', 'elevation-0');
    const allNames = Pokemon.names();

    for (let i = gen.start; i <= gen.end; i++) {
      const pkmnContainer = document.createElement('span');
      pkmnContainer.classList.add('dex-icon', 'surface', 'interactive');
      pkmnContainer.setAttribute('data-dexid', String(i));

      const pkmn = document.createElement('button');
      pkmn.setAttribute('type', 'button');
      pkmn.setAttribute('aria-label', allNames[i]);
      pkmn.classList.add('pkmnicon');
      pkmn.setAttribute('data-dexid', String(i));
      pkmn.addEventListener('click', event => {
        try {
          navigate('sprite-viewer', event, { dexid: String(i) });
        } catch (error) {
          const message = `Erreur : impossible d'afficher ce Pokémon`;
          console.error(message, error);
          new Notif(message).prompt();
        }
      });

      pkmnContainer.appendChild(pkmn);
      //lazyLoad(pkmn, 'manual');
      monsToPopulate.push(pkmnContainer);
    }

    for (let pkmn of monsToPopulate) { genConteneur.appendChild(pkmn); }
    gensToPopulate.push(genConteneur);
  }

  // Peuple le Pokédex
  const section = document.querySelector('#pokedex');
  if (!(section instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
  const conteneur = section.querySelector('.section-contenu');
  if (!(conteneur instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
  for (let genConteneur of gensToPopulate) {
    conteneur.appendChild(genConteneur);
    //lazyLoad(genConteneur);
  }

  // Peuple le compteur total de Pokémon dans le Pokédex
  const totalPokemon = generations[generations.length - 1].end;
  const totalCounter = section.querySelector('.compteur > .total');
  if (totalCounter) totalCounter.innerHTML = String(totalPokemon);

  pokedexInitialized = true;
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