import { Hunt } from '../../Hunt.js';
import { huntStorage, localForageAPI } from '../../localForage.js';
import { Notif } from '../../notification.js';
import { shinyCard } from '../shiny-card/shinyCard.js';



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  [data-action="edit"] {
    display: none;
  }

  [data-action="restore"] {
    display: flex;
  }
`);



export class corbeilleCard extends shinyCard {
  dataStore: localForageAPI = huntStorage;
  dataClass = Hunt;
  
  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [...this.shadow.adoptedStyleSheets, sheet];
    this.editHandler = (e: Event) => {};
    this.restoreHandler = (e: Event) => {
      e.stopPropagation();
      this.restoreHunt();
    };
  }


  async dataToContent() {
    let hunt: Hunt;
    try {
      hunt = new Hunt(await this.dataStore.getItem(this.huntid));
    } catch (e) {
      console.error('Échec de création de la Hunt', e);
      throw e;
    }

    await super.dataToContent();

    const sprite = this.shadow.querySelector('pokemon-sprite')!;
    sprite?.setAttribute('shiny', String(hunt.caught));
  }


  async restoreHunt(populate = true) {
    try {
      let hunt = await huntStorage.getItem(this.huntid);
      if (hunt == null) {
        throw `Ce Pokémon ne peut pas être restauré.`;
      }

      hunt = new Hunt(hunt);
      hunt.lastUpdate = Date.now();
      hunt.deleted = false;
      hunt.destroy = false;
      await huntStorage.setItem(this.huntid, hunt);

      if (populate) {
        window.dispatchEvent(new CustomEvent('dataupdate', {
          detail: {
            sections: ['chasses-en-cours', 'corbeille'],
            ids: [this.huntid],
            sync: false
          }
        }));
      }
    } catch (error) {
      const message = (typeof error === 'string') ? error : `Erreur : impossible de restaurer ce Pokémon.`;
      console.error(error);
      new Notif(message).prompt();
    }
  }


  connectedCallback() {
    super.connectedCallback();
  }
}

if (!customElements.get('corbeille-card')) customElements.define('corbeille-card', corbeilleCard);