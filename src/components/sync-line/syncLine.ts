import { Params } from '../../Params.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



class syncLine extends HTMLElement {
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

        this.longueur = this.getBoundingClientRect().width;
        svg.style.setProperty('--longueur', String(this.longueur));

        this.loadingAnim = progressLine.animate([
          { strokeDashoffset: `${this.longueur}px` },
          { strokeDashoffset: '0' },
          { strokeDashoffset: `-${this.longueur}px` }
        ], {
          duration: loadingDuration,
          iterations: Infinity,
          easing: 'cubic-bezier(.445, .050, .55, .95)'
        });
      }

      // Si le chargement est complété avec succès
      else if (newValue == 'success') {
        this.loadingAnim.pause();

        const offset = ((this.loadingAnim.currentTime || 0) % loadingDuration < .5 * loadingDuration) ? '0' : `-${2 * this.longueur}px`;
        this.successAnim = progressLine.animate([
          { strokeDashoffset: offset, stroke: 'var(--success-color)' }
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
          { strokeDashoffset: offset, stroke: 'var(--failure-color)' }
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