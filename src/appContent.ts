import { pokemonCard } from './components/pokemon-card/pokemonCard.js';
import { filterCards, ListeFiltres, orderCards } from './filtres.js';
import { lazyLoad } from './lazyLoading.js';
import { dataStorage, huntStorage, localForageAPI, shinyStorage } from './localforage.js';
import { Notif } from './notification.js';
import { Pokemon } from './Pokemon.js';
import { openSpriteViewer } from './spriteViewer.js';



const sections = ['mes-chromatiques', 'chasses-en-cours'];
const populating: Map<string, boolean> = new Map(sections.map(s => [s, false]));
const lastModified: Map<string, Set<string>> = new Map(sections.map(s => [s, new Set()]));
let pokedexInitialized = false;



interface PopulateOptions {
  modified?: string[];
  filtres?: ListeFiltres;
}



export async function populateFromData(section: 'mes-chromatiques' | 'chasses-en-cours', options: PopulateOptions = {}): Promise<PromiseSettledResult<any>[]> {
  lastModified.set(section, new Set([...(lastModified.get(section) ?? []), ...(options.modified ?? [])]));

  if (populating.get(section)) return Promise.allSettled([Promise.resolve()]);
  populating.set(section, true);

  let cardsToPopulate: pokemonCard[] | huntCard[] = [];

  let elementName: string; // Nom de l'élément de carte
  let dataStore: localForageAPI; // Base de données
  let filtres: ListeFiltres | undefined; // Filtres à appliquer aux cartes
  let eventName: string; // Nom de l'événement de mise à jour d'une carte
  switch (section) {
    case 'mes-chromatiques':
      elementName = 'pokemon-card';
      dataStore = shinyStorage;
      filtres = await dataStorage.getItem('filtres');
      eventName = 'shinyupdate';
    break;
    case 'chasses-en-cours':
      elementName = 'hunt-card';
      dataStore = huntStorage;
      eventName = 'huntupdate';
    break;
  }

  // Liste des huntid ayant déjà une carte
  const currentPkmnIds = Array.from(document.querySelectorAll(`#${section} ${elementName}`))
                              .map(pkmn => pkmn.getAttribute('huntid'));

  // Liste des huntid stockés dans la base de données locale
  const keys = await dataStore.keys();
  const dbPkmn = await Promise.all(keys.map(key => dataStore.getItem(key)));
  const dbPkmnIds = dbPkmn.map(pkmn => pkmn.huntid);

  // Comparons les deux listes
  // - Shiny marqués supprimés dans la base de données (donc à ignorer)
  const toIgnore = dbPkmn.filter(pkmn => pkmn.deleted).map(pkmn => pkmn.huntid);
  // - Shiny ayant une carte qui ont disparu de la base de données (donc à supprimer)
  const toDelete = currentPkmnIds.filter(huntid => !dbPkmnIds.includes(huntid) || (currentPkmnIds.includes(huntid) && toIgnore.includes(huntid)));
  // - Shiny présents dans la base de données n'ayant pas de carte (donc à créer)
  const toCreate = dbPkmnIds.filter(huntid => !currentPkmnIds.includes(huntid));

  // Liste des huntid de toutes les cartes à créer, éditer ou supprimer
  const allPkmnIds = Array.from(new Set([...dbPkmnIds, ...currentPkmnIds]));

  // Traitons les cartes :

  let results = await Promise.allSettled(allPkmnIds.map(huntid => {
    // Si la carte existe déjà et doit être supprimée, on la supprime puis on passe à la suivante
    if (toDelete.includes(huntid)) {
      const card = document.getElementById(`pokemon-card-${huntid}`);
      card?.remove();
      return Promise.resolve(huntid);
    }

    // Si la carte n'existe pas encore mais que le Pokémon est marqué comme supprimé, on ne fait rien et on passe à la suivante
    else if (toIgnore.includes(huntid)) {
      return Promise.resolve(huntid);
    }

    // Si la carte (existante ou non) doit être affichée
    else {
      let card;
      const pkmn = dataStore.getItem(huntid);
      const updateEvent = new CustomEvent(eventName, { detail: { pkmn }});

      // Si la carte doit être créée
      if (toCreate.includes(huntid)) {
        card = document.createElement('pokemon-card') as pokemonCard | huntCard;
        card.dispatchEvent(updateEvent);
        cardsToPopulate.push(card);
        return Promise.resolve(huntid);
      }

      // Si la carte doit être modifiée
      else if ('modified' in options && options.modified?.includes(huntid)) {
        card = document.getElementById(`${elementName}-${huntid}`) as pokemonCard | huntCard;
        if (card == null) throw `Carte #${huntid} inexistante`;
        card.dispatchEvent(updateEvent);
        return Promise.resolve(huntid);
      }
    }
  }));

  // Filtrons et ordonnons les cartes :

  if (section !== 'chasses-en-cours') {
    await filterCards(section);
    await orderCards(section);
  }

  // Plaçons les cartes sur la page
  // (après la préparation pour optimiser le temps d'exécution)
  const conteneur = document.querySelector(`#${section} > .section-contenu`)!;
  for (const card of cardsToPopulate) {
    conteneur.appendChild(card);
    lazyLoad(card);
  }

  populating.set(section, false);

  // Si certains Pokémon ont été modifiés depuis que l'exécution a commencé, on relance la fonction sur ces Pokémon uniquement
  const newModified = [...(lastModified.get(section) || [])].filter(huntid => !((options.modified || []).includes(huntid)));
  if (newModified.length > 0) {
    const newOptions = Object.assign(options);
    newOptions.modified = newModified;
    results = [...results, ...await populateFromData(section, newOptions)];
  }

  return results;
}


/** Initialise le Pokédex. */
export async function initPokedex() {
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
          openSpriteViewer(i, event);
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