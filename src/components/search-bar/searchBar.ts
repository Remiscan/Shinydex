import { Params } from '../../Params.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



export class searchBar extends HTMLElement {
  ready: boolean = false;
  resetField: (e: Event) => void = () => {};

  constructor() {
    super();
  }


  open() {
    document.body.setAttribute('data-search', 'true');
    this.animate([
      { clipPath: 'circle(0 at top center)' },
      { clipPath: 'circle(100vmin at top center)' }
    ], {
      duration: 250,
      easing: Params.easingDecelerate,
      fill: 'backwards'
    });
    this.querySelector('input')!.focus();
  }


  close() {
    document.body.removeAttribute('data-search');
  }


  update(name: string, value: string | null = this.getAttribute(name)) {
    if (!this.ready) return;
    switch (name) {
      case 'section': {
        const input = this.querySelector('input')!;
        let placeholder = 'Rechercher un Pokémon';
        const section = this.getAttribute('section') || '';
        switch (section) {
          case 'partage': placeholder = 'Rechercher un ami'; break;
        }
        input.setAttribute('placeholder', placeholder);
      } break;
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

    const resetIcon = this.querySelector('.reset-icon')!;
    resetIcon.addEventListener('click', this.resetField = (event: Event) => {
      const input = (event.currentTarget as HTMLButtonElement).parentElement?.querySelector('input')!;
      input.value = '';
      input.focus();
    });
  }

  disconnectedCallback() {
    const resetIcon = this.querySelector('.reset-icon')!;
    resetIcon.removeEventListener('click', this.resetField);
    this.ready = false;
  }

  static get observedAttributes() {
    return ['section'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('search-bar')) customElements.define('search-bar', searchBar);