const template = document.createElement('template');
template.innerHTML = /*html*/`
	<svg aria-hidden="true" width="100%" height="8" fill="none">
		<pattern id="wave" width="91" height="8" patternUnits="userSpaceOnUse" fill="none">
			<path d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0" fill="none" stroke-linecap="square"/>
		</pattern>
		<rect width="120%" height="100%" fill="url(#wave)"/>
	</svg>
`;



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
	:host {
		display: grid;
		width: 100%;
		height: 8px;
	}

	path {
		stroke: currentColor;
	}

	:host([scroll-animated]) rect {
		animation: translate-left linear;
		animation-timeline: view();
	}

	@keyframes translate-left {
		from { translate: 0%; }
		to { translate: -8%; }
	}
`);



export class wavyDivider extends HTMLElement {
	shadow: ShadowRoot;

	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' });
		this.shadow.appendChild(template.content.cloneNode(true));
		this.shadow.adoptedStyleSheets = [sheet];
	}
}

if (!customElements.get('wavy-divider')) customElements.define('wavy-divider', wavyDivider);