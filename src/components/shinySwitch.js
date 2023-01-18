import InputSwitch from '../../../_common/components/input-switch/input-switch.js';
import { template } from './shinyStars.js';



export class ShinySwitch extends InputSwitch {
  constructor() {
    super();
    const iconOn = this.shadow.querySelector('[part~="icon-on"]');

    const newIcon = template.content.cloneNode(true);
    const svg = newIcon.querySelector('svg');
    svg.setAttribute('part', 'icon icon-on');
    svg.setAttribute('viewBox', '-10 -8 44 44');
    iconOn.outerHTML = svg.outerHTML;
  }
}

if (!customElements.get('shiny-switch')) customElements.define('shiny-switch', ShinySwitch);