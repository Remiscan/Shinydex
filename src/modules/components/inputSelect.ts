import { backFromTopLayer, closeTopLayer, openTopLayer, toTopLayer } from '../topLayer.js';
import { TextField } from './textField.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form>
    <label class="text-field surface variant interactive" part="container">
      <span class="leading-icon">
        <slot name="leading-icon"></slot>
      </span>
      <span class="label body-medium">
        <slot name="label"></slot>
      </span>
      <button
        type="button"
        part="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="options-list"
      ></button>
      <span class="material-icons trailing-icon" aria-hidden="true">
        <slot name="trailing-icon"></slot>
        <span class="error-icon">error</span>
      </span>
      <div
        role="listbox"
        id="options-list"
        class="surface primary shadow elevation-3 mobile-centered select-menu"
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
  <button type="button" role="option" id="option-{key}" class="surface interactive"
    data-value="{value}" aria-selected="false" tabindex="-1"
    {attr}
  >
    <span class="material-icons" part="icon icon-unchecked" aria-hidden="true">
      <slot name="icon-unchecked">radio_button_unchecked</slot>
    </span>
    <span class="material-icons" part="icon icon-checked" aria-hidden="true">
      <slot name="icon-checked">check</slot>
    </span>
    <span part="option-label" class="label-large">{label}</span>
  </button type="button">
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  button {
    all: unset;
    grid-row: 2;
    grid-column: text;
    display: grid;
    grid-template-columns: 1fr 24px;
    align-items: center;
    color: rgb(var(--on-surface));
  }

  button::before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  button::after {
    content: 'expand_more';
    font-family: 'Material Icons';
    font-size: 24px;
    margin-block: -12px;
  }

  [hidden] {
    display: none !important;
  }
`);



export class InputSelect extends TextField {
  static template = template;
  static sheets = [...TextField.sheets, sheet];
  static attributes = ['disabled', 'multiple', 'name', 'required', 'size', 'value'];
  static defaultValue = 'null';
  #initialSlotsAssigned = false; // to check if options need to be generated from slot in connectedCallback
  #optionsList: HTMLElement | undefined; // to retain control over the options list when it's promoted to the top layer

  labels: Map<string, string> = new Map(); // stores options as couples of values and labels

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

      const label = node.innerHTML || node.getAttribute('value') || `Option ${k}`;
      const value = node.getAttribute('value') ?? label;
      this.labels.set(value, label);

      const optionAttributes = [];
      for (const attr of node.attributes) {
        if (['value', 'selected'].includes(attr.name)) {} // Do nothing
        else optionAttributes.push(attr);
      }

      const template = document.createElement('template');
      template.innerHTML = optionTemplate.innerHTML
        .replace('{label}', label)
        .replace('{value}', value)
        .replace('{attr}', optionAttributes.map(attr => `${attr.name}="${attr.value}"`).join(' '));
      
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

    this.value = currentValue ?? this.initialValue;
  };


  // Opens the select menu on pressing some keys while the button is focused.
  buttonKeydownHandler = (event: Event) => {
    const button = event.target;
    if (!(button instanceof HTMLButtonElement)) return;
    if (!(event instanceof KeyboardEvent)) return;

    if (!this.isOpen && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      return button.click();
    }
  }


  // Enables keyboard navigation in the options list.
  optionKeydownHandler = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    const { key, altKey } = event;

    switch (key) {
      case 'ArrowUp':
        if (altKey) this.close();
        else        this.focusedIndex--;
        break;

      case 'ArrowDown':
        if (altKey) return;
        else        this.focusedIndex++;
        break;

      case 'PageUp':
        this.focusedIndex -= 10;
        break;

      case 'PageDown':
        this.focusedIndex += 10;
        break;

      case 'Home':
        this.focusedIndex = 0;
        break;

      case 'End':
        this.focusedIndex = +Infinity;
        break;

      case 'Escape':
        this.close();
        break;
    }
  };


  // Close the menu on clicking anywhere in the window, except on the menu itself.
  optionBlurHandler = (event: Event) => {
    if (!(event instanceof FocusEvent)) return;

    const blurredElement = event.target;
    const focusedElement = event.relatedTarget;
    const topLayer = document.querySelector('#top-layer');
    if (topLayer && focusedElement instanceof Node && 
      (topLayer.contains(focusedElement) || this.shadow.contains(focusedElement))
    ) return;

    this.selectIndex(this.focusedIndex);
    this.close();
  }
  

  // Opens the options list in the top layer, and listens for its changes.
  buttonClickHandler = (event: Event) => {
    if (!this.isOpen) this.open();
    else              this.close();
  };


  // Selects a value and closes the menu on a click on an option.
  optionClickHandler = (event: Event) => {
    const option = event.currentTarget;
    if (!(option instanceof HTMLElement)) return;
    this.selectValue(option.getAttribute('data-value') ?? this.defaultValue);
    this.close();
  }


  // Opens the menu and promotes the options list to the top layer.
  open() {
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
      'max-width': available.right >= available.left ? available.right : available.left,
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
    if (selectedOption instanceof HTMLButtonElement) {
      const selectedIndex = this.indexOf(selectedOption?.getAttribute('data-value'));
      this.focusedIndex = selectedIndex;
    }

    // Make the menu more accessible and be ready to close it.
    optionsList.querySelectorAll('[role="option"]').forEach(option => {
      option.addEventListener('click', this.optionClickHandler);
      option.addEventListener('blur', this.optionBlurHandler);
      option.addEventListener('keydown', this.optionKeydownHandler);
    });
    this.button?.addEventListener('blur', this.optionBlurHandler);
  }


  // Closes the menu and brings it back from the top layer.
  close() {
    const optionsList = this.optionsList;
    if (!(optionsList instanceof HTMLElement)) throw new Error('Expecting HTMLElement');

    optionsList.querySelectorAll('[role="option"]').forEach(option => {
      option.removeEventListener('click', this.optionClickHandler);
      option.removeEventListener('blur', this.optionBlurHandler);
      option.removeEventListener('keydown', this.optionKeydownHandler);
    });
    this.button?.removeEventListener('blur', this.optionBlurHandler);

    closeTopLayer();
    optionsList.setAttribute('hidden', '');
    backFromTopLayer(optionsList);

    this.shadow.querySelector('label')?.classList.remove('focused');
    this.button?.setAttribute('aria-expanded', 'false');
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
      if (!(option instanceof HTMLButtonElement)) continue;
      if (k === key) {
        option.tabIndex = 0;
        option.focus();
        option.classList.add('focused');
        const button = this.button;
        button?.setAttribute('aria-activedescendant', `option-${k}`);
      }
      else {
        option.tabIndex = -1;
        option.classList.remove('focused');
      }
    }
  }

  // Value of the currently focused option.
  get focusedValue(): string | null {
    return this.allOptions[this.focusedIndex].getAttribute('data-value');
  }


  // Container of all option elements.
  get optionsList(): HTMLElement | undefined {
    if (this.#optionsList) return this.#optionsList;
    const optionsList = this.shadow.querySelector('[role="listbox"]');
    if (optionsList instanceof HTMLElement) return optionsList;
  }

  // Array of all option elements.
  get allOptions(): Element[] {
    return [...this.optionsList?.querySelectorAll('[role="option"]') ?? []];
  }


  // Gets the index of an option from its value.
  indexOf(val: string | null) {
    const allOptions = this.allOptions;
    for (let k = 0; k < allOptions.length; k++) {
      const option = allOptions[k];
      const value = option.getAttribute('data-value');
      if (value === val) return k;
    }
    return -1;
  }


  // Button that opens the menu.
  get button(): HTMLButtonElement | undefined {
    const button = this.shadow.querySelector('button');
    if (button instanceof HTMLButtonElement) return button;
  }


  // Whether the menu is currently open.
  get isOpen(): boolean {
    return this.button?.getAttribute('aria-expanded') === 'true';
  }


  get value(): string | null {
    return this.optionsList?.querySelector('[role="option"][aria-selected="true"]')?.getAttribute('data-value') ?? this.initialValue ?? this.defaultValue;
  }

  set value(val: string | null) {
    // If the requested value is an existing option, select it.
    const allOptions = this.allOptions;
    let optionExists = false;
    for (let k = 0; k < allOptions.length; k++) {
      const option = allOptions[k];
      const value = option.getAttribute('data-value');
      if (value === val) {
        option.setAttribute('aria-selected', 'true');
        optionExists = true;
      } else {
        option.setAttribute('aria-selected', 'false');
      }
    }

    const appliedValue = optionExists ? val : this.value;
    this.updateFormValue(appliedValue);
    this.dispatchEvent(new CustomEvent('valuechange', { detail: { value: appliedValue }}));
    const button = this.button;
    if (button) button.innerHTML = this.getLabel(appliedValue);
  }

  get valueLabel() {
    return this.getLabel(this.value);
  }

  get valueIndex(): number {
    return this.indexOf(this.value);
  }

  getLabel(val: string | null): string {
    let label = '⋯';
    if (val !== null) label = this.labels.get(val) ?? label;
    return label;
  }


  connectedCallback(): void {
    // To retain control of the options list when it's promoted to the top layer.
    const optionsList = this.optionsList;
    if (optionsList instanceof HTMLElement) this.#optionsList = optionsList;

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

    const button = this.button;
    button?.addEventListener('click', this.buttonClickHandler);
    button?.addEventListener('keydown', this.buttonKeydownHandler);
  }

  disconnectedCallback(): void {
    const source = this.shadow.querySelector('datalist > slot');
    source?.removeEventListener('slotchange', this.slotchangeHandler);

    const button = this.button;
    button?.removeEventListener('click', this.buttonClickHandler);
    button?.removeEventListener('keydown', this.buttonKeydownHandler);
  }
}

if (!customElements.get('input-select')) customElements.define('input-select', InputSelect);