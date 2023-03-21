import { friendStorage, localForageAPI } from '../../localForage.js';
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



export class friendCard extends HTMLElement {
  shadow: ShadowRoot;
  username: string = '';
  dataStore: localForageAPI = friendStorage
  clickHandler: (e: Event) => void = () => {};
  openHandler = (e: Event) => {
    e.stopPropagation();
    this.toggleMenu();
  };
  deleteHandler = (e: Event) => {
    e.stopPropagation();
    this.delete();
  };


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
    
  }


  /**
   * Affiche les notes d'une carte au clic.
   */
  toggleMenu() {
    
  }


  /**
   * Supprime l'ami associé à cette carte de la liste d'amis.
   */
  delete() {

  }


  /**
   * Vérifie si la carte correspond à un filtre.
   */
  fitsFilter(filterid: string): boolean {
    return JSON.parse(this.getAttribute('filtres') || '[]').includes(filterid);
  }


  connectedCallback() {
    // Détecte le clic pour "ouvrir" la carte
    const openButton = this.shadow.querySelector('[data-action="open"]');
    if (!(openButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    openButton.addEventListener('click', this.openHandler);
    this.addEventListener('click', this.clickHandler = event => openButton.click());

    const deleteButton = this.shadow.querySelector('[data-action="delete"]');
    if (!(deleteButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    deleteButton.addEventListener('click', this.deleteHandler);

    // Peuple le contenu de la carte
    this.dataToContent();
  }


  disconnectedCallback() {
    const openButton = this.shadow.querySelector('[data-action="open"]');
    if (!(openButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    openButton.removeEventListener('click', this.openHandler);

    this.removeEventListener('click', this.clickHandler);

    const deleteButton = this.shadow.querySelector('[data-action="delete"]');
    if (!(deleteButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    deleteButton.removeEventListener('click', this.deleteHandler);
  }


  static get observedAttributes() {
    return ['username'];
  }


  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'username': {
        this.username = newValue;
        //this.dataToContent();
      } break
    }
  }
}

if (!customElements.get('friend-card')) customElements.define('friend-card', friendCard);