import InputSwitch from '../../../../_common/components/input-switch/input-switch.js';
import '../shiny-stars/shinyStars.js';



class ShinySwitch extends InputSwitch {
  constructor() {
    super();
  }

  update(attr, newValue) {
    switch (attr) {
      case 'hint': {
        const hints = (newValue || '').split(' ');
        const type = hints[0];
        switch (type) {
          case 'icon': {
            const iconOn = `<shiny-stars></shiny-stars>`;
            const iconOff = ``;
            this.shadowRoot.querySelector('[data-state="on"]').innerHTML = iconOn;
            this.shadowRoot.querySelector('[data-state="off"]').innerHTML = iconOff;
          } break;
          default: super.update(attr, newValue);
        }
      } break;
      default: super.update(attr, newValue);
    }
  }
}

if (!customElements.get('shiny-switch')) customElements.define('shiny-switch', ShinySwitch);