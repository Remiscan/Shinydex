import { Params, loadAllImages, wait } from './Params.js';
import { FrontendShiny } from './ShinyBackend.js';
import { callBackend } from './callBackend.js';
import { FilterMenu } from './components/filter-menu/filterMenu.js';
import { clearElementStorage, lazyLoadSection, unLazyLoadSection, virtualizedSections } from './lazyLoading.js';
import { friendShinyStorage } from './localForage.js';
import { Notif } from './notification.js';
import { scrollObserver } from './theme.js';
import { TranslatedString, getString } from './translation.js';



interface Section {
  nom: string;
  urls: {
    fr: string,
    en: string
  };
  preload: string[];
  fab: string | null;
  element: HTMLElement;
}

export const sections: Section[] = [
  {
    nom: 'mes-chromatiques',
    urls: {
      fr: '',
      en: '',
    },
    preload: [`./images/iconsheet.webp`],
    fab: 'add',
    element: document.getElementById('mes-chromatiques')!
  }, {
    nom: 'pokedex',
    urls: {
      fr: 'pokedex',
      en: 'pokedex',
    },
    preload: [`./images/pokemonsheet.webp`],
    fab: 'add',
    element: document.getElementById('pokedex')!
  }, {
    nom: 'chasses-en-cours',
    urls: {
      fr: 'chasses',
      en: 'hunts',
    },
    preload: [`./images/iconsheet.webp`],
    fab: 'add',
    element: document.getElementById('chasses-en-cours')!
  }, {
    nom: 'corbeille',
    urls: {
      fr: 'corbeille',
      en: 'deleted',
    },
    preload: [`./images/iconsheet.webp`],
    fab: null,
    element: document.getElementById('corbeille')!
  }, {
    nom: 'partage',
    urls: {
      fr: 'amis',
      en: 'friends',
    },
    preload: [`./images/iconsheet.webp`],
    fab: 'person_add',
    element: document.getElementById('partage')!
  }, {
    nom: 'chromatiques-ami',
    urls: {
      fr: 'ami',
      en: 'friend',
    },
    preload: [`./images/iconsheet.webp`],
    fab: null,
    element: document.getElementById('chromatiques-ami')!
  }, {
    nom: 'parametres',
    urls: {
      fr: 'parametres',
      en: 'settings',
    },
    preload: [],
    fab: null,
    element: document.getElementById('parametres')!
  }, {
    nom: 'a-propos',
    urls: {
      fr: 'a-propos',
      en: 'about',
    },
    preload: [],
    fab: null,
    element: document.getElementById('a-propos')!
  }
];
export let sectionActuelle = 'mes-chromatiques';
const lastPosition: Map<string, number> = new Map(sections.map(section => [section.nom, 0]));


const backOnEscape = (event: KeyboardEvent) => {
  if (event.code === 'Escape') {
    history.back();
  }
};


const getLinkedSections = (section: Section['nom']): Section[] => {
  let linkedSections = [section];
  if (Params.currentLayout === 'large') {
    switch (section) {
      case 'mes-chromatiques': linkedSections.push('pokedex'); break;
      case 'pokedex':          linkedSections.push('mes-chromatiques'); break;
      case 'chasses-en-cours': linkedSections.push('corbeille'); break;
      case 'corbeille':        linkedSections.push('chasses-en-cours'); break;
      case 'parametres':       linkedSections.push('a-propos'); break;
      case 'a-propos':         linkedSections.push('parametres'); break;
    }
  }
  return linkedSections.map(nom => sections.find(s => s.nom === nom)!);
}


/**
 * Navigue vers la section demandée.
 * @param sectionCible - ID de la section demandée.
 * @param event - L'évènement qui a déclenché la navigation.
 */
export async function navigate(event: CustomEvent) {
  if (event.detail.cause !== 'replacestate') {
    document.body.classList.remove('welcome');
  }

  const url = new URL(location.href);
  const sectionCible = url.pathname.split('/')[2];

  const ancienneSection = sections.find(section => section.nom === sectionActuelle);
  if (!ancienneSection) throw getString('error-no-section');
  const nouvelleSection = sections.find(section => Object.values(section.urls).includes(sectionCible));
  if (!nouvelleSection) throw getString('error-no-section');

  if (ancienneSection.nom === nouvelleSection.nom) {
    // If trying to navigate to the already open section, scroll back to top
    const section = sections.find(section => section.nom === sectionActuelle)!;
    const scrolledElement = section.element.querySelector('.section-contenu')!;
    scrolledElement.scroll(0, 0);
    return Promise.resolve();
  }

  // Pré-chargement des images de la nouvelle section
  await Promise.all([loadAllImages(nouvelleSection.preload || [])]);

  if (ancienneSection) {
    // On désactive le retour à la section précédente à l'appui sur Échap
    window.removeEventListener('keydown', backOnEscape);

    const linkedAnciennesSections = getLinkedSections(ancienneSection.nom);
    await Promise.all(linkedAnciennesSections.map(async section => {
      // On dé-virtualise la section précédente si elle l'était
      const virtualized = virtualizedSections.includes(section.nom);
      if (virtualized) unLazyLoadSection(section.nom);

      // On enregistre la position du scroll sur l'ancienne section
      const scrolledElement = section.element.querySelector('.section-contenu')!;
      lastPosition.set(sectionActuelle, scrolledElement.scrollTop);

      const scrollDetector = ancienneSection.element.querySelector('.scroll-detector');
      if (scrollDetector) scrollObserver.unobserve(scrollDetector);
    }));
  }

  // Disparition de l'indicateur de l'état du backup autour du bouton paramètres
  Array.from(document.querySelectorAll('sync-progress[finished]')).forEach(sp => {
    sp.removeAttribute('state');
    sp.removeAttribute('finished');
  });

  //if (event.type !== 'popstate') history.pushState({ section: sectionCible, data: data }, '');

  // On anime le FAB si besoin
  animateFabIcon(ancienneSection, nouvelleSection);

  // On affiche la nouvelle section
  sectionActuelle = nouvelleSection.nom;
  document.body.dataset.sectionActuelle = nouvelleSection.nom;

  const linkedNouvellesSections = getLinkedSections(nouvelleSection.nom);
  await Promise.all(linkedNouvellesSections.map(async section => {
    // On prépare la nouvelle section si besoin
    switch (section.nom) {
      case 'chromatiques-ami': {
        const username = url.pathname.split('/')[3];
        //if (username !== section.element.getAttribute('data-username')) {
          section.element.setAttribute('data-username', username);

          section.element.classList.add('loading');
          section.element.classList.remove('vide', 'vide-filtres', 'vide-recherche');

          // Populate section with friend's username
          section.element.querySelectorAll('[data-type="username"]').forEach(e => e.innerHTML = username);

          // Populate section with friend's Pokémon
          // ⚠️ (don't await this before navigating)
          callBackend('get-friend-data', { username: username, scope: 'full' }, false)
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
            } else {
              new Notif(getString('error-no-profile')).prompt();
            }
          });
        //}
      } break;

      default: {
        document.body.removeAttribute('data-filters');
      }
    }

    // On prépare les liens de retour de la nouvelle section s'il y en a
    for (const a of [...nouvelleSection.element.querySelectorAll('a.bouton-retour')]) {
      if (!(a instanceof HTMLAnchorElement)) throw new TypeError(`Expecting HTMLAnchorElement`);
      a.href = `./${ancienneSection.nom}`;
    }

    // On restaure la position de scroll précédemment enregistrée
    /*if (section.rememberPosition) {
      const scrolledElement = section.element.querySelector('.section-contenu')!;
      scrolledElement.scroll(0, lastPosition.get(sectionCible) || 0);
    }*/

    const scrollDetector = nouvelleSection.element.querySelector('.scroll-detector');
    if (scrollDetector) scrollObserver.observe(scrollDetector);

    // On virtualise la nouvelle section si elle peut l'être
    const virtualize = virtualizedSections.includes(section.nom);
    if (virtualize) lazyLoadSection(section.nom);
  }));

  // On nettoie l'ancienne section si besoin
  switch (ancienneSection.nom) {
    case 'sprite-viewer': {
      ancienneSection.element.querySelector('sprite-viewer')?.removeAttribute('dexid');
      ancienneSection.element.removeAttribute('data-ready');
    } break;

    case 'chromatiques-ami': {
      friendShinyStorage.clear();
      ancienneSection.element.removeAttribute('data-ready');
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
    } break;
  }

  window.dispatchEvent(new Event('navigationend'));
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


/**
 * Crée l'URL d'une page.
 */
export function getPageUrl(page: string, subPage: string = ''): URL {
  const lang = document.documentElement.lang as keyof Section['urls'];
  const requestedSection = sections.find(s => s.nom === page);
  const requestedPath = requestedSection?.urls[lang] ?? requestedSection?.urls['en'] ?? '';
  const suffix = subPage
    ? `/${subPage}`
    : ''
  return new URL(`${requestedPath}${suffix}`, `${location.origin}/shinydex/`);
}


/**
 * Déclenche un changement d'URL, qui déclenchera lui-même une navigation.
 */
export async function goToPage(
  page: string,
  subPage: string = '',
  data: unknown = {},
  options: { type?: 'push'|'replace' } = {}
) {
  return new Promise(resolve => {
    const url = getPageUrl(page, subPage).pathname;
    window.addEventListener('navigationend', resolve, { once: true });
    switch (options.type) {
      case 'replace':
        history.replaceState(data, '', url);
        break;
      case 'push':
      default:
        history.pushState(data, '', url);
    }
  });
}



///////////////////////////////////////////////
// Déclenche une navigation au changement d'URL
const pushState = history.pushState;
const replaceState = history.replaceState;

history.pushState = function(...args: Parameters<History['pushState']>) {
  const override = pushState.apply(this, args);
  window.dispatchEvent(new Event('pushstate'));
  window.dispatchEvent(new CustomEvent('locationchange', {
    detail: {
      cause: 'pushstate',
      url: args[2],
      ...args[0]
    }
  }));
  return override;
};

history.replaceState = function(...args: Parameters<History['replaceState']>) {
  const override = replaceState.apply(this, args);
  window.dispatchEvent(new Event('replacestate'));
  window.dispatchEvent(new CustomEvent('locationchange', {
    detail: {
      cause: 'replacestate',
      url: args[2],
      ...args[0]
    }
  }));
  return override;
};

window.addEventListener('popstate', event => {
  window.dispatchEvent(new CustomEvent('locationchange', {
    detail: {
      cause: 'popstate',
      ...event.state?.data
    }
  }));
});

window.addEventListener('locationchange', event => {
  if (!(event instanceof CustomEvent)) return;
  navigate(event);
});