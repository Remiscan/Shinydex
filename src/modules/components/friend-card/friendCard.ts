import { friendStorage, type LocalForage } from '../../localForage.js';
import { getCurrentLang, getString, translationObserver } from '../../translation.js';
import template from './template.js';
import materialIconsSheet from '../../../../ext/material_icons.css' with { type: 'css' };
import iconSheet from '../../../../images/iconsheet.css' with { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' with { type: 'css' };
import commonSheet from '../../../../styles/common.css' with { type: 'css' };
import { Friend } from '../../Friend.js';
import { noAccent } from '../../Params.js';
import { updateUserProfile } from '../../Settings.js';
import { goToPage } from '../../navigate.js';
import { warnBeforeDestruction } from '../../notification.js';
import sheet from './styles.css' with { type: 'css' };
import { pokemonSprite } from '../pokemon-sprite/pokemonSprite.js';
import { shinyCard } from '../shiny-card/shinyCard.js';



const previewSheet = new CSSStyleSheet();
{
  let previewSheetCss = ``;
  const maxArrowWidth = 20;
  for (let i = 1; i <= 10; i++) {
    const containerWidth = 8 + 4 + i * (.75 * 112) + (i-1) * 4 + 4 + maxArrowWidth + 4 + 8;
    previewSheetCss += `
      @container section-contenu (width < ${containerWidth}px) {
        .pokemon-sprite-container:nth-child(${i-1}) ~ .pokemon-sprite-container {
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
  dataStore: LocalForage = friendStorage
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
    goToPage(`chromatiques-ami`, encodeURIComponent(this.username));
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
      friend = new Friend(this.username, await this.dataStore.getItem<object[]>(this.username) || []);
    } catch (e) {
      console.error('Échec de création du Friend', e);
      throw e;
    }

    // Username
    {
      const elements = this.shadow.querySelectorAll<HTMLElement>('[data-type="username"]')!;
      elements.forEach(element => element.innerText = friend.username);
    }

    // Recent Pokémon list
    {
      const spritesContainers = this.shadow.querySelectorAll('.pokemon-sprite-container');
      for (let i = 0; i < Math.min(friend.pokemonList.length, spritesContainers.length); i++) {
        const container = spritesContainers[i];
        const pokemon = friend.pokemonList[i];
  
        const spriteElement = container.querySelector('pokemon-sprite') as pokemonSprite;
        spriteElement.setAttribute('dexid', String(pokemon.dexid));
        spriteElement.setAttribute('forme', pokemon.forme);
        spriteElement.setAttribute('data-caught', String(shinyCard.caughtCache.has(`${pokemon.dexid}-${pokemon.forme}`)));
        spriteElement.setAttribute('data-has-evolved', String(shinyCard.hasEvolvedCache.has(`${pokemon.dexid}-${pokemon.forme}`)));

        const dateContainer = container.querySelector('time') as HTMLTimeElement;
        dateContainer.dateTime = String(pokemon.catchTime);
        const lang = getCurrentLang();
        const date = new Intl.DateTimeFormat(lang, {"day":"numeric", "month":"numeric", "year":"numeric"})
                             .format(new Date(pokemon.catchTime));
        dateContainer.innerHTML = date;
        dateContainer.setAttribute('data-datetime', String(pokemon.catchTime));
      }

      const compteurContainer = this.shadow.querySelector('.compteur') as HTMLElement;
      compteurContainer.innerText = String(friend.pokemonList[0]?.total ?? '');
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