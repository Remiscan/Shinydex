// @ts-expect-error
import materialIconsSheet from '../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import themesSheet from '../../styles/themes.css.php' assert { type: 'css' };



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <button type="button" part="button">
    <span class="icon material-icons" part="icon"><slot name="icon"></slot></span>
    <span class="label label-large" part="label"><slot name="label"></slot></span>
  </button>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  :host {
    display: contents;
  }

  button {
    -webkit-appearance: none;
    appearance: none;
    background: none;
    border: none;
    margin: 0;
    padding: 0;
    font: inherit;

    height: 40px;
    min-height: 40px;
    width: fit-content;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 24px 0 16px;
    margin: auto;
    --elevation-shadow: none;
  }

  button.only-icon .label,
  button.only-text .icon {
    display: none;
  }

  button.only-icon {
    padding: 0 16px;
  }

  button.only-text {
    padding: 0 24px;
  }

  /* Elevated */

  button.elevated {
    --surface-color: var(--surface);
    --elevation-opacity: var(--elevation-1-opacity);
    --elevation-shadow: var(--elevation-1-shadow);
    color: rgb(var(--primary));
    --state-tint: var(--primary);
  }

  button.elevated:focus {
    --elevation-opacity: var(--elevation-1-opacity);
    --elevation-shadow: var(--elevation-1-shadow);
  }

  button.elevated:hover {
    --elevation-opacity: var(--elevation-2-opacity);
    --elevation-shadow: var(--elevation-2-shadow);
  }

  button.elevated:active {
    --elevation-opacity: var(--elevation-1-opacity);
    --elevation-shadow: var(--elevation-1-shadow);
  }

  /* Filled */

  button.filled {
    --surface-color: var(--primary);
    --surface-opacity: 1;
    color: rgb(var(--on-primary));
    --state-tint: var(--on-primary);
  }

  /* Filled tonal */

  button.filled.tonal {
    --surface-color: var(--secondary-container);
    color: rgb(var(--on-secondary-container));
    --state-tint: var(--on-secondary-container);
  }

  button.filled.error {
    --surface-color: var(--error-container);
    color: rgb(var(--on-error-container));
    --state-tint: var(--on-error-container);
  }

  /* Outlined */

  button.outlined {
    --surface-opacity: 0;
    color: rgb(var(--primary));
    outline: 1px solid rgb(var(--outline));
    --state-tint: var(--primary);
  }

  button.outlined:focus {
    outline: 1px solid rgb(var(--primary));
  }

  /* Text */

  button.text {
    --surface-opacity: 0;
    color: rgb(var(--primary));
    --state-tint: var(--primary);
  }

  /* Fab */

  button.fab {
    --surface-color: var(--primary-container);
    --elevation-opacity: var(--elevation-1-opacity);
    --elevation-shadow: var(--elevation-1-shadow);
    color: rgb(var(--on-primary-container));
    --state-tint: var(--on-primary-container);
    min-width: 56px;
    height: 56px;
    border-radius: 16px;
    margin: 16px;
  }

  button.fab.small {
    min-width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  button.fab.large {
    min-width: 96px;
    height: 96px;
    border-radius: 28px;
  }

  button.fab:focus {
    --elevation-opacity: var(--elevation-1-opacity);
    --elevation-shadow: var(--elevation-1-shadow);
  }

  button.fab:hover {
    --elevation-opacity: var(--elevation-2-opacity);
    --elevation-shadow: var(--elevation-2-shadow);
  }

  button.fab:active {
    --elevation-opacity: var(--elevation-1-opacity);
    --elevation-shadow: var(--elevation-1-shadow);
  }

  /* Icon button */

  button.icon {
    width: 40px;
    height: 40px;
    --surface-opacity: 0;
    --elevation-opacity: 0;
    --state-tint: var(--on-surface);
  }

  button.icon::before {
    width: 48px;
    height: 48px;
    content: '';
    position: absolute;
  }

  /* Disabled */

  button:disabled {
    --surface-color: var(--on-surface);
    --elevation-opacity: 0;
    --surface-opacity: .12;
    color: rgb(var(--on-surface), .38);
  }

  button.outlined:disabled {
    outline: 1px solid rgb(var(--on-surface));
  }
`);



export class MaterialButton extends HTMLElement {
  shadow: ShadowRoot;
  clickHandler: (event: Event) => void;

  static formAssociated = true;
  #internals;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [materialIconsSheet, themesSheet, sheet];
    if ('ElementInternals' in window && 'setFormValue' in window.ElementInternals.prototype) {
      this.#internals = this.attachInternals();
    }

    this.clickHandler = event => {
      const type = this.buttonElement?.getAttribute('type') ?? '';
      if (this.#internals) {
        if (type === 'submit') this.form?.submit();
        else if (type === 'reset') this.form?.reset();
      }
    };
  }

  get buttonElement() {
    return this.shadow.querySelector('button');
  }

  get iconElement() {
    return this.shadow.querySelector('.icon');
  }

  get icon() {
    return this.querySelector('[slot="icon"]')?.innerHTML;
  }

  set icon(value) {
    const slot = this.querySelector('[slot="icon"]');
    if (slot) slot.innerHTML = value ?? '';
  }

  get labelElement() {
    return this.shadow.querySelector('.label');
  }


  connectedCallback() {
    this.buttonElement?.addEventListener('click', this.clickHandler);
  }

  disconnectedCallback() {
    this.buttonElement?.removeEventListener('click', this.clickHandler);
  }

  static get observedAttributes() {
    return ['class', 'type'];
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    const button = this.buttonElement;
    let appliedValue = newValue;
    if (name === 'class') {
      appliedValue = `surface interactive ${newValue}`;
    }

    if (appliedValue) button?.setAttribute(name, appliedValue);
    else          button?.removeAttribute(name);
  }

  // Useful properties and methods for form-associated elements
  get form() { return this.#internals?.form; }
  get name() { return this.getAttribute('name'); }
  get type() { return this.localName; }
}

if (!customElements.get('material-button')) customElements.define('material-button', MaterialButton);