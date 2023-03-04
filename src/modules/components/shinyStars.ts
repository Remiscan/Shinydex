export const template = document.createElement('template');
template.innerHTML = /*html*/`
  <svg viewBox="0 0 24 24" role="img" aria-labelledby="title">
    <title id="title">chromatique</title>
    <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5z" transform="translate(0 4)"/>
  </svg>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  svg {
    --size: 1em;
    width: var(--size);
    height: var(--size);
    fill: var(--color);
  }
`);



export class shinyStars extends HTMLElement {
  shadow: ShadowRoot;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [sheet];
  }
}

if (!customElements.get('shiny-stars')) customElements.define('shiny-stars', shinyStars);