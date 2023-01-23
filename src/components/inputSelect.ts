import { toTopLayer } from '../navigate.js';
import { RadioGroup } from './radioGroup.js';
import { TextField } from './textField.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form>
    <label class="text-field surface variant interactive">
      <span class="leading-icon">
        <slot name="leading-icon"></slot>
      </span>
      <span class="label body-medium">
        <slot name="label"></slot>
      </span>
      <button type="button"></button>
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

  inputHandler = (event: Event) => {
    this.value = this.input?.value ?? this.defaultValue;
    if (event.type === 'change') {
      this.propagateEvent(event);
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

    const bringItBack = () => {
      const elementAfter = this.shadow.querySelector('datalist');
      elementAfter?.before(selector);
    };

    let lastChangeEvent: Event;
    const changeHandler = (event: Event) => {
      lastChangeEvent = new Event(event.type, event);
      if (topLayer instanceof HTMLElement) topLayer.click();
    };

    topLayer.addEventListener('sectionclose', event => {
      this.shadow.querySelector('label')?.classList.remove('focused');
      bringItBack();
      selector.removeEventListener('change', changeHandler);
      if (lastChangeEvent) selector.propagateEvent(lastChangeEvent);
    }, { once: true });
    selector.addEventListener('change', changeHandler);

    this.shadow.querySelector('label')?.classList.add('focused');
    toTopLayer(selector, event);
  };


  get input(): RadioGroup | undefined {
    const input = this.shadow.querySelector('radio-group');
    if (input instanceof RadioGroup) return input;
  }

  get button(): HTMLButtonElement | undefined {
    const button = this.shadow.querySelector('button');
    if (button instanceof HTMLButtonElement) return button;
  }


  set value(val: string) {
    const input = this.input;
    if (!input) return;
    input.value = val;
    this.updateFormValue(val);

    const button = this.button;
    if (!button) return;
    button.innerHTML = input.valueLabel || '⋯';
  }


  connectedCallback(): void {
    super.connectedCallback();

    const button = this.button;
    button?.addEventListener('click', this.buttonClickHandler);

    // Populate options
    const source = this.shadow.querySelector('datalist > slot');
    if (source instanceof HTMLSlotElement) {
      source.addEventListener('slotchange', this.slotchangeHandler);
      if (source.assignedNodes().length > 0) {
        source.dispatchEvent(new Event('slotchange'));
      }
    }

    // Apply initial value
    const radioGroup = this.shadow.querySelector('radio-group');
    radioGroup?.setAttribute('value', this.initialValue ?? '');
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    const button = this.button;
    button?.removeEventListener('click', this.buttonClickHandler);

    const source = this.shadow.querySelector('datalist > slot');
    source?.removeEventListener('slotchange', this.slotchangeHandler);
  }

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    if (attr === 'value') {
      this.input?.setAttribute(attr, newValue ?? this.defaultValue);
    }
    else super.attributeChangedCallback(attr, oldValue, newValue);
  }
}

if (!customElements.get('input-select')) customElements.define('input-select', InputSelect);