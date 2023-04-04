import { Params, loadAllImages, wait } from './Params.js';
import { Settings } from './Settings.js';
import { FrontendShiny } from './ShinyBackend.js';
import { callBackend } from './callBackend.js';
import { FilterMenu } from './components/filter-menu/filterMenu.js';
import { clearElementStorage, lazyLoadSection, unLazyLoadSection, virtualizedSections } from './lazyLoading.js';
import { friendShinyStorage } from './localForage.js';
import { Notif } from './notification.js';
import { TranslatedString, getString } from './translation.js';



interface Section {
  nom: string;
  rememberPosition: boolean;
  openAnimation: (el: HTMLElement, ev: Event, data?: any) => (Animation | null);
  closeAnimation: (el: HTMLElement, ev: Event, data?: any) => (Animation | null);
  historique: boolean;
  closePrevious: boolean;
  makePreviousInert: boolean;
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
    makePreviousInert: false,
    preload: [`./images/iconsheet.webp`],
    fab: 'add',
    element: document.getElementById('mes-chromatiques')!
  }, {
    nom: 'pokedex',
    rememberPosition: true,
    openAnimation: defaultAnimation,
    closeAnimation: () => null,
    historique: true,
    closePrevious: true,
    makePreviousInert: false,
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
    makePreviousInert: false,
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
    makePreviousInert: false,
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
    makePreviousInert: false,
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
    makePreviousInert: false,
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
    makePreviousInert: false,
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
    makePreviousInert: false,
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
        fill: 'both'
      });;
    },
    closeAnimation: (section: Element, event: Event) => {
      return section.animate([
        { opacity: 1, transform: 'scale(1) translateZ(0)' },
        { opacity: 0, transform: 'scale(.7) translateZ(0)' }
      ], {
        easing: Params.easingAccelerate,
        duration: 150,
        fill: 'both'
      });
    },
    historique: true,
    closePrevious: false,
    makePreviousInert: true,
    preload: [],
    fab: null,
    element: document.getElementById('sprite-viewer')!
  }, {
    nom: 'filter-menu',
    rememberPosition: false,
    openAnimation: (section: Element, event: Event) => {
      const from = getComputedStyle(section).getPropertyValue('--from');
      return section.animate([
        { opacity: 0, transform: `translate3D(0, ${from}, 0)` },
        { opacity: 1, transform: 'translate3D(0, 0, 0)' }
      ], {
        easing: Params.easingDecelerate,
        duration: 200,
        fill: 'both'
      });
    },
    closeAnimation: (section: Element, event: Event) => {
      const from = getComputedStyle(section).getPropertyValue('--from');
      return section.animate([
        { opacity: 1, transform: 'translate3D(0, 0, 0)' },
        { opacity: 0, transform: `translate3D(0, ${from}, 0)` }
      ], {
        easing: Params.easingAccelerate,
        duration: 150,
        fill: 'both'
      });
    },
    historique: true,
    closePrevious: false,
    makePreviousInert: true,
    preload: [],
    fab: null,
    element: document.getElementById('filter-menu')!
  }, {
    nom: 'user-search',
    rememberPosition: false,
    openAnimation: (section: Element, event: Event) => {
      const from = getComputedStyle(section).getPropertyValue('--from');
      return section.animate([
        { opacity: 0, transform: `translate3D(0, ${from}, 0)` },
        { opacity: 1, transform: 'translate3D(0, 0, 0)' }
      ], {
        easing: Params.easingDecelerate,
        duration: 200,
        fill: 'both'
      });
    },
    closeAnimation: (section: Element, event: Event) => {
      const from = getComputedStyle(section).getPropertyValue('--from');
      return section.animate([
        { opacity: 1, transform: 'translate3D(0, 0, 0)' },
        { opacity: 0, transform: `translate3D(0, ${from}, 0)` }
      ], {
        easing: Params.easingAccelerate,
        duration: 150,
        fill: 'both'
      });
    },
    historique: true,
    closePrevious: false,
    makePreviousInert: true,
    preload: [],
    fab: null,
    element: document.getElementById('user-search')!
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
    makePreviousInert: true,
    preload: [],
    fab: null,
    element: document.getElementById('obfuscator')!
  }
];
export let sectionActuelle = 'mes-chromatiques';
const lastPosition: Map<string, number> = new Map(sections.filter(section => section.rememberPosition).map(section => [section.nom, 0]));


const backOnEscape = (event: KeyboardEvent) => {
  if (event.code === 'Escape') {
    history.back();
  }
};


const getLinkedSections = (section: Section['nom']): Section[] => {
  let linkedSections = [section];
  if (window.innerWidth >= Params.layoutPClarge) {
    switch (section) {
      case 'mes-chromatiques': linkedSections.push('pokedex'); break;
      case 'pokedex':          linkedSections.push('mes-chromatiques'); break;
      case 'chasses-en-cours': linkedSections.push('corbeille'); break;
      case 'corbeille':        linkedSections.push('chasses-en-cours'); break;
      case 'parametres':       linkedSections.push('a-propos'); break;
      case 'a-propos':         linkedSections.push('parametres'); break;
      case 'partage':          linkedSections.push('chromatiques-ami'); break;
      case 'chromatiques-ami': linkedSections.push('partage'); break;
    }
  }
  return linkedSections.map(nom => sections.find(s => s.nom === nom)!);
}


/**
 * Navigue vers la section demandée.
 * @param sectionCible - ID de la section demandée.
 * @param event - L'évènement qui a déclenché la navigation.
 */
export async function navigate(sectionCible: string, event: Event, data?: any) {
  if (sectionActuelle === sectionCible) return Promise.resolve();
  if (sectionCible === 'sprite-viewer' && !(navigator.onLine)) {
    if (!(Settings.get('cache-all-sprites'))) return new Notif(getString('error-no-connection')).prompt();
  }

  const ancienneSection = sections.find(section => section.nom === sectionActuelle)!;
  const nouvelleSection = sections.find(section => section.nom === sectionCible);
  if (!nouvelleSection) throw getString('error-no-section');

  // Pré-chargement des images de la nouvelle section
  await Promise.all([loadAllImages(nouvelleSection.preload || [])]);

  const mainElement = document.querySelector('main')!;

  if (ancienneSection) {
    // On désactive le retour à la section précédente à l'appui sur Échap
    window.removeEventListener('keydown', backOnEscape);

    const linkedAnciennesSections = getLinkedSections(ancienneSection.nom);
    await Promise.all(linkedAnciennesSections.map(async section => {
      // On dé-virtualise la section précédente si elle l'était
      if (nouvelleSection.closePrevious) {
        const virtualized = virtualizedSections.includes(section.nom);
        if (virtualized) unLazyLoadSection(section.nom);
      }

      // On enregistre la position du scroll sur l'ancienne section
      if (section.rememberPosition) {
        const scrolledElement = section.element.querySelector('.section-contenu')!;
        lastPosition.set(sectionActuelle, scrolledElement.scrollTop);
      }

      // On anime la disparition de l'ancienne section
      const anim = section.closeAnimation(section.element, event, data);
      if (anim) await wait(anim);
    }));
  }

  // Disparition de l'indicateur de l'état du backup autour du bouton paramètres
  Array.from(document.querySelectorAll('sync-progress[finished]')).forEach(sp => {
    sp.removeAttribute('state');
    sp.removeAttribute('finished');
  });

  if (nouvelleSection.historique && event.type !== 'popstate') history.pushState({ section: sectionCible, data: data }, '');

  // On rend l'ancienne section inerte si la nouvelle section s'affiche par-dessus
  const main = document.querySelector('main');
  const bottomBar = document.querySelector('nav.bottom-bar');
  if (!nouvelleSection.closePrevious) {
    if (nouvelleSection.makePreviousInert) {
      main?.setAttribute('inert', '');
      bottomBar?.setAttribute('inert', '');
    }
    window.addEventListener('keydown', backOnEscape); // On ferme la section en appuyant sur Échap
  } else {
    main?.removeAttribute('inert');
    bottomBar?.removeAttribute('inert');
  }

  // On anime le FAB si besoin
  animateFabIcon(ancienneSection, nouvelleSection);

  // Only animate new section(s) if the one we're closing was NOT displayed over it,
  // i.e. if it closed its previous section.
  const animateNewSection = ancienneSection.closePrevious;

  // On affiche la nouvelle section
  sectionActuelle = sectionCible;
  const sectionsString = `${nouvelleSection.closePrevious ? '' : ancienneSection.nom} ${nouvelleSection.nom}`;
  document.body.dataset.sectionActuelle = sectionsString;

  const linkedNouvellesSections = getLinkedSections(nouvelleSection.nom);
  await Promise.all(linkedNouvellesSections.map(section => {
    // On prépare la nouvelle section si besoin
    switch (section.nom) {
      case 'chromatiques-ami': {
        if (data.username !== section.element.getAttribute('data-username')) {
          section.element.setAttribute('data-username', data.username);

          section.element.classList.add('loading');
          section.element.classList.remove('vide', 'vide-filtres', 'vide-recherche');

          // Populate section with friend's username
          section.element.querySelectorAll('[data-type="username"]').forEach(e => e.innerHTML = data.username);

          // Populate section with friend's Pokémon (don't await this before navigating)
          callBackend('get-friend-data', { username: data.username, scope: 'full' }, false)
          .then(async response => {
            if ('matches' in response && response.matches === true) {
              await Promise.all(
                response.pokemon.map((shiny: any) => {
                  const feShiny = new FrontendShiny(shiny);
                  return friendShinyStorage.setItem(String(shiny.huntid), feShiny);
                })
              );

              window.dispatchEvent(new CustomEvent('dataupdate', {
                detail: {
                  sections: ['chromatiques-ami'],
                  ids: response.pokemon.map((shiny: any) => String(shiny.huntid)),
                  sync: false
                }
              }));
            }
          });
        }
      } break;

      case 'sprite-viewer': {
        const viewer = section.element.querySelector('sprite-viewer')!;
        viewer.setAttribute('dexid', data.dexid || '');
        viewer.setAttribute('shiny', 'true');
        viewer.setAttribute('size', navigator.onLine ? '512' : '112')
      } break;

      case 'filter-menu': {
        const menu = document.querySelector(`filter-menu[section="${data.section ?? ancienneSection.nom}"]`);
        if (!(menu instanceof FilterMenu)) throw new TypeError(`Expecting FilterMenu`);
        menu.open();
      } break;

      default: {
        document.body.removeAttribute('data-filters');
      }
    }

    // On prépare les liens de retour de la nouvelle section s'il y en a
    if (event.type !== 'popstate') {
      const container = (sectionCible === 'obfuscator' && data.filters) ? document.querySelector(`filter-menu`)! : nouvelleSection.element;
      for (const a of [...container.querySelectorAll('a.bouton-retour')]) {
        if (!(a instanceof HTMLAnchorElement)) throw new TypeError(`Expecting HTMLAnchorElement`);
        a.href = `./${ancienneSection.nom}`;
      }
    }

    // On restaure la position de scroll précédemment enregistrée
    /*if (section.rememberPosition) {
      const scrolledElement = section.element.querySelector('.section-contenu')!;
      scrolledElement.scroll(0, lastPosition.get(sectionCible) || 0);
    }*/
    
    // On anime l'apparition de la nouvelle section
    if (animateNewSection) {
      const apparitionSection = section?.openAnimation(section.element, event, data);
      if (apparitionSection) wait(apparitionSection);
    }

    // On virtualise la nouvelle section si elle peut l'être
    const virtualize = virtualizedSections.includes(section.nom);
    if (virtualize) lazyLoadSection(section.nom);
  }));

  // On nettoie l'ancienne section si besoin
  switch (ancienneSection.nom) {
    case 'sprite-viewer': {
      ancienneSection.element.querySelector('sprite-viewer')?.removeAttribute('dexid');
    } break;

    case 'chromatiques-ami': {
      if (nouvelleSection.closePrevious) {
        friendShinyStorage.clear();
        ancienneSection.element.querySelectorAll('friend-shiny-card, [data-replaces="friend-shiny-card"]').forEach(card => {
          (card as Element & {obsolete: boolean}).obsolete = true;
          card.remove();
          clearElementStorage('chromatiques-ami', card.getAttribute('huntid') ?? card.getAttribute('data-huntid') ?? '');
        });
        ancienneSection.element.querySelectorAll('.compteur').forEach(compteur => compteur.innerHTML = '');
        ancienneSection.element.removeAttribute('data-username');

        const filterMenu = document.querySelector('filter-menu[section="chromatiques-ami"]');
        if (!(filterMenu instanceof FilterMenu)) throw new TypeError('Expecting FilterMenu');
        filterMenu.reset();

        const searchBoxes = document.querySelectorAll('search-box[section="chromatiques-ami"]');
        searchBoxes.forEach(searchBox => {
          const form = searchBox.shadowRoot?.querySelector('form');
          if (form instanceof HTMLFormElement) form.reset();
        });
      }
    } break;
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

  if (nouvelleSection.fab) {
    fabIcon.innerHTML = nouvelleSection.fab || '';
    let labelKey;
    switch (nouvelleSection.nom) {
      case 'partage' : labelKey = 'fab-friend'; break;
      default: labelKey = 'fab-pokemon';
    }
    fab.setAttribute('data-label', labelKey);
    fab.setAttribute('aria-label', getString(labelKey as TranslatedString));
  }
  
  if (fabIcon && animate) {
    const deg = (k2 >= k1) ? '-90deg' : '+90deg';
    animFabIcon.end = fabIcon.animate([
      { transform: 'rotate(' + deg + ')', opacity: '0' },
      { transform: 'rotate(0)', opacity: '1' }
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