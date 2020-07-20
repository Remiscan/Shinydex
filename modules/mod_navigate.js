import { Params, loadAllImages, wait } from './mod_Params.js';
import { playEasterEgg, prepareEasterEgg } from './mod_easterEgg.js';
import { closeFiltres, openFiltres } from './mod_filtres.js';
import { closeSpriteViewer, openSpriteViewer } from './mod_spriteViewer.js';
import { getNames } from './mod_DexDatalist.js';

export let sectionActuelle = 'mes-chromatiques';
export const sections = ['mes-chromatiques', 'pokedex', 'chasses-en-cours', 'parametres', 'a-propos'];

export async function navigate(sectionCible, position = 0, historique = true)
{
  if (sectionActuelle == sectionCible) return Promise.resolve();

  const ancienneSection = document.getElementById(sectionActuelle);
  const nouvelleSection = document.getElementById(sectionCible);

  // Pré-chargement des images de la nouvelle section
  const listeImages = ['./ext/pokesprite.png'];
  if (sectionCible == 'mes-chromatiques') {
    const versionSprite = document.documentElement.style.getPropertyValue('--link-sprites').match(/[0-9]+/)[0];
    listeImages.push(`./sprites--${versionSprite}.php`, './images/iconsheet.png');
  }

  await Promise.all([loadAllImages(listeImages), loadVideo(sectionCible)]);
  await new Promise((resolve, reject) => {
    closeFiltres();

    // Préparation de l'easter-egg de la section 'à propos'
    if (sectionCible == 'a-propos' || (sectionCible == 'parametres' && Params.owidth >= Params.layoutPClarge))
      playEasterEgg();
    else
      setTimeout(prepareEasterEgg, 200);

    // Essaie de réduire le TTFB pour les sprites du Pokédex
    if (sectionCible == 'pokedex' || (sectionCible == 'mes-chromatiques' && Params.owidth >= Params.layoutPClarge))
      loadAllImages(['./sprites-home/small/poke_capture_0670_005_fo_n_00000000_f_n.png']).catch(() => {});

    if (historique)
      history.pushState({section: sectionCible}, '');

    // Animation du FAB
    const sectionsFabFilter = ['mes-chromatiques', 'pokedex'];
    const sectionsFabAdd = ['chasses-en-cours'];
    let animateFab = false;
    if (
      (sectionsFabFilter.includes(sectionActuelle) && sectionsFabAdd.includes(sectionCible))
      || (sectionsFabFilter.includes(sectionCible) && sectionsFabAdd.includes(sectionActuelle))
    ) animateFab = true;
    animateFabIcon(sectionCible, animateFab);

    sectionActuelle = sectionCible;

    document.querySelector('main').scroll(0, 0);
    document.body.dataset.sectionActuelle = sectionActuelle;

    // Disparition de l'indicateur de l'état du backup autour du bouton paramètres
    Array.from(document.querySelectorAll('sync-progress[finished]'))
    .forEach(sp => { sp.removeAttribute('state'); sp.removeAttribute('finished'); });

    if (Params.owidth >= Params.layoutPClarge) return resolve();

    // Animation d'apparition de la nouvelle section
    // (sur PC, géré par CSS, d'où le return précédent)
    const apparitionSection = nouvelleSection.animate([
      { transform: 'translate3D(0, 20px, 0)', opacity: '0' },
      { transform: 'translate3D(0, 0, 0)', opacity: '1' }
    ], {
        easing: Params.easingDecelerate,
        duration: 200,
        fill: 'both'
    });

    apparitionSection.addEventListener('finish', resolve);
  });

  if (sectionCible == 'chasses-en-cours')
    getNames();

  const toUndefer = Array.from(ancienneSection.querySelectorAll('.defered'));
  if (toUndefer.length != 0) ancienneSection.classList.remove('defered');
  Array.from(ancienneSection.querySelectorAll('.defered')).forEach(defered => defered.classList.replace('defered', 'defer'));
}



// Anime l'icône du FAB selon la section en cours
function animateFabIcon(sectionCible, animations = false) {
  const fab = document.querySelector('.fab');
  const fabIcon = fab.querySelector('.material-icons');
  const animFabIcon = { start: null, end: null };

  if (!animations) {
    if (sectionCible == 'chasses-en-cours') fab.classList.add('add');
    else fab.classList.remove('add');
    return;
  }

  // On joue les animations
  let deg = (sectionCible == 'chasses-en-cours') ? '90deg' : '-90deg';
  animFabIcon.start = fabIcon.animate([
    { transform: 'translate3D(0, 0, 0) rotate(0)', opacity: '1' },
    { transform: 'translate3D(0, 0, 0) rotate(' + deg + ')', opacity: '0' }
  ], {
    easing: Params.easingAccelerate,
    duration: 100,
    fill: 'forwards'
  });

  animFabIcon.start.addEventListener('finish', () => {
    if (sectionCible == 'chasses-en-cours') fab.classList.add('add');
    else fab.classList.remove('add');
    
    deg = (sectionCible == 'chasses-en-cours') ? '-90deg' : '+90deg';
    animFabIcon.end = fabIcon.animate([
      { transform: 'translate3D(0, 0, 0) rotate(' + deg + ')', opacity: '0' },
      { transform: 'translate3D(0, 0, 0) rotate(0)', opacity: '1' }
    ], {
      easing: Params.easingDecelerate,
      duration: 100,
      fill: 'backwards'
    });

    animFabIcon.end.addEventListener('finish', () => {
      animFabIcon.start.cancel();
      animFabIcon.end.cancel();
    });
  });
}



// Précharge la vidéo de l'easter egg
async function loadVideo(sectionCible) {
  if (sectionCible == 'a-propos' || (sectionCible == 'parametres' && Params.owidth >= Params.layoutPClarge))
    await fetch('./images/instinct.mp4');
  return;
}



// Permet la navigation avec le bouton retour du navigateur
window.addEventListener('popstate', event => {
  if (typeof document.body.dataset.viewerOpen != 'undefined' || typeof document.body.dataset.viewerLoading != 'undefined')
  {
    closeSpriteViewer();
  }
  else if (event.state)
  {
    const section = event.state.section;
    if (document.querySelector('.menu-filtres').classList.contains('on'))
      closeFiltres();
    if (section != sectionActuelle)
    {
      switch(section)
      {
        case 'sprite-viewer':
          openSpriteViewer(event.state.dexid, { clientX: 0, clientY: 0 });
          break;
        case 'menu-filtres':
          openFiltres(false);
          break;
        default:
          navigate(section, 0, false);
      }
    }
  }
  else
    navigate('mes-chromatiques', 0, false);
}, false);