import InputSwitch from '../../../../_common/components/input-switch/input-switch.js';



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  [part~="icon-checked"],
  [part~="icon-unchecked"] {
    stroke-width: 0;
    stroke: transparent;
  }

  [part~="icon-checked"] {
    fill: var(--on-track-color);
  }

  [part~="icon-unchecked"] {
    fill: var(--off-track-color);
  }
`);



export class NotifSwitch extends InputSwitch {
  constructor() {
    super();
    this.shadow.adoptedStyleSheets.push(sheet);

    const viewBox = '-4.8 -4.8 33.6 33.6';

    const uncheckedIcon = this.shadow.querySelector('[part~="icon-unchecked"]');
    uncheckedIcon.setAttribute('viewBox', viewBox);
    uncheckedIcon.innerHTML = /*html*/`
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm0-15.5c2.49 0 4 2.02 4 4.5v.1l2 2V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.24.06-.47.15-.69.23l1.64 1.64c.18-.02.36-.05.55-.05zM5.41 3.35L4 4.76l2.81 2.81C6.29 8.57 6 9.74 6 11v5l-2 2v1h14.24l1.74 1.74 1.41-1.41L5.41 3.35zM16 17H8v-6c0-.68.12-1.32.34-1.9L16 16.76V17z"/>
    `;

    const checkedIcon = this.shadow.querySelector('[part~="icon-checked"]');
    checkedIcon.setAttribute('viewBox', viewBox);
    checkedIcon.innerHTML = /*html*/`
      <path d="M7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42zM18 11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2v-5zm-6 11c.14 0 .27-.01.4-.04.65-.14 1.18-.58 1.44-1.18.1-.24.15-.5.15-.78h-4c.01 1.1.9 2 2.01 2z"/>
    `;
  }
}

if (!customElements.get('notif-switch')) customElements.define('notif-switch', NotifSwitch);