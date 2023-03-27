import { friendShinyStorage, localForageAPI } from '../../localForage.js';
import { shinyCard } from '../shiny-card/shinyCard.js';



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  .menu {
    display: none;
  }

  @container (min-width: 650px) {
    .menu-hint {
      display: none;
    }
  }
`);



export class friendShinyCard extends shinyCard {
  dataStore: localForageAPI = friendShinyStorage;
  
  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [...this.shadow.adoptedStyleSheets, sheet];
    this.editHandler = (e: Event) => {};
  }


  async makeEdit() {}


  connectedCallback(): void {
    super.connectedCallback();

    const container = this.shadow.querySelector('.container');
    container?.classList.remove('interactive');
  }
}

if (!customElements.get('friend-shiny-card')) customElements.define('friend-shiny-card', friendShinyCard);