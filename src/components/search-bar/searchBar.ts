import { Params, noAccent, wait } from '../../Params.js';
import { Pokemon } from '../../Pokemon.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';
// @ts-expect-error
import gameNames from '../../../strings/games.json' assert { type: 'json' };
import { FilterList, FiltrableSection, Search, currentFilters, filterSection, isFiltrableSection, saveFilters } from '../../filtres.js';



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
      const accentedValue = event.type === 'reset' ? '' : searchBar.value;
      const simplifiedValue = noAccent(accentedValue).toLowerCase();

      // Build search hints based on user input
      const hintsContainer = this.querySelector('.search-hints')!;
      const hintTemplate: HTMLTemplateElement = document.querySelector('#search-hint-template')!;

      // Remove previous hints
      hintsContainer.innerHTML = '';

      if (event.type === 'reset' && this.section) {
        this.searchSection(this.section, null);
        return;
      }

      const newHints = [];

      // - Pokémon nickname
      nickname: {
        if (accentedValue.length <= 0) break nickname;

        const hint = hintTemplate.content.cloneNode(true);
        if (!(hint instanceof DocumentFragment)) throw new TypeError(`Expecting DocumentFragment`);
        const input = hint.querySelector('input')!;
        const label = hint.querySelector('label')!;
        const text = label?.querySelector('span')!;
        input.setAttribute('id', 'chip-nickname');
        input.setAttribute('name', 'chip-nickname');
        input.value = simplifiedValue;
        label.setAttribute('for', 'chip-nickname');
        text.innerHTML = `Surnom contenant "${accentedValue}"`;
        newHints.push(hint);
      }

      // - Pokémon species
      species: {
        if (accentedValue.length <= 2) break species;

        const allNames = await Pokemon.names();
        const fittingNames: Set<{ name: string, dexid: number }> = new Set();
        allNames.forEach((name, dexid) => {
          const simplifiedName = noAccent(name).toLowerCase();
          if (simplifiedName.includes(simplifiedValue)) {
            fittingNames.add({ name, dexid });
          }
        });

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
        if (accentedValue.length <= 2) break game;

        const lang = document.documentElement.getAttribute('lang');
        const allGames: { name: string, uid: string }[] = Pokemon.jeux.map(j => { return { name: gameNames[lang][j.uid], uid: j.uid }; });
        const fittingNames: Set<{ name: string, uid: string }> = new Set();
        allGames.forEach(game => {
          const simplifiedName = noAccent(game.name).toLocaleLowerCase();
          if (simplifiedName.includes(simplifiedValue)) {
            fittingNames.add({ name: game.name, uid: game.uid });
          }
        });

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
          text.innerHTML = `Jeu : ${name}`;
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
      const section = this.getAttribute('section') ?? '';
      if (!isFiltrableSection(section)) return;

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

      const newFilters = this.formToFilters(formData);
      currentFilters.set(section, newFilters);
      filterSection(section, newFilters);

      // Save filters if needed
      const shouldSaveFilters = (section === 'mes-chromatiques');
      if (shouldSaveFilters) {
        await saveFilters();
      }

      // Change l'icône de retour en ✅ si un filtre a été modifié
      const icon = this.querySelector('.bouton-retour>.material-icons')!;
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
    this.querySelector('.bouton-retour>.material-icons')!.innerHTML = 'arrow_back';
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
  formToFilters(formData: FormData): FilterList {
    const section = this.section ?? '';
    if (!isFiltrableSection(section)) throw new Error(`Should not be trying to filter ${section}`);
    return new FilterList(section, formData);
  }


  /** Checks options inputs corresponding to a list of filters. */
  filtersToForm(filters: FilterList) {
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
          if (filter && filter.has(value === 'true')) input.checked = true;
          else                                        input.checked = false;
        }
      }
    }
  }


  searchSection(section: FiltrableSection, search: Search | null) {
    const element = document.querySelector(`section#${section}`);
    if (!element) return;

    // Hide non-corresponding cards via CSS
    let css = '';
    if (search instanceof Search) {
      const card = `:is(shiny-card, hunt-card, corbeille-card)`;
      if (search.name.length > 0) {
        css += `#${section} ${card}:not([data-name*="${search.name}"]) { display: none; }`;
      }
      if (search.game.size > 0) {
        const gameSelector = [...search.game].map(g => `:not([data-game="${g}"])`).join('');
        css += `#${section} ${card}${gameSelector} { display: none; }`;
      }
      if (search.species.size > 0) {
        const speciesSelector = [...search.species].map(i => `:not([data-dexid="${i}"])`).join('');;
        css += `#${section} ${card}${speciesSelector} { display: none; }`;
      }
    }
    searchSheet.replaceSync(css);
  }


  update(name: string, value: string | null = this.getAttribute(name)) {
    if (!this.ready) return;
    switch (name) {
      case 'section': {
        if (!isFiltrableSection(value ?? '')) return;

        const input = this.querySelector('input')!;
        let placeholder: string = 'Rechercher dans mes Pokémon';
        let searchSection: FiltrableSection = 'mes-chromatiques';

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

        const filters = currentFilters.get(searchSection) ?? new FilterList(searchSection);

        // On applique au formulaire les filtres enregistrés de la section demandée.
        // Si aucun n'est sauvegardé, on applique les filtres par défaut.
        this.filtersToForm(filters);
        filterSection(searchSection, filters);

        // Si les filtres ne sont pas sauvegardés pour les sections qui enregistrent leurs filtres,
        // on sauvegarde les filtres par défaut.
        const shouldSaveFilters = (searchSection === 'mes-chromatiques');
        if (shouldSaveFilters) saveFilters();
      } break;
    }
  }


  get section() {
    const value = this.getAttribute('section') ?? '';
    if (isFiltrableSection(value)) return value;
    else return null;
  }
  set section(value) {
    this.setAttribute('section', isFiltrableSection(value ?? '') ? (value ?? '') : '');
  }
  

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

    const searchInput = this.querySelector('input[name="search"]');
    searchInput?.addEventListener('input', this.searchInputHandler);

    const searchForm = this.querySelector('form[name="search-bar"]');
    searchForm?.addEventListener('change', this.searchSuggestionsChangeHandler);
    searchForm?.addEventListener('reset', this.searchInputHandler);

    const filterForm = this.querySelector('form[name="search-options"]');
    filterForm?.addEventListener('change', this.filtersChangeHandler);

  }

  disconnectedCallback() {
    const searchInput = this.querySelector('input[name="search"]');
    searchInput?.removeEventListener('input', this.searchInputHandler);

    const searchForm = this.querySelector('form[name="search-bar"]');
    searchForm?.removeEventListener('change', this.searchSuggestionsChangeHandler);
    searchForm?.removeEventListener('reset', this.searchInputHandler);

    const filterForm = this.querySelector('form[name="search-options"]');
    filterForm?.removeEventListener('change', this.filtersChangeHandler);

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