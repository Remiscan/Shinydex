import { noAccent } from '../../Params.js';
// @ts-expect-error
import materialIconsSheet from '../../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import themesSheet from '../../../styles/themes.css.php' assert { type: 'css' };
import { Pokemon } from '../../Pokemon.js';
import { isFiltrableSection, isSearchableSection } from '../../filtres.js';
// @ts-expect-error
import commonSheet from '../../../styles/common.css' assert { type: 'css' };
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
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

      if (event.type === 'reset') searchBar.value = '';
      this.applySearch(simplifiedValue);
    };
  }


  async applySearch(search: string) {
    const searchNonce = {};
    this.searchNonce = searchNonce;

    const section = this.section;
    const element = document.querySelector(`section#${section}`);
    if (!element) return;

    let cardSelector = 'shiny-card';
    switch (section) {
      case 'pokedex': cardSelector = '.pkmnicon'; break;
      case 'chasses-en-cours': cardSelector = 'hunt-card'; break;
      case 'corbeille': cardSelector = 'corbeille-card'; break;
      case 'partage': cardSelector = 'friend-card'; break;
    }

    // Hide non-corresponding cards via CSS
    let css = '';
    if (search.length > 0) {
      if (section === 'pokedex') {
        if (!isNaN(parseFloat(search))) {
          const speciesSelector = `:not([data-dexid="${parseFloat(search)}"])`;
          css += `#${section} ${cardSelector}${speciesSelector} { display: none; }`;
        } else {
          const names = await Pokemon.names();
          const dexids: number[] = [];
          names.forEach((name, dexid) => {
            if (dexid === 0) return;
            const simplifiedName = noAccent(name).toLowerCase();
            if (simplifiedName.includes(search)) dexids.push(dexid);
          });
          const speciesSelector = dexids.map(dexid => `:not([data-dexid="${dexid}"])`).join('');
          css += `#${section} ${cardSelector}${speciesSelector} { display: none; }`;
        }
      } else {
        if (!isNaN(parseFloat(search))) {
          const speciesSelector = `:not([data-dexid="${parseFloat(search)}"])`;
          css += `#${section} ${cardSelector}${speciesSelector} { display: none; }`;
        } else {
          const selector = `:not([data-name*="${search}"]):not([data-species*="${search}"])`;
          css += `#${section} ${cardSelector}${selector} { display: none; }`;
        }
      }
    }

    if (searchNonce !== this.searchNonce) return;
    searchSheet.replaceSync(css);
  }


  update(name: string, value: string | null = this.getAttribute(name)) {
    switch (name) {
      case 'section': {
        if (!isSearchableSection(value ?? '')) return;

        const input = this.shadow.querySelector('[name="search"]')!;
        let placeholder: string = 'Rechercher dans mes Pokémon';

        switch (value) {
          case 'pokedex':
            placeholder = 'Rechercher dans le Pokédex';
            break;
          case 'chasses-en-cours': 
            placeholder = 'Rechercher dans mes chasses';
            break;
          case 'corbeille':
            placeholder = 'Rechercher dans la corbeille';
            break;
          case 'partage':
            placeholder = 'Rechercher dans mes amis';
            break;
          case 'chromatiques-ami':
            placeholder = 'Rechercher dans les Pokémon de {pseudo}';
            break;
        }
        
        input.setAttribute('placeholder', placeholder);
        if (isFiltrableSection(value ?? '')) this.removeAttribute('no-filters');
        else                                 this.setAttribute('no-filters', '');
      } break;
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
    const form = this.shadow.querySelector('form');
    form?.addEventListener('input', this.searchInputHandler);
    form?.addEventListener('reset', this.searchInputHandler);
    form?.addEventListener('submit', this.searchInputHandler);
  }

  disconnectedCallback() {
    const form = this.shadow.querySelector('form');
    form?.removeEventListener('input', this.searchInputHandler);
    form?.removeEventListener('reset', this.searchInputHandler);
    form?.removeEventListener('submit', this.searchInputHandler);
  }

  static get observedAttributes() {
    return ['section'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('search-box')) customElements.define('search-box', SearchBox);