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
import { Friend } from '../../Friend.js';
import { noAccent } from '../../Params.js';
import { updateUserProfile } from '../../Settings.js';
import { navigate } from '../../navigate.js';
import { warnBeforeDestruction } from '../../notification.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };



let currentCardId: string | null;

const previewSheet = new CSSStyleSheet();
{
  let previewSheetCss = ``;
  const maxArrowWidth = 20;
  for (let i = 1; i <= 10; i++) {
    const containerWidth = 8 + 4 + i * (.75 * 112) + (i-1) * 4 + 4 + maxArrowWidth + 4 + 8;
    previewSheetCss += `
      @container (width < ${containerWidth}px) {
        pokemon-sprite:nth-child(${i-1}) ~ pokemon-sprite {
          display: none;
        }
      }
    `;
  }
  previewSheet.replaceSync(previewSheetCss);
}



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
    warnBeforeDestruction(e.target as Element, `Retirer ${this.username} de votre liste d'amis ?`)
    .then(userResponse => { if (userResponse) this.delete(); });
  };
  navHandler = (event: Event) => {
    event.preventDefault();
    navigate('chromatiques-ami', event, { username: this.username });
  }


  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [materialIconsSheet, iconSheet, themesSheet, commonSheet, sheet, previewSheet];
  }


  /**
   * Met à jour le contenu de la carte à partir des données sauvegardées.
   */
  async dataToContent() {
    let friend: Friend;
    try {
      friend = new Friend(this.username, await this.dataStore.getItem(this.username));
    } catch (e) {
      console.error('Échec de création du Friend', e);
      throw e;
    }

    // Username
    {
      const elements = this.shadow.querySelectorAll('[data-type="username"]')!;
      elements.forEach(element => element.innerHTML = friend.username);
    }

    // Recent Pokémon list
    {
      const sprites = this.shadow.querySelectorAll('pokemon-sprite');
      for (let i = 0; i < Math.min(friend.pokemonList.length, sprites.length); i++) {
        const pokemon = friend.pokemonList[i];
        const element = sprites[i];
        element.setAttribute('dexid', String(pokemon.dexid));
        element.setAttribute('forme', pokemon.forme);
      }
    }

    // Filters
    this.setAttribute('data-username', noAccent(friend.username || '').toLowerCase());
  }


  /**
   * Affiche le menu d'une carte au clic.
   */
  toggleMenu() {
    const username = this.getAttribute('username');

    // On ferme la carte déjà ouverte
    if (currentCardId != null)
      document.querySelector(`[username="${currentCardId}"]`)!.removeAttribute('open');

    const menuButtons = [...this.shadow.querySelectorAll('.menu button')];

    // Si la carte demandée n'est pas celle qu'on vient de fermer, on l'ouvre
    if (username != currentCardId) {
      this.setAttribute('open', 'true');
      menuButtons.forEach(button => {
        button.removeAttribute('disabled');
        button.setAttribute('tabindex', '0');
      });
      currentCardId = username;
    } else {
      menuButtons.forEach(button => {
        button.setAttribute('disabled', '');
        button.setAttribute('tabindex', '-1');
      });
      currentCardId = null;
    }
  }


  /**
   * Supprime l'ami associé à cette carte de la liste d'amis.
   */
  async delete(populate = true) {
    try {
      await friendStorage.removeItem(this.username);
      await updateUserProfile({ lastUpdate: Date.now() });

      if (populate) {
        window.dispatchEvent(new CustomEvent('dataupdate', {
          detail: {
            sections: ['partage'],
            ids: [this.username],
            sync: true
          }
        }));
      }
    } catch (error) {
      console.error(error);
    }
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

    const deleteButton = this.shadow.querySelector('[data-action="remove-friend"]');
    if (!(deleteButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    deleteButton.addEventListener('click', this.deleteHandler);

    const navLink = this.shadow.querySelector('a[data-nav-section]');
    if (!(navLink instanceof HTMLAnchorElement)) throw new TypeError('Expecting HTMLAnchorElement');
    navLink.addEventListener('click', this.navHandler);

    // Peuple le contenu de la carte
    this.dataToContent();
  }


  disconnectedCallback() {
    const openButton = this.shadow.querySelector('[data-action="open"]');
    if (!(openButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    openButton.removeEventListener('click', this.openHandler);

    const deleteButton = this.shadow.querySelector('[data-action="remove-friend"]');
    if (!(deleteButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    deleteButton.removeEventListener('click', this.deleteHandler);

    const navLink = this.shadow.querySelector('a[data-nav-section]');
    if (!(navLink instanceof HTMLAnchorElement)) throw new TypeError('Expecting HTMLAnchorElement');
    navLink.removeEventListener('click', this.navHandler);
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