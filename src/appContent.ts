import { pokemonCard } from './components/pokemon-card/pokemonCard.js';
import { filterCards, orderCards } from './filtres.js';
import { huntedPokemon, initHunts } from './Hunt.js';
import { lazyLoad } from './lazyLoading.js';
import { dataStorage, huntStorage, shinyStorage } from './localforage.js';
import { notify, unNotify } from './notification.js';
import { loadAllImages, Params, timestamp2date, wait } from './Params.js';
import { frontendShiny, Pokemon } from './Pokemon.js';
import { openSpriteViewer } from './spriteViewer.js';
import { upgradeStorage } from './upgradeStorage.js';



declare global {
  interface Window {
    tempsChargementDebut: number,
    tempsChargementFin: number
  }
}

let populating = false;
let displaying = false;

export let lastPopulateAttempt: number = 0;
let lastModified: string[] = [];

/////////////////////////////////////////////////////////
// Peuple l'application à partir des données de indexedDB
export async function appPopulate(start: boolean = true, modified: string[] = []): Promise<string | undefined> {
  lastModified = modified;

  if (populating) return;
  populating = true;
  const thisAttempt = Date.now();

  try {
    // Prépare la liste principale
    let cardsToPopulate: pokemonCard[] = [];

    // Récupère la liste des huntid des shiny ayant déjà une carte
    const currentShinyIds = Array.from(document.querySelectorAll('#mes-chromatiques pokemon-card'))
                                 .map(shiny => String(shiny.getAttribute('huntid')));

    // Récupère la liste des huntid des shiny de la base de données
    const keys = await shinyStorage.keys();
    const dbShiny = await Promise.all(keys.map(key => shinyStorage.getItem(key)));
    const dbShinyIds = dbShiny.map(shiny => String(shiny.huntid));

    // Comparons les deux listes
    //// Shiny marqués supprimés dans la base de données (donc à ignorer)
    const toIgnore = dbShiny.filter(shiny => shiny.deleted).map(shiny => String(shiny.huntid));
    //// Shiny ayant une carte qui ont disparu de la base de données (donc à supprimer)
    const toDelete = currentShinyIds.filter(huntid => !dbShinyIds.includes(huntid) || (currentShinyIds.includes(huntid) && toIgnore.includes(huntid)));
    //// Shiny présents dans la base de données n'ayant pas de carte (donc à créer)
    const toCreate = dbShinyIds.filter(huntid => !currentShinyIds.includes(huntid));

    // Liste des huntid de tous les shiny à créer, éditer ou supprimer, ordonnée par huntid
    const allShinyIds = Array.from(new Set([...dbShinyIds, ...currentShinyIds]))
                             .sort((a, b) => Number(a) - Number(b));

    // On récupère la liste des filtres à appliquer aux cartes (undefined = filtres par défaut)
    let savedFiltres = await dataStorage.getItem('filtres');
    savedFiltres = (savedFiltres != null && savedFiltres.length > 0) ? savedFiltres : undefined;

    for (const huntid of allShinyIds) {
      // Si on doit supprimer cette carte, on la supprime puis on passe à la suivante
      if (toDelete.includes(huntid)) {
        const card = document.getElementById(`pokemon-card-${huntid}`);
        card?.remove();
        continue;
      }

      // Si cette carte est déjà marquée comme supprimée, on passe à la suivante
      if (toIgnore.includes(huntid)) {
        continue;
      }

      // Si cette carte doit être affichée
      else {
        let card;
        const shiny = await shinyStorage.getItem(huntid);
        const cardUpdateEvent = new CustomEvent('cardupdate', { detail: { shiny }});

        // Si on doit créer cette carte
        if (toCreate.includes(huntid)) {
          card = document.createElement('pokemon-card') as pokemonCard;
          card.dispatchEvent(cardUpdateEvent);
          cardsToPopulate.push(card);
        }

        // Si on doit éditer cette carte
        else if (modified.includes(huntid)) {
          card = document.getElementById(`pokemon-card-${huntid}`) as pokemonCard;
          if (card == null) throw `Card #${huntid} not found`;
          card.dispatchEvent(cardUpdateEvent);
        }
      }
    }

    await filterCards();
    await orderCards();

    // Peuple les éléments après la préparation (pour optimiser le temps d'exécution)
    //// Liste principale
    {
      const conteneur = document.querySelector('#mes-chromatiques>.section-contenu')!;
      for (const card of cardsToPopulate) {
        conteneur.appendChild(card);
        lazyLoad(card);
      }
    }

    // 🔽🔽🔽 Seulement au lancement de l'appli 🔽🔽🔽
    if (start) {
      // Peuple les chasses en cours
      await initHunts();

      // Prépare le Pokédex
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
          pkmn.addEventListener('click', event => openSpriteViewer(i, event));
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

    else {
      // On vérifie si des requêtes plus récentes de populate ont été faites
      if (lastPopulateAttempt > thisAttempt) {
        populating = false;
        return appPopulate(false, lastModified);
      } else {
        lastModified.length = 0;
      }
    }

    await filterCards();
    await orderCards();

    populating = false;
    return '[:)] Liste de Pokémon chromatiques prête !';
  }
  catch(error) {
    populating = false;
    console.error('[:(] Erreur critique de chargement');
    throw error;
  }
}



////////////////////////
// Affiche l'application
export async function appDisplay(start = true)
{
  if (displaying) return;
  displaying = true;

  let listeImages = [`./ext/pokesprite.png`];

  async function promiseInit() {
    // Nombre de cartes en tout (filtrées ou non)
    const keys = await shinyStorage.keys();
    const dbShiny = await Promise.all(keys.map(key => shinyStorage.getItem(key)));
    const numberOfCards = dbShiny.filter(shiny => !shiny.deleted).length;
    if (numberOfCards <= 0) {
      document.querySelector('#mes-chromatiques')!.classList.add('vide');
      document.querySelector('#mes-chromatiques .message-vide>.material-icons')!.innerHTML = 'cloud_off';
      document.querySelector('#mes-chromatiques .message-vide>span')!.innerHTML = 'Aucun Pokémon chromatique dans la base de données. Pour en ajouter, complétez une Chasse !';
      document.querySelector('.compteur')!.innerHTML = '0';
    }
    
    document.getElementById('version-fichiers')!.innerHTML = timestamp2date(await dataStorage.getItem('version-fichiers'));
    if (start) {
      window.tempsChargementFin = Date.now();
      document.getElementById('version-tempschargement')!.innerHTML = String(window.tempsChargementFin - window.tempsChargementDebut);
    }
    
    return;
  };

  try {
    if (start) await Promise.all([loadAllImages(listeImages), promiseInit()]);
    else await promiseInit();

    if (start) {
      // Efface l'écran de chargement
      const loadScreen = document.getElementById('load-screen')!;
      const byeLoad = loadScreen.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], {
        duration: 100,
        easing: Params.easingStandard,
        fill: 'forwards'
      });
      byeLoad.onfinish = loadScreen.remove;
    }

    displaying = false;
    return '[:)] Affichage du Rémidex réussi !';
  } catch (error) {
    displaying = false;
    console.error(error);
    throw error;
  }
}