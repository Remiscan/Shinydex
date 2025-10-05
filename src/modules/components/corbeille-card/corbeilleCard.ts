import { Hunt } from '../../Hunt.js';
import { huntStorage, type LocalForage } from '../../localForage.js';
import { Notif } from '../../notification.js';
import { getString } from '../../translation.js';
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
  dataStore: LocalForage = huntStorage;
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


  async dataToContent(getPkmn = this.dataStore.getItem<object>(this.huntid)) {
    let hunt: Hunt;
    try {
      hunt = new Hunt(await getPkmn || {});
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
      let _hunt = await huntStorage.getItem(this.huntid);
      if (_hunt == null) {
        throw getString('error-cant-be-restored');
      }

      const hunt = new Hunt(_hunt);
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
      const message = (typeof error === 'string') ? error : getString('error-cant-restore');
      console.error(error);
      new Notif(message).prompt();
    }
  }


  connectedCallback() {
    super.connectedCallback();
  }
}

if (!customElements.get('corbeille-card')) customElements.define('corbeille-card', corbeilleCard);