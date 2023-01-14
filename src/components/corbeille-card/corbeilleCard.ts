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
  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [...this.shadow.adoptedStyleSheets, sheet];
    this.editHandler = (e: Event) => {};
    this.restoreHandler = (e: Event) => {

    };
  }

  connectedCallback() {
    super.connectedCallback();
  }
}

if (!customElements.get('corbeille-card')) customElements.define('corbeille-card', corbeilleCard);