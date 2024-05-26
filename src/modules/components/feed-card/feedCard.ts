import materialIconsSheet from '../../../../ext/material_icons.css' assert { type: 'css' };
import commonSheet from '../../../../styles/common.css' assert { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' assert { type: 'css' };
import { goToPage } from '../../navigate.js';
import { BackendShiny } from '../../ShinyBackend.js';
import { translationObserver } from '../../translation.js';
import { friendShinyCard } from '../friend-shiny-card/friendShinyCard.js';
import '../wavyDivider.js';
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';
// @ts-expect-error
import Couleur from 'colori';



export class feedCard extends HTMLElement {
	shadow: ShadowRoot;
	username: string = '';
	static maxShinyDisplayed = 3;

	get congratsButton() {
		return this.shadow.querySelector('[data-action="feliciter"]') as HTMLButtonElement | null;
	}


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


	async sendCongratulations(event: Event) {
		if (!(event instanceof MouseEvent)) return;
		// @ts-ignore
		await import('../../../../ext/confetti.min.js');

		const baseColor = new Couleur(`rgb(${getComputedStyle(document.documentElement).getPropertyValue('--primary')})`);

		// @ts-ignore
		confetti({
			spread: 360,
			startVelocity: 15,
			ticks: 75,
			gravity: .1,
			origin: {
				x: event.clientX / window.innerWidth,
				y: event.clientY / window.innerHeight
			},
			shapes: [
				// @ts-ignore
				confetti.shapeFromPath({ path: 'M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9z' })
			],
			colors: [
				baseColor.hex,
				baseColor.replace('okh', baseColor.okh - 120).hex,
				baseColor.replace('okh', baseColor.okh - 60).hex,
				baseColor.replace('okh', baseColor.okh + 60).hex,
				baseColor.replace('okh', baseColor.okh + 120).hex,
			],
			scalar: .4,
			disableForReducedMotion: true
		});

		const button = this.congratsButton
		if (button) {
			button.disabled = true;
			const iconContainer = button.querySelector('.material-icons');
			if (iconContainer) iconContainer.innerHTML = 'check';
		}
	}
	boundSendCongratulations = this.sendCongratulations.bind(this);


	static make(username: string, shinyList: BackendShiny[]): feedCard {
		const card = document.createElement('feed-card') as feedCard;

		let feedCardType = 'pluriel';
		if (shinyList.length === 1)
			feedCardType = 'singulier';

		card.setAttribute('type', feedCardType);
		card.setAttribute('username', username);

		const usernameContainer = document.createElement('span');
		usernameContainer.setAttribute('slot', 'username');
		usernameContainer.innerHTML = username;
		card.appendChild(usernameContainer);

		const quantityContainer = document.createElement('span');
		quantityContainer.setAttribute('slot', 'pokemon-quantity');
		quantityContainer.innerHTML = String(shinyList.length);
		card.appendChild(quantityContainer);

		let count = 0;
		for (const pkmn of shinyList) {
			const shinyCard = document.createElement('friend-shiny-card') as friendShinyCard;
			shinyCard.dataToContent(Promise.resolve(pkmn));
			card.appendChild(shinyCard);
			count++;
			//if (count >= this.maxShinyDisplayed) break;
		}

		return card;
	}


	static get observedAttributes() {
		return ['lang', 'type', 'username'];
	}


	attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
		// Do not prevent same-value execution!

		switch (attr) {
			case 'lang':
				translationObserver.translate(this, newValue ?? '');
				break;

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

		this.congratsButton?.addEventListener('click', this.boundSendCongratulations);
	}

	disconnectedCallback() {
		translationObserver.unserve(this);

		const navLinks = this.shadow.querySelectorAll<HTMLAnchorElement>('a[data-nav-section]');
		navLinks.forEach(link => link.removeEventListener('click', this.navHandler));

		this.congratsButton?.removeEventListener('click', this.boundSendCongratulations);
	}
}

if (!customElements.get('feed-card')) customElements.define('feed-card', feedCard);