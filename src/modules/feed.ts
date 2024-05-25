import { callBackend } from "./callBackend.js";
import { loadSpinner } from "./components/loadSpinner.js";
import { shinyCard } from "./components/shiny-card/shinyCard.js";
import { dataStorage } from "./localForage.js";
import { dateDifference, formatRelativeNumberOfDays } from "./Params.js";
import { Settings } from "./Settings.js";
import { Shiny } from "./Shiny.js";
import { BackendShiny } from "./ShinyBackend.js";



const feedLoaderObserver = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
	for (const entry of entries) {
		if (!entry.isIntersecting) return;
		if (!(entry.target instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);

		const maxDate = entry.target.dataset.maxDate;
		if (!maxDate) return;

		getFeedData(maxDate as ISODay)
		.then(data => {

		});
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
export async function getFeedData(maxDate: ISODay = timestamp2ISODay(Date.now())) {
	const userProfile = await dataStorage.getItem('user-profile');
	const data = await callBackend('get-feed-data', { maxDate, username: userProfile?.username ?? undefined });
	return data.entries;
}


/** Crée le template d'une journée dans le flux. */
function makeFeedDay([day, userList]: FeedDataEntry) {
	const dateDiff = dateDifference(new Date(Date.now()), new Date(day));
	const template = document.createElement('template');
	template.innerHTML = /*html*/`
		<h2>${formatRelativeNumberOfDays(dateDiff)}</h2>
		${Object.entries(userList).map(([username, shinyList]) => /*html*/`
			<feed-card>
				<span slot="username">${username}</span>
			</feed-card>
		`)}
	`;
	return template;
}



function populateFeedData(data: FeedData) {
	for (const [date, userList] of Object.entries(data)) {
		for (const [username, shinyList] of Object.entries(userList)) {
			const feedCard = document.createElement('feed-card');
			feedCard.dataset.username = username;
			feedCard.populate(shinyList);
		}
	}
}