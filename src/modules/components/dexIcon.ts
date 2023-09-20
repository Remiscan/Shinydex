import { Pokemon } from '../Pokemon.js';
import { pokemonData } from '../jsonData.js';
import { navigate } from '../navigate.js';
import { Notif } from '../notification.js';
import { getString, translationObserver } from '../translation.js';



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

        const catchableForms = pokemonData[this.dexid].formes.filter(f => f.catchable);
        let caughtFormsIndicatorsTemplate = ``;
        for (const forme of catchableForms) {
          const formid = forme.dbid === '' ? 'emptystring' : forme.dbid;
          caughtFormsIndicatorsTemplate += `<span class="caught-form-indicator" data-form="${formid}"></span>`;
        }
        if (button) button.innerHTML = caughtFormsIndicatorsTemplate;
      } // don't break

      case 'data-caught-forms': {
        const button = this.querySelector('button');
        const caughtFormsIndicators = button?.querySelectorAll('.caught-form-indicator') ?? [];
        const caughtForms = new Set(newValue?.split(' ') ?? []);
        for (const indicator of caughtFormsIndicators) {
          const form = indicator.getAttribute('data-form') ?? '';
          if (caughtForms.has(form)) indicator.setAttribute('data-caught', 'true');
          else                       indicator.setAttribute('data-caught', 'false');
        }
      } break;
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

  static get observedAttributes() { return ['dexid', 'data-caught-forms']; }

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;
    return this.update(attr, oldValue, newValue);
  }
}

if (!customElements.get('dex-icon')) customElements.define('dex-icon', dexIcon);