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
      <select class="body-large"></select>
      <span class="arrow material-icons">expand_more</span>
      <span class="material-icons trailing-icon" aria-hidden="true">
        <slot name="trailing-icon"></slot>
        <span class="error-icon">error</span>
      </span>
      <span hidden><slot></slot></span>
    </label>
  </form>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  select {
    background: inherit;
    appearance: none;
    padding-right: 24px;
  }

  .arrow {
    grid-row: 2;
    grid-column: text;
    justify-self: end;
    align-self: center;
    color: rgb(var(--on-surface));
    pointer-events: none;
  }

  [hidden] {
    display: none;
  }
`);



export class InputSelect extends TextField {
  static template = template;

  slotchangeHandler = (event: Event) => {
    const slot = event.target;
    if (!(slot instanceof HTMLSlotElement)) return;

    const input = this.input;
    if (!input) return;

    const oldValue = input.value;
    input.innerHTML = '';
    const values = [];
    for (const node of slot.assignedNodes()) {
      if (!(node instanceof HTMLOptionElement)) continue;
      values.push(node.getAttribute('value') ?? node.innerHTML);
      input.appendChild(node.cloneNode(true));
    }
    input.value = oldValue;
    if (oldValue === '' && !(values.includes(''))) {
      input.value = values[0];
    }
  };

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [...this.shadow.adoptedStyleSheets, sheet];
  }


  override get input(): HTMLSelectElement | undefined {
    const input = this.shadow.querySelector('select');
    if (input instanceof HTMLSelectElement) return input;
  }

  connectedCallback(): void {
    const source = this.shadow.querySelector('span[hidden] > slot');
    if (source instanceof HTMLSlotElement) {
      source.addEventListener('slotchange', this.slotchangeHandler);
      if (source.assignedNodes().length > 0) {
        source.dispatchEvent(new Event('slotchange'));
      }
    }

    super.connectedCallback();
  }

  disconnectedCallback(): void {
    const source = this.shadow.querySelector('span[hidden] > slot');
    source?.removeEventListener('slotchange', this.slotchangeHandler);

    super.disconnectedCallback();
  }


  static get observedAttributes() { return [...TextField.globalAttributes, 'autocomplete', 'disabled', 'multiple', 'name', 'required', 'size']; }
}

if (!customElements.get('input-select')) customElements.define('input-select', InputSelect);