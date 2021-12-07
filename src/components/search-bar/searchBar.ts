// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



class searchBar extends HTMLElement {
  ready: boolean = false;

  constructor() {
    super();
  }


  update(name: string, value: string | null = this.getAttribute(name)) {
    if (!this.ready) return;
    switch (name) {
      case 'placeholder':
        this.querySelector('input')?.setAttribute('placeholder', value || '');
        break;
    }
  }
  

  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));
    if (!(document.adoptedStyleSheets.includes(sheet))) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
    this.ready = true;
    for (const attr of searchBar.observedAttributes) {
      this.update(attr);
    }
  }

  disconnectedCallback() {
    this.ready = false;
  }

  static get observedAttributes() {
    return ['section', 'placeholder'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('search-bar')) customElements.define('search-bar', searchBar);