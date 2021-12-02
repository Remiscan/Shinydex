// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



class loadSpinner extends HTMLElement {
  shadow: ShadowRoot;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [sheet];
  }
}

if (!customElements.get('load-spinner')) customElements.define('load-spinner', loadSpinner);