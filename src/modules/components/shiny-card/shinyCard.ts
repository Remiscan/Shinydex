import { Hunt } from '../../Hunt.js';
import { Params, noAccent } from '../../Params.js';
import { Shiny } from '../../Shiny.js';
import { isSupportedLang, isSupportedMethodID, isSupportedPokemonLang, methodStrings, pokemonData } from '../../jsonData.js';
import { huntStorage, localForageAPI, shinyStorage } from '../../localForage.js';
import { Notif } from '../../notification.js';
import { computeShinyFilters } from '../../filtres.js';
import template from './template.js';
// @ts-expect-error
import materialIconsSheet from '../../../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import iconSheet from '../../../../images/iconsheet.css' assert { type: 'css' };
// @ts-expect-error
import themesSheet from '../../../../styles/themes.css.php' assert { type: 'css' };
// @ts-expect-error
import commonSheet from '../../../../styles/common.css' assert { type: 'css' };
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };



let charmlessMethods: string[];
let previousEditNotification: Notif;



export class shinyCard extends HTMLElement {
  shadow: ShadowRoot;
  huntid: string = '';
  dataStore: localForageAPI = shinyStorage;
  clickHandler: (e: Event) => void = () => {};
  openHandler = (e: Event) => {
    e.stopPropagation();
    this.toggleNotes();
  };
  editHandler = (e: Event) => {
    e.stopPropagation();
    this.makeEdit();
  };
  restoreHandler = (e: Event) => {};


  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [materialIconsSheet, iconSheet, themesSheet, commonSheet, sheet];
  }


  /**
   * Met à jour le contenu de la carte à partir des données sauvegardées.
   */
  async dataToContent() {
    let shiny: Shiny;
    try {
      shiny = new Shiny(await this.dataStore.getItem(this.huntid));
    } catch (e) {
      console.error('Échec de création du Shiny', e);
      throw e;
    }

    this.setAttribute('last-update', String(shiny.lastUpdate));

    const lang = document.documentElement.getAttribute('lang') ?? Params.defaultLang;
    const pokemon = pokemonData[shiny.dexid];

    // Espèce
    {
      const element = this.shadow.querySelector('[data-type="species"]')!;
      let name = '';
      if (isSupportedPokemonLang(lang)) {
        name = pokemon.name?.[lang] ?? '';
      }
      element.innerHTML = name;

      const sprite = this.shadow.querySelector('pokemon-sprite')!;
      sprite.setAttribute('dexid', String(shiny.dexid));
    }

    // Forme
    {
      const sprite = this.shadow.querySelector('pokemon-sprite')!;
      sprite.setAttribute('forme', shiny.forme);
    }

    // Surnom
    {
      const element = this.shadow.querySelector('[data-type="name"]')!;
      element.innerHTML = shiny.name;

      const speciesElement = this.shadow.querySelector('[data-type="species"]')!;
      if (shiny.name) speciesElement.classList.remove('title-large');
      else            speciesElement.classList.add('title-large');
    }

    // Compteur
    {
      const element = this.shadow.querySelector('[data-type="count"]')!;
      let countString: string = '';

      const getProp = (prop: keyof Shiny['count']) => shiny.count[prop] || 0;

      const parts = [];
      if (getProp('encounters')) parts.push(`${getProp('encounters')} rencontres`);

      if ((shiny.game === 'ultrasun' || shiny.game === 'ultramoon') && shiny.method === 'ultrawormhole') {
        parts.push(`Distance : ${getProp('usum-distance')}m, ${getProp('usum-rings')} anneaux`);
      }

      else if (shiny.game === 'letsgopikachu' || shiny.game === 'letsgoeevee') {
        if (getProp('lgpe-nextSpawn')) parts.push(`Combo Capture : ${getProp('lgpe-catchCombo')}`);
        if (getProp('lgpe-lure')) parts.push('Parfum utilisé');
      }

      else if (shiny.game === 'sword' || shiny.game === 'shield') {
        if (getProp('swsh-dexKo')) parts.push(`Compteur de KO : ${getProp('swsh-dexKo')}`);
      }

      else if (shiny.game === 'legendsarceus') {
        const dexResearch = getProp('pla-dexResearch');
        const niv = dexResearch === 2 ? '100%' : dexResearch === 1 ? '10' : '9 ou -';
        parts.push(`niv. de recherche ${niv}`);
      }

      else if (shiny.game === 'scarlet' || shiny.game === 'violet') {
        if (shiny.method === 'massoutbreak') {
          const outbreakCleared = getProp('sv-outbreakCleared');
          const num = outbreakCleared === 2 ? 'Plus de 60'
                    : outbreakCleared === 1 ? '30 à 59'
                    : 'Moins de 29';
          parts.push(`${num} KO`);
        }

        if (getProp('sv-sparklingPower')) {
          const sparklingPower = getProp('sv-sparklingPower');
          parts.push(`Rencontre brillance niv. ${sparklingPower}`);
        }
      }

      countString = parts.join(', ');

      element.innerHTML = countString || '<span class="empty">Pas de détail.</span>';
    }

    // Temps de capture / date
    {
      const time = shiny.catchTime;
      const element = this.shadow.querySelector('[data-type="catchTime"]')!;
      if (time > 825289200000) {
        const date = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})
                             .format(new Date(time));
        element.innerHTML = date;
      } else {
        // Si la date est avant la sortie du premier jeu Pokémon au Japon,
        // marquer la date comme inconnue.
        element.innerHTML = 'Date inconnue';
      }
    }

    // Jeu
    {
      const game = shiny.game;
      const element = this.shadow.querySelector('[data-type="game"]')!
      element.setAttribute('data-icon', `game/${game}`);
    }

    // Ball
    {
      const ball = shiny.ball || '';
      const element = this.shadow.querySelector('[data-type="ball"]')!;
      element.setAttribute('data-icon', `ball/${ball}`);
      if (ball) element.classList.remove('off');
      else      element.classList.add('off');
    }

    // Notes
    {
      const notes = shiny.notes || '<span class="empty">Pas de note.</span>';
      const element = this.shadow.querySelector('[data-type="notes"]')!;
      element.innerHTML = notes;
    }

    // Checkmark
    {
      const origin = shiny.appliedOriginMark;
      const element = this.shadow.querySelector('[data-type="originMark"]')!;
      element.setAttribute('data-icon', `origin-mark/${origin}`);
      if (origin) element.classList.remove('off');
      else        element.classList.add('off');
    }

    // Gène (gigamax ou alpha)
    {
      const gene = shiny.gene;
      const element = this.shadow.querySelector('[data-type="gene"]')!;
      element.setAttribute('data-icon', `gene/${gene}`);
      if (gene) element.classList.remove('off');
      else      element.classList.add('off');
    }

    // Méthode
    {
      const element = this.shadow.querySelector('[data-type="method"]')!;
      let method = '';
      if (isSupportedLang(lang) && isSupportedMethodID(shiny.method)) {
        method = methodStrings[lang][shiny.method] ?? '';
      }
      element.innerHTML = method;
    }

    // Charme chroma et shiny rate
    {
      const srContainer = this.shadow.querySelector('.shiny-rate') as HTMLElement;
      const charm = shiny.charm;
      const shinyRate = shiny.shinyRate ?? 0;
      const methode = shiny.method || '';
      const game = shiny.jeuObj;

      // Icône du charme chroma
      if (charmlessMethods == null) charmlessMethods = Shiny.methodes('charmless').map(m => m.id);
      if (charm && !(charmlessMethods.includes(methode)) && game.hasCharm) {
        srContainer.classList.add('with-charm');
      } else {
        srContainer.classList.remove('with-charm');
      }

      // Affichage du shiny rate
      if (shinyRate > 0 && shiny.mine) {
        srContainer.classList.remove('off');
      } else {
        srContainer.classList.add('off');
      }
      
      const element = this.shadow.querySelector('.shiny-rate-text.denominator')!;
      element.innerHTML = String(shinyRate || '???');

      // Couleur du shiny rate
      srContainer.classList.remove('full-odds', 'charm-ods', 'one-odds');
      try {
        if (
          (game.gen <= 5 && shinyRate >= 8192 - 1) ||
          (game.gen > 5 && shinyRate >= 4096 - 1)
        ) {
          srContainer.classList.add('full-odds');
        } else if (charm && !(charmlessMethods.includes(methode)) && (
          (game.gen <= 5 && shinyRate >= 2731 - 1) ||
          (game.gen > 5 && shinyRate >= 1365 - 1)
        )) {
          srContainer.classList.add('charm-odds');
        } else if (shinyRate <= 1) {
          srContainer.classList.add('one-odds');
        }

        // Couleur de la bordure (0 = high shiny denominator / hard, 1 = low shiny denominator / easy)
        const hardestRate = (game.gen <= 5 ? 2731 : 1365);
        const easiestRate = 256;
        const hueCoeff = (hardestRate - Math.min(Math.max(easiestRate, shinyRate), hardestRate)) / (hardestRate - easiestRate);
        srContainer.style.setProperty('--hue-coeff', String(hueCoeff));
      } catch (error) {}
    }

    // Filters
    const filters = computeShinyFilters(shiny);
    for (const [filter, value] of Object.entries(filters)) {
      this.setAttribute(`data-${filter}`, String(value));
    }
  }


  /**
   * Affiche les notes d'une carte au clic.
   */
  toggleNotes() {
    const currentState = this.getAttribute('open') === 'true';
    const menuButtons = [...this.shadow.querySelectorAll('.menu button')];

    // Si la carte demandée n'est pas celle qu'on vient de fermer, on l'ouvre
    if (!currentState) {
      this.setAttribute('open', 'true');
      menuButtons.forEach(button => {
        button.removeAttribute('disabled');
        button.setAttribute('tabindex', '0');
      });
    } else {
      this.removeAttribute('open');
      menuButtons.forEach(button => {
        button.setAttribute('disabled', '');
        button.setAttribute('tabindex', '-1');
      });
    }
  }


  /**
   * Vérifie si la carte correspond à un filtre.
   */
  fitsFilter(filterid: string): boolean {
    return JSON.parse(this.getAttribute('filtres') || '[]').includes(filterid);
  }


  /**
   * Créer une chasse pour éditer un shiny au long clic sur une carte.
   */
  async makeEdit() {
    try {
      let k = await huntStorage.getItem(this.huntid);
      if (k != null) {
        throw `Ce Pokémon est déjà en cours de modification.`;
      }

      const card = document.createElement('hunt-card');
      card.setAttribute('huntid', this.huntid);

      const hunt = await Hunt.getOrMake(this.huntid);
      if (!(hunt instanceof Hunt)) throw new Error('Erreur lors de la création de la chasse à éditer');
      hunt.caught = true;
      await huntStorage.setItem(hunt.huntid, hunt);

      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['chasses-en-cours'],
          ids: [this.huntid],
          sync: false
        }
      }));

      const navLink = document.querySelector('.nav-link[data-nav-section="chasses-en-cours"]');
      if (!(navLink instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
      navLink.click();
    } catch (error) {
      const message = (typeof error === 'string') ? error : `Erreur : impossible de modifier ce Pokémon.`;
      console.error(error);
      if (previousEditNotification) previousEditNotification.remove();
      previousEditNotification = new Notif(message);
      previousEditNotification.prompt();
    }
  }


  connectedCallback() {
    // Détecte le clic pour "ouvrir" la carte
    const openButton = this.shadow.querySelector('[data-action="open"]');
    if (!(openButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    openButton.addEventListener('click', this.openHandler);
    
    this.addEventListener('click', this.clickHandler = event => openButton.click());

    const editButton = this.shadow.querySelector('[data-action="edit"]');
    if (!(editButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    editButton.addEventListener('click', this.editHandler);

    const restoreButton = this.shadow.querySelector('[data-action="restore"]');
    if (!(restoreButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    restoreButton.addEventListener('click', this.restoreHandler);

    // Peuple le contenu de la carte
    this.dataToContent();
  }


  disconnectedCallback() {
    const openButton = this.shadow.querySelector('[data-action="open"]');
    if (!(openButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    openButton.removeEventListener('click', this.openHandler);

    this.removeEventListener('click', this.clickHandler);

    const editButton = this.shadow.querySelector('[data-action="edit"]');
    if (!(editButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    editButton.removeEventListener('click', this.editHandler);

    const restoreButton = this.shadow.querySelector('[data-action="restore"]');
    if (!(restoreButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    restoreButton.removeEventListener('click', this.restoreHandler);
  }


  static get observedAttributes() {
    return ['huntid'];
  }


  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'huntid': {
        this.huntid = newValue;
        //this.dataToContent();
      } break
    }
  }
}

if (!customElements.get('shiny-card')) customElements.define('shiny-card', shinyCard);