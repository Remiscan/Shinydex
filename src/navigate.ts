import { closeFiltres, openFiltres } from './filtres.js';
import { disableLazyLoad, enableLazyLoad } from './lazyLoading.js';
import { loadAllImages, Params, wait } from './Params.js';
import { closeSpriteViewer, openSpriteViewer } from './spriteViewer.js';



export let sectionActuelle = 'mes-chromatiques';
export const sections = ['mes-chromatiques', 'pokedex', 'chasses-en-cours', 'partage', 'parametres', 'a-propos'];
const lastPosition: Map<string, number> = new Map(sections.map(section => [section, 0]));


/**
 * Récupère la première carte d'une section.
 * @param section - La section en question.
 * @returns La première carte.
 */
const firstCard = (section: Element): Element | null | undefined => {
  let card;
  switch (section.id) {
    case 'mes-chromatiques': card = section.querySelector('pokemon-card'); break;
    case 'pokedex':          card = section.querySelector('.pokedex-gen'); break;
    case 'hunts':            card = section.querySelector('.hunt-card'); break;
  }
  return card;
};


/**
 * Navigue vers la section demandée.
 * @param sectionCible - ID de la section demandée.
 * @param historique - Si la navigation doit créer une nouvelle entrée dans l'historique.
 */
export async function navigate(sectionCible: string, historique = true) {
  if (sectionActuelle == sectionCible) return Promise.resolve();

  const ancienneSection = document.getElementById(sectionActuelle)!;
  const nouvelleSection = document.getElementById(sectionCible)!;

  // On enregistre la position du scroll sur l'ancienne section
  const mainElement = document.querySelector('main')!;
  lastPosition.set(sectionActuelle, mainElement.scrollTop);

  // Pré-chargement des images de la nouvelle section
  const listeImages = ['./ext/pokesprite.png'];
  await Promise.all([loadAllImages(listeImages)]);

  closeFiltres();

  if (historique) history.pushState({section: sectionCible}, '');

  // Désactive le lazy loading de la première carte de l'ancienne section
  const oldFirstCard = firstCard(ancienneSection);
  if (oldFirstCard) disableLazyLoad(oldFirstCard);

  // Disparition de l'indicateur de l'état du backup autour du bouton paramètres
  Array.from(document.querySelectorAll('sync-progress[finished]')).forEach(sp => {
    sp.removeAttribute('state');
    sp.removeAttribute('finished');
  });

  sectionActuelle = sectionCible;
  document.body.dataset.sectionActuelle = sectionActuelle; // affiche la nouvelle section
  mainElement.scroll(0, lastPosition.get(sectionCible) || 0); // scrolle vers la position précédemment enregistrée

  // On détermine quelles sections animer (sur PC, certaines sections apparaissent en couple)
  const sectionsToAnimate: HTMLElement[] = [nouvelleSection];
  if (window.innerWidth >= Params.layoutPClarge) {
    switch (sectionCible) {
      case 'mes-chromatiques': sectionsToAnimate.push(document.getElementById('pokedex')!); break;
      case 'parametres':       sectionsToAnimate.push(document.getElementById('a-propos')!); break;
    }
  }

  // On anime l'apparition de la nouvelle section
  await Promise.all(sectionsToAnimate.map(section => {
    const apparitionSection = section.animate([
      { transform: 'translate3D(0, 20px, 0)', opacity: '0' },
      { transform: 'translate3D(0, 0, 0)', opacity: '1' }
    ], {
      easing: Params.easingDecelerate,
      duration: 200,
      fill: 'both'
    });

    return wait(apparitionSection);
  }));

  // Active le lazy loading de la première carte
  const newFirstCard = firstCard(nouvelleSection);
  if (newFirstCard) enableLazyLoad(newFirstCard);
}


/**
 * Anime la bulle en fond d'un lien de navigation.
 * @param event - L'event mousedown ou touchstart sur le bouton de nav.
 * @param element - Le bouton de nav.
 */
export function navLinkBubble(event: Event, element: Element): void {
  element.classList.remove('bubbly');
  if ((element as HTMLElement).dataset.section === document.body.dataset.sectionActuelle) return;
  if (element.classList.contains('search-button')) return;

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


/**
 * Anime l'icône du FAB si elle change entre deux sections.
 * (Inutilisé pour l'instant, mais garder.)
 * @param sectionCible 
 * @param animations 
 */
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
          navigate(section, false);
      }
    }
  } else {
    navigate('mes-chromatiques', false);
  }
}, false);