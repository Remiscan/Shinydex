import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';
import materialIconsSheet from '../../../../ext/material_icons.css' assert { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' assert { type: 'css' };
import commonSheet from '../../../../styles/common.css' assert { type: 'css' };
import { BackendShiny } from '../../ShinyBackend.js';
import { shinyCard } from '../shiny-card/shinyCard.js';
import { translationObserver } from '../../translation.js';
import { goToPage } from '../../navigate.js';



export class feedCard extends HTMLElement {
	shadow: ShadowRoot;
	username: string = '';


	navHandler = (event: Event) => {
		event.preventDefault();
		goToPage(`chromatiques-ami`, this.username);
	}


	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' });
		this.shadow.appendChild(template.content.cloneNode(true));
		this.shadow.adoptedStyleSheets = [materialIconsSheet, themesSheet, commonSheet, sheet];
	}


	static make(username: string, shinyList: BackendShiny[]): feedCard {
		const card = document.createElement('feed-card') as feedCard;

		let feedCardType = 'singulier';
		switch (shinyList.length) {
			case 2:
			case 3:
				feedCardType = 'pluriel';
				break;
			default:
				feedCardType = 'tres-pluriel';
		}
		card.setAttribute('type', feedCardType);
		card.setAttribute('username', username);

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
		return ['lang', 'type', 'username'];
	}


	attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
		if (oldValue === newValue) return;

		switch (attr) {
			case 'type': {
				const titleContainer = this.shadow.querySelector('h3');
				if (titleContainer) {
					titleContainer.dataset.string = `titre-flux-${newValue}`;
					this.setAttribute('lang', this.getAttribute('lang') ?? '');
				}
			} break;

			case 'username': {
				this.username = newValue ?? '';
			} break;
		}
	}


	connectedCallback() {
		translationObserver.serve(this, { method: 'attribute' });

		const navLinks = this.shadow.querySelectorAll<HTMLAnchorElement>('a[data-nav-section]');
		navLinks.forEach(link => link.addEventListener('click', this.navHandler));
	}

	disconnectedCallback() {
		translationObserver.unserve(this);

		const navLinks = this.shadow.querySelectorAll<HTMLAnchorElement>('a[data-nav-section]');
		navLinks.forEach(link => link.removeEventListener('click', this.navHandler));
	}
}

if (!customElements.get('feed-card')) customElements.define('feed-card', feedCard);