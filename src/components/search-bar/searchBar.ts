import { Params, wait } from '../../Params.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



export class searchBar extends HTMLElement {
  ready: boolean = false;
  resetField: (e: Event) => void = () => {};
  listenToChanges: (e: Event) => void = () => {};

  constructor() {
    super();
  }


  open() {
    this.querySelector('.bouton-retour>i')!.innerHTML = 'arrow_back';
    document.body.setAttribute('data-search', 'true');
    this.animate([
      { clipPath: 'circle(0 at top center)' },
      { clipPath: 'circle(142% at top center)' }
    ], {
      duration: 500,
      easing: Params.easingDecelerate,
      fill: 'backwards'
    });
    this.querySelector('input')!.focus();
  }


  close() {
    document.body.removeAttribute('data-search');
  }


  update(name: string, value: string | null = this.getAttribute(name)) {
    if (!this.ready) return;
    switch (name) {
      case 'section': {
        const input = this.querySelector('input')!;
        let placeholder = 'Rechercher un Pokémon';
        let searchSection = value;
        switch (value) {
          case 'partage': placeholder = 'Rechercher un ami'; break;
          case 'ajouter-ami': placeholder = 'Ajouter un ami'; break;
          case 'parametres':
          case 'a-propos':
            searchSection = 'mes-chromatiques';
            break;
        }
        input.setAttribute('placeholder', placeholder);
        // Ici, récupérer les filtres de la searchSection, et peupler le menu de filtres avec eux.
        // À FAIRE !!!
      } break;
    }
  }
  

  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));
    if (!(document.adoptedStyleSheets.includes(sheet))) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
    this.ready = true;
    for (const attr of searchBar.observedAttributes) {
      this.update(attr);
    }

    const resetIcon = this.querySelector('.reset-icon')!;
    resetIcon.addEventListener('click', this.resetField = (event: Event) => {
      const input = (event.currentTarget as HTMLButtonElement).parentElement?.querySelector('input')!;
      input.value = '';
      input.focus();
    });

    this.querySelector('.search-options')!.addEventListener('change', this.listenToChanges = async event => {
      // Change l'icône de retour en ✅ si un filtre a été modifié
      const icon = this.querySelector('.bouton-retour>i')!;
      if (icon.innerHTML !== 'done') {
        const anims: { start?: Animation, end?: Animation } = {};

        anims.start = icon.animate([
          { transform: 'translate3D(0, 0, 0) rotate(0)', opacity: '1' },
          { transform: 'translate3D(0, 0, 0) rotate(90deg)', opacity: '0' }
        ], {
          easing: Params.easingAccelerate,
          duration: 100,
          fill: 'forwards'
        });
        await wait(anims.start);

        icon.innerHTML = 'done';
        
        anims.end = icon.animate([
          { transform: 'translate3D(0, 0, 0) rotate(-90deg)', opacity: '0' },
          { transform: 'translate3D(0, 0, 0) rotate(0)', opacity: '1' }
        ], {
          easing: Params.easingDecelerate,
          duration: 100,
          fill: 'backwards'
        });
        await wait(anims.end);

        anims.start?.cancel();
        anims.end?.cancel();
      }

      // Ici, construire les filtres à partir du formulaire et de la section, et filtrer la section correspondante.
      // À FAIRE !!!
    });
  }

  disconnectedCallback() {
    const resetIcon = this.querySelector('.reset-icon')!;
    resetIcon.removeEventListener('click', this.resetField);
    this.ready = false;
  }

  static get observedAttributes() {
    return ['section'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update(name, newValue);
  }
}

if (!customElements.get('search-bar')) customElements.define('search-bar', searchBar);