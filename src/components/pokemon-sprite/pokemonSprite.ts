import { pokemonData } from '../../localforage.js';
import { pad, Params, wait } from '../../Params.js';
import { Forme } from '../../Pokemon.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



class pokemonSprite extends HTMLElement {
  shadow: ShadowRoot;
  params: { [key: string]: number | string | boolean } = {
    dexid: 0,
    forme: '',
    gender: 'mf',
    gigamax: false,
    candy: 0,
    backside: false,
    shiny: false,
    size: 112,
    format: Params.preferredImageFormat
  };
  lastChange: number = 0;
  animating: boolean = false;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [sheet];
  }

  async sparkle() {
    if (this.animating) return;
    this.animating = true;

    const starField = this.shadow.querySelector('#star-field')!;
    starField.innerHTML = '';

    const starQuantity = 40;
    const animations: Animation[] = [];

    for (let i = 0; i < starQuantity; i++) {
      starField.innerHTML += `<use href="#shiny-star"/>`;
    }

    for (const [i, star] of Object.entries(Array.from(starField.querySelectorAll('use')))) {
      const late = Number(i) % 2;
      const angle = 2 * Math.PI * (Math.random() * (1 / starQuantity) + Number(i) / starQuantity);
      const radius = this.size / 2;
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

      const minWidth = this.size / 30;
      const maxWidth = this.size / 6;
      const minScale = minWidth / 30;
      const maxScale = maxWidth / 30;
      const scale = minScale + (maxScale - minScale) * Math.random();

      const startRotation = 90 * Math.random();
      const endRotation = startRotation + (Math.sign(Math.random() - 0.5) || 1) * 360 * (.5 + .5 * Math.random());

      star.style.setProperty('transform-origin', 'center center');
      if (Math.random() - 0.5 < 0) star.style.setProperty('filter', 'hue-rotate(150deg)');
      const anim = star.animate([
        { opacity: 0, transform: `translate3D(${startPos.x}px, ${startPos.y}px, 0) scale(${scale}) rotate(${startRotation}deg)` },
        { opacity: 1 },
        { opacity: 1 },
        { opacity: .8 },
        { opacity: 0, transform: `translate3D(${endPos.x}px, ${endPos.y}px, 0) scale(${scale}) rotate(${endRotation}deg)` }
      ], {
        easing: 'cubic-bezier(0, 0, 0, .7)',
        fill: 'both',
        duration: 1500,
        delay: 200 * Math.random() + 500 * (late ? 1 : 0)
      });
      animations.push(anim);
    }

    await Promise.all(animations.map(anim => wait(anim)));
    this.animating = false;
  }

  async setSpriteUrl(): Promise<void> {
    const currentChange = this.lastChange;
    const img = this.shadow.querySelector('img')!;
    const svg = this.shadow.querySelector('svg')!;
    const url = await this.getSpriteUrl();
    if (currentChange === this.lastChange) {
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      img.width = img.height = this.params.size as number;
      svg.setAttribute('width', String(this.params.size));
      svg.setAttribute('height', String(this.params.size));
      await fetch(url);
      img.src = url;
    }
    return;
  }

  async getSpriteUrl(params = this.params): Promise<string> {
    const pkmn = await pokemonData.getItem(String(params.dexid));
    const forme = pkmn.formes.find((form: Forme) => form.dbid === params.forme) || pkmn.formes[0];

    // Alcremie shiny forms are all the same
    const formToConsider = (params.shiny && params.dexid === 869) ? 0 : forme.form;

    const spriteCaracs = [
      pad(params.dexid.toString(), 4),
      pad(formToConsider.toString(), 3),
      forme.gender,
      forme.gigamax ? 'g' : 'n',
      pad(forme.candy.toString(), 8),
      (typeof forme.hasBackside !== 'undefined' && params.backside === true) ? 'b' : 'f',
      params.shiny ? 'r' : 'n'
    ];

    if (typeof forme.noShiny !== 'undefined' && forme.noShiny === true && params.shiny === true) {
      const newParams = Object.assign(
        Object.assign({}, params),
        { shiny: false }
      );
      return await this.getSpriteUrl(newParams);
    } else {
      return `/shinydex/pokemon-sprite-${spriteCaracs.join('_')}-${this.size}.${this.params.format}`;
    }
  }

  get size() {
    return Math.max(1, Math.min(this.params.size as number, 512));
  }

  update(param: string, newValue: string) {
    let value: number | string | boolean;
    switch (param) {
      case 'dexid':
      case 'candy':
        value = Number(newValue) || 0;
        break;
      case 'gender':
        value = ['m', 'f', 'mf', 'uk'].includes(newValue) ? newValue : 'uk';
        break;
      case 'forme':
        value = newValue || '';
        break;
      case 'gigamax':
      case 'backside':
      case 'shiny':
        value = newValue === 'true' ? true : false;
        break;
      case 'size':
        value = Number(newValue) || 112;
        break;
      case 'format':
        value = newValue === 'webp' ? 'webp' : 'png';
        break;
      default:
        value = '';
    }
    if (this.params.hasOwnProperty(param)) {
      this.lastChange = Date.now();
      this.params[param] = value;
    }
  }

  connectedCallback() {
    this.addEventListener('sparkle', this.sparkle);
    for (const param of pokemonSprite.observedAttributes) {
      this.update(param, this.getAttribute(param) || '');
    }
    this.setSpriteUrl();
  }

  disconnectedCallback() {
    this.removeEventListener('sparkle', this.sparkle);
  }

  static get observedAttributes() {
    return ['dexid', 'forme', 'gender', 'gigamax', 'candy', 'backside', 'shiny', 'size', 'format'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
    this.setSpriteUrl();
  }
}

if (!customElements.get('pokemon-sprite')) customElements.define('pokemon-sprite', pokemonSprite);