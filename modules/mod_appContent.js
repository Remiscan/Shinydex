import { Pokemon } from './mod_Pokemon.js';
import { createCard, toggleNotes } from './mod_pokemonCard.js';
import { filterCards, orderCards, filterDex, deferCards, deferMonitor } from './mod_filtres.js';
import { Params, loadAllImages, wait, version2date, getVersionSprite } from './mod_Params.js';
import { openSpriteViewer } from './mod_spriteViewer.js';
import { editHunt, initHunts } from './mod_Hunt.js';
import { notify, unNotify } from './mod_notification.js';

let longClic = false;
let populating = false;
let displaying = false;

export let populateAttemptsVersions = [];
export let populateAttemptsObsolete = [];

/////////////////////////////////////////////////////////
// Peuple l'application à partir des données de indexedDB
export async function appPopulate(start = true, obsolete = [], versionSprite = 0)
{
  if (populating) return;
  populating = true;

  try {
    // Prépare la liste principale
    let cardsToPopulate = [];

    // Récupère la liste des huntid des shiny ayant déjà une carte
    const currentShiny = Array.from(document.querySelectorAll('#mes-chromatiques .pokemon-card'))
                              .map(shiny => String(shiny.id.replace('pokemon-card-', '')));

    // Récupère la liste des huntid des shiny de la base de données
    let keys = await shinyStorage.keys();
    keys = await Promise.all(keys.map(key => shinyStorage.getItem(key)));
    const dbShiny = keys.map(shiny => String(shiny.huntid));

    // Comparons les deux listes
    //// Shiny marqués supprimés dans la base de données (donc à ignorer)
    const toIgnore = keys.filter(shiny => shiny.deleted).map(shiny => String(shiny.huntid));
    //// Shiny ayant une carte qui ont disparu de la base de données (donc à supprimer)
    const toDelete = currentShiny.filter(huntid => !dbShiny.includes(huntid) || (currentShiny.includes(huntid) && toIgnore.includes(huntid)));
    //// Shiny présents dans la base de données n'ayant pas de carte (donc à créer)
    const toCreate = dbShiny.filter(huntid => !currentShiny.includes(huntid));

    // Liste des huntid de tous les shiny à créer, éditer ou supprimer, ordonnée par huntid
    const allShiny = Array.from(new Set([...dbShiny, ...currentShiny]))
                          .sort((a, b) => a - b);

    // On récupère la liste des filtres à appliquer aux cartes (undefined = filtres par défaut)
    let savedFiltres = await dataStorage.getItem('filtres');
    savedFiltres = (savedFiltres != null && savedFiltres.length > 0) ? savedFiltres : undefined;

    const futureVersionSprite = versionSprite || getVersionSprite();

    let ordre = 0; // ordre du sprite dans le spritesheet
    for (const huntid of allShiny) {
      // Si on doit supprimer cette carte
      if (toDelete.includes(huntid)) {
        const card = document.getElementById(`pokemon-card-${huntid}`);
        card.remove();
      }

      // Si cette carte est déjà marquée comme supprimée,
      // si cette suppression précède la génération du spritesheet, on n'incrémente pas ordre
      if (toIgnore.includes(huntid)) {
        const pokemon = await shinyStorage.getItem(String(huntid));
        if (pokemon['last_update'] <= futureVersionSprite) continue;
      }

      // Si cette carte doit être affichée
      else {
        const pokemon = await shinyStorage.getItem(String(huntid));
        let card;

        // Si on doit créer cette carte
        if (toCreate.includes(huntid)) {
          card = await createCard(pokemon, ordre);
          // Si le spritesheet est obsolète à cause de cette carte, on affichera
          // le sprite seulement après la génération du spritesheet (supprimer --ordre-sprite = sprite masqué)
          // (après génération du spritesheet, card.dataset.ordreSprite deviendra --ordre-sprite)
          if (!start && obsolete.includes(huntid)) {
            card.style.removeProperty('--ordre-sprite');
            card.dataset.ordreSprite = ordre;
          }
          cardsToPopulate.push(await filterCards(savedFiltres, [card]));
        }

        // Si on doit éditer cette carte
        else {
          const oldCard = document.getElementById(`pokemon-card-${huntid}`);
          const oldOrdre = oldCard.style.getPropertyValue('--ordre-sprite'); // ancien ordre du sprite
          const wasObsolete = (oldCard.dataset.obsolete != null); // spritesheet obsolète à cause de cette carte

          let newCard = await createCard(pokemon, oldOrdre || ordre); // nouvel ordre = oldOrdre || ordre pour le cas où oldOrdre non défini
          if (obsolete.includes(huntid) || wasObsolete) newCard.dataset.obsolete = true;
          if (oldCard.classList.contains('on')) newCard.classList.add('on');
          newCard = await filterCards(savedFiltres, [newCard]);

          // Si le spritesheet est obsolète à cause de cette carte... (cf cas précédent)
          if (newCard.dataset.obsolete != null) {
            newCard.style.removeProperty('--ordre-sprite');
            newCard.dataset.ordreSprite = ordre;
          }
          oldCard.outerHTML = newCard.outerHTML;
          card = document.getElementById(`pokemon-card-${huntid}`); // on récupère la carte mise à jour pour détecter le clic
        }

        // Active le long clic pour éditer
        card.addEventListener('click', () => { if (!longClic) toggleNotes(card.id); longClic = false; });
        card.addEventListener('mousedown', async event => { if (event.button != 0) return; makeEdit(event, card); }); // souris
        card.addEventListener('touchstart', async event => { makeEdit(event, card); }, { passive: true }); // toucher
      }

      ordre++;
    }

    let unfilteredCards;
    if (start) {
      // On récupère les cartes non filtrées pour filtrer le Pokédex
      unfilteredCards = await filterCards(null, cardsToPopulate);

      // On ordonne les cartes
      const savedOrdreReverse = await dataStorage.getItem('ordre-reverse');
      let savedOrdre = await dataStorage.getItem('ordre');
      savedOrdre = (savedOrdre != null) ? savedOrdre : undefined;
      cardsToPopulate = await orderCards(savedOrdre, savedOrdreReverse, cardsToPopulate);
    }

    // Peuple les éléments après la préparation (pour optimiser le temps d'exécution)
    //// Liste principale
    let conteneur = document.querySelector('#mes-chromatiques>.section-contenu');
    for (let card of cardsToPopulate) { conteneur.appendChild(card); }

    if (!start) {
      populating = false;

      // On vérifie si des requêtes plus récentes de populate ont été faites
      const lastPopulateAttempt = Math.max(...populateAttemptsVersions);
      if (lastPopulateAttempt > futureVersionSprite)
        return appPopulate(false, populateAttemptsObsolete, lastPopulateAttempt);
      else {
        populateAttemptsVersions.length = 0;
        populateAttemptsObsolete.length = 0;
      }
      return;
    }

    // 🔽🔽🔽 Seulement au lancement de l'appli 🔽🔽🔽

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
        pkmn.dataset.dexid = i;
        pkmn.addEventListener('click', event => openSpriteViewer(i, event));
        monsToPopulate.push(pkmn);
      }
      genConteneur.classList.add('defer');

      for (let pkmn of monsToPopulate) { genConteneur.appendChild(pkmn); }
      gensToPopulate.push(genConteneur);
    }

    // Peuple le Pokédex
    conteneur = document.querySelector('#pokedex>.section-contenu');
    for (let genConteneur of gensToPopulate) { conteneur.appendChild(genConteneur); }
    filterDex(unfilteredCards);

    populating = false;
    return '[:)] L\'application est prête !';
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

  const loadScreen = (start == true) ? document.getElementById('load-screen') : null;
  const version = await dataStorage.getItem('version-bdd');
  let listeImages = [`./ext/pokesprite.png`];
  if (start) {
    listeImages.push(`./sprites--${version}.php`);
    document.documentElement.style.setProperty('--link-sprites', `url('./sprites--${version}.php')`);
  }

  async function promiseInit() {
    const savedFiltres = await dataStorage.getItem('filtres');
    if (savedFiltres != null && savedFiltres.length > 0)
    {
      if (!start) await filterCards(savedFiltres);
      Array.from(document.querySelectorAll('input.filtre')).forEach(input => {
        let correspondances = 0;
        for (const filtre of savedFiltres) {
          const alterFiltres = filtre.split('|');
          if (alterFiltres.includes(input.value)) correspondances++;
        }
        if (correspondances > 0) input.checked = true;
        else input.checked = false;
      });
    }
    else
      if (!start) await filterCards();
    if (!start) filterDex();

    const savedOrdreReverse = await dataStorage.getItem('ordre-reverse');
    let savedOrdre = await dataStorage.getItem('ordre');
    savedOrdre = (savedOrdre != null) ? savedOrdre : undefined;
    if (!start) await orderCards(savedOrdre, savedOrdreReverse);
    if (savedOrdre != null)
    {
      Array.from(document.querySelectorAll('input[name=ordre]')).forEach(input => {
        if (input.id == 'ordre-' + savedOrdre) input.checked = true;
      });
    }

    ['mes-chromatiques', 'pokedex', 'chasses-en-cours'].forEach(section => deferCards(section));

    // Nombre de cartes affichées
    const numberOfCards = Array.from(document.querySelectorAll('#mes-chromatiques .pokemon-card')).length;
    if (numberOfCards <= 0) {
      document.querySelector('#mes-chromatiques').classList.add('vide');
      document.querySelector('#mes-chromatiques .message-vide>.material-icons').innerHTML = 'cloud_off';
      document.querySelector('#mes-chromatiques .message-vide>span').innerHTML = 'Aucun Pokémon chromatique dans la base de données. Pour en ajouter, complétez une Chasse !';
      document.querySelector('.compteur').innerHTML = 0;
    }
    
    document.getElementById('version-fichiers').innerHTML = version2date(await dataStorage.getItem('version-fichiers'));
    document.getElementById('version-bdd').innerHTML = version2date(await dataStorage.getItem('version-bdd'));
    if (start) {
      window.tempsFin = Date.now();
      document.getElementById('version-tempschargement').innerHTML = Number(window.tempsFin - window.tempsDebut);
    }
    
    return;
  };

  try {
    if (start) await Promise.all([loadAllImages(listeImages), promiseInit()]);
    else await promiseInit();

    // Surveille le defer-loader pour charger le reste des shiny quand il apparaît à l'écran
    const deferLoaders = Array.from(document.querySelectorAll('.defer-loader'));
    deferLoaders.forEach(deferLoader => {
      const observer = new IntersectionObserver(deferMonitor, {
        threshold: 1
      });
      observer.observe(deferLoader);
    });

    if (!start) { displaying = false; return; }
    
    // Efface l'écran de chargement
    const byeLoad = loadScreen.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], {
      duration: 100,
      easing: Params.easingStandard,
      fill: 'forwards'
    });
    byeLoad.onfinish = () => {
      loadScreen.remove();
      // Try to reduce TTFB for Pokédex sprites
      loadAllImages(['./sprites-home/small/poke_capture_0670_005_fo_n_00000000_f_n.png']).catch(() => {});
    }

    displaying = false;
    return '[:)] Bienvenue sur le Rémidex !';
  }
  catch(error) {
    displaying = false;
    console.error(error);
  }
}



///////////////////////////////////////////////////////////////////
// Créer une chasse pour éditer un shiny au long clic sur une carte
async function makeEdit(event, card) {
  let act = true;

  const editIcon = card.querySelector('.edit-icon');
  let appear = editIcon.animate([
    { opacity: '0' },
    { opacity: '1' }
  ], {
    easing: Params.easingStandard,
    duration: 150,
    fill: 'forwards'
  });
  appear.pause();
  const circle = editIcon.querySelector('.edit-icon circle');
  let anim = circle.animate([
    { strokeDashoffset: '157' },
    { strokeDashoffset: '0' }
  ], {
    easing: 'linear',
    duration: 1000
  });
  anim.pause();

  const clear = () => {
    act = false;
    appear.cancel(); anim.cancel();
    setTimeout(() => { longClic = false; }, 50)
  };

  if (event.type == 'touchstart') {
    card.addEventListener('touchmove', clear, { passive: true });
    card.addEventListener('touchend', clear);
    card.addEventListener('touchcancel', clear);
  } else {
    card.addEventListener('mouseup', clear);
    card.addEventListener('mouseout', clear);
  }
  await wait(500);

  if (!act) return;
  longClic = true;

  appear.play();
  await new Promise(resolve => appear.addEventListener('finish', resolve));
  anim.play();
  await new Promise(resolve => anim.addEventListener('finish', resolve));

  if (!act) return;
  card.classList.remove('editing');
  let ready = await editHunt(parseInt(card.id.replace('pokemon-card-', '')));
  ready = (ready != false);
  appear.cancel(); anim.cancel();
  if (ready) longClic = false;
}


//////////////////////////////////////////////////////////
// Peuple l'application avec les données d'un fichier JSON
export async function json2import(file) {
  const reader = new FileReader();
  reader.addEventListener('load', async event => {
    const importedData = JSON.parse(event.target.result);
    if (!'shiny' in importedData || !'hunts' in importedData)
      throw 'Le fichier importé est incorrect.';

    await shinyStorage.ready();
    await Promise.all(
      importedData.shiny.map(shiny => shinyStorage.setItem(String(shiny.id), shiny))
    );
    await huntStorage.ready();
    await Promise.all(
      importedData.hunts.map(hunt => huntStorage.setItem(String(hunt.id), hunt))
    );

    notify('Mise à jour des données...', '', 'loading', () => {}, 999999999);
    await appPopulate(false);
    await appDisplay(false);
    await wait(1000);
    unNotify();
  });
  reader.readAsText(file);
}