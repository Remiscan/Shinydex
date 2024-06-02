import { queueable } from "../../../_common/js/per-function-async-queue/mod.js";
import { callBackend } from "./callBackend.js";
import { sendConfetti } from "./components/confetti.js";
import { BackendCongratulatedShiny, feedCard, ISODay } from "./components/feed-card/feedCard.js";
import './components/feed-day/feedDay.js';
import { loadSpinner } from "./components/loadSpinner.js";
import { dataStorage, friendStorage } from "./localForage.js";
import { Notif } from "./notification.js";
import { dateDifference, Params } from "./Params.js";
import { formatRelativeNumberOfDays, getString, TranslatedString } from "./translation.js";



const maxRequests = 10;
let requestsCount = 0;



const feedLoaderObserver = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
	for (const entry of entries) {
		if (requestsCount >= maxRequests) return;

		if (!entry.isIntersecting) return;
		if (!(entry.target instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

		const maxDate = entry.target.dataset.maxDate;
		if (!maxDate) return;

		getAndPopulateFeed(maxDate as ISODay);
	}
}, {
	threshold: [0],
});



type FeedData = {
	[key: ISODay]: Array<{
		'username': string | null,
		total: number,
		entries: BackendCongratulatedShiny[],
	}>
}
type FeedDayEntry = [key: keyof FeedData, userList: FeedData[keyof FeedData]];


function timestamp2ISODay(timestamp: number): ISODay {
	return new Date(timestamp).toISOString().slice(0, 10) as ISODay
}


/** Initialise le récupérateur de données du flux. */
export function initFeedLoader(maxDate: ISODay = timestamp2ISODay(Date.now())) {
	const feedSection = document.getElementById('flux');
	const feedLoader = feedSection?.querySelector<loadSpinner>('.liste-cartes > load-spinner');
	if (!feedLoader) return;
	feedLoader?.setAttribute('data-max-date', maxDate);
	feedLoaderObserver.observe(feedLoader);
}


/** Récupère les données du flux. */
export async function _getFeedData(maxDate: ISODay = timestamp2ISODay(Date.now()), minDate?: ISODay) {
	const body = {
		maxDate,
		minDate
	};
	if (!minDate) delete body.minDate;
	const data = await callBackend('get-feed-data', body, true);
	requestsCount++;
	return data.entries;
}
const getFeedData = queueable(_getFeedData, 1050);


/** Crée le template d'une journée dans le flux. */
function makeFeedDay(day: ISODay, userList: FeedData[keyof FeedData], friends: Set<string>) {
	const container = document.createElement('feed-day');
	container.dataset.datetime = day;

	const uniqueName = `feed-day-${day}`;
	container.style.setProperty('--unique-name', uniqueName);

	const dateContainer = document.createElement('time');
	dateContainer.setAttribute('datetime', day);
	dateContainer.setAttribute('slot', 'relative-date');
	const relativeDate = formatRelativeNumberOfDays(
		dateDifference(new Date(Date.now()), new Date(day))
	);
	dateContainer.innerHTML = relativeDate.slice(0, 1).toLocaleUpperCase() + relativeDate.slice(1);
	container.appendChild(dateContainer);

	let index = 0;
	for (const userData of userList) {
		const { username, total, entries: shinyList } = userData;
		const isFriend = username && friends.has(username);
		const card = feedCard.make(day, username ?? '', shinyList, total);
		card.setAttribute('data-is-friend', String(isFriend));
		card.style.setProperty('--unique-name', `${uniqueName}-user-${username || `anonymous-${index}`}`);
		container.appendChild(card);
		index++;
	}
	
	return container;
}


/** Remplit le flux public avec les données reçues du backend. */
function populateFeedData(data: FeedData, friends: Set<string>, { position = 'bottom' } = {}) {
	const feedSection = document.getElementById('flux');
	const feedContentContainer = feedSection?.querySelector('.liste-cartes');
	if (!feedContentContainer) return;

	const feedContent = new DocumentFragment();

	for (const [day, userList] of Object.entries(data)) {
		const dayContent = makeFeedDay(day as ISODay, userList, friends);
		feedContent.appendChild(dayContent);
	}

	// If we're refreshing the feed, i.e. inserting recent content at the top
	if (position === 'top') {
		const firstFeedDay = feedContentContainer.querySelector('feed-day');

		const replace = () => {
			firstFeedDay?.replaceWith(feedContent);
		};

		if ('startViewTransition' in document) {
			feedSection!.classList.add('view-transition');
			document.startViewTransition(replace)
			.then(() => feedSection!.classList.remove('view-transition'));
		} else {
			replace();
		}
	}

	// If we're scrolling down the feed, i.e. inserting older content at the bottom
	else {
		if (requestsCount < maxRequests) {
			const previousMinDate = Object.keys(data).at(-1);
			if (previousMinDate) {
				const _pMinDate = new Date(previousMinDate);
				const newMaxDate = new Date(_pMinDate.getTime() - Params.msPerDay);
		
				const loader = document.createElement('load-spinner');
				loader.setAttribute('data-max-date', newMaxDate.toISOString().slice(0, 10));
				feedContent.appendChild(loader);
				feedLoaderObserver.observe(loader);
			}
		}
		
		feedContentContainer.querySelectorAll('load-spinner').forEach(loader => loader.remove());
		feedContentContainer.appendChild(feedContent);
	}
}


/** Récupère les données du flux public sur le backend, puis le remplit. */
async function getAndPopulateFeed(maxDate: ISODay, minDate?: ISODay, { position = 'bottom', method = 'auto' } = {}) {
	try {
		const data = method === 'auto'
			? await getFeedData(maxDate, minDate)
			: await _getFeedData(maxDate, minDate);
		const friends = new Set(await friendStorage.keys());
		populateFeedData(data, friends, { position });
	} catch (error) {}
}


let refreshingFeed = false;
/** Actualise le flux public en récupérant les données plus récentes que celles de la première carte. */
async function refreshFeed(event: Event) {
	if (refreshingFeed) return;
	refreshingFeed = true;

	const target = event.target as HTMLElement;
	target.setAttribute('disabled', '');

	const feedSection = document.getElementById('flux');
	const feedScroller = feedSection?.querySelector('.section-contenu');
	const feedContentContainer = feedSection?.querySelector('.liste-cartes');
	if (!feedScroller || !feedContentContainer) return;

	feedScroller.scrollTo({ top: 0, behavior: 'smooth' });

	const firstFeedDay = feedContentContainer.querySelector<feedCard>('feed-day');
	const previousMaxDate = firstFeedDay?.dataset.datetime as ISODay | undefined;
	if (!previousMaxDate) return;

	const tomorrowDate = (new Date(Date.now() + Params.msPerDay)).toISOString().slice(0, 10) as ISODay;
	await getAndPopulateFeed(tomorrowDate, previousMaxDate, { position: 'top', method: 'manual' });

	target.removeAttribute('disabled');
	refreshingFeed = false;
}

// Écoute le clic sur le bouton d'actualisation du flux public
document.querySelector('#flux [data-action="refresh-feed"]')?.addEventListener('click', refreshFeed);


/** Récupère les félicitations stockées en BDD depuis la dernière fois, et en notifie l'utilisateur. */
export async function getAndNotifyCongratulations() {
	const usernames: string[] = Array.from(await getCongratulations())
		.map((username, index) => username == null
			? index === 0
				? getString('an-anonymous-user')
				: getString('an-anonymous-user').toLocaleLowerCase()
			: username
		);

	if (usernames.length === 0) return;

	const numberOfUsernames = usernames.length;

	const lastUsername = usernames.pop()!;
	const notifMessageKey: TranslatedString = numberOfUsernames > 1
		? 'notif-congratulations-plural'
		: 'notif-congratulations-singular';
	const notifMessage = getString(notifMessageKey)
		.replace('{usernames}', usernames.join(', '))
		.replace('{last_username}', lastUsername);

	const congratulationsNotif = new Notif(notifMessage, 10000);
	congratulationsNotif.prompt();

	const notifElement = congratulationsNotif.element as HTMLElement | undefined;
	if (!notifElement) return;

	const rect = notifElement.getBoundingClientRect();
	const confettiOptions = {
		spread: 360
	};

	const maxIterations = 4;
	const iterations = Math.min(maxIterations, numberOfUsernames);

	const timeouts: number[] = [];
	for (let k = 0; k < iterations; k++) {
		let x: number, y: number;

		if (iterations > 1) {
			const baseX = k % 2 === 0
			? rect.left + .3 * rect.width
			: rect.right - .3 * rect.width;

			const minX = (baseX - .15 * rect.width) / window.innerWidth;
			const maxX = (baseX + .15 * rect.width) / window.innerWidth;

			const minY = (rect.top / window.innerHeight) - .4;
			const maxY = (rect.top / window.innerHeight) - .15;

			x = minX + Math.random() * (maxX - minX);
			y = minY + Math.random() * (maxY - minY);
		} else {
			x = (rect.left + .5 * rect.width) / window.innerWidth;
			y = (rect.top / window.innerHeight) - .25;
		}
		

		const t = setTimeout(() => {
			sendConfetti({
				...confettiOptions,
				origin: { x, y }
			})
		}, k * 500);
		timeouts.push(t);
	}

	const onRemoval = () => {
		timeouts.forEach(t => clearTimeout(t));
		notifElement.removeEventListener('notification-removed', onRemoval);
	};
	notifElement.addEventListener('notification-removed', onRemoval);
}

/** Récupère les félicitations stockées en BDD. */
async function getCongratulations() {
	const dataStorageKey = 'last-congratulation-time';

	const lastCongratulationTime = await dataStorage.getItem(dataStorageKey);
	const lastCongratulationDate = lastCongratulationTime
		? new Date(Number(lastCongratulationTime))
		: null;

	const requestBody: Record<string, unknown> = {};
	if (lastCongratulationDate) requestBody.lastCongratulationDate = lastCongratulationDate.toISOString();
	const { congratulations } = await callBackend('get-congratulations', requestBody, true);

	if (!Array.isArray(congratulations)) throw new TypeError('Expecting Array<{ username, date }>');

	const usernames: Set<string | null> = new Set();
	let maxCongratulationDate = new Date(0);
	for (const r of congratulations) {
		if (!('username' in r) || !('date' in r)) continue;
		const date = new Date(r.date.endsWith('Z') ? r.date : (r.date + 'Z'));
		usernames.add(r.username);
		if (date > maxCongratulationDate) maxCongratulationDate = date;
	}

	const maxCongratulationDateTimestamp = maxCongratulationDate.getTime();
	if (maxCongratulationDateTimestamp) await dataStorage.setItem(dataStorageKey, maxCongratulationDateTimestamp);

	return usernames;
}