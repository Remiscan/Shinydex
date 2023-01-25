import { TextField } from './textField.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form>
    <label class="text-field surface standard elevation-2 interactive" part="container">
      <span class="leading-icon">
        <slot name="leading-icon"></slot>
      </span>
      <span class="label body-medium">
        <slot name="label"></slot>
      </span>
      <textarea class="body-large" part="input"></textarea>
      <span class="material-icons trailing-icon" aria-hidden="true">
        <slot name="trailing-icon"></slot>
        <span class="error-icon">error</span>
      </span>
    </label>
  </form>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  textarea {
    vertical-align: top;
  }
`);



export class TextArea extends TextField {
  static template = template;
  static sheets = [...TextField.sheets, sheet];
  static attributes = ['autocomplete', 'autocorrect', 'cols', 'disabled', 'maxlength', 'minlength', 'name', 'placeholder', 'readonly', 'required', 'rows', 'spellcheck', 'wrap'];


  get input(): any {
    const input = this.shadow.querySelector('textarea');
    return input;
  }
}

if (!customElements.get('text-area')) customElements.define('text-area', TextArea);