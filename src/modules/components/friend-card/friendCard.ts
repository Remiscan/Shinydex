import { friendStorage, localForageAPI, shinyStorage } from '../../localForage.js';
import { getString, translationObserver } from '../../translation.js';
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
import { goToPage } from '../../navigate.js';
import { warnBeforeDestruction } from '../../notification.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };



const previewSheet = new CSSStyleSheet();
{
  let previewSheetCss = ``;
  const maxArrowWidth = 20;
  for (let i = 1; i <= 10; i++) {
    const containerWidth = 8 + 4 + i * (.75 * 112) + (i-1) * 4 + 4 + maxArrowWidth + 4 + 8;
    previewSheetCss += `
      @container section-contenu (width < ${containerWidth}px) {
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
    warnBeforeDestruction(e.target as Element, getString('notif-remove-friend').replace('{username}', this.username))
    .then(userResponse => { if (userResponse) this.delete(); });
  };
  navHandler = (event: Event) => {
    event.preventDefault();
    goToPage(`chromatiques-ami`, this.username);
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
        shinyStorage.iterate(shiny => {
          if (shiny.dexid === pokemon.dexid && shiny.forme === pokemon.forme) return true;
        })
        .then(isCaught => element.setAttribute('data-caught', String(isCaught)));
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
    const currentState = this.getAttribute('open') === 'true';
    const menuButtons = [...this.shadow.querySelectorAll('.menu button')];

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
    translationObserver.serve(this, { method: 'attribute' });

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
    translationObserver.unserve(this);

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
    return ['username', 'lang'];
  }


  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'username': {
        this.username = newValue;
        //this.dataToContent();
      } break;

      case 'lang':
        translationObserver.translate(this, newValue ?? '');
        break;
    }
  }
}

if (!customElements.get('friend-card')) customElements.define('friend-card', friendCard);