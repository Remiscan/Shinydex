import { Pokemon } from './mod_Pokemon.js';
import { createCard, toggleNotes } from './mod_pokemonCard.js';
import { filterCards, orderCards, reverseOrder, deferCards, deferMonitor } from './mod_filtres.js';
import { Params, loadAllImages, wait, version2date } from './mod_Params.js';
import { openSpriteViewer } from './mod_spriteViewer.js';
import { editHunt, initHunts } from './mod_Hunt.js';
import { notify, unNotify } from './mod_notification.js';

let longClic = false;

/////////////////////////////////////////////////////////
// Peuple l'application à partir des données de indexedDB
export async function appPopulate(start = true)
{
  try {
    // Prépare la liste principale
    let cardsToPopulate = [];
    if (!start) {
      // Vide la liste principale
      Array.from(document.querySelectorAll('#mes-chromatiques .pokemon-card')).forEach(c => c.remove());
    }

    let data = await shinyStorage.keys();
    data = await Promise.all(data.map(key => shinyStorage.getItem(key)));
    data = data.filter(shiny => !shiny.deleted);
    data = data.sort((a, b) => b.id - a.id);

    if (data.length == 0) {
      document.querySelector('#mes-chromatiques').classList.add('vide');
      document.querySelector('#mes-chromatiques .message-vide>.material-icons').innerHTML = 'cloud_off';
      document.querySelector('#mes-chromatiques .message-vide>span').innerHTML = 'Aucun Pokémon chromatique dans la base de données. Pour en ajouter, complétez une Chasse !';
    }

    for (const [ordre, pokemon] of data.entries()) {
      const card = await createCard(pokemon, ordre);
      card.classList.add('defer');

      // Active le long clic pour éditer
      card.addEventListener('click', () => { if (!longClic) toggleNotes(card.id); longClic = false; });
      card.addEventListener('mousedown', async event => { if (event.button != 0) return; makeEdit(event, card); }); // souris
      card.addEventListener('touchstart', async event => { makeEdit(event, card); }, { passive: true }); // toucher

      cardsToPopulate.push(card);
    };

    // Peuple les éléments après la préparation (pour optimiser le temps d'exécution)
    //// Liste principale
    let conteneur = document.querySelector('#mes-chromatiques>.section-contenu');
    for (let card of cardsToPopulate) { conteneur.appendChild(card); }
    //// Chasses en cours
    await initHunts();

    if (!start) return;

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

    // Peuple le Pokédex (seulement au lancement)
    conteneur = document.querySelector('#pokedex>.section-contenu');
    for (let genConteneur of gensToPopulate) { conteneur.appendChild(genConteneur); }

    return '[:)] L\'application est prête !';
  }
  catch(error) {
    console.error('[:(] Erreur critique de chargement');
    throw error;
  }
}



////////////////////////
// Affiche l'application
export async function appDisplay(start = true)
{
  const loadScreen = (start == true) ? document.getElementById('load-screen') : null;
  const version = await dataStorage.getItem('version-bdd');
  const onlineBackup = await dataStorage.getItem('online-backup');
  const spritePrefix = onlineBackup ? '' : 'data-';
  const listeImages = [`./ext/pokesprite.png`, `./sprites--${spritePrefix}${version}.php`];
  document.documentElement.style.setProperty('--link-sprites', `url('./sprites--${spritePrefix}${version}.php')`);

  async function promiseInit() {
    const savedFiltres = JSON.parse(await dataStorage.getItem('filtres'));
    if (savedFiltres != null && savedFiltres.length > 0)
    {
      await filterCards(savedFiltres);
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
      await filterCards();

    const savedOrdre = JSON.parse(await dataStorage.getItem('ordre'));
    if (savedOrdre != null)
    {
      await orderCards(savedOrdre);
      Array.from(document.querySelectorAll('input[name=ordre]')).forEach(input => {
        if (input.id == 'ordre-' + savedOrdre) input.checked = true;
      });
    }
    else
      await orderCards();

    const savedOrdreReverse = await dataStorage.getItem('ordre-reverse');
    if (savedOrdreReverse == true)
      await reverseOrder();

    ['mes-chromatiques', 'pokedex', 'chasses-en-cours'].forEach(section => deferCards(section));
    
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

    if (!start) return;
    
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

    return '[:)] Bienvenue sur le Rémidex !';
  }
  catch(error) {
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