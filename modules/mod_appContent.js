import { Pokemon } from './mod_Pokemon.js';
import { createCard, toggleNotes } from './mod_pokemonCard.js';
import { filterCards, orderCards, reverseOrder, deferCards, deferMonitor } from './mod_filtres.js';
import { Params, loadAllImages, wait, version2date } from './mod_Params.js';
import { openSpriteViewer } from './mod_spriteViewer.js';
import { updateHunt } from './mod_Hunt.js';

/////////////////////////////////////////////////////////
// Peuple l'application à partir des données de indexedDB
export async function appPopulate(start = true)
{
  try {
    // Liste principale
    if (!start) {
      // Vider la liste principale
      Array.from(document.querySelectorAll('#mes-chromatiques .pokemon-card')).forEach(c => c.remove());
    }

    let data = await shinyStorage.keys();
    data = data.map(async key => { return await shinyStorage.getItem(key) });
    data = await Promise.all(data);
    let conteneur = document.querySelector('#mes-chromatiques>.section-contenu');

    if (data.length == 0) {
      document.querySelector('#mes-chromatiques').classList.add('vide');
      document.querySelector('#mes-chromatiques .message-vide>.material-icons').innerHTML = 'cloud_off';
      document.querySelector('#mes-chromatiques .message-vide>span').innerHTML = 'Aucun Pokémon chromatique dans la base de données. Pour en ajouter, complétez une Chasse !';
    }

    for (const pokemon of data) {
      const card = await createCard(pokemon);
      card.addEventListener('click', () => toggleNotes(card.id));
      card.classList.add('defer');
      conteneur.appendChild(card);

      // Active le long clic pour éditer
      let longClic;
      let tresLongClic;
      // - à la souris
      card.addEventListener('mousedown', event => {
        if (event.button == 0)
        {
          clearTimeout(longClic);
          longClic = setTimeout(() => { card.classList.add('editing'); }, 1000);
          tresLongClic = setTimeout(async () => {
            card.classList.remove('editing');
            await updateHunt(parseInt(card.id.replace('pokemon-card-', ''))); 
          }, 3000);
      
          card.addEventListener('mouseup', () => { clearTimeout(longClic); clearTimeout(tresLongClic); card.classList.remove('editing'); });
          card.addEventListener('mouseout', () => { clearTimeout(longClic); clearTimeout(tresLongClic); card.classList.remove('editing'); });
        }
      });
      // - au toucher
      card.addEventListener('touchstart', event => {
        clearTimeout(longClic);
        longClic = setTimeout(() => { card.classList.add('editing'); }, 1000);
        tresLongClic = setTimeout(async () => {
          card.classList.remove('editing');
          await updateHunt(parseInt(card.id.replace('pokemon-card-', ''))); 
        }, 3000);
    
        const clear = () => { clearTimeout(longClic); clearTimeout(tresLongClic); card.classList.remove('editing'); };
        card.addEventListener('touchmove', clear, { passive: true });
        card.addEventListener('touchend', clear);
        card.addEventListener('touchcancel', clear);
      }, { passive: true });
    };

    if (!start) return;

    // Pokédex
    conteneur = document.querySelector('#pokedex>.section-contenu');
    const generations = Pokemon.generations;
    for (const gen of generations) {
      const genConteneur = document.createElement('div');
      genConteneur.classList.add('pokedex-gen');
      for (let i = gen.start; i <= gen.end; i++) {
        const pkmn = document.createElement('span');
        const pokemon = await pokemonData.getItem(String(i));
        pkmn.classList.add('pkspr', 'pokemon', pokemon.name + '-shiny');
        pkmn.dataset.dexid = i;
        pkmn.addEventListener('click', event => openSpriteViewer(i, event));
        genConteneur.appendChild(pkmn);
      }
      if (gen.num > 2) genConteneur.classList.add('defer');
      conteneur.appendChild(genConteneur);
    }

    return '[:)] L\'application est prête !';
  } catch(error) {
    console.error('[:(] Erreur critique de chargement');
    throw error;
  }
}



////////////////////////
// Affiche l'application
export async function appDisplay(start = true)
{
  const loadScreen = (start == true) ? document.getElementById('load-screen') : null;
  const version = await dataStorage.getItem('version');
  const listeImages = [`./pokesprite/pokesprite.png`, `./sprites--${version}.php`];
  document.documentElement.style.setProperty('--link-sprites', `url('./sprites--${version}.php')`);

  const promiseImages = loadAllImages(listeImages);
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

    const savedOrdreReverse = JSON.parse(await dataStorage.getItem('ordre-reverse'));
    if (savedOrdreReverse == true)
      await reverseOrder();

    deferCards();
    
    document.getElementById('version-fichiers').innerHTML = version2date(await dataStorage.getItem('version-fichiers'));
    document.getElementById('version-bdd').innerHTML = version2date(await dataStorage.getItem('version-bdd'));
    if (start) {
      window.tempsFin = Date.now();
      document.getElementById('version-tempschargement').innerHTML = Number(window.tempsFin - window.tempsDebut);
    }
    
    return;
  };

  try {
    if (start) await Promise.all([promiseImages, promiseInit()]);
    else await promiseInit();

    // Surveille le defer-loader pour charger le reste des shiny quand il apparaît à l'écran
    const deferLoader = document.querySelector('.defer-loader');
    const observer = new IntersectionObserver(deferMonitor, {
      threshold: 1,
    });
    observer.observe(deferLoader);

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
    }

    return '[:)] Bienvenue sur le Rémidex !';
  }
  catch(error) {
    console.error(error);
  }
}