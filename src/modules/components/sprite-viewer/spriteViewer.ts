import { pad, wait } from '../../Params.js';
import { Pokemon } from '../../Pokemon.js';
import { SupportedLang, pokemonData } from '../../jsonData.js';
import { getString, translationObserver } from '../../translation.js';
import sheet from './styles.css' with { type: 'css' };
import template from './template.js';



export class SpriteViewer extends HTMLElement {
  ready: boolean = true;
  toggle: () => void = () => {};
  mode: 'shiny' | 'regular' = 'shiny';
  size: number = 512;

  
  constructor() {
    super();
  }


  open() {
    const dialog = this.closest('dialog#sprite-viewer');
    if (!(dialog instanceof HTMLDialogElement)) throw new TypeError('Expecting HTMLDialogElement');
    dialog.showModal();
    dialog.addEventListener('close', this.dialogCloseHandler);
  }


  close() {
    const dialog = this.closest('dialog#sprite-viewer');
    if (!(dialog instanceof HTMLDialogElement)) throw new TypeError('Expecting HTMLDialogElement');
    dialog.close();
    dialog.removeEventListener('close', this.dialogCloseHandler);
  }


  dialogCloseHandler = async (event: Event) => {
    const dialog = event.target;
    await Promise.any([
      wait(210),
      new Promise(resolve => dialog?.addEventListener('transitionend', resolve, { once: true }))
    ]);
    this.removeAttribute('dexid');
  }


  /** Affiche les sprites de toutes les formes du Pokémon demandé. */
  async updateSprites(dexid: string) {
    const pokemon = new Pokemon(pokemonData[Number(dexid)]);

    const container = document.querySelector(`#pokedex`);
    if (!(container instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

    const caughtFormsList: Set<string> = new Set(this.getAttribute('data-caught-forms')?.split(' ') ?? []);
    if (caughtFormsList.has('')) caughtFormsList.delete('');
    if (caughtFormsList.has('emptystring')) {
      caughtFormsList.add('');
      caughtFormsList.delete('emptystring');
    }

    // On place le numéro
    const dexInfos = this.querySelector('.sprite-viewer-dex-info')!;
    const dexNumberContainer = dexInfos.querySelector('.info-dexid')!;
    if (caughtFormsList.size > 0) dexInfos.classList.add('caught');
    else                          dexInfos.classList.remove('caught');
    dexNumberContainer.innerHTML = pad(String(pokemon.dexid), 4);

    // On place le nom dans le FAB
    const fab = this.querySelector('#sprite-viewer-fab');
    const labelContainer = fab?.querySelector('.fab-label');
    if (labelContainer) {
      const label = getString('sprite-viewer-fab').replace('{{name}}', pokemon.getName());
      labelContainer.innerHTML = label;
    }

    // On réordonne les formes (normale d'abord, puis catchable, puis les autres)
    const formes = pokemon.formes.slice()
    .sort((a, b) => {
      if (a.name['fr'] === '') return -1;
      else return 0;
    })
    .sort((a, b) => {
      if (a.catchable && !b.catchable) return -1;
      else if (!a.catchable && b.catchable) return 1;
      else return 0;
    });

    const spriteScroller = this.querySelector('.sprite-scroller')!;
    spriteScroller.classList.remove('single-sprite', 'two-sprites');
    const className = formes.length === 2 ? 'two-sprites' : formes.length === 1 ? 'single-sprite' : null;
    if (className) spriteScroller.classList.add(className);

    // On place les sprites
    const listeShiny = this.querySelector('.sprite-list.shiny')!;
    listeShiny.innerHTML = '';
    const listeRegular = this.querySelector('.sprite-list.regular')!;
    listeRegular.innerHTML = '';

    for (const forme of formes) {
      const caught = caughtFormsList.has(forme.dbid);
      const formeNameTemplate = /*html*/`
        <span class="forme-name surface surface-container-high label-medium ${caught ? 'caught' : forme.catchable ? 'catchable' : ''}">
          <span class="forme-name-arrow surface"></span>
          ${
            caught ? '<span class="icon" data-icon="ball/poke"></span>' :
            forme.catchable ? `
            <span class="icon not-caught-indicator">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <circle cx="50%" cy="50%" r="9" fill="transparent" stroke-width="1" stroke-dasharray="3 2"/>
              </svg>
            </span>
            ` : ''
          }
          ${pokemon.getFormeName(forme.dbid, true)}
        </span>
      `;

      const templateS = document.createElement('template');
      templateS.innerHTML = /*html*/`
        <div class="dex-sprite" data-forme="${forme.dbid}">
          <picture ${(typeof forme.noShiny != 'undefined' && forme.noShiny) ? 'class="no-shiny"' : ''}>
            <pokemon-sprite dexid="${pokemon.dexid}" shiny="true" forme="${forme.dbid}" size="${this.size}" lazy="false"></pokemon-sprite>
            ${(typeof forme.noShiny != 'undefined' && forme.noShiny) ? '<span class="label-large">N\'existe pas<br>en chromatique</span>' : ''}
          </picture>
          ${formeNameTemplate}
        </div>
      `;
      const dexSpriteS = templateS.content.cloneNode(true) as DocumentFragment;

      const templateR = document.createElement('template');
      templateR.innerHTML = /*html*/`
        <div class="dex-sprite" data-forme="${forme.dbid}">
          <picture>
            <pokemon-sprite dexid="${pokemon.dexid}" shiny="false" forme="${forme.dbid}" size="${this.size}" lazy="true"></pokemon-sprite>
          </picture>
          ${formeNameTemplate}
        </div>
      `;
      const dexSpriteR = templateR.content.cloneNode(true) as DocumentFragment;

      // Load regular sprites after shiny sprites
      const thisRegularSprite = dexSpriteR.querySelector('pokemon-sprite');
      let spritesLoaded = 0;
      const loadHandler = async (event: Event) => {
        spritesLoaded++;
        thisRegularSprite?.setAttribute('lazy', 'false');
        if (spritesLoaded >= formes.length) {
          this.dispatchEvent(new Event('allspritesloaded', { bubbles: false }));
        }
      };

      const thisShinySprite = dexSpriteS.querySelector('pokemon-sprite');
      new Promise((resolve, reject) => {
        thisShinySprite?.addEventListener('load', resolve);
        thisShinySprite?.addEventListener('error', resolve);
      })
      .then(event => loadHandler(event as Event));

      listeShiny.appendChild(dexSpriteS);
      listeRegular.appendChild(dexSpriteR);

      this.dispatchEvent(new Event('contentready'));
    }
  }


  toggleShinyRegular(event: Event) {
    if (!(event.currentTarget instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
    const formData = new FormData(event.currentTarget);
    const shiny = formData.get('shiny');
    document.querySelector('#sprite-viewer sprite-viewer')!.setAttribute('shiny', String(shiny));
  }


  update(name: string, value: string | null = this.getAttribute(name)) {
    if (!this.ready) return;
    switch (name) {
      case 'dexid': {
        if (value != null) this.updateSprites(value);
        else {
          this.querySelector('.info-dexid')!.innerHTML = '';
          this.querySelector('.sprite-list.shiny')!.innerHTML = '';
          this.querySelector('.sprite-list.regular')!.innerHTML = '';
        }
      } break;
      case 'shiny': {
        const input = this.querySelector('shiny-switch');
        if (input == null || !('checked' in input)) throw new TypeError(`Expecting ShinySwitch`);
        input.checked = value === 'true';
      } break;
      case 'size': {
        this.size = Number(value) || 512;
      } break;
      case 'lang':
        translationObserver.translate(this, value ?? '');
        const switchSR = this.querySelector('shiny-switch');
        switchSR?.setAttribute('label', getString('shiny-switch', (value ?? '') as SupportedLang));
        break;
    }
  }
  

  connectedCallback() {
    translationObserver.serve(this, { method: 'attribute' });

    this.appendChild(template.content.cloneNode(true));
    if (!(document.adoptedStyleSheets.includes(sheet))) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
    this.ready = true;
    for (const attr of SpriteViewer.observedAttributes) {
      this.update(attr);
    }

    const form = this.querySelector('form');
    if (!(form instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
    form.addEventListener('change', this.toggleShinyRegular);

    const switchSR = this.querySelector('shiny-switch');
    const spriteScroller = this.querySelector('.sprite-scroller')!;
    if (switchSR == null || !('checked' in switchSR)) throw new TypeError(`Expecting ShinySwitch`);
    spriteScroller.addEventListener('click', this.toggle = () => switchSR.shadowRoot!.querySelector('button')?.click());
  }

  disconnectedCallback() {
    translationObserver.unserve(this);

    const form = this.querySelector('form');
    if (!(form instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
    form.removeEventListener('change', this.toggleShinyRegular);

    const switchSR = this.querySelector('shiny-switch');
    const spriteScroller = this.querySelector('.sprite-scroller')!;
    if (switchSR == null || !('checked' in switchSR)) throw new TypeError(`Expecting ShinySwitch`);
    spriteScroller.removeEventListener('click', this.toggle);

    this.ready = false;
  }

  static get observedAttributes() {
    return ['dexid', 'shiny', 'size', 'lang'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('sprite-viewer')) customElements.define('sprite-viewer', SpriteViewer);