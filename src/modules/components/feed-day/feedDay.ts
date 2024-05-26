import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';
import materialIconsSheet from '../../../../ext/material_icons.css' assert { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' assert { type: 'css' };
import commonSheet from '../../../../styles/common.css' assert { type: 'css' };
import { BackendShiny } from '../../ShinyBackend.js';
import { shinyCard } from '../shiny-card/shinyCard.js';
import '../feed-card/feedCard.js';
import { translationObserver } from '../../translation.js';



export class feedDay extends HTMLElement {
	shadow: ShadowRoot;


	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' });
		this.shadow.appendChild(template.content.cloneNode(true));
		this.shadow.adoptedStyleSheets = [materialIconsSheet, themesSheet, commonSheet, sheet];
	}


	populate(shinyList: BackendShiny[]) {

	}


	static make(username: string, shinyList: BackendShiny[]): feedDay {
		const card = document.createElement('feed-card') as feedDay;

		let feedCardType: string;
		switch (shinyList.length) {
			case 1:
				feedCardType = 'singulier';
			case 2:
			case 3:
				feedCardType = 'pluriel';
				break;
			default:
				feedCardType = 'tres-pluriel';
		}
		card.setAttribute('type', feedCardType);

		const usernameContainer = document.createElement('span');
		usernameContainer.setAttribute('slot', 'username');
		usernameContainer.innerHTML = username;
		card.appendChild(usernameContainer);

		for (const pkmn of shinyList) {
			const shinyCard = document.createElement('shiny-card') as shinyCard;
			shinyCard.dataToContent(Promise.resolve(pkmn));
			card.appendChild(shinyCard);
		}

		return card;
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
}

if (!customElements.get('feed-day')) customElements.define('feed-day', feedDay);