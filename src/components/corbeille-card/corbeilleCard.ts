import { shinyCard } from '../shiny-card/shinyCard.js';



export class corbeilleCard extends shinyCard {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.removeEventListener('pointerdown', this.pointerdownHandler);
  }
}

if (!customElements.get('corbeille-card')) customElements.define('corbeille-card', corbeilleCard);