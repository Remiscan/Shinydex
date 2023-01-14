import { Params, loadAllImages, wait } from './Params.js';
import { Settings } from './Settings.js';
import { SearchBar } from './components/search-bar/searchBar.js';
import { SearchBox } from './components/search-box/searchBox.js';
import { isSearchableSection } from './filtres.js';
import { disableLazyLoad, enableLazyLoad } from './lazyLoading.js';
import { Notif } from './notification.js';



interface Section {
  nom: string;
  rememberPosition: boolean;
  openAnimation: (el: HTMLElement, ev: Event, data?: any) => (Animation | null);
  closeAnimation: (el: HTMLElement, ev: Event, data?: any) => (Animation | null);
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
    preload: [`./images/iconsheet.webp`, `./images/pokemonsheet.webp`],
    fab: 'add',
    element: document.getElementById('mes-chromatiques')!
  }, {
    nom: 'pokedex',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: [`./images/pokemonsheet.webp`],
    fab: 'add',
    element: document.getElementById('pokedex')!
  }, {
    nom: 'chasses-en-cours',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: [`./images/iconsheet.webp`],
    fab: 'add',
    element: document.getElementById('chasses-en-cours')!
  }, {
    nom: 'corbeille',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: [`./images/iconsheet.webp`],
    fab: null,
    element: document.getElementById('corbeille')!
  }, {
    nom: 'partage',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: [`./images/iconsheet.webp`],
    fab: 'person_add',
    element: document.getElementById('partage')!
  }, {
    nom: 'chromatiques-ami',
    rememberPosition: false,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    preload: [`./images/iconsheet.webp`],
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
    preload: ['./images/app-icons/icon.svg'],
    fab: null,
    element: document.getElementById('a-propos')!
  }, {
    nom: 'sprite-viewer',
    rememberPosition: false,
    openAnimation: (section: HTMLElement, event: Event, data: any) => {
      let originX, originY;
      if (event instanceof MouseEvent && event.clientX && event.clientY) {
        originX = event.clientX;
        originY = event.clientY;
      } else {
        const rect = document.querySelector(`#pokedex .pkmnicon[data-dexid="${data.dexid}"]`)!.getBoundingClientRect();
        originX = rect.x;
        originY = rect.y;
      }
      section.style.transformOrigin = originX + 'px ' + originY + 'px';

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
    openAnimation: (section: Element, event: Event, data: any) => {
      return section.animate([
        { opacity: 0 },
        { opacity: data?.opacity ?? .75 }
      ], {
        easing: Params.easingStandard,
        duration: 200,
        fill: 'both'
      });
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
const lastPosition: Map<string, number> = new Map(sections.filter(section => section.rememberPosition).map(section => [section.nom, 0]));


/**
 * Récupère la première carte d'une section.
 * @param section - La section en question.
 * @returns La première carte.
 */
const firstCard = (section: Element): HTMLElement | null | undefined => {
  let card;
  switch (section.id) {
    case 'mes-chromatiques': card = section.querySelector('shiny-card'); break;
    case 'pokedex':          card = section.querySelector('.pokedex-gen'); break;
    case 'hunts':            card = section.querySelector('.hunt-card'); break;
  }
  return card instanceof HTMLElement ? card : undefined;
};


const backOnEscape = (event: KeyboardEvent) => {
  if (event.code === 'Escape') {
    history.back();
  }
};


/**
 * Navigue vers la section demandée.
 * @param sectionCible - ID de la section demandée.
 * @param event - L'évènement qui a déclenché la navigation.
 */
export async function navigate(sectionCible: string, event: Event, data?: any) {
  if (sectionActuelle === sectionCible) return Promise.resolve();
  if (sectionCible === 'sprite-viewer' && !(navigator.onLine)) {
    if (!(Settings.get('cache-all-sprites'))) return new Notif('Pas de connexion internet.').prompt();
  }

  const ancienneSection = sections.find(section => section.nom === sectionActuelle)!;
  const nouvelleSection = sections.find(section => section.nom === sectionCible);
  if (!nouvelleSection) throw `La section demandée n'existe pas.`;

  // Pré-chargement des images de la nouvelle section
  await Promise.all([loadAllImages(nouvelleSection.preload || [])]);

  const mainElement = document.querySelector('main')!;

  if (ancienneSection) {
    // On désactive le retour à la section précédente à l'appui sur Échap
    window.removeEventListener('keydown', backOnEscape);
    
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

  // On met à jour la barre de recherche globale
  const globalSearchBar = document.querySelector('nav > search-box');
  if (globalSearchBar && globalSearchBar instanceof SearchBox && isSearchableSection(nouvelleSection.nom)) {
    document.body.removeAttribute('data-no-search');
    globalSearchBar.section = nouvelleSection.nom;
  } else if (nouvelleSection.closePrevious) {
    document.body.setAttribute('data-no-search', 'true');
  }

  // On affiche la nouvelle section
  sectionActuelle = sectionCible;
  const sectionsString = `${nouvelleSection.closePrevious ? '' : ancienneSection.nom} ${nouvelleSection.nom}`;
  document.body.dataset.sectionActuelle = sectionsString;

  if (nouvelleSection.historique && event.type !== 'popstate') history.pushState({ section: sectionCible, data: data }, '');
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
      case 'chasses-en-cours': if (shouldItAnimate('corbeile')) sectionsToAnimate.push('corbeille'); break;
      case 'parametres':       if (shouldItAnimate('a-propos')) sectionsToAnimate.push('a-propos'); break;
      case 'partage':          if (shouldItAnimate('chromatiques-ami')) sectionsToAnimate.push('chromatiques-ami'); break;
    }
  }

  // On prépare la nouvelle section si besoin
  switch (sectionCible) {
    case 'sprite-viewer':
      const viewer = nouvelleSection.element.querySelector('sprite-viewer')!;
      viewer.setAttribute('dexid', data.dexid || '');
      viewer.setAttribute('shiny', 'true');
      viewer.setAttribute('size', navigator.onLine ? '512' : '112')
      break;
    case 'obfuscator': {
      if (data.search) {
        const searchBar = document.querySelector(`search-bar`);
        if (!(searchBar instanceof SearchBar)) throw new TypeError(`Expecting SearchBar`);
        searchBar.setAttribute('section', data.section ?? ancienneSection.nom);
        searchBar?.open();
      }
    } break;
    default: {
      document.body.removeAttribute('data-search');
    }
  }

  // On prépare les liens de retour de la nouvelle section s'il y en a
  if (event.type !== 'popstate') {
    const container = (sectionCible === 'obfuscator' && data.search) ? document.querySelector(`search-bar`)! : nouvelleSection.element;
    for (const a of [...container.querySelectorAll('a.bouton-retour')]) {
      if (!(a instanceof HTMLAnchorElement)) throw new TypeError(`Expecting HTMLAnchorElement`);
      a.href = `./${ancienneSection.nom}`;
    }
  }

  // On anime le FAB si besoin
  animateFabIcon(ancienneSection, nouvelleSection);

  // On rend l'ancienne section inerte si la nouvelle section s'affiche par-dessus
  const main = document.querySelector('main');
  const bottomBar = document.querySelector('nav.bottom-bar');
  if (!nouvelleSection.closePrevious) {
    main?.setAttribute('inert', '');
    bottomBar?.setAttribute('inert', '');
    window.addEventListener('keydown', backOnEscape); // On ferme la section en appuyant sur Échap
  } else {
    main?.removeAttribute('inert');
    bottomBar?.removeAttribute('inert');
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

  // On nettoie l'ancienne section si besoin
  switch (ancienneSection.nom) {
    case 'sprite-viewer': {
      ancienneSection.element.querySelector('sprite-viewer')?.removeAttribute('dexid');
    }
  }

  return;
}


/**
 * Anime la bulle en fond d'un lien de navigation.
 * @param event - L'event mousedown ou touchstart sur le bouton de nav.
 * @param element - Le bouton de nav.
 */
export function navLinkBubble(event: PointerEvent, element: HTMLElement): void {
  if (event.button !== 0) return; // Only act on left mouse click, touch or pen contact
  
  element.classList.remove('bubbly');
  if (element.dataset.section === document.body.dataset.sectionActuelle) return;
  if (element.classList.contains('search-button')) return;

  let transformOrigin = 'center center';
  const rect = element.getBoundingClientRect();
  transformOrigin = `${event.clientX - rect.x}px ${event.clientY - rect.y}px`;

  element.style.setProperty('--transform-origin', transformOrigin);
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.classList.add('bubbly');
    })
  });
}


/**
 * Anime l'icône du FAB si elle change entre deux sections.
 */
async function animateFabIcon(ancienneSection: Section, nouvelleSection: Section) {
  const fab = document.querySelector('.fab');
  if (!(fab instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
  const fabIcon = fab.querySelector('.material-icons');
  if (!(fabIcon instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
  type startendAnimations = { start: Animation | null, end: Animation | null };
  const animFabIcon: startendAnimations = { start: null, end: null };
  const animate = ancienneSection.fab && nouvelleSection.fab && ancienneSection.fab != nouvelleSection.fab;

  const k1 = sections.findIndex(section => section.nom === ancienneSection.nom);
  const k2 = sections.findIndex(section => section.nom === nouvelleSection.nom);

  // On joue les animations
  if (fabIcon && animate) {
    const deg = (k2 >= k1) ? '90deg' : '-90deg';
    animFabIcon.start = fabIcon.animate([
      { transform: 'translate3D(0, 0, 0) rotate(0)', opacity: '1' },
      { transform: 'translate3D(0, 0, 0) rotate(' + deg + ')', opacity: '0' }
    ], {
      easing: Params.easingAccelerate,
      duration: 100,
      fill: 'forwards'
    });
    await wait(animFabIcon.start);
  }

  if (nouvelleSection.fab) fabIcon.innerHTML = nouvelleSection.fab || '';
  
  if (fabIcon && animate) {
    const deg = (k2 >= k1) ? '-90deg' : '+90deg';
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
  }
  return;
}


// Permet la navigation avec le bouton retour du navigateur
window.addEventListener('popstate', event => {
  navigate(event.state?.section || 'mes-chromatiques', event, event.state?.data);
}, false);