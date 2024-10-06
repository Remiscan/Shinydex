import materialIconsSheet from '../../../../ext/material_icons.css' with { type: 'css' };
import commonSheet from '../../../../styles/common.css' with { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' with { type: 'css' };
import { translationObserver } from '../../translation.js';
import '../feed-card/feedCard.js';
import sheet from './styles.css' with { type: 'css' };
import template from './template.js';



export class feedDay extends HTMLElement {
	shadow: ShadowRoot;


	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' });
		this.shadow.appendChild(template.content.cloneNode(true));
		this.shadow.adoptedStyleSheets = [materialIconsSheet, themesSheet, commonSheet, sheet];
	}


	static get observedAttributes() {
		return ['lang'];
	}


	connectedCallback() {
		translationObserver.serve(this, { method: 'attribute' });
	}

	disconnectedCallback() {
		translationObserver.unserve(this);
	}

	attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
		// Do not prevent same-value execution!

		switch (attr) {
			case 'lang':
				translationObserver.translate(this, newValue ?? '');
				break;
		}
	}
}

if (!customElements.get('feed-day')) customElements.define('feed-day', feedDay);