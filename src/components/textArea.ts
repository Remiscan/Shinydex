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
      <textarea class="body-large"></textarea>
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

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [...this.shadow.adoptedStyleSheets, sheet];
  }


  override get input(): HTMLTextAreaElement | undefined {
    const input = this.shadow.querySelector('textarea');
    if (input instanceof HTMLTextAreaElement) return input;
  }


  static get observedAttributes() { return [...TextField.globalAttributes, 'autocomplete', 'autocorrect', 'cols', 'disabled', 'maxlength', 'minlength', 'name', 'placeholder', 'readonly', 'required', 'rows', 'spellcheck', 'wrap']; }
}

if (!customElements.get('text-area')) customElements.define('text-area', TextArea);