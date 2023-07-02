import { pad, wait } from '../../Params.js';
import { Pokemon } from '../../Pokemon.js';
import { Shiny } from '../../Shiny.js';
import { SupportedLang, pokemonData } from '../../jsonData.js';
import { shinyStorage } from '../../localForage.js';
import { getString, translationObserver } from '../../translation.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



export class spriteViewer extends HTMLElement {
  ready: boolean = true;
  toggle: () => void = () => {};
  mode: 'shiny' | 'regular' = 'shiny';
  size: number = 512;

  
  constructor() {
    super();
  }


  reset() {
    this.setAttribute('shiny', 'true');
    const switchSR = this.querySelector('shiny-switch');
    if (switchSR == null || !('checked' in switchSR)) throw new TypeError(`Expecting ShinySwitch`);
    switchSR.checked = true;
  }


  /** Affiche les sprites de toutes les formes du Pokémon demandé. */
  async updateSprites(dexid: string) {
    const pokemon = new Pokemon(pokemonData[Number(dexid)]);

    // On place le numéro et nom
    this.querySelector('.info-dexid')!.innerHTML = pad(String(pokemon.dexid), 3);

    const container = document.querySelector(`#pokedex`);
    if (!(container instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

    const sectionFilters = {
      mine: new Set(container.getAttribute('data-filter-mine')?.split(' ') ?? []),
      legit: new Set(container.getAttribute('data-filter-legit')?.split(' ') ?? [])
    };

    const caughtFormsList: Set<string> = new Set();
    await shinyStorage.keys().then(keys => Promise.all(keys.map(async key => {
      const shiny = new Shiny(await shinyStorage.getItem(key));
      if (shiny.dexid !== Number(dexid)) return;

      // On vérifie si le Shiny correspond aux filtres sélectionnés
      const shinyFilters = {
        mine: String(shiny.mine),
        legit: String(shiny.legit)
      };
      if (sectionFilters.mine.has(shinyFilters.mine) && sectionFilters.legit.has(shinyFilters.legit)) {
        caughtFormsList.add(shiny.forme);
      }
    })));

    // On réordonne les formes (normale d'abord, les autres ensuite)
    const formes = pokemon.formes.slice().sort((a, b) => {
      if (a.name['fr'] === '') return -1;
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

      const templateS = document.createElement('template');
      templateS.innerHTML = /*html*/`
        <div class="dex-sprite" data-forme="${forme.dbid}">
          <picture ${(typeof forme.noShiny != 'undefined' && forme.noShiny) ? 'class="no-shiny"' : ''}>
            <pokemon-sprite dexid="${pokemon.dexid}" shiny="true" forme="${forme.dbid}" size="${this.size}" lazy="true"></pokemon-sprite>
            ${(typeof forme.noShiny != 'undefined' && forme.noShiny) ? '<span class="label-large">N\'existe pas<br>en chromatique</span>' : ''}
          </picture>
          <span class="forme-name surface variant label-medium ${caught ? 'caught' : ''}">
            <span class="forme-name-arrow surface variant"></span>
            ${caught ? '<span class="icon" data-icon="ball/poke"></span>' : ''}
            ${pokemon.getFormeName(forme.dbid, true)}
          </span>
        </div>
      `;
      const dexSpriteS = templateS.content.cloneNode(true) as DocumentFragment;

      const templateR = document.createElement('template');
      templateR.innerHTML = /*html*/`
        <div class="dex-sprite" data-forme="${forme.dbid}">
          <picture>
            <pokemon-sprite dexid="${pokemon.dexid}" shiny="false" forme="${forme.dbid}" size="${this.size}" lazy="true"></pokemon-sprite>
          </picture>
          <span class="forme-name surface variant label-medium ${caught ? 'caught' : ''}">
            <span class="forme-name-arrow surface variant"></span>
            ${caught ? '<span class="icon" data-icon="ball/poke"></span>' : ''}
            ${pokemon.getFormeName(forme.dbid, true)}
          </span>
        </div>
      `;
      const dexSpriteR = templateR.content.cloneNode(true) as DocumentFragment;

      // Load regular sprites after shiny sprites
      dexSpriteS.querySelector('pokemon-sprite')?.addEventListener('load', async () => {
        await wait(200);
        listeRegular.querySelector(`.dex-sprite[data-forme="${forme.dbid}"] pokemon-sprite`)
        ?.shadowRoot?.querySelector('img')?.setAttribute('loading', 'eager');
      }, { once: true });

      listeShiny.appendChild(dexSpriteS);
      listeRegular.appendChild(dexSpriteR);
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
    for (const attr of spriteViewer.observedAttributes) {
      this.update(attr);
    }

    const form = this.querySelector('form[name="switch-shiny-regular"]');
    if (!(form instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
    form.addEventListener('change', this.toggleShinyRegular);

    const switchSR = this.querySelector('shiny-switch');
    const spriteScroller = this.querySelector('.sprite-scroller')!;
    if (switchSR == null || !('checked' in switchSR)) throw new TypeError(`Expecting ShinySwitch`);
    spriteScroller.addEventListener('click', this.toggle = () => switchSR.shadowRoot!.querySelector('button')?.click());
  }

  disconnectedCallback() {
    translationObserver.unserve(this);

    const form = this.querySelector('form[name="switch-shiny-regular"]');
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

if (!customElements.get('sprite-viewer')) customElements.define('sprite-viewer', spriteViewer);