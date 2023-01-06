import { Params, noAccent, wait } from '../../Params.js';
import { Pokemon } from '../../Pokemon.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';
// @ts-expect-error
import gameNames from '../../../strings/games.json' assert { type: 'json' };
import { FilterList, Search, filtrableSection, isFiltrableSection } from '../../filtres.js';
import { dataStorage } from '../../localForage.js';



const searchSheet = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, searchSheet];



export class SearchBar extends HTMLElement {
  ready: boolean = false;
  htmlready: boolean = false;
  inputNonce: object = {};
  changeNonce: object = {};
  searchInputHandler: (e: Event) => void = () => {};
  searchSuggestionsChangeHandler: (e: Event) => void = () => {};
  filtersChangeHandler: (e: Event) => void = () => {};

  constructor() {
    super();

    // Called when text is input in the search bar.
    // Creates search hints.
    this.searchInputHandler = async event => {
      const inputNonce = {};
      this.inputNonce = inputNonce;

      const searchBar = this.querySelector('[role="searchbox"]');
      if (!(searchBar instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
      const value = event.type === 'reset' ? '' : noAccent(searchBar.value).toLowerCase();

      // Build search hints based on user input
      const hintsContainer = this.querySelector('.search-hints')!;
      const hintTemplate: HTMLTemplateElement = hintsContainer.querySelector('#search-hint-template')!;

      // Remove previous hints
      hintsContainer.querySelectorAll(':not(template, legend)').forEach(e => e.remove());

      const newHints = [];

      // - Pokémon nickname
      nickname: {
        if (value.length <= 0) break nickname;

        const hint = hintTemplate.content.cloneNode(true);
        if (!(hint instanceof DocumentFragment)) throw new TypeError(`Expecting DocumentFragment`);
        const input = hint.querySelector('input')!;
        const label = hint.querySelector('label')!;
        const text = label?.querySelector('span')!;
        input.setAttribute('id', 'chip-nickname');
        input.setAttribute('name', 'chip-nickname');
        input.value = value;
        label.setAttribute('for', 'chip-nickname');
        text.innerHTML = `Surnom : ${value}`;
        newHints.push(hint);
      }

      // - Pokémon species
      species: {
        if (value.length <= 2) break species;

        const allNames = await Pokemon.names();
        const fittingNames: Set<{ name: string, dexid: number }> = new Set();
        allNames.forEach((name, dexid) => { if (name.includes(value)) fittingNames.add({ name, dexid }) });

        for (const { name, dexid } of fittingNames) {
          const hint = hintTemplate.content.cloneNode(true);
          if (!(hint instanceof DocumentFragment)) throw new TypeError(`Expecting DocumentFragment`);
          const input = hint.querySelector('input')!;
          const label = hint.querySelector('label')!;
          const text = label?.querySelector('span')!;
          input.setAttribute('id', `chip-species-${dexid}`);
          input.setAttribute('name', `chip-species-${dexid}`);
          input.value = String(dexid);
          label.setAttribute('for', `chip-species-${dexid}`);
          text.innerHTML = `Espèce : ${name.charAt(0).toUpperCase() + name.slice(1)}`;
          newHints.push(hint);
        }
      }

      // - Pokémon game
      game: {
        if (value.length <= 2) break game;

        const lang = document.documentElement.getAttribute('lang');
        const allGames: { name: string, uid: string }[] = Pokemon.jeux.map(j => { return { name: gameNames[lang][j.uid].toLowerCase(), uid: j.uid }; });
        const fittingNames: Set<{ name: string, uid: string }> = new Set();
        allGames.forEach(game => { if (game.name.includes(value)) fittingNames.add({ name: game.name, uid: game.uid }) });

        for (const { name, uid } of fittingNames) {
          const hint = hintTemplate.content.cloneNode(true);
          if (!(hint instanceof DocumentFragment)) throw new TypeError(`Expecting DocumentFragment`);
          const input = hint.querySelector('input')!;
          const label = hint.querySelector('label')!;
          const text = label?.querySelector('span')!;
          input.setAttribute('id', `chip-game-${uid}`);
          input.setAttribute('name', `chip-game-${uid}`);
          input.value = uid;
          label.setAttribute('for', `chip-game-${uid}`);
          text.innerHTML = `Jeu : ${name.charAt(0).toUpperCase() + name.slice(1)}`;
          newHints.push(hint);
        }
      }

      if (this.inputNonce === inputNonce) {
        for (const hint of newHints) {
          hintsContainer.appendChild(hint);
        }
      }
    };

    // Called when search hints are selected or unselected.
    // Filters current section.
    this.searchSuggestionsChangeHandler = event => {
      const section = this.getAttribute('section') ?? '';
      if (!isFiltrableSection(section)) return;

      const form = this.querySelector('form[name="search-bar"]');
      if (!(form instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
      const formData = new FormData(form);

      // Add checkboxes state to formData
      const checkboxes = [...form.querySelectorAll('input[type="checkbox"][name]')];
      checkboxes.forEach(checkbox => {
        if (!(checkbox instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
        const name = checkbox.getAttribute('name')!;
        if (!checkbox.checked) formData.append(name, 'false');
      });

      const newSearch = new Search(formData);
      this.searchSection(section, newSearch);
    };

    // Called when filters or order are selected or unselected.
    // Filters the current section.
    this.filtersChangeHandler = async event => {
      const section = this.getAttribute('section');

      const form = this.querySelector('form[name="search-options"]');
      if (!(form instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
      const formData = new FormData(form);
    
      // Add checkboxes state to formData
      const checkboxes = [...form.querySelectorAll('input[type="checkbox"][name]')];
      checkboxes.forEach(checkbox => {
        if (!(checkbox instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
        const name = checkbox.getAttribute('name')!;
        if (!checkbox.checked) formData.append(name, 'false');
      });

      const newFilters = this.optionsToFilters(formData);

      // Save filters if needed
      const shouldSaveFilters = (section === 'mes-chromatiques');
      if (shouldSaveFilters) {
        const savedFilters = await dataStorage.getItem('filters');
        savedFilters.set(section, newFilters);
        await dataStorage.setItem('filters', savedFilters);
      }

      // Change l'icône de retour en ✅ si un filtre a été modifié
      const icon = this.querySelector('.bouton-retour>i')!;
      if (icon.innerHTML !== 'done') {
        const anims: { start?: Animation, end?: Animation } = {};

        anims.start = icon.animate([
          { transform: 'translate3D(0, 0, 0) rotate(0)', opacity: '1' },
          { transform: 'translate3D(0, 0, 0) rotate(90deg)', opacity: '0' }
        ], {
          easing: Params.easingAccelerate,
          duration: 100,
          fill: 'forwards'
        });
        await wait(anims.start);

        icon.innerHTML = 'done';
        
        anims.end = icon.animate([
          { transform: 'translate3D(0, 0, 0) rotate(-90deg)', opacity: '0' },
          { transform: 'translate3D(0, 0, 0) rotate(0)', opacity: '1' }
        ], {
          easing: Params.easingDecelerate,
          duration: 100,
          fill: 'backwards'
        });
        await wait(anims.end);

        anims.start?.cancel();
        anims.end?.cancel();
      }
    };
  }


  open() {
    this.querySelector('.bouton-retour>i')!.innerHTML = 'arrow_back';
    document.body.setAttribute('data-search', 'true');
    this.animate([
      { clipPath: 'circle(0 at top center)' },
      { clipPath: 'circle(142% at top center)' }
    ], {
      duration: 500,
      easing: Params.easingDecelerate,
      fill: 'backwards'
    });
    this.querySelector('input')!.focus();
  }


  close() {
    document.body.removeAttribute('data-search');
  }


  /** Builds Filters from the selected options. */
  optionsToFilters(formData: FormData): FilterList {
    const section = this.section ?? '';
    if (!isFiltrableSection(section)) throw new Error(`Should not be trying to filter ${section}`);
    return new FilterList(section, formData);
  }


  /** Checks options inputs corresponding to a list of filters. */
  filtersToOptions(filters: FilterList) {
    order: {
      const input = this.querySelector(`input[name="order"][value="${filters.order}"]`);
      if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
      input.checked = true;
    }
  
    orderReverse: {
      const input = this.querySelector(`input[name="orderReversed"]`);
      if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
      input.checked = filters.orderReversed;
    }
  
    filters: {
      const allInputs = [...this.querySelectorAll('input[name^="filter"]')];
      for (const input of allInputs) {
        if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
        const [x, key, value] = input.getAttribute('name')!.split('-');
        if (FilterList.isKey(key) && key !== 'order' && key !== 'orderReversed') {
          const filter = filters[key];
          if (filter && (filter.size === 0 || filter.has(Boolean(value)))) input.checked = true;
          else                                                             input.checked = false;
        }
      }
    }
  }


  filterSection(section: filtrableSection, filters: FilterList) {
    const element = document.querySelector(`section#${section}`);
    if (!element) return;
    element.setAttribute('data-filter-mine', [filters.mine].map(f => String(f)).join(' '));
    element.setAttribute('data-filter-legit', [filters.legit].map(f => String(f)).join(' '));
    element.setAttribute('data-order', filters.order);
    element.setAttribute('data-order-reversed', String(filters.orderReversed));
  }


  searchSection(section: filtrableSection, search: Search) {
    const element = document.querySelector(`section#${section}`);
    if (!element) return;

    // Hide non-corresponding cards via CSS
    let css = '';
    const card = `:is(pokemon-card, hunt-card, corbeille-card)`;
    css += `#${section} ${card}:not([data-name*="${search.name}"]) { display: none; }`;
    const gameSelector = [...search.game].map(g => `:not([data-game="${g}"])`).join('');
    css += `#${section} ${card}${gameSelector} { display: none; }`;
    const speciesSelector = [...search.species].map(i => `:not([data-dexid="${i}"])`).join('');;
    css += `#${section} ${card}${speciesSelector} { display: none; }`;
    searchSheet.replaceSync(css);
  }


  async update(name: string, value: string | null = this.getAttribute(name)) {
    if (!this.ready) return;
    switch (name) {
      case 'section': {
        if (!isFiltrableSection(value ?? '')) return;

        const input = this.querySelector('input')!;
        let placeholder: string = 'Rechercher dans mes Pokémon';
        let searchSection: filtrableSection = 'mes-chromatiques';

        switch (value) {
          case 'chasses-en-cours': 
            placeholder = 'Rechercher dans mes chasses';
            searchSection = value;
            break;
          case 'corbeille':
            placeholder = 'Rechercher dans la corbeille';
            searchSection = value;
            break;
          case 'partage':
            placeholder = 'Rechercher dans mes amis';
            searchSection = value;
            break;
          case 'chromatiques-ami':
            placeholder = 'Rechercher dans les Pokémon de {pseudo}';
            searchSection = value;
            break;
        }
        
        input.setAttribute('placeholder', placeholder);

        if (value === 'ajouter-ami') return;

        let defaultFilters: FilterList;
        switch (searchSection) {
          case 'chasses-en-cours':
            defaultFilters = {
              mine: new Set([true, false]),
              legit: new Set([true, false]),
              order: 'lastUpdate',
              orderReversed: false
            };
            break;
          default:
            defaultFilters = {
              mine: new Set([true, false]),
              legit: new Set([true, false]),
              order: 'catchTime',
              orderReversed: false
            };
        }

        let savedFilters = await dataStorage.getItem('filters');
        if (!savedFilters) {
          savedFilters = new Map();
          savedFilters.set(searchSection, defaultFilters);
        }
        const filters = savedFilters.get(searchSection) ?? defaultFilters;

        // On applique au formulaire les filtres enregistrés de la section demandée.
        // Si aucun n'est sauvegardé, on applique les filtres par défaut.
        this.filtersToOptions(filters);
        this.filterSection(searchSection, filters);

        // Si les filtres ne sont pas sauvegardés pour les sections qui enregistrent leurs filtres,
        // on sauvegarde les filtres par défaut.
        const shouldSaveFilters = (searchSection === 'mes-chromatiques');
        if (shouldSaveFilters) {
          savedFilters.set(searchSection, filters);
          await dataStorage.setItem('filters', savedFilters);
        }
      } break;
    }
  }


  get section() { return this.getAttribute('section'); }
  set section(value) { this.setAttribute('section', value ?? ''); }
  

  connectedCallback() {
    if (!this.htmlready) {
      this.appendChild(template.content.cloneNode(true));
      this.htmlready = true
    }
    if (!(document.adoptedStyleSheets.includes(sheet))) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
    this.ready = true;

    for (const attr of SearchBar.observedAttributes) {
      this.update(attr);
    }

    const searchBox = this.querySelector('form[name="search-bar"]')!;
    searchBox.addEventListener('input', this.searchInputHandler);
    searchBox.addEventListener('reset', this.searchInputHandler);

    const searchOptions = this.querySelector('.search-options')!;
    searchOptions.addEventListener('change', this.filtersChangeHandler);
  }

  disconnectedCallback() {
    const searchBox = this.querySelector('form[name="search-bar"]')!;
    searchBox.removeEventListener('input', this.searchInputHandler);
    searchBox.removeEventListener('reset', this.searchInputHandler);

    const searchOptions = this.querySelector('.search-options')!;
    searchOptions.removeEventListener('change', this.filtersChangeHandler);

    this.ready = false;
  }

  static get observedAttributes() {
    return ['section'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('search-bar')) customElements.define('search-bar', SearchBar);