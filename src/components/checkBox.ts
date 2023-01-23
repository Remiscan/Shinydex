import CustomInput from './customInput.js';
// @ts-expect-error
import materialIconsSheet from '../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import themesSheet from '../../styles/themes.css.php' assert { type: 'css' };
// @ts-expect-error
import commonSheet from '../../styles/common.css' assert { type: 'css' };



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form>
    <input type="checkbox" name="checkbox" id="checkbox" value="true">
    <label for="checkbox" class="surface interactive">
      <span class="material-icons" part="icon icon-unchecked">
        <slot name="icon-unchecked">check_box_outline_blank</slot>
      </span>
      <span class="material-icons" part="icon icon-checked">
        <slot name="icon-checked">check_box</slot>
      </span>
      <span part="label" class="label-large">
        <slot></slot>
      </span>
    </label>
  </form>
`;



export const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  form {
    display: contents;
  }

  input {
    height: 0;
    width: 0;
    margin: 0;
    opacity: 0;
    pointer-events: none;
    position: absolute;
  }

  label {
    border: none;
    margin: 0;
    padding: 0;
    font: inherit;

    height: 40px;
    min-height: 40px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 8px;
    padding: 0 12px 0 8px;
    position: relative;
    --elevation-shadow: none;
    --surface-opacity: 0;
    --elevation-opacity: 0;
    --state-tint: var(--on-surface);
  }

  label::before,
  label::after {
    content: '';
    display: flex;
    width: 100%;
    min-width: var(--tap-safe-size);
    height: 100%;
    min-height: var(--tap-safe-size);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  label::after {
    min-width: unset;
    min-height: unset;
    pointer-events: none;
    border-radius: 20px;
  }

  label > .material-icons {
    color: rgb(var(--on-surface-variant));
  }

  input:checked + label,
  input:checked + label > .material-icons {
    color: rgb(var(--primary));
    --elevation-opacity: var(--elevation-2-opacity);
  }

  input:checked + label [part~="icon-unchecked"],
  input:not(:checked) + label [part~="icon-checked"] {
    display: none;
  }

  input:focus + label::after {
    outline: 2px solid currentColor;
    outline: 5px auto Highlight;
    outline: 5px auto -webkit-focus-ring-color;
    outline-offset: 1px;
  }

  input:focus:not(:focus-visible) + label::after {
    outline: none;
  }
`);



export class CheckBox extends CustomInput {
  static template = template;
  static sheets = [materialIconsSheet, themesSheet, commonSheet, sheet];
  static attributes = ['checked', 'disabled', 'readonly', 'required', 'value'];
  static defaultValue = 'false';


  inputHandler = (event: Event) => {
    this.checked = this.input?.checked ?? false;
    if (event.type === 'change') {
      const cloneEvent = new Event(event.type, event);
      this.dispatchEvent(cloneEvent);
    }
  };


  get input(): HTMLInputElement | undefined {
    const input = this.shadow.querySelector('input');
    if (input instanceof HTMLInputElement) return input;
  }


  get checked(): boolean {
    return this.value === 'true';
  }

  set checked(bool: boolean) {
    this.value = String(bool);
  }

  get value(): string {
    const input = this.input;
    return String((input && 'checked' in input && input?.checked) ?? false);
  }

  set value(val: string) {
    const input = this.input;
    if (!input || !('checked' in input)) return;
    input.checked = val === 'true';
    super.updateFormValue(val);
  }

  get initialValue() {
    return String(this.getAttribute('checked') != null);
  }
}

if (!customElements.get('check-box')) customElements.define('check-box', CheckBox);