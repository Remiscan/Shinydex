const template = document.createElement('template');
template.innerHTML = `
<style>
  @keyframes rotate {
    0% { transform: rotate(0); }
    100% { transform: rotate(360deg); }
  }

  :host {
    --size: 32px;
    width: var(--size);
    height: var(--size);
  }

  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    opacity: 0;
    transition: opacity .2s var(--easing-standard);
  }

  svg.loading,
  svg.success,
  svg.failure,
  svg.lazy {
    opacity: 1;
  }

  circle {
    fill: transparent;
  }

  .progress-dots {
    stroke: var(--text-color-soft);
    stroke-width: 1px;
    stroke-dasharray: 2px 3px;
    stroke-dashoffset: 0;
    transform-origin: center center;
  }

  .failure>.progress-dots {
    stroke: var(--failure-color);
    transition: stroke 0 linear;
    transition-delay: .5s;
  }

  .lazy>.progress-dots {
    stroke: var(--success-color);
    transition: stroke .1s linear;
    transition-delay: .5s;
  }

  .loading>.progress-dots,
  .success>.progress-dots,
  .lazy>.progress-dots {
    stroke-dasharray: 2px 3px;
    animation: rotate 10s infinite linear;
  }

  .finished>.progress-dots {
    animation-play-state: paused;
  }

  .progress-line {
    stroke: var(--progress-bar-color);
    stroke-width: 2px;
    stroke-dasharray: var(--perimetre, 0);
    stroke-dashoffset: var(--perimetre, 0);
    transform-origin: center center;
  }

  .failure>.progress-line {
    opacity: 0;
    transition: opacity .2s var(--easing-standard);
    transition-delay: 1s;
  }
</style>

<svg>
  <circle class="progress-dots" cx="50%" cy="50%" r="50%"/>
  <circle class="progress-line" cx="50%" cy="50%" r="50%"/>
</svg>
`;

class syncProgress extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  get state() { return this.getAttribute('state'); }

  static get observedAttributes() {
    return ['state', 'finished'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const svg = this.shadow.querySelector('svg');

    if (name == 'state') {
      svg.classList.remove(oldValue);
      svg.classList.add(newValue);
      const progressLine = this.shadow.querySelector('.progress-line');

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

        this.perimetre = Math.ceil(Math.PI * this.getBoundingClientRect().width);
        svg.style.setProperty('--perimetre', this.perimetre);

        this.loadingAnim = progressLine.animate([
          { transform: 'rotate(0)', strokeDashoffset: '101px' },
          { transform: 'rotate(180deg)', strokeDashoffset: '0' },
          { transform: 'rotate(360deg)', strokeDashoffset: '-101px' }
        ], {
          duration: loadingDuration,
          iterations: Infinity,
          easing: 'cubic-bezier(.445, .050, .55, .95)'
        });
      }

      // Si le chargement est complété avec succès
      else if (newValue == 'success') {
        this.loadingAnim.pause();

        const offset = (this.loadingAnim.currentTime % loadingDuration < .5 * loadingDuration) ? '0' : '-202px';
        this.successAnim = progressLine.animate([
          { strokeDashoffset: offset, stroke: 'var(--success-color)' }
        ], {
          duration: successDuration,
          iterations: 1,
          easing: 'linear',
          fill: 'forwards'
        });

        this.successAnim.onfinish = () => this.setAttribute('finished', true);
      }

      // Si le chargement est complété avec erreur
      else if (newValue == 'failure') {
        this.loadingAnim.pause();

        const offset = (this.loadingAnim.currentTime % loadingDuration < .5 * loadingDuration) ? '0' : '-202px';
        this.failureAnim = progressLine.animate([
          { strokeDashoffset: offset, stroke: 'var(--failure-color)' }
        ], {
          duration: successDuration,
          iterations: 1,
          easing: 'linear',
          fill: 'forwards'
        });

        this.failureAnim.onfinish = () => this.setAttribute('finished', true);
      }

      // Si le chargement est complété sans avoir effectué d'action
      else if (newValue == 'lazy') {
        this.loadingAnim.pause();

        const offset = (this.loadingAnim.currentTime % loadingDuration < .5 * loadingDuration) ? '-101px' : '-101px';
        this.lazyAnim = progressLine.animate([
          { strokeDashoffset: offset }
        ], {
          duration: successDuration,
          iterations: 1,
          easing: 'linear',
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
        this.bye = svg.animate([
          { opacity: '0' }
        ], {
          duration: 200,
          easing: 'linear',
          fill: 'forwards'
        });
        this.bye.pause();
        setTimeout(() => this.bye.play(), 3000);
        this.bye.onfinish = () => { this.removeAttribute('state'); this.bye.cancel(); };
      }

      else {
        svg.classList.remove('finished');
      }
    }
  }
}
customElements.define("sync-progress", syncProgress);