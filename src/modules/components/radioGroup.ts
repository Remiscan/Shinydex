import { sheet as checkboxSheet } from './checkBox.js';
import { translationObserver } from '../translation.js';
import CustomInput from './customInput.js';
import materialIconsSheet from '../../../ext/material_icons.css' assert { type: 'css' };
import themesSheet from '../../../styles/themes.css.php' assert { type: 'css' };
import commonSheet from '../../../styles/common.css' assert { type: 'css' };



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form></form>
  <datalist hidden>
    <slot></slot>
  </datalist>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  :host {
    display: contents;
  }

  [part="option"] {
    position: relative;
  }

  [hidden] {
    display: none;
  }
`);



export class RadioGroup extends CustomInput {
  static template = template;
  static sheets = [materialIconsSheet, themesSheet, commonSheet, checkboxSheet, sheet];
  static attributes = ['name', 'value', 'lang'];
  static defaultValue = null;
  #initialSlotsAssigned = false;

  labels: Map<string, string> = new Map();

  /** Builds a list of option nodes from the options passed to the slot. */
  makeOptionsFromSlot = (slot: HTMLSlotElement) => {
    const assignedNodes = slot.assignedNodes();
    const options: Node[] = [];
    
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

      const name = this.name ?? 'group';

      const containerAttributes = [];
      const inputAttributes = [];
      for (const attr of node.attributes) {
        if (['disabled'].includes(attr.name)) inputAttributes.push(attr);
        else if (['value', 'selected', 'data-string'].includes(attr.name)) { /* Do nothing */ }
        else containerAttributes.push(attr);
      }
      const dataStringAttr = node.getAttribute('data-string') ?? '';

      const template = document.createElement('template');
      template.innerHTML = /*html*/`
        <span part="option" ${containerAttributes.map(attr => `${attr.name}="${attr.value}"`).join(' ')}>
          <input type="radio" name="${name}" id="${name}-${k}" value="${value}"
                ${inputAttributes.map(attr => `${attr.name}="${attr.value}"`).join(' ')}>
          <label for="${name}-${k}" class="surface interactive" part="option-label-element">
            <span class="material-icons" part="icon icon-unchecked">
              <slot name="icon-unchecked">radio_button_unchecked</slot>
            </span>
            <span class="material-icons" part="icon icon-checked">
              <slot name="icon-checked">radio_button_checked</slot>
            </span>
            <span part="option-label" class="label-large" data-string="${dataStringAttr}">${label}</span>
          </label>
        </span>
      `;
      
      options.push(template.content.cloneNode(true));
    }

    return options;
  }

  /** Remakes the list of options when the slot's contents change. */
  slotchangeHandler = (event: Event) => {
    const slot = event.target;
    if (!(slot instanceof HTMLSlotElement)) return;

    const form = this.shadow.querySelector('form');
    if (!form) return;

    form.innerHTML = '';
    this.labels = new Map();
    const currentValue = this.value;
    
    const options = this.makeOptionsFromSlot(slot);
    for (const option of options) {
      form.appendChild(option);
    }

    translationObserver.translate(this, this.lang ?? '');
    this.value = currentValue ?? this.initialValue;
  };

  formSubmitHandler = (event: Event) => event.preventDefault();


  get input(): HTMLInputElement | undefined {
    const input = this.shadow.querySelector('input:checked');
    if (input instanceof HTMLInputElement) return input;
  }


  get value(): string | null {
    return this.input?.value ?? this.initialValue ?? this.defaultValue;
  }

  set value(val: string | null) {
    const input = this.shadow.querySelector(`input[value="${val}"]`);
    let setValue: string;
    if (val !== null && input instanceof HTMLInputElement) {
      input.checked = true;
      super.updateFormValue(val);
      setValue = val;
    } else {
      const checkedInput = this.input;
      if (checkedInput) checkedInput.checked = false;
      super.updateFormValue(this.defaultValue);
      setValue = this.defaultValue;
    }

    this.dispatchEvent(new CustomEvent('valuechange', {
      detail: {
        value: setValue,
        label: this.getLabel(setValue)
      }
    }));
  }

  get valueLabel() {
    return this.getLabel(this.value);
  }

  getLabel(val: string | null): string {
    let label = '⋯';
    if (val !== null) label = this.labels.get(val) ?? label;
    return label;
  }


  connectedCallback(): void {
    translationObserver.serve(this, { method: 'attribute' });

    const source = this.shadow.querySelector('datalist > slot');
    source?.addEventListener('slotchange', this.slotchangeHandler);

    if (!this.#initialSlotsAssigned) {
      if (source instanceof HTMLSlotElement) {
        if (source.assignedNodes().length > 0) {
          source.dispatchEvent(new Event('slotchange'));
        }
      }
      this.#initialSlotsAssigned = true;
    }

    const form = this.shadow.querySelector('form');
    form?.addEventListener('input', this.inputHandler);
    form?.addEventListener('change', this.inputHandler);
    form?.addEventListener('submit', this.formSubmitHandler);
  }

  disconnectedCallback(): void {
    translationObserver.unserve(this);

    const source = this.shadow.querySelector('datalist > slot');
    source?.removeEventListener('slotchange', this.slotchangeHandler);
    
    const form = this.shadow.querySelector('form');
    form?.removeEventListener('input', this.inputHandler);
    form?.removeEventListener('change', this.inputHandler);
    form?.removeEventListener('submit', this.formSubmitHandler);
  }

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'lang':
        translationObserver.translate(this, newValue ?? '');
        break;

      default:
        super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }
}

if (!customElements.get('radio-group')) customElements.define('radio-group', RadioGroup);