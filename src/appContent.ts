import { Hunt } from './Hunt.js';
import { Pokemon } from './Pokemon.js';
import { Shiny } from './Shiny.js';
import { huntCard } from './components/hunt-card/huntCard.js';
import { shinyCard } from './components/shiny-card/shinyCard.js';
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
      elementName = 'shiny-card';
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
        cardsToCreate.push(card);
      } else {
        // DANS LA BDD & AVEC CARTE = Éditer
        await card.dataToContent();
      }
    }

    return Promise.resolve(huntid);
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
    genConteneur.classList.add('pokedex-gen', 'surface', 'variant', 'elevation-0');
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
  }

  // Peuple le compteur total de Pokémon dans le Pokédex
  const totalPokemon = generations[generations.length - 1].end;
  const totalCounter = section.querySelector('.compteur > .total');
  if (totalCounter) totalCounter.innerHTML = String(totalPokemon);

  pokedexInitialized = true;
  return;
}


export async function cleanUpRecycleBin() {
  const month = 1000 * 60 * 60 * 24 * 30;
  try {
    await shinyStorage.ready();
    const keys = await shinyStorage.keys();
    await Promise.all(
      keys.map(async key => {
        const shiny = new Shiny(await shinyStorage.getItem(key));
        if (shiny.destroy && shiny.lastUpdate + month < Date.now()) {
          return await shinyStorage.removeItem(shiny.huntid);
        }
      })
    );
  } catch (error) {
    console.error(`Erreur pendant le nettoyage de la corbeille.`, error);
  }
}