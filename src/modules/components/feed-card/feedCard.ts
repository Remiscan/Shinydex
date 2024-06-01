import materialIconsSheet from '../../../../ext/material_icons.css' assert { type: 'css' };
import commonSheet from '../../../../styles/common.css' assert { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' assert { type: 'css' };
import { callBackend } from '../../callBackend.js';
import { goToPage } from '../../navigate.js';
import { dateDifference } from '../../Params.js';
import { Shiny } from '../../Shiny.js';
import { BackendShiny } from '../../ShinyBackend.js';
import { formatRelativeNumberOfDays, getString, translationObserver } from '../../translation.js';
import { sendConfetti } from '../confetti.js';
import { friendShinyCard } from '../friend-shiny-card/friendShinyCard.js';
import '../wavyDivider.js';
import sheet from './styles.css' assert { type: 'css' };
import template from './template.js';



export type ISODay = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
export interface BackendCongratulatedShiny extends BackendShiny {
	congratulated: boolean;
}



export class feedCard extends HTMLElement {
	shadow: ShadowRoot;
	username: string = '';
	minCatchTime: number = +Infinity;
	maxCatchTime: number = -Infinity;
	firstHuntid: string = '';
	static maxShinyDisplayed = 3;
	rendering = false;

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

		this.disableCongratsButton();

		sendConfetti({
			spread: 360,
			origin: {
				x: event.clientX / window.innerWidth,
				y: event.clientY / window.innerHeight
			},
		}),

		await callBackend('send-congratulation', {
			huntid: this.firstHuntid,
		}, true);
	}
	boundSendCongratulations = this.sendCongratulations.bind(this);


	disableCongratsButton() {
		const button = this.congratsButton;
		if (button) {
			button.disabled = true;
			const iconContainer = button.querySelector('.material-icons');
			if (iconContainer) iconContainer.innerHTML = 'check';
		}
	}


	static make(day: ISODay, username: string, shinyList: BackendCongratulatedShiny[], total: number): feedCard {
		const card = document.createElement('feed-card') as feedCard;
		card.rendering = true;

		let feedCardType = 'pluriel';
		if (shinyList.length === 1)
			feedCardType = 'singulier';

		card.setAttribute('type', feedCardType);
		card.setAttribute('username', username);
		if (total > feedCard.maxShinyDisplayed) {
			card.setAttribute('data-too-many', '');
		}

		const usernameContainer = document.createElement('span');
		usernameContainer.setAttribute('slot', 'username');
		if (username) {
			usernameContainer.innerHTML = username;
		} else {
			usernameContainer.innerHTML = getString('an-anonymous-user');
			usernameContainer.dataset.string = 'an-anonymous-user';
		}
		card.appendChild(usernameContainer);

		const dateContainer = document.createElement('time');
		dateContainer.setAttribute('datetime', day);
		dateContainer.setAttribute('slot', 'relative-date');
		const relativeDate = formatRelativeNumberOfDays(
			dateDifference(new Date(Date.now()), new Date(day))
		);
		dateContainer.innerHTML = relativeDate.slice(0, 1).toLocaleUpperCase() + relativeDate.slice(1);
		card.appendChild(dateContainer);

		const quantityContainer = document.createElement('span');
		quantityContainer.setAttribute('slot', 'pokemon-quantity');
		quantityContainer.innerHTML = String(total);
		card.appendChild(quantityContainer);

		const howManyMoreContainer = document.createElement('span');
		howManyMoreContainer.setAttribute('slot', 'how-many-more');
		howManyMoreContainer.innerHTML = String(total - feedCard.maxShinyDisplayed);
		card.appendChild(howManyMoreContainer);

		let count = 0;
		let canCongratulate = true;
		let shinyCards: friendShinyCard[] = [];
		for (const pkmn of shinyList) {
			const shiny = new Shiny(pkmn);
			if (shiny.catchTime < card.minCatchTime) card.minCatchTime = shiny.catchTime;
			if (shiny.catchTime > card.maxCatchTime) card.maxCatchTime = shiny.catchTime;
			if (count === 0) {
				card.firstHuntid = shiny.huntid;
				if (pkmn.congratulated) canCongratulate = false;
			}
			const shinyCard = document.createElement('friend-shiny-card') as friendShinyCard;
			shinyCard.dataToContent(Promise.resolve(shiny));
			card.appendChild(shinyCard);
			shinyCards.push(shinyCard);
			count++;
			if (count >= this.maxShinyDisplayed) break;
		}

		if (!canCongratulate) card.setAttribute('disabled-congratulation', '');

		Promise.all(shinyCards.map(c => c.renderingComplete))
		.then(() => {
			card.rendering = false;
			card.dispatchEvent(new Event('rendering-complete'));
		});

		return card;
	}


	getRenderingComplete() {
		return new Promise(resolve => {
		  if (!this.rendering) return resolve(true);
		  this.addEventListener('rendering-complete', resolve, { once: true });
		});
	  }
	  get renderingComplete() {
		return this.getRenderingComplete();
	  }


	static get observedAttributes() {
		return ['lang', 'type', 'username', 'disabled-congratulation'];
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

			case 'disabled-congratulation': {
				this.disableCongratsButton();
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