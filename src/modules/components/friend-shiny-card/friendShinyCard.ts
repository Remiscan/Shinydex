import { friendShinyStorage, localForageAPI } from '../../localForage.js';
import { shinyCard } from '../shiny-card/shinyCard.js';



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  .menu {
    display: none;
  }

  @container (min-width: 650px) {
    .container {
      --state-opacity: 0 !important;
    }

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
  }
}

if (!customElements.get('friend-shiny-card')) customElements.define('friend-shiny-card', friendShinyCard);