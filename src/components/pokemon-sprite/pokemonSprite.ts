import { pokemonData } from '../../localforage.js';
import { pad, Params, wait } from '../../Params.js';
import { Forme } from '../../Pokemon.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



export default class pokemonSprite extends HTMLElement {
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
    format: Params.preferredImageFormat,
    lazy: true
  };
  lastChange: number = 0;
  animating: boolean = false;

  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [sheet];
  }


  /** Animation d'étoiles, similaire à celle des jeux. */
  async sparkle() {
    if (this.animating) return;
    this.animating = true;

    const animations: Animation[] = [];

    const starField = this.shadow.querySelector('#star-field')!;
    starField.innerHTML = '';

    // On génère les étoiles sn SVG
    const starQuantity = 40;
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

      // Animation
      star.style.setProperty('transform-origin', 'center center');
      const anim = star.animate([
        { opacity: 0, transform: `translate3D(${startPos.x}px, ${startPos.y}px, 0) scale(${scale}) rotate(${startRotation}deg)` },
        { opacity: 1 },
        { opacity: 1 },
        { opacity: .8 },
        { opacity: 0, transform: `translate3D(${endPos.x}px, ${endPos.y}px, 0) scale(${scale}) rotate(${endRotation}deg)` }
      ], {
        easing: 'cubic-bezier(0, 0, 0, .7)',
        fill: 'both',
        duration: 1000,
        delay: 200 * Math.random() + 500 * (late ? 1 : 0)
      });
      animations.push(anim);
    }

    await Promise.all(animations.map(anim => wait(anim)));
    this.animating = false;
  }


  /** Met à jour le sprite affiché en fonction de ${this.params}. */
  async setSpriteUrl(): Promise<void> {
    const currentChange = this.lastChange;
    const img = this.shadow.querySelector('img')!;
    const url = await this.getSpriteUrl();
    this.style.setProperty('--size', `${this.params.size}px`);
    // On affiche le nouveau sprite uniquement si aucune nouvelle demande n'a été faite entre temps
    if (currentChange === this.lastChange) {
      img.loading = this.params.lazy ? 'lazy' : 'eager';
      img.src = url;
    }
    return;
  }


  /** Récupère l'url du sprite demandé en fonction de l'objet des paramètres de sprite. */
  async getSpriteUrl(params = this.params): Promise<string> {
    const pkmn = await pokemonData.getItem(String(params.dexid));
    const forme = pkmn?.formes.find((form: Forme) => form.dbid === params.forme) || pkmn?.formes[0];

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
        return `/shinydex/pokemon-sprite-${spriteCaracs.join('_')}-${this.spriteSize}.${this.params.format}`;
      }
    } catch {
      return `/shinydex/pokemon-sprite-0000_000_uk_n_00000000_f_n-${this.spriteSize}.${this.params.format}`;
    }
  }


  /** Taille du sprite (limitée par la taille originale de l'image). */
  get spriteSize() {
    return Math.max(1, Math.min(this.params.size as number, 512));
  }


  /** Taille de l'élément <pokemon-sprite> (limitée par la taille du sprite et du conteneur). */
  get elementSize() {
    return this.getBoundingClientRect().width;
  }


  /** Met à jour ${this.params} en fonction des arguments de l'élément HTML. */
  update(param: string, newValue: string) {
    let value: number | string | boolean;
    switch (param) {
      case 'dexid':
        value = Number(newValue) || 0;
        break;
      case 'forme':
        value = newValue || '';
        break;
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
      case 'lazy':
        value = newValue === 'false' ? false : true;
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
    this.setSpriteUrl();
  }

  disconnectedCallback() {
  }

  static get observedAttributes() {
    return ['dexid', 'forme', 'backside', 'shiny', 'size', 'format', 'lazy'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
    this.setSpriteUrl();
  }
}

if (!customElements.get('pokemon-sprite')) customElements.define('pokemon-sprite', pokemonSprite);