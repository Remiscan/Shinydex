const template = document.createElement('template');
template.innerHTML = /*html*/`
  <div class="outer-spin">
    <div class="inner-spin"></div>
    <div class="inner-spin"></div>
  </div>
  <div class="mask"></div>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  @keyframes rotate-left {
    100%, 60%, 75% { transform: rotate(360deg); }
  }

  @keyframes rotate {
    0% { transform: rotate(0); }
    100% { transform: rotate(360deg); }
  }

  @keyframes rotate-right {
    0%, 25%, 45% { transform: rotate(0); }
    100% { transform: rotate(360deg); }
  }

  :host {
    --size: 4em;
    --border: 3px;
    --padding: 3px;
    backface-visibility: hidden;
    display: grid;
    place-items: center;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    position: relative;
  }

  :host * {
    grid-row: 1 / 1;
    grid-column: 1 / 1;
  }

  .outer-spin {
    display: grid;
    position: relative;
    width: var(--size);
    border-radius: var(--size);
    overflow: hidden;
    animation: rotate 2s infinite linear;
  }

  .outer-spin::before {
    content: '';
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: linear-gradient(to bottom, var(--accent-color, red) 0% 47%, var(--bg-color) 47% 53%, var(--text-color, white) 53% 100%);
    border: var(--padding) solid var(--bg-color);
    border-radius: 100%;
  }

  .inner-spin {
    background: var(--bg-color);
    height: var(--size);
    width: calc(0.5 * var(--size));
    animation: rotate-left 2.5s infinite cubic-bezier(.445, .050, .55, .95);
    border-radius: calc(0.5 * var(--size)) 0 0 calc(0.5 * var(--size));
    place-self: start;
    transform-origin: right center;
  }

  .inner-spin:last-child {
    animation-name: rotate-right;
    border-radius: 0 calc(0.5 * var(--size)) calc(0.5 * var(--size)) 0;
    place-self: end;
    transform-origin: left center;
  }

  .mask {
    background: var(--bg-color);
    border-radius: 50%;
    --width: calc(var(--size) - 2 * var(--border) - 2 * var(--padding));
    width: var(--width);
    height: var(--width);
    position: relative;
  }
`);



export class loadSpinner extends HTMLElement {
  shadow: ShadowRoot;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [sheet];
  }
}

if (!customElements.get('load-spinner')) customElements.define('load-spinner', loadSpinner);