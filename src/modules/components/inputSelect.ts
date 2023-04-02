/**
 * Partially derived from https://www.w3.org/WAI/ARIA/apg/example-index/combobox/combobox-select-only.html
 * under W3C Software License (https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)
 */



import { backFromTopLayer, closeTopLayer, openTopLayer, toTopLayer } from '../topLayer.js';
import { TextField } from './textField.js';
import { TranslatedString, getString, translationObserver } from '../translation.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form>
    <label class="text-field surface standard elevation-2 interactive" part="container">
      <span class="leading-icon">
        <slot name="leading-icon"></slot>
      </span>
      <span class="label body-medium">
        <slot name="label"></slot>
      </span>
      <span
        tabindex="0"
        part="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="options-list"
      ></span>
      <span class="material-icons trailing-icon" aria-hidden="true">
        <slot name="trailing-icon"></slot>
        <span class="error-icon">error</span>
      </span>
      <div
        role="listbox"
        id="options-list"
        class="surface standard primary shadow elevation-3 select-menu"
        style="
          padding: 4px;
          display: flex;
          flex-direction: column;
          flex-wrap: no-wrap;
          gap: 4px;
          position: fixed;
          box-sizing: border-box;
          overflow: auto;
        "
        hidden
      >
      </div>
      <datalist hidden>
        <slot></slot>
      </datalist>
    </label>
  </form>
`;



const optionTemplate = document.createElement('template');
optionTemplate.innerHTML = /*html*/`
  <span role="option" part="option" id="option-{key}" class="surface interactive"
    data-value="{value}" aria-selected="false"
    {attr}
  >
    <span class="material-icons" part="icon icon-unchecked" aria-hidden="true">
      <slot name="icon-unchecked">radio_button_unchecked</slot>
    </span>
    <span class="material-icons" part="icon icon-checked" aria-hidden="true">
      <slot name="icon-checked">check</slot>
    </span>
    <span part="option-label" class="label-large" data-string="{stringKey}">{label}</span>
  </span>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  [role="combobox"] {
    all: unset;
    grid-row: 2;
    grid-column: text;
    display: grid;
    grid-template-columns: 1fr 24px;
    align-items: center;
    color: rgb(var(--on-surface));
    white-space: nowrap;
  }

  [role="combobox"]::before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  [role="combobox"]::after {
    content: 'expand_more';
    font-family: 'Material Icons';
    font-size: 24px;
    margin-block: -12px;
  }

  [hidden] {
    display: none !important;
  }
`);


/**
 * 🔽 ARIA APG Select-Only Combobox code 🔽
 */

const actions = Object.fromEntries(Object.entries(
  ['close', 'closeSelect', 'first', 'last', 'next', 'open', 'pageDown', 'pageUp', 'previous', 'select', 'type']
).map(e => e.reverse()));

function getActionFromKey(event: Event, menuOpen: boolean) {
  if (!(event instanceof KeyboardEvent)) return;

  const { key, altKey, ctrlKey, metaKey } = event;
  const openKeys = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

  if (!menuOpen && openKeys.includes(key)) return actions.open;
  if (key === 'Home') return actions.first;
  if (key === 'End') return actions.last;

  if (key === 'Backspace' || key === 'Clear' || (
    key.length === 1 && key !== ' ' && !altKey && !ctrlKey && !metaKey
  )) return actions.type;

  if (menuOpen) {
    if (key === 'ArrowUp' && altKey) return actions.closeSelect;
    else if (key === 'ArrowDown' && !altKey) return actions.next;
    else if (key === 'ArrowUp') return actions.previous;
    else if (key === 'PageUp') return actions.pageUp;
    else if (key === 'PageDown') return actions.pageDown;
    else if (key === 'Escape') return actions.close;
    else if (key === 'Enter' || key === ' ') return actions.closeSelect;
  }
}

function filterOptions(options: string[] = [], filter: string, exclude: string[] = []) {
  return options.filter(option => {
    const matches = option.toLowerCase().indexOf(filter.toLowerCase()) === 0;
    return matches && exclude.indexOf(option) < 0;
  });
}

function getIndexByLetter(options: string[], filter: string, startIndex = 0) {
  const orderedOptions = [
    ...options.slice(startIndex),
    ...options.slice(0, startIndex)
  ];
  const firstMatch = filterOptions(orderedOptions, filter)[0];
  const allSameLetter = (array: any[]) => array.every(letter => letter === array[0]);

  if (firstMatch) return options.indexOf(firstMatch);
  else if (allSameLetter(filter.split(''))) {
    const matches = filterOptions(orderedOptions, filter[0]);
    return options.indexOf(matches[0]);
  }
  else return -1;
}

function getUpdatedIndex(currentIndex: number, maxIndex: number, action: string) {
  const pageSize = 10;
  switch (action) {
    case actions.first: return 0;
    case actions.last: return maxIndex;
    case actions.previous: return Math.max(0, currentIndex - 1);
    case actions.next: return Math.min(maxIndex, currentIndex + 1);
    case actions.pageUp: return Math.max(0, currentIndex - pageSize);
    case actions.pageDown: return Math.min(maxIndex, currentIndex + pageSize);
    default: return currentIndex;
  }
}

function isElementInView(element: Element) {
  var bounding = element.getBoundingClientRect();

  return (
    bounding.top >= 0
    && bounding.left >= 0
    && bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    && bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function isScrollable(element: HTMLElement) {
  return element && element.clientHeight < element.scrollHeight;
}

function maintainScrollVisibility(activeElement: HTMLElement, scrollParent: HTMLElement) {
  const { offsetHeight, offsetTop } = activeElement;
  const { offsetHeight: parentOffsetHeight, scrollTop } = scrollParent;

  const isAbove = offsetTop < scrollTop;
  const isBelow = offsetTop + offsetHeight > scrollTop + parentOffsetHeight;

  if (isAbove) {
    scrollParent.scrollTo(0, offsetTop - 4);
  } else if (isBelow) {
    scrollParent.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight + 4);
  }
}

/**
 * 🔼 ARIA APG Select-Only Combobox code 🔼
 */



export class InputSelect extends TextField {
  static template = template;
  static sheets = [...TextField.sheets, sheet];
  static attributes = ['disabled', 'multiple', 'name', 'required', 'size', 'value', 'default-label', 'lang'];
  static defaultValue = 'null';
  static defaultLabel = '⋯'; // label displayed on the button when no option is selected
  #initialSlotsAssigned = false; // to check if options need to be generated from slot in connectedCallback
  #optionsList: HTMLElement | undefined; // to retain control over the options list when it's promoted to the top layer
  #button: HTMLElement | undefined;
  #ignoreBlur = false; // to keep focus on the button while using the select menu
  #searchString = '';
  #searchTimeout?: number;

  labels: Map<string, string> = new Map(); // stores options as couples of values and labels
  labelStringKeys: Map<string, string> = new Map(); // stores options as couples of values and keys to their labels

  /** Builds a list of option nodes from the options passed to the slot. */
  makeOptionsFromSlot = (slot: HTMLSlotElement) => {
    const assignedNodes = slot.assignedNodes();
    const options: HTMLTemplateElement[] = [];
    
    for (let k = 0; k < assignedNodes.length; k++) {
      const node = assignedNodes[k];

      // If the node itself is a slot, look inside it.
      if (node instanceof HTMLSlotElement) {
        options.push(...this.makeOptionsFromSlot(node));
        continue;
      }

      if (!(node instanceof HTMLOptionElement)) continue;

      const dataStringAttr = node.getAttribute('data-string') ?? '';

      const label = node.innerHTML || node.getAttribute('value') || `Option ${k}`;
      const value = node.getAttribute('value') ?? label;
      this.labels.set(value, label);
      this.labelStringKeys.set(value, dataStringAttr);

      const optionAttributes = [];
      for (const attr of node.attributes) {
        if (['value', 'selected', 'data-string'].includes(attr.name)) {} // Do nothing
        else optionAttributes.push(attr);
      }

      const template = document.createElement('template');
      template.innerHTML = optionTemplate.innerHTML
        .replace('{label}', label)
        .replace('{value}', value)
        .replace('{attr}', optionAttributes.map(attr => `${attr.name}="${attr.value}"`).join(' '))
        .replace('{stringKey}', dataStringAttr);
      
      options.push(template);
    }

    return options;
  }


  // Updates the radio-group options when the slotted options in input-select change.
  slotchangeHandler = (event: Event) => {
    const slot = event.target;
    if (!(slot instanceof HTMLSlotElement)) return;

    const optionsList = this.optionsList;
    if (!optionsList) return;

    optionsList.innerHTML = '';
    this.labels = new Map();
    const currentValue = this.value;
    
    const options = this.makeOptionsFromSlot(slot);
    for (let k = 0; k < options.length; k++) {
      const option = options[k];
      option.innerHTML = option.innerHTML.replace('{key}', String(k));
      optionsList.appendChild(option.content.cloneNode(true));
    }

    translationObserver.translate(this, this.lang ?? '');
    this.value = currentValue ?? this.initialValue;
  };


  // Close the menu on clicking anywhere in the window, except on the menu itself.
  buttonBlurHandler = (event: Event) => {
    if (!(event instanceof FocusEvent)) return;
    if (!(event.target instanceof HTMLElement)) return;

    if (this.#ignoreBlur) {
      this.#ignoreBlur = false;
      return;
    }

    if (this.isOpen) {
      this.selectIndex(this.focusedIndex);
      this.close(false);
    }
  }


  // Opens the options list in the top layer, and listens for its changes.
  buttonClickHandler = (event: Event) => {
    if (!this.isOpen) this.open(false);
    else this.close(false);
  };


  // Enables keyboard navigation in the options list.
  buttonKeydownHandler = (event: Event) => {
    const button = event.target;
    if (!(button instanceof HTMLElement)) return;
    if (!(event instanceof KeyboardEvent)) return;

    const { key } = event;
    const max = this.allOptions.length - 1;
    const action = getActionFromKey(event, this.isOpen);

    switch (action) {
      case actions.last:
      case actions.first:
        this.open();
        // don't break
      case actions.next:
      case actions.previous:
      case actions.pageUp:
      case actions.pageDown:
        event.preventDefault();
        return this.focusedIndex = getUpdatedIndex(this.focusedIndex, max, action);
      case actions.closeSelect:
        event.preventDefault();
        this.selectIndex(this.focusedIndex);
        // don't break
      case actions.close:
        event.preventDefault();
        return this.close();
      case actions.type:
        return this.typeHandler(key);
      case actions.open:
        event.preventDefault();
        return this.open();
    }
  };


  // Opens the menu and selects the first option starting by the typed letter.
  typeHandler = (letter: string) => {
    this.open();

    const searchString = this.getSearchString(letter);
    const searchIndex = getIndexByLetter(
      this.allOptions.map(option => this.getLabel(option.getAttribute('data-value') ?? 'null')),
      searchString,
      this.focusedIndex + 1
    );

    if (searchIndex >= 0) this.focusedIndex = searchIndex;
    else {
      clearTimeout(this.#searchTimeout);
      this.#searchString = '';
    }
  }


  // Prevents focus from leaving the button when clicking on an option.
  optionPointerdownHandler = (event: Event) => {
    this.#ignoreBlur = true;
  }


  // Selects a value and closes the menu on a click on an option.
  optionsListClickHandler = (event: Event) => {
    if (!(event.target instanceof HTMLElement) || !(event.currentTarget instanceof HTMLElement)) return;
    const option = event.target?.closest('[role="option"]');
    if (!(option instanceof HTMLElement)) return;
    if (!(event.currentTarget.contains(option))) return;

    this.selectValue(option.getAttribute('data-value') ?? this.defaultValue);
    this.close();
  }


  // Builds the search string by adding the newly types character to the previously typed string (in the last 500ms)
  getSearchString(char: string) {
    if (typeof this.#searchTimeout === 'number') clearTimeout(this.#searchTimeout);
    this.#searchTimeout = setTimeout(() => this.#searchString = '', 500);
    this.#searchString += char;
    return this.#searchString;
  }


  // Opens the menu and promotes the options list to the top layer.
  open(restoreFocus = true) {
    if (this.isOpen) return;

    const optionsList = this.optionsList;
    if (!(optionsList instanceof HTMLElement)) throw new Error('Expecting HTMLElement');

    // Compute fixed position
    const rect = this.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const available = {
      top: rect.top,
      bottom: viewport.height - rect.bottom,
      left: rect.left + rect.width,
      right: viewport.width - rect.left
    };

    const selectorStyles = {
      'top': available.bottom >= available.top ? rect.bottom + 1 : null,
      'bottom': available.top > available.bottom ? viewport.height - rect.top + 1 : null,
      'max-height': available.bottom >= available.top ? available.bottom - 9 : available.top - 9,
      'left': available.right >= available.left ? rect.left + 1 : null,
      'right': available.left > available.right ? viewport.width - rect.right + 1 : null,
      'max-width': available.right >= available.left ? available.right + rect.width : available.left + rect.width,
      'min-width': rect.width,
    };

    for (const [prop, val] of Object.entries(selectorStyles)) {
      if (val) optionsList.style.setProperty(prop, `${Math.floor(val)}px`);
      else     optionsList.style.removeProperty(prop);
    }

    if (selectorStyles.top) {
      if (selectorStyles.left) optionsList.style.setProperty('border-top-right-radius', '4px');
      else if (selectorStyles.right) optionsList.style.setProperty('border-top-left-radius', '4px');
      optionsList.style.setProperty('border-bottom-left-radius', '4px');
      optionsList.style.setProperty('border-bottom-right-radius', '4px');
    }
    else if (selectorStyles.bottom) {
      if (selectorStyles.left) optionsList.style.setProperty('border-bottom-right-radius', '4px');
      else if (selectorStyles.right) optionsList.style.setProperty('border-bottom-left-radius', '4px');
      optionsList.style.setProperty('border-top-left-radius', '4px');
      optionsList.style.setProperty('border-top-right-radius', '4px');
    }

    this.shadow.querySelector('label')?.classList.add('focused');
    this.button?.setAttribute('aria-expanded', 'true')

    // Promote the radio-group to the top layer and open it.
    toTopLayer(optionsList);
    optionsList.removeAttribute('hidden');
    openTopLayer();

    // Focus the selected option
    const selectedOption = optionsList.querySelector('[role="option"][aria-selected="true"]');
    if (selectedOption instanceof HTMLElement) {
      const selectedIndex = this.indexOf(selectedOption?.getAttribute('data-value') ?? 'null');
      this.focusedIndex = selectedIndex;
    }

    // Make the menu more accessible and be ready to close it.
    this.allOptions.forEach(option => option.addEventListener('pointerdown', this.optionPointerdownHandler));
    optionsList.addEventListener('click', this.optionsListClickHandler);

    if (restoreFocus) this.button?.focus();
  }


  // Closes the menu and brings it back from the top layer.
  close(restoreFocus = true) {
    if (!this.isOpen) return;

    const optionsList = this.optionsList;
    if (!(optionsList instanceof HTMLElement)) throw new Error('Expecting HTMLElement');

    optionsList.removeEventListener('click', this.optionsListClickHandler);
    this.allOptions.forEach(option => option.removeEventListener('pointerdown', this.optionPointerdownHandler));

    closeTopLayer();
    optionsList.setAttribute('hidden', '');
    backFromTopLayer(optionsList);

    this.shadow.querySelector('label')?.classList.remove('focused');
    this.button?.setAttribute('aria-expanded', 'false');

    if (restoreFocus) this.button?.focus();
  }


  // Selects a value on user input from its index.
  selectIndex(key: number) {
    this.focusedIndex = key;
    const value = this.focusedValue;

    this.value = value;
    this.propagateEvent(new Event('change', { bubbles: true }));
  };

  // Selects a value on user input.
  selectValue(val: string) {
    const allOptions = this.allOptions;
    for (let k = 0; k < allOptions.length; k++) {
      const option = allOptions[k];
      const value = option.getAttribute('data-value');
      if (value === val) {
        return this.selectIndex(k);
      }
    }
  }


  // Returns the currently focused option.
  // The focused option is not necessarily the selected option,
  // since we can change the focused option with keyboard inputs.
  get focusedOptionElement(): Element | null {
    return this.optionsList?.querySelector('[role="option"].focused') ?? null;
  }


  // Index of the currently focused option.
  get focusedIndex(): number {
    const button = this.button;
    const focusedId = button?.getAttribute('aria-activedescendant') ?? 'option-0';
    const allOptions = this.allOptions;
    for (let k = 0; k < allOptions.length; k++) {
      const option = allOptions[k];
      if (option.getAttribute('id') === focusedId) return k;
    }
    return -1;
  }

  set focusedIndex(key: number) {
    const allOptions = this.allOptions;
    key = Math.max(0, Math.min(allOptions.length - 1, key));
    for (let k = 0; k < allOptions.length; k++) {
      const option = allOptions[k];
      if (!(option instanceof HTMLElement)) continue;
      if (k === key) {
        option.classList.add('focused');
        const button = this.button;
        button?.setAttribute('aria-activedescendant', `option-${k}`);

        // Make sure the option is on screen
        if (this.optionsList && isScrollable(this.optionsList)) maintainScrollVisibility(option, this.optionsList);
        if (!isElementInView(option)) option.scrollIntoView( { behavior: 'smooth', block: 'nearest' });
      }
      else {
        option.classList.remove('focused');
      }
    }
  }

  // Value of the currently focused option.
  get focusedValue(): string {
    return this.allOptions[this.focusedIndex]?.getAttribute('data-value') ?? this.defaultValue;
  }


  // Array of all option elements.
  get allOptions(): Element[] {
    return [...this.optionsList?.querySelectorAll('[role="option"]') ?? []];
  }


  // Gets the index of an option from its value.
  indexOf(val: string) {
    const allOptions = this.allOptions;
    for (let k = 0; k < allOptions.length; k++) {
      const option = allOptions[k];
      const value = option.getAttribute('data-value');
      if (value === val) return k;
    }
    return -1;
  }


  // Container of all option elements.
  get optionsList(): HTMLElement | undefined {
    if (this.#optionsList) return this.#optionsList;
    const optionsList = this.shadow.querySelector('[role="listbox"]');
    if (optionsList instanceof HTMLElement) return optionsList;
  }


  // Button that opens the menu.
  get button(): HTMLElement | undefined {
    if (this.#button) return this.#button;
    const button = this.shadow.querySelector('[role="combobox"]');
    if (button instanceof HTMLElement) return button;
  }


  // Whether the menu is currently open.
  get isOpen(): boolean {
    return this.button?.getAttribute('aria-expanded') === 'true';
  }


  get value(): string {
    return this.optionsList?.querySelector('[role="option"][aria-selected="true"]')?.getAttribute('data-value') ?? this.initialValue ?? this.defaultValue;
  }

  set value(val: string) {
    // If the requested value is an existing option, select it.
    const allOptions = this.allOptions;
    let optionExists = false;
    let stringKey = '';
    for (let k = 0; k < allOptions.length; k++) {
      const option = allOptions[k];
      const value = option.getAttribute('data-value');
      if (value === val) {
        option.setAttribute('aria-selected', 'true');
        optionExists = true;
        stringKey = option.querySelector('[part="option-label"]')?.getAttribute('data-string') ?? '';
      } else {
        option.setAttribute('aria-selected', 'false');
      }
    }

    const appliedValue = optionExists ? val : this.value;
    this.updateFormValue(appliedValue);
    this.dispatchEvent(new CustomEvent('valuechange', { detail: { value: appliedValue }}));
    const button = this.button;
    if (button) {
      button.innerHTML = this.getLabel(appliedValue);
      button.setAttribute('data-string', stringKey);
    }
  }

  updateFormValue(val: any) {
    const isRequired = this.getAttribute('required') !== null;
    const validity = {
      valueMissing: isRequired ? (val == null || val === 'null') : false
    };
    super.updateFormValue(val, validity, `Aucune valeur n'est sélectionnée`);
  }

  get valueLabel() {
    return this.getLabel(this.value);
  }

  get defaultLabel(): string {
    return this.getAttribute('default-label') ?? (this.constructor as typeof InputSelect).defaultLabel;
  }

  get valueIndex(): number {
    return this.indexOf(this.value);
  }

  getLabel(val: string | null): string {
    let label = this.defaultLabel;
    if (val !== null) {
      const stringKey = this.labelStringKeys.get(val);
      if (stringKey) return getString(stringKey as TranslatedString);
      else return this.labels.get(val) ?? label;
    }
    return label;
  }


  connectedCallback(): void {
    translationObserver.serve(this, { method: 'attribute' });

    // To retain control of the options list when it's promoted to the top layer.
    const optionsList = this.optionsList;
    if (optionsList instanceof HTMLElement) this.#optionsList = optionsList;

    const button = this.button;
    if (button instanceof HTMLElement) this.#button = button;

    button?.addEventListener('blur', this.buttonBlurHandler);
    button?.addEventListener('click', this.buttonClickHandler);
    button?.addEventListener('keydown', this.buttonKeydownHandler);

    // To rebuild the list of options when the slot's contents change.
    const source = this.shadow.querySelector('datalist > slot');
    source?.addEventListener('slotchange', this.slotchangeHandler);

    // To initialize options if they're already slotted.
    if (!this.#initialSlotsAssigned) {
      if (source instanceof HTMLSlotElement) {
        if (source.assignedNodes().length > 0) {
          source.dispatchEvent(new Event('slotchange'));
        }
      }
      this.#initialSlotsAssigned = true;
    }
  }

  disconnectedCallback(): void {
    translationObserver.unserve(this);

    if (this.isOpen) this.close(false);

    const button = this.button;
    button?.removeEventListener('blur', this.buttonBlurHandler);
    button?.removeEventListener('click', this.buttonClickHandler);
    button?.removeEventListener('keydown', this.buttonKeydownHandler);

    const source = this.shadow.querySelector('datalist > slot');
    source?.removeEventListener('slotchange', this.slotchangeHandler);
  }

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'lang':
        translationObserver.translate(this, newValue ?? '');
        break;

      case 'default-label':
        const currentLabelIsDefault = !(this.labels.get(this.value));
        if (currentLabelIsDefault) {
          const button = this.button;
          if (button) button.innerHTML = this.defaultLabel;
        }
        break;

      default:
        super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }
}

if (!customElements.get('input-select')) customElements.define('input-select', InputSelect);