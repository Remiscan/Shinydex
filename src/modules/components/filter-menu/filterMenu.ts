import { FilterList, filterSection, isFiltrableSection, orderCards, saveFilters } from '../../filtres.js';
import { dataStorage } from '../../localForage.js';
import materialIconsSheet from '../../../../ext/material_icons.css' assert { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' assert { type: 'css' };
import commonSheet from '../../../../styles/common.css' assert { type: 'css' };
import { translationObserver } from '../../translation.js';
import { CheckBox } from '../checkBox.js';
import { InputSelect } from '../inputSelect.js';
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

      const sectionElement = document.querySelector(`#${section}`);
      if (!(sectionElement instanceof HTMLElement)) throw new TypeError('Expecting HTMLElement');
      const oldFilters = {
        order: sectionElement.getAttribute('data-order') ?? '',
        orderReversed: sectionElement.getAttribute('data-order-reversed') === 'true'
      };

      filterSection(section, newFilters);
      if (newFilters.order !== oldFilters.order || newFilters.orderReversed !== oldFilters.orderReversed) {
        await orderCards(section, undefined, newFilters.order, newFilters.orderReversed);
      }
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
      if (input instanceof InputSelect) input.value = filters.order;
      else input?.setAttribute('value', filters.order);
    }
  
    orderReverse: {
      const input = this.shadow.querySelector(`[name="orderReversed"]`);
      if (input instanceof CheckBox) input.checked = filters.orderReversed;
      else input?.setAttribute('checked', String(filters.orderReversed));
    }
  
    filters: {
      const allInputs = [...this.shadow.querySelectorAll('[name^="filter"]')];
      for (const input of allInputs) {
        const [x, key, value] = input.getAttribute('name')!.split('-');
        if (FilterList.isKey(key) && key !== 'order' && key !== 'orderReversed') {
          const filter = filters[key];
          const checked = filter && filter.has(value === 'true');
          if (input instanceof CheckBox) input.checked = checked;
          else input?.setAttribute('checked', String(checked));
        }
      }
    }
  }


  /** Resets the filters. */
  reset() {
    const section = this.section ?? '';
    if (!isFiltrableSection(section)) throw new Error(`Should not be trying to filter ${section}`);
    const newFilters = new FilterList(section);
    this.filtersToForm(newFilters);
    this.filtersChangeHandler(new Event('change'));
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

          const input = this.shadow.querySelector('[name="order"]');
          const validOptions = new DocumentFragment();

          // On applique l'ordre sauvegardé pour cette section avant regénération des options
          input?.setAttribute('value', filters.order);

          // On crée les options du input-select qui correspondent à la section
          const optionsTemplate = this.shadow.querySelector('template#orders-select-options') as HTMLTemplateElement;
          const options = optionsTemplate.content.querySelectorAll('option');
          for (const option of options) {
            if (option.matches(`[data-section~="${section}"]`)) {
              validOptions.appendChild(option);
            }
          }

          input?.querySelectorAll('option').forEach(option => option.remove());
          input?.appendChild(validOptions);

          // On applique au formulaire les filtres enregistrés de la section demandée.
          // Si aucun n'est sauvegardé, on applique les filtres par défaut.
          this.filtersToForm(filters);
          filterSection(section, filters);
          this.saveFilters(filters);
        }

        this.#initialized = true;
        this.dispatchEvent(new Event('initialized'));
      } break;

      case 'lang':
        translationObserver.translate(this, value ?? '');
        break;
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
    translationObserver.serve(this, { method: 'attribute' });

    const filterForm = this.shadow.querySelector('form[name="search-options"]');
    filterForm?.addEventListener('change', this.filtersChangeHandler);

  }

  disconnectedCallback() {
    translationObserver.unserve(this);

    const filterForm = this.shadow.querySelector('form[name="search-options"]');
    filterForm?.removeEventListener('change', this.filtersChangeHandler);
  }

  static get observedAttributes() {
    return ['section', 'lang'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('filter-menu')) customElements.define('filter-menu', FilterMenu);