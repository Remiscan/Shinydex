import { huntedPokemon } from './Hunt.js';
import { Pokemon, frontendShiny } from './Pokemon.js';
import { huntCard } from './components/hunt-card/huntCard.js';
import { pokemonCard } from './components/pokemon-card/pokemonCard.js';
import { ListeFiltres } from './filtres.js';
import { lazyLoad } from './lazyLoading.js';
import { dataStorage, friendStorage, huntStorage, localForageAPI, shinyStorage } from './localForage.js';
import { navigate } from './navigate.js';
import { Notif } from './notification.js';



const sections = ['mes-chromatiques', 'chasses-en-cours'];
const populating: Map<string, boolean> = new Map(sections.map(s => [s, false]));
const lastModified: Map<string, Set<string>> = new Map(sections.map(s => [s, new Set()]));
const queue: Map<string, Set<string>> = new Map(sections.map(section => [section, new Set()]));
let pokedexInitialized = false;



export type populatableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'chromatiques-ami' | 'corbeille';

export async function populateHandler(section: populatableSection, _ids?: string[], filtres: ListeFiltres = new ListeFiltres()): Promise<PromiseSettledResult<string>[]> {
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
  const currentQueue = new Set([...(queue.get(section) || []), ...ids]);
  //queue.set(section, new Set([...(queue.get(section) || []), ...ids]));

  if (populating.get(section)) return Promise.allSettled([Promise.resolve('')]);
  populating.set(section, true);

  const populated = await populateFromData(section, ids);
  for (const result of populated) {
    if (result.status === 'fulfilled') currentQueue.delete(result.value);
  }

  /*switch (section) {
    case 'mes-chromatiques':
    case 'chromatiques-ami':
      await filterCards(section, options.filtres, ids);
      await orderCards(section, options.filtres.ordre, options.filtres.ordreReverse, ids);
  }*/

  populating.set(section, false);

  const newQueue = new Set([...(queue.get(section) || []), ...currentQueue]);
  queue.set(section, newQueue);
  if (newQueue.size > 0) return populateHandler(section, [...newQueue], filtres);

  return populated;
}



export async function populateFromData(section: populatableSection, ids: string[]): Promise<PromiseSettledResult<string>[]> {
  let elementName: string; // Nom de l'élément de carte
  let dataStore: localForageAPI; // Base de données
  let filtres: ListeFiltres | undefined; // Filtres à appliquer aux cartes
  switch (section) {
    case 'mes-chromatiques':
      elementName = 'pokemon-card';
      dataStore = shinyStorage;
      filtres = await dataStorage.getItem('filtres');
      break;
    case 'chasses-en-cours':
      elementName = 'hunt-card';
      dataStore = huntStorage;
      break;
    case 'chromatiques-ami':
      elementName = 'pokemon-card';
      dataStore = friendStorage;
      break;
    case 'corbeille':
      elementName = 'corbeille-card';
      dataStore = huntStorage;
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
    const pkmn = await dataStore.getItem(huntid) as frontendShiny | huntedPokemon | null;
    let card = document.querySelector(`${elementName}[huntid="${huntid}"]`) as pokemonCard | huntCard;

    // ABSENT DE LA BDD = Supprimer (manuellement)
    if (pkmn === null) {
      card?.remove();
      return Promise.resolve(huntid);
    }

    // DANS LA BDD
    else {
      if (card === null) {
        // DANS LA BDD MAIS DELETED & SANS CARTE = Ignorer
        const ignoreCondition = section === 'corbeille' ? !(pkmn.deleted)
                                                        : pkmn.deleted;
        if (ignoreCondition) return Promise.resolve(huntid);
        // DANS LA BDD & SANS CARTE = Créer
        else {
          card = document.createElement(elementName) as pokemonCard | huntCard;
          card.setAttribute('huntid', huntid);
          cardsToCreate.push(card);
        }
      } else {
        // DANS LA BDD & AVEC CARTE = Éditer
        card.dataToContent();
      }
      return Promise.resolve(huntid);
    }
  }));

  // Plaçons les cartes sur la page
  // (après la préparation pour optimiser le temps d'exécution)
  const conteneur = document.querySelector(`#${section} > .section-contenu`)!;
  for (const card of cardsToCreate) {
    conteneur.appendChild(card);
    lazyLoad(card);
  }

  // Compte le nombre de cartes affichées
  const allCards = [...conteneur.querySelectorAll(elementName)];
  if (allCards.length > 0) conteneur.closest('section')?.classList.remove('vide');
  else                     conteneur.closest('section')?.classList.add('vide');
  const filteredCards = allCards.filter(card => card.classList.contains('filtered'));
  if ((allCards.length - filteredCards.length) > 0) conteneur.closest('section')?.classList.remove('vide-filtres');
  else                                              conteneur.closest('section')?.classList.add('vide-filtres');

  return results;
}


/** Initialise le Pokédex. */
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
  const conteneur = document.querySelector('#pokedex>.section-contenu')!;
  for (let genConteneur of gensToPopulate) {
    conteneur.appendChild(genConteneur);
    lazyLoad(genConteneur);
  }

  pokedexInitialized = true;
  return;
}