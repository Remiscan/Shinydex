import { wait } from '../Params.js';
import { Pokemon } from '../Pokemon.js';
import { Settings } from '../Settings.js';
import { pokemonData } from '../jsonData.js';
import { Notif } from '../notification.js';
import { getString, translationObserver } from '../translation.js';
import { SpriteViewer } from './sprite-viewer/spriteViewer.js';



export const template = document.createElement('template');
template.innerHTML = /*html*/`
  <button type="button" class="pkmnicon"></button>
`;



export class dexIcon extends HTMLElement {
  #populated = false;
  dexid: number = 0;

  clickHandler = async (event: Event) => {
    try {
      const viewer = document.querySelector('sprite-viewer');
      if (!(viewer instanceof SpriteViewer)) throw new TypeError('Expecting SpriteViewer');

      const dialog = viewer.closest('dialog#sprite-viewer');
      if (!(dialog instanceof HTMLDialogElement)) throw new TypeError('Expecting HTMLDialogElement');

      if (!(navigator.onLine) && !(await Settings.get('cache-all-sprites'))) {
        return new Notif(getString('error-no-connection')).prompt();
      }

      let originX, originY;
      if (event instanceof PointerEvent && event.clientX && event.clientY) {
        originX = event.clientX;
        originY = event.clientY;
      } else {
        const rect = this.getBoundingClientRect();
        originX = rect.x;
        originY = rect.y;
      }

      dialog.style.transformOrigin = originX + 'px ' + originY + 'px';

      const readinessChecker = new Promise(resolve => {
        let contentreadyHandler: (event: Event) => void;
        viewer.addEventListener('contentready', contentreadyHandler = () => {
          resolve(true);
          viewer.removeEventListener('contentready', contentreadyHandler);
        });
      }).then(() => console.log('sprite-viewer contentready done'));

      const spritesLoadChecker = new Promise(resolve => {
        let spriteloadHandler: (event: Event) => void;
        viewer.addEventListener('allspritesloaded', spriteloadHandler = _event => {
          resolve(true);
          viewer.removeEventListener('spriteload', spriteloadHandler);
        });
        wait(3000).then(() => {
          resolve(false);
          viewer.removeEventListener('spriteload', spriteloadHandler)
        });
      }).then(() => console.log('sprite-viewer sprites loading done'));

      const caughtFormsList = this.getAttribute('data-caught-forms') ?? '';

      viewer.setAttribute('data-caught-forms', caughtFormsList);
      viewer.setAttribute('dexid', String(this.dexid || ''));
      viewer.setAttribute('shiny', 'true');
      viewer.setAttribute('size', navigator.onLine ? '512' : '112');

      // On attend que le sprite viewer soit bien peuplé pour lancer l'animation d'apparition
      // (si le peuplement prend + de 500ms, on lance l'animation quand même)
      await Promise.any([
        Promise.all([readinessChecker, spritesLoadChecker]),
        new Promise(resolve => setTimeout(resolve, 200))
      ]);

      viewer.open();
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