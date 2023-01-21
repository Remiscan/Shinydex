import { pad } from '../../Params.js';
import { Pokemon } from '../../Pokemon.js';
import { Shiny } from '../../Shiny.js';
import { pokemonData, shinyStorage } from '../../localForage.js';
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
    const pokemon = new Pokemon(await pokemonData.getItem(dexid));
    const nomFormeNormale = 'Normale';

    const caughtFormsList: Set<string> = new Set();
    await shinyStorage.keys().then(keys => Promise.all(keys.map(async key => {
      const shiny = new Shiny(await shinyStorage.getItem(key));
      if (shiny.dexid !== Number(dexid)) return;
      caughtFormsList.add(shiny.forme);
    })));

    // On réordonne les formes (normale d'abord, les autres ensuite)
    const formes = pokemon.formes.slice().sort((a, b) => {
      if (a.nom === '') return -1;
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

    const nomForme = (nom: string) => {
      switch(nom) {
        case 'Mâle':
        case 'Femelle':
        case 'Méga':
        case 'Méga (X)':
        case 'Méga (Y)':
        case 'Gigamax':
          return nom;
        case '':
          return `Forme ${nomFormeNormale}`;
        default:
          return `Forme ${nom}`;
      }
    };

    for (const forme of formes) {
      const afficherNomForme = true;//(forme.nom != '' || formes.length > 1);
      const caught = caughtFormsList.has(forme.dbid);

      const htmlS = `
        <div class="dex-sprite">
          <picture ${(typeof forme.noShiny != 'undefined' && forme.noShiny) ? 'class="no-shiny"' : ''}>
            <pokemon-sprite dexid="${pokemon.dexid}" shiny="true" forme="${forme.dbid}" size="${this.size}" lazy="false"></pokemon-sprite>
            ${(typeof forme.noShiny != 'undefined' && forme.noShiny) ? '<span>N\'existe pas<br>en chromatique</span>' : ''}
          </picture>
          <span class="forme-name surface variant label-medium ${afficherNomForme ? '' : 'off'} ${caught ? 'caught' : ''}">
            <span class="forme-name-arrow surface variant"></span>
            ${caught ? '<span class="icon" data-icon="ball/poke"></span>' : ''}
            ${afficherNomForme ? nomForme(forme.nom) : '&nbsp;'}
          </span>
        </div>
      `;
      listeShiny.innerHTML += htmlS;

      const htmlR = `
      <div class="dex-sprite">
        <picture>
          <pokemon-sprite dexid="${pokemon.dexid}" shiny="false" forme="${forme.dbid}" size="${this.size}" lazy="false"></pokemon-sprite>
        </picture>
        <span class="forme-name surface variant label-medium ${afficherNomForme ? '' : 'off'} ${caught ? 'caught' : ''}">
          <span class="forme-name-arrow surface variant"></span>
          ${caught ? '<span class="icon" data-icon="ball/poke"></span>' : ''}
          ${afficherNomForme ? nomForme(forme.nom) : '&nbsp;'}
        </span>
      </div>
    `;
    listeRegular.innerHTML += htmlR;
    }

    // On place le numéro et nom
    this.querySelector('.info-dexid')!.innerHTML = pad(String(pokemon.dexid), 3);
    this.querySelector('.info-nom')!.innerHTML = pokemon.getName();
  }


  toggleShinyRegular(event: Event) {
    if (event.currentTarget == null || !('checked' in event.currentTarget)) throw new TypeError(`Expecting ShinySwitch`);
    const shiny = event.currentTarget.checked;
    document.querySelector('#sprite-viewer sprite-viewer')!.setAttribute('shiny', String(shiny));
  }


  update(name: string, value: string | null = this.getAttribute(name)) {
    if (!this.ready) return;
    switch (name) {
      case 'dexid': {
        if (value != null) this.updateSprites(value);
        else {
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
    }
  }
  

  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));
    if (!(document.adoptedStyleSheets.includes(sheet))) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
    this.ready = true;
    for (const attr of spriteViewer.observedAttributes) {
      this.update(attr);
    }

    const spriteScroller = this.querySelector('.sprite-scroller')!;
    const switchSR = this.querySelector('shiny-switch');
    if (switchSR == null || !('checked' in switchSR)) throw new TypeError(`Expecting ShinySwitch`);
    switchSR.addEventListener('change', this.toggleShinyRegular);
    spriteScroller.addEventListener('click', this.toggle = () => switchSR.shadowRoot!.querySelector('button')?.click());
  }

  disconnectedCallback() {
    const spriteScroller = this.querySelector('.sprite-scroller')!;
    const switchSR = this.querySelector('shiny-switch');
    if (switchSR == null || !('checked' in switchSR)) throw new TypeError(`Expecting ShinySwitch`);
    switchSR.removeEventListener('change', this.toggleShinyRegular);
    spriteScroller.removeEventListener('click', this.toggle);
    this.ready = false;
  }

  static get observedAttributes() {
    return ['dexid', 'shiny', 'size'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('sprite-viewer')) customElements.define('sprite-viewer', spriteViewer);