import { Params, wait } from '../../Params.js';
import { FilterList, FiltrableSection, currentFilters, filterSection, isFiltrableSection, saveFilters } from '../../filtres.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



const searchSheet = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, searchSheet];



export class SearchBar extends HTMLElement {
  ready: boolean = false;
  htmlready: boolean = false;
  inputNonce: object = {};
  changeNonce: object = {};
  filtersChangeHandler: (e: Event) => void = () => {};

  constructor() {
    super();

    // Called when filters or order are selected or unselected.
    // Filters the current section.
    this.filtersChangeHandler = async event => {
      const section = this.section;
      if (!section) return;

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
    };
  }


  open() {
    document.body.setAttribute('data-search', 'true');
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


  update(name: string, value: string | null = this.getAttribute(name)) {
    if (!this.ready) return;
    switch (name) {
      case 'section': {
        if (!isFiltrableSection(value ?? '')) return;

        let searchSection: FiltrableSection = 'mes-chromatiques';

        switch (value) {
          case 'chasses-en-cours': 
            searchSection = value;
            break;
          case 'corbeille':
            searchSection = value;
            break;
          case 'partage':
            searchSection = value;
            break;
          case 'chromatiques-ami':
            searchSection = value;
            break;
        }

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

    const filterForm = this.querySelector('form[name="search-options"]');
    filterForm?.addEventListener('change', this.filtersChangeHandler);

  }

  disconnectedCallback() {
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