import { Params, wait } from '../../Params.js';
import { Pokemon } from '../../Pokemon.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';
// @ts-expect-error
import gameNames from '../../../strings/games.json' assert { type: 'json' };
import { ListeFiltres, filtrableSection } from '../../filtres.js';
import { dataStorage } from '../../localForage.js';



export class searchBar extends HTMLElement {
  ready: boolean = false;
  htmlready: boolean = false;
  inputNonce: object = {};
  changeNonce: object = {};
  inputHandler: (e: Event) => void = () => {};
  optionsChangeHandler: (e: Event) => void = () => {};

  constructor() {
    super();

    this.inputHandler = async event => {
      const inputNonce = {};
      this.inputNonce = inputNonce;

      const searchBar = this.querySelector('[role="searchbox"]') as HTMLInputElement;
      const value = event.type === 'reset' ? '' : searchBar.value.toLowerCase();

      // Build search hints based on user input
      const hintsContainer = this.querySelector('.search-hints')!;
      const hintTemplate: HTMLTemplateElement = hintsContainer.querySelector('#search-hint-template')!;

      // Remove previous hints
      hintsContainer.querySelectorAll(':not(template, legend)').forEach(e => e.remove());

      const newHints = [];

      // - Pokémon nickname
      nickname: {
        if (value.length <= 0) break nickname;

        const hint = hintTemplate.content.cloneNode(true) as HTMLElement;
        const input = hint.querySelector('input')!;
        const label = hint.querySelector('label')!;
        const text = label?.querySelector('span')!;
        input.setAttribute('id', 'chip-nickname');
        input.setAttribute('name', 'chip-nickname');
        input.value = value;
        label.setAttribute('for', 'chip-nickname');
        text.innerHTML = `Surnom : ${value}`;
        newHints.push(hint);
      }

      // - Pokémon species
      species: {
        if (value.length <= 2) break species;

        const allNames = await Pokemon.names();
        const fittingNames: Set<{ name: string, dexid: number }> = new Set();
        allNames.forEach((name, dexid) => { if (name.includes(value)) fittingNames.add({ name, dexid }) });

        for (const { name, dexid } of fittingNames) {
          const hint = hintTemplate.content.cloneNode(true) as HTMLElement;
          const input = hint.querySelector('input')!;
          const label = hint.querySelector('label')!;
          const text = label?.querySelector('span')!;
          input.setAttribute('id', `chip-species-${dexid}`);
          input.setAttribute('name', `chip-species-${dexid}`);
          input.value = String(dexid);
          label.setAttribute('for', `chip-species-${dexid}`);
          text.innerHTML = `Espèce : ${name.charAt(0).toUpperCase() + name.slice(1)}`;
          newHints.push(hint);
        }
      }

      // - Pokémon game
      game: {
        if (value.length <= 2) break game;

        const lang = document.documentElement.getAttribute('lang');
        const allGames: { name: string, uid: string }[] = Pokemon.jeux.map(j => { return { name: gameNames[lang][j.uid].toLowerCase(), uid: j.uid }; });
        const fittingNames: Set<{ name: string, uid: string }> = new Set();
        allGames.forEach(game => { if (game.name.includes(value)) fittingNames.add({ name: game.name, uid: game.uid }) });

        for (const { name, uid } of fittingNames) {
          const hint = hintTemplate.content.cloneNode(true) as HTMLElement;
          const input = hint.querySelector('input')!;
          const label = hint.querySelector('label')!;
          const text = label?.querySelector('span')!;
          input.setAttribute('id', `chip-game-${uid}`);
          input.setAttribute('name', `chip-game-${uid}`);
          input.value = uid;
          label.setAttribute('for', `chip-game-${uid}`);
          text.innerHTML = `Jeu : ${name.charAt(0).toUpperCase() + name.slice(1)}`;
          newHints.push(hint);
        }
      }

      if (this.inputNonce === inputNonce) {
        for (const hint of newHints) {
          hintsContainer.appendChild(hint);
        }
      }
    };

    this.optionsChangeHandler = async event => {
      const section = this.getAttribute('section');
      const filtresMap = await dataStorage.getItem('filtres');
      const oldFiltres = filtresMap.get(section);

      if (!oldFiltres) return;

      const form = this.querySelector('form[name="search-options"]') as HTMLFormElement;
      const formData = new FormData(form);
    
      // Add checkboxes state to formData
      const checkboxes = [...form.querySelectorAll('input[type="checkbox"][name]')] as HTMLInputElement[];
      checkboxes.forEach(checkbox => {
        const name = checkbox.getAttribute('name')!;
        if (!checkbox.checked) formData.append(name, 'false');
      });

      const newFiltres = this.optionsToFiltres(formData);
      filtresMap.set(section, newFiltres);
      await dataStorage.setItem('filtres', filtresMap);

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
    };
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


  /** Builds Filtres from the selected options. */
  optionsToFiltres(formData: FormData): ListeFiltres {
    return new ListeFiltres(formData);
  }


  /** Checks options inputs corresponding to a list of filters. */
  filtresToOptions(filtres: ListeFiltres) {
    ordre: {
      const input = this.querySelector(`input[name="ordre"][value="${filtres.ordre}"]`) as HTMLInputElement;
      input.checked = true;
    }
  
    ordreReverse: {
      const input = this.querySelector(`input[name="ordre-reverse"]`) as HTMLInputElement;
      input.checked = filtres.ordreReverse;
    }
  
    filtres: {
      const allInputs = [...this.querySelectorAll('input[name^="filtre"]')] as HTMLInputElement[];
      for (const input of allInputs) {
        const [x, key, value] = input.getAttribute('name')!.split('-');
        const filtre = filtres[key as keyof ListeFiltres] as Set<string>;
        if (filtre.size === 0 || filtre.has(value)) input.checked = true;
        else                                        input.checked = false;
      }
    }
  }


  async update(name: string, value: string | null = this.getAttribute(name)) {
    if (!this.ready) return;
    switch (name) {
      case 'section': {
        if (value == null) return;

        const input = this.querySelector('input')!;
        let placeholder: string = 'Rechercher dans mes Pokémon';
        let searchSection: filtrableSection = 'mes-chromatiques';

        switch (value) {
          case 'chasses-en-cours': 
            placeholder = 'Rechercher dans mes chasses';
            searchSection = value;
            break;
          case 'corbeille':
            placeholder = 'Rechercher dans la corbeille';
            searchSection = value;
            break;
          case 'partage':
            placeholder = 'Rechercher dans mes amis';
            searchSection = value;
            break;
          case 'ajouter-ami':
            placeholder = 'Ajouter un ami';
            break;
          case 'chromatiques-ami':
            placeholder = 'Rechercher dans les Pokémon de {pseudo}';
            searchSection = value;
            break;
        }
        
        input.setAttribute('placeholder', placeholder);

        if (value === 'ajouter-ami') return;

        // On applique au formulaire les filtres enregistrés de la section demandée
        const savedFiltres = (await dataStorage.getItem('filtres')).get(searchSection);
        this.filtresToOptions(savedFiltres ?? new ListeFiltres());
      } break;
    }
  }
  

  connectedCallback() {
    if (!this.htmlready) {
      this.appendChild(template.content.cloneNode(true));
      this.htmlready = true
    }
    if (!(document.adoptedStyleSheets.includes(sheet))) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
    this.ready = true;

    for (const attr of searchBar.observedAttributes) {
      this.update(attr);
    }

    const searchBox = this.querySelector('form[name="search-bar"]')!;
    searchBox.addEventListener('input', this.inputHandler);
    searchBox.addEventListener('reset', this.inputHandler);

    const searchOptions = this.querySelector('.search-options')!;
    searchOptions.addEventListener('change', this.optionsChangeHandler);
  }

  disconnectedCallback() {
    const searchBox = this.querySelector('form[name="search-bar"]')!;
    searchBox.removeEventListener('input', this.inputHandler);
    searchBox.removeEventListener('reset', this.inputHandler);

    const searchOptions = this.querySelector('.search-options')!;
    searchOptions.removeEventListener('change', this.optionsChangeHandler);

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