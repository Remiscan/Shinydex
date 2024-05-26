import { queueable } from "../../../_common/js/per-function-async-queue/mod.js";
import { callBackend } from "./callBackend.js";
import { feedCard } from "./components/feed-card/feedCard.js";
import './components/feed-day/feedDay.js';
import { loadSpinner } from "./components/loadSpinner.js";
import { dataStorage } from "./localForage.js";
import { dateDifference, Params } from "./Params.js";
import { BackendShiny } from "./ShinyBackend.js";
import { formatRelativeNumberOfDays } from "./translation.js";



const feedLoaderObserver = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
	for (const entry of entries) {
		if (!entry.isIntersecting) return;
		if (!(entry.target instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

		const maxDate = entry.target.dataset.maxDate;
		if (!maxDate) return;

		getFeedData(maxDate as ISODay)
		.then(data => populateFeedData(data))
		.catch(error => {});
	}
}, {
	threshold: [0],
});



/** Date d'un jour, de la forme `2024-05-25`. */
type ISODay = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
type Username = string;

type FeedData = {
	[key: ISODay]: {
		[key: Username]: BackendShiny[]
	}
}
type FeedDataEntry = [key: keyof FeedData, userList: FeedData[keyof FeedData]];


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
export async function _getFeedData(maxDate: ISODay = timestamp2ISODay(Date.now())) {
	const userProfile = await dataStorage.getItem('user-profile');
	const data = await callBackend('get-feed-data', { maxDate, username: userProfile?.username ?? undefined });
	return data.entries;
}
const getFeedData = queueable(_getFeedData, 1050);


/** Crée le template d'une journée dans le flux. */
function makeFeedDay(...[day, userList]: FeedDataEntry) {
	const container = document.createElement('feed-day');

	const dateContainer = document.createElement('time');
	dateContainer.setAttribute('datetime', day);
	dateContainer.setAttribute('slot', 'relative-date');
	dateContainer.innerHTML = formatRelativeNumberOfDays(
		dateDifference(new Date(Date.now()), new Date(day))
	);
	container.appendChild(dateContainer);

	for (const [username, shinyList] of Object.entries(userList)) {
		const card = feedCard.make(username, shinyList);
		container.appendChild(card);
	}
	
	return container;
}



function populateFeedData(data: FeedData) {
	const feedSection = document.getElementById('flux');
	const feedContentContainer = feedSection?.querySelector('.liste-cartes');
	if (!feedContentContainer) return;

	const feedContent = new DocumentFragment();

	for (const [day, userList] of Object.entries(data)) {
		const dayContent = makeFeedDay(day as ISODay, userList);
		feedContent.appendChild(dayContent);
	}

	const previousMinDate = Object.keys(data).at(-1);
	if (previousMinDate) {
		const _pMinDate = new Date(previousMinDate);
		const newMaxDate = new Date(_pMinDate.getTime() - Params.msPerDay);

		const loader = document.createElement('load-spinner');
		loader.setAttribute('data-max-date', newMaxDate.toISOString().slice(0, 10));
		feedContent.appendChild(loader);
		feedLoaderObserver.observe(loader);
	}
	
	feedContentContainer.querySelectorAll('load-spinner').forEach(loader => loader.remove());
	feedContentContainer.appendChild(feedContent);
}