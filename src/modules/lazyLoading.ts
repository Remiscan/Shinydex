// Thank you https://infrequently.org/2020/12/resize-resilient-deferred-rendering/



import { computeShinyFilters } from "./filtres.js";
import { Shiny } from "./Shiny.js";
import { getCurrentLang } from "./translation.js";



const loaded = new WeakMap();

/** Computes whether an element's bounding client rect is the same as it was before. */
function isRectSame(r1: DOMRect, r2: DOMRect): boolean {
  const closeEnough = (a: number, b: number) => Math.abs(a - b) <= 2;
  return (closeEnough(r1.width, r2.width) && closeEnough(r1.height, r2.height));
}

/** Computes an element's size and sets it as its contain-intrinsic-size. */
function computeSize(element: HTMLElement, rect: DOMRect = element.getBoundingClientRect()): void {
  const oldRect = loaded.get(element);
  if ((!oldRect || !isRectSame(oldRect, rect)) && (rect.width > 0 && rect.height > 0)) {
    loaded.set(element, rect);
    element.style.setProperty('contain-intrinsic-height', `${rect.height}px`);
  }
}

/** Computes an element's size whenever it enters or exists viewport, and sets it as its contain-intrinsic-size. */
const intersector = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
  for (const entry of entries) {
    if (!(entry.target instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    computeSize(entry.target, entry.boundingClientRect);
  }
}, {
  rootMargin: '252px 0px 252px 0px'
});

/** Computes an element's size whenever it's resized, and sets it as its contain-intrinsic-size. */
const resizor = new ResizeObserver((entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    if (!(entry.target instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    computeSize(entry.target, entry.contentRect);
  }
});

/** Manually sets an element as hidden or visible depending on whether it intersects the viewport. */
export const virtualizedSections: string[] = ['mes-chromatiques', 'corbeille', 'chromatiques-ami', 'pokedex'];
const manualLoaders: Map<string, IntersectionObserver> = new Map();
const elementStorage: Map< string, Map<string, Element> > = new Map();

virtualizedSections.forEach(section => {
  const storage = new Map();
  elementStorage.set(section, storage);

  let filterKeys: string[];
  let elementAttribute: string;
  let replacementClasses: string[];
  let rootMargin: number;
  switch (section) {
    case 'pokedex':
      filterKeys = ['caught'];
      elementAttribute = 'dexid';
      replacementClasses = [];
      rootMargin = 256;
      break;

    default:
      filterKeys = Object.keys(computeShinyFilters(new Shiny()));
      elementAttribute = 'huntid';
      replacementClasses = ['surface', 'variant', 'elevation-0'];
      rootMargin = 256;
      break;
  }

  const loader = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (!(entry.target instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
      if (entry.isIntersecting) {
        const elementName = entry.target.getAttribute('data-replaces');
        const elementId = entry.target.getAttribute(`data-${elementAttribute}`);

        if (elementName && elementId) {
          const replacement = storage.get(elementId) ?? document.createElement(elementName);
          if (!replacement.getAttribute(elementAttribute)) {
            replacement.setAttribute(elementAttribute, elementId);
          }

          replacement.setAttribute('style', entry.target.getAttribute('style') ?? '');
          for (const filter of filterKeys) {
            replacement.setAttribute(`data-${filter}`, entry.target.getAttribute(`data-${filter}`) ?? '');
          }

          if ('needsRefresh' in replacement) {
            replacement.needsRefresh = entry.target.getAttribute('data-needs-refresh') === 'true';
          }

          replacement.setAttribute('lang', getCurrentLang());
          replacement.setAttribute('role', entry.target.getAttribute('role'));

          entry.target.parentElement?.replaceChild(replacement, entry.target);
          loader.observe(replacement);
        }
      } else {
        const elementName = entry.target.tagName.toLowerCase();
        const elementId = entry.target.getAttribute(elementAttribute);

        if (elementName && elementId) {
          if ((entry.target as HTMLElement & {obsolete: boolean}).obsolete) {
            storage.delete(elementId);
          } else {
            storage.set(elementId, entry.target);

            const replacement = document.createElement('div');
            replacement.setAttribute('data-replaces', elementName);
            replacement.setAttribute(`data-${elementAttribute}`, elementId);

            replacement.classList.add(...replacementClasses);
            replacement.setAttribute('style', entry.target.getAttribute('style') ?? '');
            for (const filter of filterKeys) {
              replacement.setAttribute(`data-${filter}`, entry.target.getAttribute(`data-${filter}`) ?? '');
            }

            entry.target.parentElement?.replaceChild(replacement, entry.target);
            loader.observe(replacement);
          }
        }
      }
    }
  }, {
    root: document.querySelector(`#${section} > .section-contenu`),
    rootMargin: `${rootMargin}px 0px ${rootMargin}px 0px`
  });

  manualLoaders.set(section, loader);
});

export function clearElementStorage(section: string, id: string) {
  elementStorage.get(section)?.delete(id);
}

function getLazyLoadableCards(section: string): Element[] {
  switch (section) {
    case 'pokedex':
      return [...(document.querySelectorAll(`#${section} :is(dex-icon, [data-replaces="dex-icon"])`) ?? [])];
    default:
      return [...(document.querySelector(`#${section} .liste-cartes`)?.children ?? [])];
  }
}

type LazyLoadingMethod = 'auto' | 'manual';
type LazyLoadingOptions = {
  fixedSize?: boolean
};

/** Computes an element's size whenever it changes, and set it as its contain-intrinsic-size. */
export function lazyLoad(element: Element, method: LazyLoadingMethod = 'auto', { fixedSize = false }: LazyLoadingOptions = {}) {
  switch (method) {
    case 'manual':
      manualLoaders.get(element.closest('section')?.id ?? '')?.observe(element);
      if (fixedSize) break;
    default:
      intersector.observe(element);
      resizor.observe(element);
  }
}

/** Virtualizes a section's list of cards. */
export function lazyLoadSection(section: string) {
  const cards = getLazyLoadableCards(section);
  cards.forEach((card: Element) => lazyLoad(card, 'manual', { fixedSize: true}));
}

/**
 * Stops virtualization of a section's list of cards,
 * leaving every card in its current state (potentially replaced by a placeholder).
 */
export function unLazyLoadSection(section: string) {
  const cards = getLazyLoadableCards(section);
  const observer = manualLoaders.get(section);
  cards.forEach((card: Element) => observer?.unobserve(card));
}