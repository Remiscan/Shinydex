import { sheet as checkboxSheet } from './checkBox.js';
import CustomInput from './customInput.js';
// @ts-expect-error
import materialIconsSheet from '../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import themesSheet from '../../styles/themes.css.php' assert { type: 'css' };
// @ts-expect-error
import commonSheet from '../../styles/common.css' assert { type: 'css' };



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
  static attributes = ['name', 'value'];

  slotchangeHandler = (event: Event) => {
    const slot = event.target;
    if (!(slot instanceof HTMLSlotElement)) return;

    const form = this.shadow.querySelector('form');
    if (!form) return;

    form.innerHTML = '';
    const assignedNodes = slot.assignedNodes();
    let currentValue: string = this.value;
    for (let k = 0; k < assignedNodes.length; k++) {
      const node = assignedNodes[k];
      if (!(node instanceof HTMLOptionElement)) continue;

      const label = node.innerHTML || node.getAttribute('value') || `Option ${k}`;
      const value = node.getAttribute('value') ?? label;
      if (k === 0) currentValue = value;
      const name = this.name ?? 'group';

      const containerAttributes = [];
      const inputAttributes = [];
      for (const attr of node.attributes) {
        if (['disabled'].includes(attr.name)) inputAttributes.push(attr);
        else if (['value', 'selected'].includes(attr.name)) { /* Do nothing */ }
        else containerAttributes.push(attr);
      }
      
      form.innerHTML += /*html*/`
        <span part="option" ${containerAttributes.map(attr => `${attr.name}="${attr.value}"`).join(' ')}>
          <input type="radio" name="${name}" id="${name}-${k}" value="${value}"
                 ${inputAttributes.map(attr => `${attr.name}="${attr.value}"`).join(' ')}>
          <label for="${name}-${k}" class="surface interactive">
            <span class="material-icons" part="icon icon-unchecked">
              <slot name="icon-unchecked">radio_button_unchecked</slot>
            </span>
            <span class="material-icons" part="icon icon-checked">
              <slot name="icon-checked">radio_button_checked</slot>
            </span>
            <span part="label" class="label-large">${label}</span>
          </label>
        </span>
      `;
    }

    const value = currentValue || this.initialValue || this.defaultValue;
    this.value = value;
    this.dispatchEvent(new CustomEvent('optionsparsed', { detail: { value }}));
  };


  get input(): HTMLInputElement | undefined {
    const input = this.shadow.querySelector('input:checked');
    if (input instanceof HTMLInputElement) return input;
  }


  get value(): string {
    return this.input?.value ?? this.defaultValue;
  }

  set value(val: string) {
    const input = this.shadow.querySelector(`input[value="${val}"]`);
    if (input instanceof HTMLInputElement) {
      input.checked = true;
      super.updateFormValue(val);
    } else {
      const checkedInput = this.input;
      if (checkedInput) checkedInput.checked = false;
      super.updateFormValue('');
    }
  }

  get valueLabel(): string {
    const input = this.input;
    if (!input) return '';
    const label = this.shadow.querySelector(`label[for="${input?.getAttribute('id')}"] > [part="label"]`);
    return label?.innerHTML ?? '';
  }


  connectedCallback(): void {
    const source = this.shadow.querySelector('datalist > slot');
    if (source instanceof HTMLSlotElement) {
      source.addEventListener('slotchange', this.slotchangeHandler);
      if (!this.getAttribute('name') && source.assignedNodes().length > 0) {
        source.dispatchEvent(new Event('slotchange'));
      }
    }

    const form = this.shadow.querySelector('form');
    form?.addEventListener('input', this.inputHandler);
    form?.addEventListener('change', this.inputHandler);

    setTimeout(() => {
      this.ready = true;
      this.dispatchEvent(new Event('ready'));
    });
  }

  disconnectedCallback(): void {
    const source = this.shadow.querySelector('datalist > slot');
    source?.removeEventListener('slotchange', this.slotchangeHandler);
    
    const form = this.shadow.querySelector('form');
    form?.removeEventListener('input', this.inputHandler);
    form?.removeEventListener('change', this.inputHandler);
  }

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'value':
      case 'name': {
        const source = this.shadow.querySelector('datalist > slot');
        if (source instanceof HTMLSlotElement) {
          if (source.assignedNodes().length > 0) {
            source.dispatchEvent(new Event('slotchange'));
          }
        }
      } break;
    }
  }
}

if (!customElements.get('radio-group')) customElements.define('radio-group', RadioGroup);