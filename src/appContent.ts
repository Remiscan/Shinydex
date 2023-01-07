import { Hunt } from './Hunt.js';
import { Pokemon, Shiny } from './Pokemon.js';
import { huntCard } from './components/hunt-card/huntCard.js';
import { pokemonCard } from './components/pokemon-card/pokemonCard.js';
import { computedOrders } from './filtres.js';
import { lazyLoad } from './lazyLoading.js';
import { friendStorage, huntStorage, localForageAPI, shinyStorage } from './localForage.js';
import { navigate } from './navigate.js';
import { Notif } from './notification.js';



export type PopulatableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'chromatiques-ami' | 'corbeille';
const populatableSections: PopulatableSection[] = ['mes-chromatiques', 'chasses-en-cours', 'chromatiques-ami', 'corbeille'];

async function populateHandler(section: PopulatableSection, _ids?: string[]): Promise<PromiseSettledResult<string>[]> {
  let dataStore: localForageAPI; // base de données
  switch (section) {
    case 'mes-chromatiques':
      dataStore = shinyStorage;
      break;
    case 'chasses-en-cours':
      dataStore = huntStorage;
      break;
    case 'chromatiques-ami':
      dataStore = friendStorage;
      break;
    case 'corbeille':
      dataStore = huntStorage;
      break;
  }

  const ids = _ids ?? await dataStore.keys();
  const populated = await populateFromData(section, ids);

  computedOrders(section, ids);

  return populated;
}

export const populator = Object.fromEntries(populatableSections.map(section => {
  return [section, (ids?: string[]) => populateHandler(section, ids)];
}));



export async function populateFromData(section: PopulatableSection, ids: string[]): Promise<PromiseSettledResult<string>[]> {
  let elementName: string; // Nom de l'élément de carte
  let dataStore: localForageAPI; // Base de données
  let dataClass: (typeof Shiny) | (typeof Hunt);
  switch (section) {
    case 'mes-chromatiques':
      elementName = 'pokemon-card';
      dataStore = shinyStorage;
      dataClass = Shiny;
      break;
    case 'chasses-en-cours':
      elementName = 'hunt-card';
      dataStore = huntStorage;
      dataClass = Hunt;
      break;
    case 'chromatiques-ami':
      elementName = 'pokemon-card';
      dataStore = friendStorage;
      dataClass = Shiny;
      break;
    case 'corbeille':
      elementName = 'corbeille-card';
      dataStore = huntStorage;
      dataClass = Hunt;
      break;
  }

  /* Que faire selon l'état des données du Pokémon ?
  |------------|-------------|--------------------------|--------------------------|
  |            | DANS LA BDD | DANS LA BDD MAIS DELETED | ABSENT DE LA BDD         |
  |------------|-------------|--------------------------|--------------------------|
  | AVEC CARTE |           Éditer                       | Supprimer (manuellement) |
  |------------|-------------|--------------------------|--------------------------|
  | SANS CARTE |    Créer    |          Ignorer         |            N/A           |
  |------------|-------------|--------------------------|--------------------------|
  */

  // Traitons les cartes :

  const cardsToCreate: Array<pokemonCard | huntCard> = [];
  const results = await Promise.allSettled(ids.map(async huntid => {
    const pkmn = await dataStore.getItem(huntid);
    const pkmnInDB = pkmn != null && typeof pkmn === 'object';
    const pkmnObj = new dataClass(pkmnInDB ? pkmn : {});
    const pkmnInDBButDeleted = pkmnInDB && pkmnObj.deleted;
    let card: pokemonCard | huntCard | null = document.querySelector(`${elementName}[huntid="${huntid}"]`);

    // ABSENT DE LA BDD = Supprimer (manuellement)
    if (!pkmnInDB) {
      card?.remove();
      return Promise.resolve(huntid);
    }

    // DANS LA BDD
    else {
      if (card == null) {
        // DANS LA BDD MAIS DELETED & SANS CARTE = Ignorer
        const ignoreCondition = pkmnObj.destroy || (
          section === 'corbeille' ? !pkmnInDBButDeleted : pkmnInDBButDeleted
        );
        if (ignoreCondition) return Promise.resolve(huntid);
        // DANS LA BDD & SANS CARTE = Créer
        else {
          card = document.createElement(elementName) as pokemonCard | huntCard;
          card.setAttribute('huntid', huntid);
          cardsToCreate.push(card);
        }
      } else {
        // DANS LA BDD & AVEC CARTE = Éditer
        await card.dataToContent();
      }
      return Promise.resolve(huntid);
    }
  }));

  // Plaçons les cartes sur la page
  // (après la préparation pour optimiser le temps d'exécution)
  const conteneur = document.querySelector(`#${section} > .section-contenu`)!;
  await Promise.all(cardsToCreate.map(async card => {
    conteneur.appendChild(card);
    await card.dataToContent();
    lazyLoad(card);
  }));

  return results;
}


/** Initialise le Pokédex. */
let pokedexInitialized = false;
export async function initPokedex() {
  if (pokedexInitialized) return;

  let gensToPopulate = [];
  const generations = Pokemon.generations;

  for (const gen of generations) {
    let monsToPopulate = [];
    const genConteneur = document.createElement('div');
    genConteneur.classList.add('pokedex-gen');
    const allNames = await Pokemon.names();

    for (let i = gen.start; i <= gen.end; i++) {
      const pkmn = document.createElement('button');
      pkmn.setAttribute('type', 'button');
      pkmn.setAttribute('aria-label', allNames[i]);
      pkmn.classList.add('pkmnicon');
      pkmn.dataset.dexid = String(i);
      pkmn.addEventListener('click', event => {
        try {
          navigate('sprite-viewer', event, { dexid: String(i) });
        } catch (error) {
          const message = `Erreur : impossible d'afficher ce Pokémon`;
          console.error(message, error);
          new Notif(message).prompt();
        }
      });
      monsToPopulate.push(pkmn);
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
    lazyLoad(genConteneur);
  }

  // Peuple le compteur total de Pokémon dans le Pokédex
  const totalPokemon = generations[generations.length - 1].end;
  const totalCounter = section.querySelector('.compteur > .total');
  if (totalCounter) totalCounter.innerHTML = String(totalPokemon);

  pokedexInitialized = true;
  return;
}