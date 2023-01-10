import { shinyCard } from '../shiny-card/shinyCard.js';
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };



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