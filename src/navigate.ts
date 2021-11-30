import { getNames } from './DexDatalist.js';
import { closeFiltres, openFiltres } from './filtres.js';
import { disableLazyLoad, enableLazyLoad } from './lazyLoading.js';
import { loadAllImages, Params, wait } from './Params.js';
import { closeSpriteViewer, openSpriteViewer } from './spriteViewer.js';



export let sectionActuelle = 'mes-chromatiques';
export const sections = ['mes-chromatiques', 'pokedex', 'chasses-en-cours', 'parametres', 'a-propos'];

// Récupère la première carte d'une section
const firstCard = (section: Element): Element | null | undefined => {
  let card;
  switch (section.id) {
    case 'mes-chromatiques': card = section.querySelector('pokemon-card'); break;
    case 'pokedex':          card = section.querySelector('.pokedex-gen'); break;
    case 'hunts':            card = section.querySelector('.hunt-card'); break;
  }
  return card;
};

// Navigue vers la section demandée
export async function navigate(sectionCible: string, position = 0, historique = true) {
  if (sectionActuelle == sectionCible) return Promise.resolve();

  const ancienneSection = document.getElementById(sectionActuelle)!;
  const nouvelleSection = document.getElementById(sectionCible)!;

  // Pré-chargement des images de la nouvelle section
  const listeImages = ['./ext/pokesprite.png'];

  await Promise.all([loadAllImages(listeImages)]);
  await new Promise((resolve, reject) => {
    closeFiltres();

    if (historique) history.pushState({section: sectionCible}, '');

    // Désactive le lazy loading de la première carte
    const oldFirstCard = firstCard(ancienneSection);
    if (oldFirstCard) disableLazyLoad(oldFirstCard);

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

    document.querySelector('main')!.scroll(0, 0);
    document.body.dataset.sectionActuelle = sectionActuelle;

    // Disparition de l'indicateur de l'état du backup autour du bouton paramètres
    Array.from(document.querySelectorAll('sync-progress[finished]'))
    .forEach(sp => { sp.removeAttribute('state'); sp.removeAttribute('finished'); });

    if (window.innerWidth >= Params.layoutPClarge) return resolve(null);

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

  if (sectionCible == 'chasses-en-cours') getNames();

  // Active le lazy loading de la première carte
  const newFirstCard = firstCard(nouvelleSection);
  if (newFirstCard) enableLazyLoad(newFirstCard);
}



// Anime l'icône du FAB selon la section en cours
async function animateFabIcon(sectionCible: string, animations = false) {
  const fab = document.querySelector('.fab')!;
  const fabIcon = fab.querySelector('.material-icons')!;
  type startendAnimations = { start: Animation | null, end: Animation | null };
  const animFabIcon: startendAnimations = { start: null, end: null };

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

  await wait(animFabIcon.start);

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

  await wait(animFabIcon.end);

  animFabIcon.start?.cancel();
  animFabIcon.end?.cancel();
  return;
}


/**
 * Anime la bulle en fond d'un lien de navigation.
 */
export function navLinkBubble(event: Event, element: Element): void {
  element.classList.remove('bubbly');
  if ((element as HTMLElement).dataset.section === document.body.dataset.sectionActuelle) return;

  let transformOrigin = 'center center';
  const rect = element.getBoundingClientRect();

  switch (event.type) {
    case 'mousedown': {
      const evt = event as MouseEvent;
      transformOrigin = `${evt.clientX - rect.x}px ${evt.clientY - rect.y}px`;
    } break;
    case 'touchstart': {
      const evt = event as TouchEvent;
      transformOrigin = `${evt.touches[0].clientX - rect.x}px ${evt.touches[0].clientY - rect.y}px`;
    } break;
  }

  (element as HTMLElement).style.setProperty('--transform-origin', transformOrigin);
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.classList.add('bubbly');
    })
  });
}



// Permet la navigation avec le bouton retour du navigateur
window.addEventListener('popstate', event => {
  if (typeof document.body.dataset.viewerOpen != 'undefined' || typeof document.body.dataset.viewerLoading != 'undefined') {
    closeSpriteViewer();
  } else if (event.state) {
    const section = event.state.section;
    if (document.querySelector('.menu-filtres')!.classList.contains('on'))
      closeFiltres();
    if (section != sectionActuelle) {
      switch(section) {
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
  } else {
    navigate('mes-chromatiques', 0, false);
  }
}, false);