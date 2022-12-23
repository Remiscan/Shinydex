import { pokemonCard } from '../pokemon-card/pokemonCard.js';



export class corbeilleCard extends pokemonCard {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.removeEventListener('pointerdown', this.pointerdownHandler);
  }
}

if (!customElements.get('corbeille-card')) customElements.define('corbeille-card', corbeilleCard);