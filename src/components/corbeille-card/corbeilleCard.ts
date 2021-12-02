import { pokemonCard } from '../pokemon-card/pokemonCard';



export class corbeilleCard extends pokemonCard {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.removeEventListener('mousedown', this.mousedownHandler);
    this.removeEventListener('touchstart', this.touchstartHandler);
  }
}

if (!customElements.get('corbeille-card')) customElements.define('corbeille-card', corbeilleCard);