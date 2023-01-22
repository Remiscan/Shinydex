import { TextField } from './textField.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <label class="text-field surface variant interactive">
    <span class="leading-icon">
      <slot name="leading-icon"></slot>
    </span>
    <span class="label body-medium" id="label">
      <slot name="label"></slot>
    </span>
    <textarea class="body-large"></textarea>
    <span class="material-icons trailing-icon" aria-hidden="true">
      <slot name="trailing-icon"></slot>
      <span class="error-icon">error</span>
    </span>
  </label>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  textarea {
    vertical-align: top;
    grid-row: 2;
    grid-column: text;
    cursor: text;
    caret-color: var(--caret-color);
    color: rgb(var(--on-surface));
  }

  textarea::placeholder {
    color: rgb(var(--on-surface-variant));
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
}

if (!customElements.get('text-area')) customElements.define('text-area', TextArea);