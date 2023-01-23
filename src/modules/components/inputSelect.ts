import { backFromTopLayer, toTopLayer } from '../navigate.js';
import { RadioGroup } from './radioGroup.js';
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
      <button type="button" part="button"></button>
      <span class="material-icons trailing-icon" aria-hidden="true">
        <slot name="trailing-icon"></slot>
        <span class="error-icon">error</span>
      </span>
      <radio-group hidden class="surface primary shadow elevation-3" style="
        padding: 4px;
        display: flex;
        flex-direction: column;
        flex-wrap: no-wrap;
        gap: 4px;
        position: fixed;
        box-sizing: border-box;
        overflow: auto;
      ">
      </radio-group>
      <datalist hidden>
        <slot></slot>
      </datalist>
    </label>
  </form>
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
  static attributes = ['autocomplete', 'disabled', 'multiple', 'name', 'required', 'size', 'value'];
  static defaultValue = null;
  #input: HTMLElement | undefined;

  slotchangeHandler = (event: Event) => {
    const slot = event.target;
    if (!(slot instanceof HTMLSlotElement)) return;

    const radioGroup = this.shadow.querySelector('radio-group');
    if (!radioGroup) return;

    radioGroup.innerHTML = '';
    const assignedNodes = slot.assignedNodes();

    for (let k = 0; k < assignedNodes.length; k++) {
      const node = assignedNodes[k];
      if (!(node instanceof HTMLOptionElement)) continue;
      radioGroup.appendChild(node.cloneNode(true));
    }
  };

  buttonClickHandler = async (event: Event) => {
    const selector = this.input;
    if (!selector) return;

    const rect = this.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const available = {
      top: rect.top,
      bottom: viewport.height - rect.bottom,
      left: rect.left,
      right: viewport.width - rect.right
    };

    const selectorStyles = {
      'top': available.bottom >= available.top ? rect.bottom + 1 : null,
      'bottom': available.top > available.bottom ? viewport.height - rect.top + 1 : null,
      'max-height': available.bottom >= available.top ? available.bottom - 9 : available.top - 9,
      'left': available.right >= available.left ? rect.left : null,
      'right': available.left > available.right ? viewport.width - rect.right : null,
      'max-width': available.right >= available.left ? available.right : available.left,
      'min-width': rect.width,
    };

    for (const [prop, val] of Object.entries(selectorStyles)) {
      if (val) selector.style.setProperty(prop, `${Math.floor(val)}px`);
      else     selector.style.removeProperty(prop);
    }

    if (selectorStyles.top) {
      if (selectorStyles.left) selector.style.setProperty('border-top-right-radius', 'var(--border-radius)');
      else if (selectorStyles.right) selector.style.setProperty('border-top-left-radius', 'var(--border-radius)');
      selector.style.setProperty('border-bottom-left-radius', 'var(--border-radius)');
      selector.style.setProperty('border-bottom-right-radius', 'var(--border-radius)');
    }
    else if (selectorStyles.bottom) {
      if (selectorStyles.left) selector.style.setProperty('border-bottom-right-radius', 'var(--border-radius)');
      else if (selectorStyles.right) selector.style.setProperty('border-bottom-left-radius', 'var(--border-radius)');
      selector.style.setProperty('border-top-left-radius', 'var(--border-radius)');
      selector.style.setProperty('border-top-right-radius', 'var(--border-radius)');
    }

    const topLayer = document.querySelector('#top-layer');
    if (!(topLayer instanceof HTMLElement)) throw new Error('Expecting HTMLElement');

    const changeHandler = (event: Event) => {
      if (topLayer instanceof HTMLElement) topLayer.click();
    };

    topLayer.addEventListener('sectionclose', event => {
      this.shadow.querySelector('label')?.classList.remove('focused');
      backFromTopLayer(selector, false);
      selector.removeEventListener('change', changeHandler);
    }, { once: true });
    selector.addEventListener('change', changeHandler);

    this.shadow.querySelector('label')?.classList.add('focused');
    toTopLayer(selector);
  };

  inputHandler = (event: Event) => {
    const input = this.input;
    let value = this.defaultValue;
    if (input instanceof RadioGroup) value = input.value;
    this.updateFormValue(value);

    const button = this.button;
    let label = '⋯';
    if (input instanceof RadioGroup) label = input.valueLabel;
    if (button) button.innerHTML = label;

    this.propagateEvent(event);
  };


  get input(): HTMLElement | undefined {
    if (this.#input) return this.#input;
    const input = this.shadow.querySelector('radio-group');
    if (input instanceof RadioGroup) return input;
  }

  get button(): HTMLButtonElement | undefined {
    const button = this.shadow.querySelector('button');
    if (button instanceof HTMLButtonElement) return button;
  }


  get value(): string | null {
    const input = this.shadow.querySelector('radio-group');
    if (input instanceof RadioGroup) return input.value;
    else return this.initialValue ?? this.defaultValue;
  }

  set value(val: string | null) {
    const input = this.input;
    if (input instanceof RadioGroup) input.value = val;
  }


  connectedCallback(): void {
    const input = this.shadow.querySelector('radio-group'); // as HTMLElement, to set the listener event before it's upgraded to RadioGroup
    if (input instanceof HTMLElement) {
      this.#input = input;
      input.addEventListener('valuechange', this.inputHandler);
      input.addEventListener('change', this.inputHandler);
    }

    const initialValue = this.initialValue;
    if (initialValue && input instanceof RadioGroup) {
      input.value = initialValue;
    }

    const button = this.button;
    button?.addEventListener('click', this.buttonClickHandler);

    const form = this.shadow.querySelector('form');
    form?.addEventListener('submit', this.formSubmitHandler);

    // Populate options
    const source = this.shadow.querySelector('datalist > slot');
    source?.addEventListener('slotchange', this.slotchangeHandler);
    if (source instanceof HTMLSlotElement && source.assignedNodes().length > 0) {
      source.dispatchEvent(new Event('slotchange'));
    }
  }

  disconnectedCallback(): void {
    const input = this.input;
    input?.removeEventListener('valuechange', this.inputHandler);
    input?.removeEventListener('change', this.inputHandler);

    const button = this.button;
    button?.removeEventListener('click', this.buttonClickHandler);

    const form = this.shadow.querySelector('form');
    form?.removeEventListener('submit', this.formSubmitHandler);

    const source = this.shadow.querySelector('datalist > slot');
    source?.removeEventListener('slotchange', this.slotchangeHandler);
  }

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'value':
      case 'default-value':
        this.input?.setAttribute(attr, newValue ?? this.defaultValue);
        break;

      default:
        super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }
}

if (!customElements.get('input-select')) customElements.define('input-select', InputSelect);