import { BottomSheet } from "./components/bottomSheet.js";
import { pokemonData } from "./jsonData.js";
import { lazyLoadSection } from "./lazyLoading.js";
import { huntStorage, shinyStorage } from "./localForage.js";
import { Pokemon } from "./Pokemon.js";
import type { BackendShiny } from "./ShinyBackend.js";
import { translationObserver } from "./translation.js";



/**
 * Éditeur de masse de Pokémon, pour corriger massivement des données après une mise à jour si besoin.
 */
export abstract class BatchDataFixer extends EventTarget {
	abstract name: string;
	protected isReady = false;
	protected shinyList: Map<BackendShiny['huntid'], BackendShiny> = new Map();


	constructor() {
		super();
		this.prepare().then(() => {
			this.isReady = true;
			this.dispatchEvent(new Event('ready'));
		});
	}


	async ready(): Promise<void> {
		const abortController = new AbortController();
		return new Promise(resolve => {
			if (this.isReady) return resolve();
			this.addEventListener('ready', () => {
				resolve();
				abortController.abort();
			}, { signal: abortController.signal });
		});
	}


	async prepare() {
		await Promise.all([shinyStorage.ready(), huntStorage.ready()]);
		const huntKeys = new Set(await huntStorage.keys());
		await shinyStorage.iterate((value: BackendShiny, key: string) => {
			if (huntKeys.has(key)) return; // On ne modifie pas un Pokémon déjà en cours d'édition, pour éviter des conflits
			if (!this.filter(value)) return;
			this.shinyList.set(key, value);
		});
	}


	/** Détermine si un Pokémon sera présent dans l'éditeur de masse. */
	abstract filter(shiny: BackendShiny): boolean;


	get bottomSheet(): BottomSheet {
		const sheet = document.getElementById('batch-data-fixer');
		if (!(sheet instanceof BottomSheet)) throw new TypeError('Expecting BottomSheet');
		return sheet;
	}


	protected stringKey(key: string) {
		return `batch-data-fixer-${this.name}-${key}`;
	}


	renderSheet() {
		return /*html*/`
			<h2 class="title-large" data-string="${this.stringKey('title')}"></h2>

			<p data-string="${this.stringKey('intro')}"></p>
			<p data-string="batch-data-fixer-hunts-warning"></p>

			<form name="batch-data-fixer-form">
				${Array.from(this.shinyList.values()).sort((a, b) => {
					return (b.catchTime - a.catchTime) || (b.creationTime - a.creationTime);
				}).map(shiny => {
					return /*html*/`
						<div class="un-pokemon" data-huntid="${shiny.huntid}">
							<div data-replaces="shiny-card" data-huntid="${shiny.huntid}"></div>
							${this.renderEditor(shiny)}
						</div>
					`;
				}).join('')}

				<button type="submit" class="surface interactive filled elevation-2 only-text" data-action="submit-fixer">
					<span class="label-large" data-string="batch-data-fixer-submit"></span>
				</button>
			</form>
		`;
	}


	abstract renderEditor(shiny: BackendShiny): string;


	protected listenersAbortController?: AbortController;

	async open() {
		if (this.listenersAbortController) this.listenersAbortController.abort();

		await this.ready();
		const sheet = this.bottomSheet;

		const dialog = sheet.dialog;
		if (!dialog) throw new TypeError('Expecting HTMLDialogElement');

		sheet.innerHTML = this.renderSheet();

		const form = sheet.querySelector('[name="batch-data-fixer-form"]');
		if (!form) throw new TypeError('Expecting HTMLFormElement');

		translationObserver.translate(sheet);
		lazyLoadSection('batch-data-fixer');

		const abortController = new AbortController();
		this.listenersAbortController = abortController;
		form.addEventListener('change', this.boundHandleChange, { signal: abortController.signal });
		form.addEventListener('submit', this.boundHandleSubmit, { signal: abortController.signal });
		dialog.addEventListener('close', () => abortController.abort(), { signal: abortController.signal });

		sheet.setAttribute('data-fixer-name', this.name);
		sheet.show();
	}


	protected handleChange(event: Event) {
		const input = event.target;
		if (!(input instanceof HTMLElement) || !('value' in input)) throw new TypeError('Expecting input Element');

		const huntid = input.closest<HTMLElement>('[data-huntid]')?.dataset.huntid;
		if (!huntid || !(this.shinyList.has(huntid))) throw new TypeError('Expecting valid huntid');

		const shiny = this.shinyList.get(huntid)!;
		const inputName = input.getAttribute('name');
		if (!inputName) throw new TypeError('Expecting valid input name');

		this.editShiny(shiny, inputName, input.value);
		shiny.lastUpdate = Date.now();
	}
	protected boundHandleChange = this.handleChange.bind(this);


	abstract editShiny(
		shiny: BackendShiny,
		inputName: string,
		inputValue: unknown,
	): void;


	protected async handleSubmit(event: Event) {
		event.preventDefault();

		await Promise.all(
			Array.from(this.shinyList.values()).map(shiny => shinyStorage.setItem(shiny.huntid, shiny))
		);

		window.dispatchEvent(new CustomEvent('dataupdate', {
			detail: {
				sections: ['mes-chromatiques'],
				ids: Array.from(this.shinyList.keys()),
				sync: true
			}
		}));
	}
	protected boundHandleSubmit = this.handleSubmit.bind(this);


	static bootDataFixer(name: string) {
		let dataFixer: BatchDataFixer;
		switch (name) {
			case 'caughtAs-fixer': dataFixer = new CaughtAsBatchDataFixer(); break;
			default: throw new Error('Unknown batch data fixer');
		}

		dataFixer.open();
	}
}



class CaughtAsBatchDataFixer extends BatchDataFixer {
	name = 'caughtAs-fixer';
	protected evolutionChains: Map<BackendShiny['huntid'], ReturnType<typeof Pokemon['getPreEvolutionChain']>> = new Map();


	filter(shiny: BackendShiny): boolean {
		const preEvolutionChain = Pokemon.getPotentialPreEvolutions(pokemonData[shiny.dexid], shiny.forme);
		if (preEvolutionChain.length > 0) {
			this.evolutionChains.set(shiny.huntid, preEvolutionChain);
			return true;
		} else {
			return false;
		}
	}


	renderEditor(shiny: BackendShiny): string {
		const evolutionChain = this.evolutionChains.get(shiny.huntid);
		if (!evolutionChain) return '';

		const initialValue = shiny.caughtAsDexid
			? `${shiny.caughtAsDexid}-${shiny.caughtAsForme || ''}`
			: '';
		return /*html*/`
			<span class="body-medium" data-string="${this.stringKey('instruction')}"></span>
			<radio-group name="caughtAs" value="${initialValue}">
				${evolutionChain.map(value => /*html*/`
					<option value="${value.dexid}-${value.forme}" data-string="pokemon/${value.dexid}/forme/${value.forme}/name"></option>
				`).join('')}
				<option value="" data-string="pokemon/${shiny.dexid}/forme/${shiny.forme}/name"></option>
			</radio-group>
		`;
	}


	editShiny(shiny: BackendShiny, inputName: string, inputValue: unknown): void {
		if (inputName !== 'caughtAs') return;

		if (inputValue === '') {
			shiny.caughtAsDexid = null;
			shiny.caughtAsForme = null;
		} else {
			const parts = String(inputValue).split('-');
			const dexid = Number(parts.shift());
			const forme = parts.join('-');
			if (isNaN(dexid) || dexid <= 0) {
				throw new Error('Invalid dexid');
			}

			const selectedPokemon = pokemonData[dexid];
			if (!selectedPokemon) throw new Error('Invalid Pokémon');

			const selectedForme = selectedPokemon.formes.find(f => f.dbid === forme);
			if (!selectedForme) throw new Error('Invalid forme');

			shiny.caughtAsDexid = dexid;
			shiny.caughtAsForme = forme;
		}
	}
}