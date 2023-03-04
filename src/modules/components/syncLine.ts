import { Params } from '../Params.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <svg>
    <line class="background" x1="0" x2="100%" y1="50%" y2="50%"/>
    <line class="progress-line" x1="0" x2="100%" y1="50%" y2="50%"/>
  </svg>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  :host {
    width: 100%;
    height: 2px;
    position: relative;

  }

  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    opacity: 0;
    transition: opacity .2s var(--easing-standard);
    position: absolute;
  }

  svg.loading,
  svg.success,
  svg.failure,
  svg.lazy {
    opacity: 1;
  }

  .background {
    stroke: rgb(var(--surface-variant));
    stroke-width: 2px;
  }

  .progress-line {
    stroke: rgb(var(--primary));
    stroke-width: 2px;
    stroke-dasharray: 0;
    stroke-dashoffset: 0;
    transform-origin: center center;
    transition: stroke 
  }
`);



export class syncLine extends HTMLElement {
  shadow: ShadowRoot;
  longueur: number = 0;
  loadingAnim: Animation = new Animation();
  successAnim: Animation = new Animation();
  failureAnim: Animation = new Animation();
  lazyAnim: Animation = new Animation();
  bye: Animation = new Animation();
  disappear: Animation = new Animation();

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [sheet];
  }

  get state() { return this.getAttribute('state'); }

  static get observedAttributes() {
    return ['state', 'finished'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    const svg = this.shadow.querySelector('svg')!;

    if (name == 'state') {
      svg.classList.remove(oldValue);
      svg.classList.add(newValue);
      const progressLine = this.shadow.querySelector('.progress-line')!;

      const loadingDuration = 3000;
      const successDuration = 500;

      // Si on lance le chargement
      if (newValue == 'loading') {
        if (this.getAttribute('finished') != null) {
          setTimeout(() => this.setAttribute('state', 'loading'), 50);
          this.removeAttribute('state');
          this.removeAttribute('finished');
          return;
        }

        this.loadingAnim = progressLine.animate([
          { strokeDashoffset: `100%` },
          { strokeDashoffset: '0' },
          { strokeDashoffset: `-100%` }
        ], {
          duration: loadingDuration,
          iterations: Infinity,
          easing: 'cubic-bezier(.445, .050, .55, .95)',
        });
      }

      // Si le chargement est complété avec succès
      else if (newValue == 'success') {
        this.loadingAnim.pause();

        const offset = ((this.loadingAnim.currentTime || 0) % loadingDuration < .5 * loadingDuration) ? '0' : `-${2 * this.longueur}px`;
        this.successAnim = progressLine.animate([
          { strokeDashoffset: offset, stroke: 'rgb(var(--success))' }
        ], {
          duration: successDuration,
          iterations: 1,
          easing: Params.easingStandard,
          fill: 'forwards'
        });

        this.successAnim.onfinish = () => this.setAttribute('finished', 'true');
      }

      // Si le chargement est complété avec erreur
      else if (newValue == 'failure') {
        this.loadingAnim.pause();

        const offset = ((this.loadingAnim.currentTime || 0) % loadingDuration < .5 * loadingDuration) ? '0' : `-${2 * this.longueur}px`;
        this.failureAnim = progressLine.animate([
          { strokeDashoffset: offset, stroke: 'rgb(var(--error))' }
        ], {
          duration: successDuration,
          iterations: 1,
          easing: Params.easingStandard,
          fill: 'forwards'
        });

        this.failureAnim.onfinish = () => this.setAttribute('finished', 'true');
      }

      // Si le chargement est complété sans avoir effectué d'action
      else if (newValue == 'lazy') {
        this.loadingAnim.pause();

        const offset = ((this.loadingAnim.currentTime || 0) % loadingDuration < .5 * loadingDuration) ? `-${this.longueur}px` : `-${this.longueur}px`;
        this.lazyAnim = progressLine.animate([
          { strokeDashoffset: offset }
        ], {
          duration: successDuration,
          iterations: 1,
          easing: Params.easingStandard,
          fill: 'forwards'
        });

        this.lazyAnim.onfinish = () => this.setAttribute('finished', 'true');
      }

      // Sinon
      else {
        this.loadingAnim.cancel();
        if (this.successAnim) this.successAnim.cancel();
        if (this.failureAnim) this.failureAnim.cancel();
        if (this.lazyAnim) this.lazyAnim.cancel();
      }
    }

    else if (name == 'finished') {
      if (newValue == 'true') {
        svg.classList.add('finished');
        const progressLine = this.shadow.querySelector('.progress-line')!;

        this.bye = svg.animate([
          { opacity: '0' }
        ], {
          duration: 200,
          easing: Params.easingAccelerate,
          fill: 'forwards'
        });
        this.bye.pause();

        this.disappear = progressLine.animate([
          { strokeDashoffset: '0' },
          { strokeDashoffset: `-${this.longueur}px` }
        ], {
          duration: 500,
          easing: Params.easingAccelerate,
          fill: 'forwards'
        });
        this.disappear.pause();

        if (this.state == 'success' || this.state == 'failure') {
          setTimeout(() => this.disappear.play(), 3000);
          this.disappear.onfinish = () => {
            this.bye.play();
            this.bye.onfinish = () => { this.removeAttribute('state'); this.bye.cancel(); this.disappear.cancel(); };
          };
        }

        /*else if (this.state == 'failure') {
          setTimeout(() => this.disappear.play(), 200);
          this.disappear.onfinish = () => {
            setTimeout(() => this.bye.play(), 3000);
            this.bye.onfinish = () => { this.removeAttribute('state'); this.bye.cancel(); this.disappear.cancel(); };
          };
        }*/

        else {
          setTimeout(() => this.bye.play(), 3000);
          this.bye.onfinish = () => { this.removeAttribute('state'); this.bye.cancel(); this.disappear.cancel(); };
        }
      }

      else {
        svg.classList.remove('finished');
      }
    }
  }
}

if (!customElements.get('sync-line')) customElements.define('sync-line', syncLine);