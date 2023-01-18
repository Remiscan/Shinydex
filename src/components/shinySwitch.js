import InputSwitch from '../../../_common/components/input-switch/input-switch.js';
import './shinyStars.js';



export class ShinySwitch extends InputSwitch {
  constructor() {
    super();
    const iconOn = this.shadow.querySelector('[part~="icon-on"]');
    iconOn.outerHTML = `<shiny-stars part="icon icon-on"></shiny-stars>`;
  }
}

if (!customElements.get('shiny-switch')) customElements.define('shiny-switch', ShinySwitch);