import { disableLazyLoad, enableLazyLoad } from './lazyLoading.js';
import { Notif } from './notification.js';
import { loadAllImages, Params, wait } from './Params.js';



interface Section {
  nom: string;
  rememberPosition: boolean;
  openAnimation: (el: Element, ev: Event, data?: any) => (Animation | null);
  closeAnimation: (el: Element, ev: Event, data?: any) => (Animation | null);
  historique: boolean;
  closePrevious: boolean;
  preload: string[];
  fab: string | null;
  element: HTMLElement;
}

const defaultAnimation = (section: Element, event: Event) => section.animate([
  { transform: 'translate3D(0, 20px, 0)', opacity: '0' },
  { transform: 'translate3D(0, 0, 0)', opacity: '1' }
], {
  easing: Params.easingDecelerate,
  duration: 200,
  fill: 'both'
});

const sections: Section[] = [
  {
    nom: 'mes-chromatiques',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: ['./ext/pokesprite.png'],
    fab: 'add',
    element: document.getElementById('mes-chromatiques')!
  }, {
    nom: 'pokedex',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: ['./ext/pokesprite.png'],
    fab: 'add',
    element: document.getElementById('pokedex')!
  }, {
    nom: 'chasses-en-cours',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: ['./ext/pokesprite.png'],
    fab: 'add',
    element: document.getElementById('chasses-en-cours')!
  }, {
    nom: 'corbeille',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: ['./ext/pokesprite.png'],
    fab: null,
    element: document.getElementById('corbeille')!
  }, {
    nom: 'partage',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: ['./ext/pokesprite.png'],
    fab: null,
    element: document.getElementById('partage')!
  }, {
    nom: 'chromatiques-ami',
    rememberPosition: false,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: ['./ext/pokesprite.png'],
    fab: null,
    element: document.getElementById('chromatiques-ami')!
  }, {
    nom: 'parametres',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: [],
    fab: null,
    element: document.getElementById('parametres')!
  }, {
    nom: 'a-propos',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: [],
    fab: null,
    element: document.getElementById('a-propos')!
  }, {
    nom: 'sprite-viewer',
    rememberPosition: false,
    openAnimation: (section: Element, event: Event, data: any) => {
      let originX, originY;
      const evt = event as MouseEvent;
      if (evt.clientX && evt.clientY) {
        originX = evt.clientX;
        originY = evt.clientY;
      } else {
        const rect = document.querySelector(`.pkspr.pokemon[data-dexid="${data.dexid}"]`)!.getBoundingClientRect();
        originX = rect.x;
        originY = rect.y;
      }
      (section as HTMLElement).style.transformOrigin = originX + 'px ' + originY + 'px';

      return section.animate([
        { opacity: 0, transform: 'scale(.7) translateZ(0)' },
        { opacity: 1, transform: 'scale(1) translateZ(0)' }
      ], {
        easing: Params.easingDecelerate,
        duration: 200,
        fill: 'backwards'
      });;
    },
    closeAnimation: (section: Element, event: Event) => {
      return section.animate([
        { opacity: 1, transform: 'scale(1) translateZ(0)' },
        { opacity: 0, transform: 'scale(.7) translateZ(0)' }
      ], {
        easing: Params.easingAccelerate,
        duration: 150
      });
    },
    historique: true,
    closePrevious: false,
    preload: [],
    fab: null,
    element: document.getElementById('sprite-viewer')!
  }, {
    nom: 'obfuscator',
    rememberPosition: false,
    openAnimation: (section: Element, event: Event) => {
      return null;
    },
    closeAnimation: (section: Element, event: Event) => {
      return null;
    },
    historique: true,
    closePrevious: false,
    preload: [],
    fab: null,
    element: document.getElementById('obfuscator')!
  }, 
];
export let sectionActuelle = 'mes-chromatiques';
const sectionsActuelles = ['mes-chromatiques'];
//export const sections = ['mes-chromatiques', 'pokedex', 'chasses-en-cours', 'corbeille', 'partage', 'chromatiques-ami', 'parametres', 'a-propos'];
const lastPosition: Map<string, number> = new Map(sections.filter(section => section.rememberPosition).map(section => [section.nom, 0]));


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
 * @param event - L'évènement qui a déclenché la navigation.
 */
export async function navigate(sectionCible: string, event: Event, data?: any) {
  if (sectionActuelle === sectionCible) return Promise.resolve();
  if (sectionCible === 'sprite-viewer' && !(navigator.onLine)) return new Notif('Pas de connexion internet.').prompt();

  const ancienneSection = sections.find(section => section.nom === sectionActuelle)!;
  const nouvelleSection = sections.find(section => section.nom === sectionCible);
  if (!nouvelleSection) throw `La section demandée n'existe pas.`;

  // Pré-chargement des images de la nouvelle section
  await Promise.all([loadAllImages(nouvelleSection.preload || [])]);

  const mainElement = document.querySelector('main')!;

  if (ancienneSection) {
    // On enregistre la position du scroll sur l'ancienne section
    if (ancienneSection.rememberPosition) lastPosition.set(sectionActuelle, mainElement.scrollTop);

    // Désactive le lazy loading de la première carte de l'ancienne section
    const oldFirstCard = firstCard(ancienneSection.element);
    if (oldFirstCard) disableLazyLoad(oldFirstCard);

    // On anime la disparition de l'ancienne section
    const anim = ancienneSection.closeAnimation(ancienneSection.element, event, data);
    if (anim) await wait(anim);
  }

  // Disparition de l'indicateur de l'état du backup autour du bouton paramètres
  Array.from(document.querySelectorAll('sync-progress[finished]')).forEach(sp => {
    sp.removeAttribute('state');
    sp.removeAttribute('finished');
  });

  // On affiche la nouvelle section
  sectionActuelle = sectionCible;
  const sectionsString = `${nouvelleSection.closePrevious ? '' : ancienneSection.nom} ${nouvelleSection.nom}`;
  document.body.dataset.sectionActuelle = sectionsString;

  if (nouvelleSection.historique) history.pushState({section: sectionCible}, '');
  if (nouvelleSection.rememberPosition) mainElement.scroll(0, lastPosition.get(sectionCible) || 0); // scrolle vers la position précédemment enregistrée

  // On détermine quelles sections animer (sur PC, certaines sections apparaissent en couple)
  const shouldItAnimate = (section: string): boolean => {
    if (ancienneSection.closePrevious) return true;
    else                               return false;
  };

  const sectionsToAnimate: string[] = [];
  if (shouldItAnimate(nouvelleSection.nom)) sectionsToAnimate.push(nouvelleSection.nom);
  if (window.innerWidth >= Params.layoutPClarge) {
    switch (sectionCible) {
      case 'mes-chromatiques': if (shouldItAnimate('pokedex')) sectionsToAnimate.push('pokedex'); break;
      case 'parametres':       if (shouldItAnimate('a-propos')) sectionsToAnimate.push('a-propos'); break;
    }
  }

  // On prépare la nouvelle section si besoin
  switch (sectionCible) {
    case 'sprite-viewer': nouvelleSection.element.querySelector('sprite-viewer')?.setAttribute('dexid', data.dexid || ''); break;
  }

  // On anime l'apparition de la nouvelle section
  await Promise.all(sectionsToAnimate.map(nom => {
    const section = sections.find(section => section.nom === nom);
    const apparitionSection = section?.openAnimation(section.element, event, data);

    if (apparitionSection) return wait(apparitionSection);
    else                   return;
  }));

  // Active le lazy loading de la première carte
  const newFirstCard = firstCard(nouvelleSection.element);
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
  navigate(event.state?.section || 'mes-chromatiques', event);
}, false);