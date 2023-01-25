import CustomInput from './customInput.js';
// @ts-expect-error
import materialIconsSheet from '../../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import themesSheet from '../../../styles/themes.css.php' assert { type: 'css' };
// @ts-expect-error
import commonSheet from '../../../styles/common.css' assert { type: 'css' };



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form>
    <label class="text-field surface standard elevation-2 interactive" part="container">
      <span class="leading-icon" aria-hidden="true">
        <slot name="leading-icon"></slot>
      </span>
      <span class="label body-medium">
        <slot name="label"></slot>
      </span>
      <input type="text" class="body-large" part="input">
      <span class="material-icons trailing-icon" aria-hidden="true">
        <slot name="trailing-icon"></slot>
        <span class="error-icon">error</span>
      </span>
    </label>
  </form>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
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
    grid-template-rows: auto auto;
    align-items: center;
    padding: 8px 16px;
    padding-bottom: 9px;
    border-bottom: 1px solid var(--indicator-color);
    min-height: 56px;
    box-sizing: border-box;
    border-radius: 4px 4px 0 0;
    position: relative;

    --indicator-color: rgb(var(--on-surface-variant));
    --caret-color: rgb(var(--primary));
  }

  label:focus-within,
  label.focused {
    --indicator-color: rgb(var(--primary));
    --label-color: rgb(var(--primary));
  }

  :host(:invalid) label:hover,
  :host([internals-invalid]) label:hover {
    --indicator-color: rgb(var(--on-error-container));
    --caret-color: rgb(var(--on-error-container));
    --text-color: rgb(var(--on-error-container));
    --label-color: rgb(var(--on-error-container));
    --trailing-icon-color: rgb(var(--on-error-container));
  }

  :host(:invalid) label,
  :host([internals-invalid]) label,
  :host(:invalid) label:is(:focus-within, .focused),
  :host([internals-invalid]) label:is(:focus-within, .focused) {
    --indicator-color: rgb(var(--error));
    --caret-color: rgb(var(--error));
    --text-color: rgb(var(--error));
    --label-color: rgb(var(--error));
    --trailing-icon-color: rgb(var(--error));
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

  .label,
  .body-large {
    line-height: normal;
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

  label:is(:focus-within, .focused) {
    border-bottom: 2px solid var(--indicator-color);
    padding-bottom: 8px;
    --state-opacity: var(--state-focus-opacity);
  }
`);



export class TextField extends CustomInput {
  static template = template;
  static sheets = [materialIconsSheet, themesSheet, commonSheet, sheet];
  static attributes = ['autocomplete', 'dirname', 'disabled', 'list', 'maxlength', 'minlength', 'name', 'pattern', 'placeholder', 'readonly', 'required', 'size', 'spellcheck', 'value', 'autocorrect', 'type'];

  formSubmitHandler = (event: Event) => event.preventDefault();


  connectedCallback(): void {
    super.connectedCallback();

    const form = this.shadow.querySelector('form');
    form?.addEventListener('submit', this.formSubmitHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    const form = this.shadow.querySelector('form');
    form?.removeEventListener('submit', this.formSubmitHandler);
  }
}

if (!customElements.get('text-field')) customElements.define('text-field', TextField);