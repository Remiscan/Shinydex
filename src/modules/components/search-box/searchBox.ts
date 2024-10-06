import { noAccent } from '../../Params.js';
import { TranslatedString, translationObserver } from '../../translation.js';
import materialIconsSheet from '../../../../ext/material_icons.css' with { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' with { type: 'css' };
import { Pokemon } from '../../Pokemon.js';
import { isFiltrableSection, isSearchableSection } from '../../filtres.js';
import commonSheet from '../../../../styles/common.css' with { type: 'css' };
import { getString } from '../../translation.js';
import { BottomSheet } from '../bottomSheet.js';
import sheet from './styles.css' with { type: 'css' };
import template from './template.js';



const searchSheet = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, searchSheet];



export class SearchBox extends HTMLElement {
  shadow: ShadowRoot;
  searchNonce: object = {};
  searchInputHandler: (e: Event) => void;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [materialIconsSheet, themesSheet, commonSheet, sheet];

    // Called when text is input in the search bar.
    // Creates search hints.
    this.searchInputHandler = async event => {
      event.preventDefault();
      const searchBar = this.shadow.querySelector('[role="searchbox"]');
      if (!(searchBar instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
      const accentedValue = event.type === 'reset' ? '' : searchBar.value;
      const simplifiedValue = noAccent(accentedValue).toLowerCase();

      if (simplifiedValue.length > 0) this.setAttribute('resetable', '');
      else                            this.removeAttribute('resetable');
      if (event.type === 'reset') searchBar.value = '';
      this.applySearch(simplifiedValue);
    };
  }


  applySearch(search: string) {
    const searchNonce = {};
    this.searchNonce = searchNonce;

    const section = this.section;
    const sectionElement = document.querySelector(`section#${section}`);
    if (!sectionElement) return;

    let cardSelector = ':is(shiny-card, [data-replaces="shiny-card"])';
    switch (section) {
      case 'pokedex': cardSelector = ':is(dex-icon, [data-replaces="dex-icon"])'; break;
      case 'chasses-en-cours': cardSelector = ':is(hunt-card, [data-replaces="hunt-card"])'; break;
      case 'corbeille': cardSelector = ':is(corbeille-card, [data-replaces="corbeille-card"])'; break;
      case 'partage': cardSelector = ':is(friend-card, [data-replaces="friend-card"])'; break;
      case 'chromatiques-ami': cardSelector = ':is(friend-shiny-card, [data-replaces="friend-shiny-card"])'; break;
    }

    // Hide non-corresponding cards via CSS
    let css = '';
    let selector = '';
    if (search.length > 0) {
      if (section === 'pokedex') {
        if (!isNaN(parseFloat(search))) {
          selector = `:not([dexid="${parseFloat(search)}"]):not([data-dexid="${parseFloat(search)}"])`;
          css += `#${section} ${cardSelector}${selector} { display: none; }`;
        } else {
          const names = Pokemon.names();
          const dexids: number[] = [];
          names.forEach((name, dexid) => {
            if (dexid === 0) return;
            const simplifiedName = noAccent(name).toLowerCase();
            if (simplifiedName.includes(search)) dexids.push(dexid);
          });
          selector = dexids.map(dexid => `:not([dexid="${dexid}"]):not([data-dexid="${dexid}"])`).join('');
          css += `#${section} ${cardSelector}${selector} { display: none; }`;
        }
      } else if (section === 'partage') {
        selector = `:not([data-username*="${search}"]):not([data-species*="${search}"])`;
        css += `#${section} ${cardSelector}${selector} { display: none; }`;
      } else {
        if (!isNaN(parseFloat(search))) {
          selector = `:not([data-dexid="${parseFloat(search)}"])`;
          css += `#${section} ${cardSelector}${selector} { display: none; }`;
        } else {
          selector = `:not([data-name*="${search}"]):not([data-species*="${search}"])`;
          css += `#${section} ${cardSelector}${selector} { display: none; }`;
        }
      }

      const cardsInSection = sectionElement.querySelectorAll(`${cardSelector}`);
      const hiddenCards = sectionElement.querySelectorAll(`${cardSelector}${selector}`);
      const displayedCardsCount = cardsInSection.length - hiddenCards.length;
      if (displayedCardsCount === 0) sectionElement.classList.add('vide-recherche');
      else                           sectionElement.classList.remove('vide-recherche');
    } else {
      sectionElement.classList.remove('vide-recherche');
    }

    if (searchNonce !== this.searchNonce) return;
    searchSheet.replaceSync(css);
  }


  update(name: string, value: string | null = this.getAttribute(name)) {
    switch (name) {
      case 'section': {
        if (!isSearchableSection(value ?? '')) return;

        const input = this.shadow.querySelector('[name="search"]')!;
        const placeholder = getString(`search-${value}` as TranslatedString);
        
        input.setAttribute('placeholder', placeholder);
        input.setAttribute('data-placeholder', `search-${value}`);
        input.setAttribute('label', placeholder);
        input.setAttribute('data-label', `search-${value}`);

        const label = this.shadow.querySelector('label[for="search"]');
        label?.setAttribute('aria-label', placeholder);
        label?.setAttribute('data-label', `search-${value}`);

        let sectionToFilter = value;
        if (value === 'pokedex') sectionToFilter = 'mes-chromatiques';
        if (isFiltrableSection(sectionToFilter ?? '')) {
          this.removeAttribute('no-filters');
        } else {
          this.setAttribute('no-filters', '');
        }
      } break;

      case 'lang':
        translationObserver.translate(this, value ?? '');
        break;
    }
  }


  openFilterMenu = (event: Event) => {
    event.stopPropagation();
    const filterMenuSheet = document.querySelector('#filter-menu');
    if (filterMenuSheet instanceof BottomSheet) {
      filterMenuSheet.setAttribute('data-section', this.section ?? '');
      filterMenuSheet.show();
    }
  }


  get section() {
    const value = this.getAttribute('section') ?? '';
    if (isSearchableSection(value)) return value;
    else return null;
  }

  set section(value: string | null) {
    const _value = value ?? '';
    this.setAttribute('section', isSearchableSection(_value) ? _value : '');
  }
  

  connectedCallback() {
    translationObserver.serve(this, { method: 'attribute' });

    const form = this.shadow.querySelector('form');
    form?.addEventListener('input', this.searchInputHandler);
    form?.addEventListener('reset', this.searchInputHandler);
    form?.addEventListener('submit', this.searchInputHandler);

    const filterButton = this.shadow.querySelector('[data-action="open-filter-menu"]');
    filterButton?.addEventListener('click', this.openFilterMenu);
  }

  disconnectedCallback() {
    translationObserver.unserve(this);

    const form = this.shadow.querySelector('form');
    form?.removeEventListener('input', this.searchInputHandler);
    form?.removeEventListener('reset', this.searchInputHandler);
    form?.removeEventListener('submit', this.searchInputHandler);

    const filterButton = this.shadow.querySelector('[data-action="open-filter-menu"]');
    filterButton?.removeEventListener('click', this.openFilterMenu);
  }

  static get observedAttributes() {
    return ['section', 'lang'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('search-box')) customElements.define('search-box', SearchBox);