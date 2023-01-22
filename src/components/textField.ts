import '../../../_common/polyfills/element-internals.js';
// @ts-expect-error
import materialIconsSheet from '../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import themesSheet from '../../styles/themes.css.php' assert { type: 'css' };
// @ts-expect-error
import commonSheet from '../../styles/common.css' assert { type: 'css' };



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form>
    <label class="text-field surface variant interactive">
      <span class="leading-icon" aria-hidden="true">
        <slot name="leading-icon"></slot>
      </span>
      <span class="label body-medium">
        <slot name="label"></slot>
      </span>
      <input type="text" class="body-large">
      <span class="material-icons trailing-icon" aria-hidden="true">
        <slot name="trailing-icon"></slot>
        <span class="error-icon">error</span>
      </span>
    </label>
  </form>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  :host {
    --indicator-color: rgb(var(--on-surface-variant));
    --caret-color: rgb(var(--primary));
  }

  :host(:focus-within) {
    --indicator-color: rgb(var(--primary));
    --label-color: rgb(var(--primary));
  }

  :host(:hover:invalid),
  :host([internals-invalid]:hover) {
    --indicator-color: rgb(var(--on-error-container));
    --caret-color: rgb(var(--on-error-container));
    --text-color: rgb(var(--on-error-container));
    --label-color: rgb(var(--on-error-container));
    --trailing-icon-color: rgb(var(--on-error-container));
  }

  :host(:invalid),
  :host([internals-invalid]),
  :host(:focus-within:invalid),
  :host(:focus-within[internals-invalid]) {
    --indicator-color: rgb(var(--error));
    --caret-color: rgb(var(--error));
    --text-color: rgb(var(--error));
    --label-color: rgb(var(--error));
    --trailing-icon-color: rgb(var(--error));
  }

  form {
    display: contents;
  }

  label {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns:
      [leading-icon] auto
      [text] 1fr
      [trailing-icon] auto
      ;
    grid-template-rows: auto 1fr;
    align-items: center;
    padding: 8px 16px;
    padding-bottom: 9px;
    border-bottom: 1px solid var(--indicator-color);
    min-height: 56px;
    box-sizing: border-box;
    border-radius: 4px 4px 0 0;
  }

  .leading-icon,
  .trailing-icon {
    grid-row: 1 / -1;
    display: inline-flex;
  }
  
  .leading-icon {
    grid-column: leading-icon;
    margin-left: -4px;
    margin-right: 16px;
  }
  
  .label {
    grid-row: 1;
    grid-column: text;
    color: var(--label-color);
  }

  /* Reset input styles */

  :is(input, select, textarea) {
    margin: 0;
    padding: 0;
    border: none;
    box-sizing: content-box;
    display: inline-block;
    vertical-align: middle;
    white-space: normal;
    background: transparent;
    line-height: inherit;
    font: inherit;
    color: inherit;
    grid-row: 2;
    grid-column: text;
    caret-color: var(--caret-color);
    color: rgb(var(--on-surface));
  }

  :is(input, select, textarea):focus,
  :is(input, select, textarea):focus-visible {
    outline: none;
  }
  
  input {
    grid-row: 2;
    grid-column: text;
    cursor: text;
    caret-color: var(--caret-color);
    color: rgb(var(--on-surface));
  }

  :is(input, textarea)::placeholder {
    color: rgb(var(--on-surface-variant));
  }
  
  .trailing-icon {
    grid-column: trailing-icon;
    margin-left: 16px;
    margin-right: -4px;
    color: var(--trailing-icon-color);
  }

  .error-icon {
    display: none;
  }

  :host(:not([icons~="leading"])) .leading-icon,
  :host(:not([icons~="trailing"], :invalid, [internals-invalid])) .trailing-icon {
    display: none;
  }

  :host(:is(:invalid, [internals-invalid])) .trailing-icon > slot {
    display: none;
  }

  :host(:is(:invalid, [internals-invalid])) .error-icon {
    display: inline-flex;
  }

  label:focus-within {
    border-bottom: 2px solid var(--indicator-color);
    padding-bottom: 8px;
    --state-opacity: var(--state-focus-opacity);
  }
`);



export class TextField extends HTMLElement {
  static template = template;
  static sheet = sheet;

  static formAssociated = true;
  #internals;
  shadow: ShadowRoot;

  inputHandler = (event: Event) => {
    this.value = this.input?.value ?? '';
    if (event.type === 'change') {
      const cloneEvent = new Event(event.type, event);
      this.dispatchEvent(cloneEvent);
    }
  };

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild((this.constructor as typeof TextField).template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [materialIconsSheet, themesSheet, commonSheet, (this.constructor as typeof TextField).sheet];
    if ('ElementInternals' in window && 'setFormValue' in window.ElementInternals.prototype) {
      this.#internals = this.attachInternals();
    }
  }


  // Useful properties and methods for form-associated elements
  get form() { return this.#internals?.form; }
  get name() { return this.getAttribute('name'); }
  get type() { return this.localName; }
  get validity() {return this.#internals?.validity; }
  get validationMessage() {return this.#internals?.validationMessage; }
  get willValidate() {return this.#internals?.willValidate; }
  checkValidity() { return this.#internals?.checkValidity(); }
  reportValidity() {return this.#internals?.reportValidity(); }


  get input(): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined {
    const input = this.shadow.querySelector('input');
    if (input instanceof HTMLInputElement) return input;
  }


  get value(): string {
    return this.input?.value ?? '';
  }

  set value(val: string) {
    const input = this.input;
    if (!input) return;
    input.value = val;
    this.#internals?.setFormValue(val);
    this.#internals?.setValidity(input.validity, input.validationMessage);
  }


  connectedCallback() {
    const initialValue = this.getAttribute('value');
    this.value = initialValue ?? '';

    const input = this.input;
    input?.addEventListener('input', this.inputHandler);
    input?.addEventListener('change', this.inputHandler);
  }


  disconnectedCallback() {
    const input = this.input;
    input?.removeEventListener('input', this.inputHandler);
    input?.removeEventListener('change', this.inputHandler);
  }


  static get globalAttributes() { return ['accesskey', 'autocapitalize', 'autofocus', 'contextmenu', 'dir', 'enterhintkey', 'inputmode', 'spellcheck', 'tabindex', 'title', 'translate', 'virtualkeyboardpolicy']; }

  static get observedAttributes() { return [...TextField.globalAttributes, 'autocomplete', 'dirname', 'disabled', 'list', 'maxlength', 'minlength', 'name', 'pattern', 'placeholder', 'readonly', 'required', 'size', 'spellcheck', 'value', 'autocorrect', 'type']; }
  

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    if (attr === 'type')       this.input?.setAttribute(attr, newValue ?? 'text');
    else if (newValue != null) this.input?.setAttribute(attr, newValue);
    else                       this.input?.removeAttribute(attr);
  }
}

if (!customElements.get('text-field')) customElements.define('text-field', TextField);