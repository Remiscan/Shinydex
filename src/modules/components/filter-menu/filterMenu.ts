import { FilterList, filterSection, isFiltrableSection, saveFilters } from '../../filtres.js';
import { dataStorage } from '../../localForage.js';
// @ts-expect-error
import materialIconsSheet from '../../../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import themesSheet from '../../../../styles/themes.css.php' assert { type: 'css' };
// @ts-expect-error
import commonSheet from '../../../../styles/common.css' assert { type: 'css' };
import { CheckBox } from '../checkBox.js';
import { RadioGroup } from '../radioGroup.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



const searchSheet = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, searchSheet];



export class FilterMenu extends HTMLElement {
  shadow: ShadowRoot;
  #initialized: Boolean = false;
  filtersChangeHandler: (e: Event) => void = () => {};

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [materialIconsSheet, themesSheet, commonSheet, sheet];

    // Called when filters or order are selected or unselected.
    // Filters the current section.
    this.filtersChangeHandler = async event => {
      const section = this.section;
      if (!section) return;

      const form = this.shadow.querySelector('form[name="search-options"]');
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
      filterSection(section, newFilters);
      await this.saveFilters(newFilters);
    };
  }


  open() {
    document.body.setAttribute('data-filters', this.section ?? '');
  }


  close() {
    document.body.removeAttribute('data-filters');
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
      const input = this.shadow.querySelector(`[name="order"]`);
      if (!(input instanceof RadioGroup)) throw new TypeError(`Expecting RadioGroup`);
      input.value = filters.order;
    }
  
    orderReverse: {
      const input = this.shadow.querySelector(`[name="orderReversed"]`);
      if (!(input instanceof CheckBox)) throw new TypeError(`Expecting CheckBox`);
      input.checked = filters.orderReversed;
    }
  
    filters: {
      const allInputs = [...this.shadow.querySelectorAll('[name^="filter"]')];
      for (const input of allInputs) {
        if (!(input instanceof CheckBox)) throw new TypeError(`Expecting CheckBox`);
        const [x, key, value] = input.getAttribute('name')!.split('-');
        if (FilterList.isKey(key) && key !== 'order' && key !== 'orderReversed') {
          const filter = filters[key];
          if (filter && filter.has(value === 'true')) input.checked = true;
          else                                        input.checked = false;
        }
      }
    }
  }


  async saveFilters(filters: FilterList) {
    if (!this.section) return;
    await saveFilters(this.section, filters);
  }


  async update(name: string, value: string | null = this.getAttribute(name)) {
    switch (name) {
      case 'section': {
        const section = this.section ?? '';
        if (isFiltrableSection(section)) {
          const savedFilters = await dataStorage.getItem('filters');
          const filters: FilterList = new FilterList(section, savedFilters?.get(section));

          // On supprime les options des radio-group qui ne correspondent pas à la section
          this.shadow.querySelectorAll('radio-group').forEach(radioGroup => {
            // On choisit la valeur par défaut
            if (radioGroup.getAttribute('name') === 'order') {
              radioGroup.setAttribute('value', filters.order);
            }

            // On supprime les options inutiles
            radioGroup.querySelectorAll('option').forEach(option => {
              if (!(option.matches(`[data-section~="${section}"]`))) option.remove();
            });
          });

          // On applique au formulaire les filtres enregistrés de la section demandée.
          // Si aucun n'est sauvegardé, on applique les filtres par défaut.
          this.filtersToForm(filters);
          filterSection(section, filters);
          this.saveFilters(filters);
        }

        this.#initialized = true;
        this.dispatchEvent(new Event('initialized'));
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


  async init() {
    if (this.#initialized) return;
    else return new Promise(resolve => {
      this.addEventListener('initialized', resolve);
    });
  }
  

  connectedCallback() {
    const filterForm = this.shadow.querySelector('form[name="search-options"]');
    filterForm?.addEventListener('change', this.filtersChangeHandler);

  }

  disconnectedCallback() {
    const filterForm = this.shadow.querySelector('form[name="search-options"]');
    filterForm?.removeEventListener('change', this.filtersChangeHandler);
  }

  static get observedAttributes() {
    return ['section'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('filter-menu')) customElements.define('filter-menu', FilterMenu);