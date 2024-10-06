import { pad, wait } from '../../Params.js';
import { pokemonData } from '../../jsonData.js';
import { TranslatedString, getString, translationObserver } from '../../translation.js';
import pokemonSheet from '../../../../images/pokemonsheet.css' with { type: 'css' };



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <img loading="lazy" width="512" height="512" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" part="image">
  <svg width="512" height="512" viewBox="0 0 512 512" part="sparkles">
    <style>
      #shiny-star {
        fill: #ffd400;
      }
      @media (prefers-color-scheme: dark) {
        #shiny-star {
          fill: #fff6cc;
        }
      }
    </style>
    <defs>
      <g id="shiny-star">
        <svg viewBox="0 0 30 30" width="30" height="30">
          <path class="star" d="M 0 15 L 10.2 10.2 L 15 0 L 19.8 10.2 L 30 15 L 19.8 19.8 L 15 30 L 10.2 19.8 Z"/>
        </svg>
      </g>
    </defs>
    <g id="star-field">
    </g>
  </svg>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  :host {
    display: grid;
    place-items: center;
    overflow: visible;
    width: min(var(--size, 100%), 100%);
    height: min(var(--size, 100%), 100%);
  }

  :host > * {
    grid-row: 1;
    grid-column: 1;
  }

  img, svg {
    width: var(--size);
    height: var(--size);
  }

  #star-field {
    transform-origin: center center;
  }

  :host(:not([shiny="true"])) svg {
    display: none;
  }
`);



type SpriteParams = { 
  dexid: number,
  forme: string,
  gender: string,
  gigamax: boolean,
  candy: number,
  backside: boolean,
  shiny: boolean,
  size: number,
  lazy: boolean
};

export class pokemonSprite extends HTMLElement {
  static supportedSizes = [112, 512];
  static sheetSize = 44;
  
  shadow: ShadowRoot;
  params: SpriteParams = {
    dexid: 0,
    forme: '',
    gender: 'mf',
    gigamax: false,
    candy: 0,
    backside: false,
    shiny: false,
    size: 112,
    lazy: true
  };
  lastChange: number = 0;

  loadHandler = (event: Event) => {
    this.dispatchEvent(new Event(event.type, { bubbles: false }));
  };

  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [pokemonSheet, sheet];
  }


  /** Animation d'étoiles, similaire à celle des jeux. */
  async sparkle() {
    const animations: Animation[] = [];

    const starField = this.shadow.querySelector('#star-field')!;
    starField.innerHTML = '';

    // On génère les étoiles sn SVG
    const starQuantity = 30;
    for (let i = 0; i < starQuantity; i++) {
      starField.innerHTML += `<use href="#shiny-star"/>`;
    }

    // Trajectoire aléatoire de chaque étoile
    for (const [i, star] of Object.entries(Array.from(starField.querySelectorAll('use')))) {
      const late = Number(i) % 2; // la moitié des étoiles font partie d'une 2e salve

      // Position de l'étoile
      const angle = 2 * Math.PI * (Math.random() * (1 / starQuantity) + Number(i) / starQuantity);
      const radius = 512 / 2;
      const rotate = (A: { x: number, y: number }, angle: number) => {
        const C = { x: 0, y: 0 };
        return {
          x: C.x + (A.x - C.x) * Math.cos(angle) - (A.y - C.y) * Math.sin(angle),
          y: C.y + (A.x - C.x) * Math.sin(angle) + (A.y - C.y) * Math.cos(angle)
        }
      };
      const endPos = rotate({ x: (.82 + .15 * Math.random()) * radius, y: 0 }, angle);
      const startPos = rotate({ x: (.25 + .15 * Math.random()) * radius, y: 0 }, angle);

      const x = String(radius - 15);
      const y = String(radius - 15);
      star.setAttribute('x', x);
      star.setAttribute('y', y);

      // Taille de l'étoile
      const minWidth = radius / 15;
      const maxWidth = radius / 3;
      const minScale = minWidth / 30;
      const maxScale = maxWidth / 30;
      const scale = minScale + (maxScale - minScale) * Math.random();

      // Rotation de l'étoile
      const startRotation = 90 * Math.random();
      const endRotation = startRotation + (Math.sign(Math.random() - 0.5) || 1) * 360 * (.5 + .5 * Math.random());

      // Couleur de l'étoile
      if (Math.random() - (1/3) < 0) star.style.setProperty('filter', 'hue-rotate(150deg)');

      // Animation de chaque étoile
      star.style.setProperty('transform-origin', 'center center');
      const anim = star.animate([
        { opacity: 0, transform: `translate3D(${startPos.x}px, ${startPos.y}px, 0) scale(${scale}) rotate(${startRotation}deg)` },
        { opacity: 1 },
        { opacity: 1 },
        { opacity: 1 },
        { opacity: 1 },
        { opacity: 1 },
        { opacity: 1 },
        { opacity: late ? 0 : 1 },
        { opacity: 0 },
        { opacity: 0, transform: `translate3D(${endPos.x}px, ${endPos.y}px, 0) scale(${scale}) rotate(${endRotation}deg)` }
      ], {
        easing: 'cubic-bezier(0, .6, .7, .6)',
        fill: 'both',
        duration: 600,
        delay: 200 * Math.random() + 300 * (late ? 1 : 0)
      });
      animations.push(anim);
    }

    // Rotation globale
    const anim = starField.animate([
      { rotate: '0deg' },
      { rotate: '-180deg' }
    ], {
      easing: 'linear',
      fill: 'both',
      duration: 1100,
    });
    animations.push(anim);

    await Promise.all(animations.map(anim => wait(anim)));
  }


  /** Met à jour le sprite affiché en fonction de ${this.params}. */
  setSpriteUrl(): void {
    const currentChange = this.lastChange;
    const img = this.shadow.querySelector('img')!;
    const url = this.getSpriteUrl();
    const isSheet = this.params.size === pokemonSprite.sheetSize;
    
    // On affiche le nouveau sprite uniquement si aucune nouvelle demande n'a été faite entre temps
    if (currentChange === this.lastChange) {
      img.loading = this.params.lazy ? 'lazy' : 'eager';
      img.src = url;
      img.setAttribute('alt', getString(`pokemon/${this.params.dexid}/forme/${this.params.forme}/name-shiny` as TranslatedString));
      img.setAttribute('data-string', `pokemon/${this.params.dexid}/forme/${this.params.forme}/name-shiny` as TranslatedString);
      img.setAttribute('width', String(isSheet ? 56 : this.params.size));
      img.setAttribute('height', String(isSheet ? 56 : this.params.size));
      this.style.setProperty('--size', `${isSheet ? 56 : this.params.size}px`);
      
      if (isSheet) {
        img.setAttribute('data-dexid', String(this.params.dexid));
        img.classList.add('pkmnicon');
      } else {
        img.removeAttribute('data-dexid');
        img.classList.remove('pkmnicon');
      }
    }
  }


  /** Récupère l'url du sprite demandé en fonction de l'objet des paramètres de sprite. */
  getSpriteUrl(params = this.params): string {
    if (this.params.size === pokemonSprite.sheetSize) return '/shinydex/images/pokemonsheet.webp';

    const pkmn = pokemonData[params.dexid];
    const formeIndex = pkmn?.formes
      .map(form => form.dbid)
      .findIndex(id => id === params.forme);
    const forme = pkmn?.formes[Math.max(formeIndex, 0)];

    const basePath = '/shinydex/images/pokemon-sprites/webp';

    try {
      if (!forme) throw 'no-form';

      // Alcremie shiny forms are all the same
      const formToConsider = (params.shiny && params.dexid === 869) ? 0 : forme.form;

      const spriteCaracs = [
        pad(params.dexid.toString(), 4),
        pad(formToConsider.toString(), 3),
        forme.gender,
        forme.gigamax ? 'g' : 'n',
        pad(forme.candy.toString(), 8),
        ('hasBackside' in forme && params.backside === true) ? 'b' : 'f',
        params.shiny ? 'r' : 'n'
      ];

      if ('noShiny' in forme && forme.noShiny === true && params.shiny === true) {
        const newParams = Object.assign(
          Object.assign({}, params),
          { shiny: false }
        );
        return this.getSpriteUrl(newParams);
      } else {
        return `${basePath}/${this.spriteSize}/poke_capture_${spriteCaracs.join('_')}.webp`;
      }
    } catch {
      return `${basePath}/${this.spriteSize}/poke_capture_0000_000_uk_n_00000000_f_n-${this.spriteSize}.webp`;
    }
  }


  /** Taille du sprite (limitée par la taille originale de l'image). */
  get spriteSize() {
    const supportedSizes = pokemonSprite.supportedSizes.sort().reverse();
    let bestSize;
    for (const size of supportedSizes) {
      if (this.params.size <= size) bestSize = size;
    }
    return bestSize ?? Math.max(1, Math.min(Number(this.params.size) || 112, 512));
  }


  /** Taille de l'élément <pokemon-sprite> (limitée par la taille du sprite et du conteneur). */
  get elementSize() {
    return this.getBoundingClientRect().width;
  }


  /** Met à jour ${this.params} en fonction des arguments de l'élément HTML. */
  update(param: string, newValue: string) {
    let value;
    switch (param) {
      case 'dexid':
        value = Number(newValue) || 0;
        this.params.dexid = value;
        break;
      case 'forme':
        value = newValue || '';
        this.params.forme = value;
        break;
      case 'backside':
      case 'shiny':
        value = newValue === 'true' ? true : false;
        this.params[param] = value;
        break;
      case 'size':
        this.params.size = Number(newValue) || 112;
        break;
      case 'lazy':
        value = newValue === 'false' ? false : true;
        this.params.lazy = value;
        break;
      default:
        value = '';
    }

    this.lastChange = Date.now();
  }
  

  connectedCallback() {
    translationObserver.serve(this, { method: 'attribute' });

    const img = this.shadow.querySelector('img');
    img?.addEventListener('load', this.loadHandler);
    img?.addEventListener('error', this.loadHandler);

    this.setSpriteUrl();
  }

  disconnectedCallback() {
    translationObserver.unserve(this);

    const img = this.shadow.querySelector('img');
    img?.removeEventListener('load', this.loadHandler);
    img?.removeEventListener('error', this.loadHandler);
  }

  static get observedAttributes() {
    return ['dexid', 'forme', 'backside', 'shiny', 'size', 'lazy', 'lang'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'lang':
        translationObserver.translate(this, newValue ?? '');
        break;

      default:
        this.update(name, newValue);
        this.setSpriteUrl();
    }
  }
}

if (!customElements.get('pokemon-sprite')) customElements.define('pokemon-sprite', pokemonSprite);