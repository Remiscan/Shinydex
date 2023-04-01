import { Pokemon } from '../Pokemon.js';
import { navigate } from '../navigate.js';
import { getString, translationObserver } from '../translation.js';
import { Notif } from '../notification.js';



export const template = document.createElement('template');
template.innerHTML = /*html*/`
  <button type="button" class="pkmnicon"></button>
`;



export class dexIcon extends HTMLElement {
  #populated = false;
  dexid: number = 0;

  clickHandler = (event: Event) => {
    try {
      navigate('sprite-viewer', event, { dexid: String(this.dexid) });
    } catch (error) {
      const message = getString('error-cant-display-pokemon');
      console.error(message, error);
      new Notif(message).prompt();
    }
  }
  
  constructor() {
    super();
  }

  update(attr: string, oldValue: string | null, newValue: string | null) {
    switch (attr) {
      case 'dexid': {
        this.dexid = parseInt(newValue ?? '');
        const button = this.querySelector('button');
        button?.setAttribute('data-dexid', String(this.dexid));
        button?.setAttribute('data-label', `pokemon/${this.dexid}`);
        button?.setAttribute('aria-label', Pokemon.names()[this.dexid]);
      }
    }
  }

  connectedCallback() {
    if (!this.#populated) {
      const content = template.content.cloneNode(true) as DocumentFragment;
      this.appendChild(content);
      this.classList.add('surface', 'interactive');
      this.#populated = true;
    }

    const button = this.querySelector('button');
    button?.addEventListener('click', this.clickHandler);

    for (const attr of dexIcon.observedAttributes) {
      this.update(attr, null, this.getAttribute(attr));
    }

    translationObserver.translate(this);
  }

  disconnectedCallback() {
    const button = this.querySelector('button');
    button?.removeEventListener('click', this.clickHandler);
  }

  static get observedAttributes() { return ['dexid']; }

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;
    return this.update(attr, oldValue, newValue);
  }
}

if (!customElements.get('dex-icon')) customElements.define('dex-icon', dexIcon);