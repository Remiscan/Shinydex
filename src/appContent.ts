import { huntCard } from './components/hunt-card/huntCard.js';
import { pokemonCard } from './components/pokemon-card/pokemonCard.js';
import { filterCards, ListeFiltres, orderCards } from './filtres.js';
import { huntedPokemon } from './Hunt.js';
import { lazyLoad } from './lazyLoading.js';
import { dataStorage, friendStorage, huntStorage, localForageAPI, shinyStorage } from './localforage.js';
import { navigate } from './navigate.js';
import { Notif } from './notification.js';
import { frontendShiny, Pokemon } from './Pokemon.js';



const sections = ['mes-chromatiques', 'chasses-en-cours'];
const populating: Map<string, boolean> = new Map(sections.map(s => [s, false]));
const lastModified: Map<string, Set<string>> = new Map(sections.map(s => [s, new Set()]));
const queue: Map<string, Set<string>> = new Map(sections.map(section => [section, new Set()]));
let pokedexInitialized = false;



export type populatableSection = 'mes-chromatiques' | 'chasses-en-cours' | 'chromatiques-ami' | 'corbeille';
interface PopulateOptions {
  filtres?: ListeFiltres;
  ordre?: string;
  ordreReversed?: boolean;
}

export async function populateHandler(section: populatableSection, _ids?: string[], options: PopulateOptions = {}): Promise<PromiseSettledResult<string>[]> {
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

  switch (section) {
    case 'mes-chromatiques':
    case 'chromatiques-ami':
      await filterCards(section, options.filtres, ids);
      await orderCards(section, options.ordre, options.ordreReversed, ids);
  }

  populating.set(section, false);

  const newQueue = new Set([...(queue.get(section) || []), ...currentQueue]);
  queue.set(section, newQueue);
  if (newQueue.size > 0) return populateHandler(section, [...newQueue], options);

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
    let card = document.getElementById(`pokemon-card-${huntid}`) as pokemonCard | huntCard;

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
          cardsToCreate.push(card);
        }
      }
      // DANS LA BDD & AVEC CARTE = Éditer
      card.dataToContent();
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

  return results;
}


/** Initialise le Pokédex. */
export async function initPokedex() {
  if (pokedexInitialized) return;

  let gensToPopulate = [];
  const generations = Pokemon.generations;
  const names = await Pokemon.names();

  for (const gen of generations) {
    let monsToPopulate = [];
    const genConteneur = document.createElement('div');
    genConteneur.classList.add('pokedex-gen');

    for (let i = gen.start; i <= gen.end; i++) {
      const pkmn = document.createElement('span');
      const name = names[i];
      pkmn.classList.add('pkspr', 'pokemon', name + '-shiny');
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



////////////////////////
// Affiche l'application
export async function appDisplay(start = true)
{
  async function promiseInit() {
    // Nombre de cartes en tout (filtrées ou non)
    const keys = await shinyStorage.keys();
    const dbShiny = await Promise.all(keys.map(key => shinyStorage.getItem(key)));
    const numberOfCards = dbShiny.filter(shiny => !shiny.deleted).length;
    if (numberOfCards <= 0) {
      // 🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽
      // Placer ce message vide quelque part hors d'ici
      // 🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼🔼
      document.querySelector('#mes-chromatiques')!.classList.add('vide');
      document.querySelector('#mes-chromatiques .message-vide>.material-icons')!.innerHTML = 'cloud_off';
      document.querySelector('#mes-chromatiques .message-vide>span')!.innerHTML = 'Aucun Pokémon chromatique dans la base de données. Pour en ajouter, complétez une Chasse !';
      document.querySelector('.compteur')!.innerHTML = '0';
    }
    
    return;
  };
}