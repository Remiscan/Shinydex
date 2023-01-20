import InputSwitch from '../../../_common/components/input-switch/input-switch.js';
import { template } from './shinyStars.js';



export class ShinySwitch extends InputSwitch {
  constructor() {
    super();
    const checkedIcon = this.shadow.querySelector('[part~="icon-checked"]');

    const newIcon = template.content.cloneNode(true);
    const svg = newIcon.querySelector('svg');
    svg.setAttribute('part', 'icon icon-checked');
    svg.setAttribute('viewBox', '-10 -8 44 44');
    checkedIcon.outerHTML = svg.outerHTML;
  }
}

if (!customElements.get('shiny-switch')) customElements.define('shiny-switch', ShinySwitch);