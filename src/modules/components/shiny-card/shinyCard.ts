import materialIconsSheet from '../../../../ext/material_icons.css' with { type: 'css' };
import iconSheet from '../../../../images/iconsheet.css' with { type: 'css' };
import commonSheet from '../../../../styles/common.css' with { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' with { type: 'css' };
import { Hunt } from '../../Hunt.js';
import { Pokemon } from '../../Pokemon.js';
import { Shiny } from '../../Shiny.js';
import { FrontendShiny } from '../../ShinyBackend.js';
import { applyOrders, computeShinyFilters, sectionsOrderMaps, type OrderMap } from '../../filtres.js';
import { pokemonData } from '../../jsonData.js';
import { huntStorage, shinyStorage, type LocalForage } from '../../localForage.js';
import { Notif } from '../../notification.js';
import { getCurrentLang, getString, TranslatedString, translationObserver } from '../../translation.js';
import shinyRatesSheet from './shinyRate.css' with { type: 'css' };
import sheet from './styles.css' with { type: 'css' };
import template from './template.js';



let charmlessMethods: string[];
let previousEditNotification: Notif;



export class shinyCard extends HTMLElement {
  dataStore: LocalForage = shinyStorage;
  shadow: ShadowRoot;
  huntid: string = '';
  needsRefresh = true;
  rendering = true;
  shiny?: Shiny;

  clickHandler: (e: Event) => void = () => {};

  openHandler = (e: Event) => {
    e.stopPropagation();
    this.toggleNotes();
  };

  editHandler = (e: Event) => {
    e.stopPropagation();
    this.makeEdit();
  };

  restoreHandler = (e: Event) => {};

  static caughtCache = new Set<`${Shiny['dexid']}-${Shiny['forme']}`>();
  static hasEvolvedCache = new Set<`${Shiny['dexid']}-${Shiny['forme']}`>();

  static async updateCaughtCache() {
    this.caughtCache.clear();
    await shinyStorage.iterate<FrontendShiny, void>(shiny => {
      this.caughtCache.add(`${shiny.dexid}-${shiny.forme}`);
      if (shiny.caughtAsDexid) {
        try {
          const preEvolutionChain = Pokemon.getPreEvolutionChain(shiny.dexid, shiny.forme, shiny.caughtAsDexid, shiny.caughtAsForme || '');
          for (let i = 1; i < preEvolutionChain.length; i++) {
            const preEvolution = preEvolutionChain[i];
            this.hasEvolvedCache.add(`${preEvolution.dexid}-${preEvolution.forme}`);
          }
        } catch {}
      }
    });
  }

  get orderMap(): OrderMap {
    return sectionsOrderMaps.get('mes-chromatiques') || new Map();
  }


  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [materialIconsSheet, iconSheet, themesSheet, commonSheet, shinyRatesSheet, sheet];
  }


  /**
   * Met à jour le contenu de la carte à partir des données sauvegardées.
   */
  async dataToContent(getPkmn = this.dataStore.getItem<object>(this.huntid)) {
    let shiny: Shiny;
    try {
      const pkmn = await getPkmn;
      shiny = pkmn instanceof Shiny ? pkmn : new Shiny(pkmn ?? {});
      this.shiny = shiny;
    } catch (e) {
      console.error('Échec de création du Shiny', e);
      throw e;
    }

    this.setAttribute('last-update', String(shiny.lastUpdate));

    const lang = getCurrentLang();
    const pkmn = new Pokemon(pokemonData[shiny.dexid]);

    const formeQuery = `pokemon/${shiny.dexid}/forme/${shiny.forme}`;
    const formeName = getString(formeQuery as TranslatedString, lang);
    const formeData = pkmn.formes.find(f => f.dbid === shiny.forme);
    const isInterestingForme = (
      formeName !== getString(`pokemon/1/forme/${shiny.forme}` as TranslatedString, lang) &&
      formeData?.catchable && 
      pkmn.formes.filter(f => f.catchable).length > 1
    );

    // Espèce
    {
      const element = this.shadow.querySelector('[data-type="species"]')!;

      let stringQuery = '';
      // Si pas de surnom ET nom de forme intéressant :
      // - le surnom sera affiché en première ligne (voir plus bas)
      // - le nom de forme avec nom d'espèce sera affiché en deuxième ligne
      if (shiny.name && isInterestingForme) {
        stringQuery = `${formeQuery}/name`;
      }
      // Sinon :
      // - le nom d'espèce sera affiché en première ligne
      // - le nom de forme sans nom d'espèce sera affiché en deuxième ligne (voir plus bas)
      else {
        stringQuery = `pokemon/${shiny.dexid}`;
      }

      element.setAttribute('data-string', stringQuery);
      element.innerHTML = getString(stringQuery as TranslatedString, lang);

      const sprite = this.shadow.querySelector('[data-type="current-sprite"]')!;
      sprite.setAttribute('dexid', String(shiny.dexid));
    }

    // Forme
    {
      const element = this.shadow.querySelector('[data-type="forme"]')!;
      if (isInterestingForme) {
        element.setAttribute('data-string', formeQuery);
        element.innerHTML = getString(formeQuery as TranslatedString, lang);
      } else {
        element.removeAttribute('data-string');
        element.innerHTML = '';
      }

      const sprite = this.shadow.querySelector('[data-type="current-sprite"]')!;
      sprite.setAttribute('forme', shiny.forme);
      this.setAttribute('data-form', shiny.forme);

      const formIdent = `${shiny.dexid}-${shiny.forme}` as const;
      sprite.setAttribute('data-caught', String(shinyCard.caughtCache.has(formIdent)));
      sprite.setAttribute('data-has-evolved', String(shinyCard.hasEvolvedCache.has(formIdent)));
    }

    // Espèce et forme lors de la capture
    {
      const sprite = this.shadow.querySelector('[data-type="caughtAs-sprite"]')!;
      if (shiny.caughtAsDexid) {
        sprite.setAttribute('dexid', String(shiny.caughtAsDexid));
        sprite.setAttribute('forme', String(shiny.caughtAsForme || ''));
        const formIdent = `${shiny.caughtAsDexid}-${shiny.caughtAsForme || ''}` as const;
        sprite.setAttribute('data-caught', String(shinyCard.caughtCache.has(formIdent)));
        sprite.setAttribute('data-has-evolved', String(shinyCard.hasEvolvedCache.has(formIdent)));
      } else {
        sprite.setAttribute('dexid', '0');
        sprite.removeAttribute('forme');
        sprite.removeAttribute('data-caught');
      }
    }

    // Surnom
    {
      const element = this.shadow.querySelector<HTMLElement>('[data-type="name"]')!;
      element.innerText = shiny.name;

      const speciesElement = this.shadow.querySelector('[data-type="species"]')!;
      if (shiny.name) speciesElement.classList.remove('title-large');
      else            speciesElement.classList.add('title-large');
    }

    // Compteur
    {
      const element = this.shadow.querySelector('[data-type="count"]')!;
      let countString: string = '';

      const getProp = (prop: keyof Shiny['count']) => shiny.count[prop] || 0;

      const parts = [];
      if (getProp('encounters')) parts.push(`${getProp('encounters')} rencontres`);

      if ((shiny.game === 'ultrasun' || shiny.game === 'ultramoon') && shiny.method === 'ultrawormhole') {
        parts.push(`<span data-string="bonus-usum-distance">${getString('bonus-usum-distance', lang)}</span> ${getProp('usum-distance')}, ${getProp('usum-rings')} <span data-string="bonus-usum-rings">${getString('bonus-usum-rings', lang)}</span>`);
      }

      else if (shiny.game === 'letsgopikachu' || shiny.game === 'letsgoeevee') {
        if (getProp('lgpe-nextSpawn')) parts.push(`<span data-string="bonus-lgpe-catchCombo-${getProp('lgpe-catchCombo')}">${getString(`bonus-lgpe-catchCombo-${getProp('lgpe-catchCombo')}` as TranslatedString, lang)}</span>`);
        if (getProp('lgpe-lure')) parts.push(`<span data-string="bonus-lgpe-lure">${getString('bonus-lgpe-lure', lang)}</span>`);
      }

      else if (shiny.game === 'sword' || shiny.game === 'shield') {
        if (getProp('swsh-dexKo')) parts.push(`<span data-string="bonus-swsh-dexKo-alt">${getString('bonus-swsh-dexKo-alt', lang)}</span> ${getProp('swsh-dexKo')}`);
      }

      else if ((shiny.game === 'brilliantdiamond' || shiny.game === 'shiningpearl') && shiny.method === 'grandunderground') {
        if (getProp('bdsp-diglettBonus')) parts.push(`<span data-string="bonus-bdsp-diglettBonus">${getString('bonus-bdsp-diglettBonus', lang)}</span>`);
      }

      else if (shiny.game === 'legendsarceus') {
        const dexResearch = getProp('pla-dexResearch');
        const niv = dexResearch === 2 ? '100%' : dexResearch === 1 ? '10' : '9 ou -';
        parts.push(`<span data-string="bonus-pla-dexResearch-${dexResearch}">${getString(`bonus-pla-dexResearch-${dexResearch}` as TranslatedString, lang)}</span>`);
      }

      else if (shiny.game === 'scarlet' || shiny.game === 'violet') {
        if (shiny.method === 'massoutbreak') {
          const outbreakCleared = getProp('sv-outbreakCleared');
          const num = outbreakCleared === 2 ? 'Plus de 60'
                    : outbreakCleared === 1 ? '30 à 59'
                    : 'Moins de 29';
          parts.push(`<span data-string="bonus-sv-outbreakCleared-${outbreakCleared}">${getString(`bonus-sv-outbreakCleared-${outbreakCleared}` as TranslatedString, lang)}</span> <span data-string="bonus-sv-outbreakCleared-alt">${getString('bonus-sv-outbreakCleared-alt', lang)}</span>`);
        }

        if (getProp('sv-sparklingPower')) {
          const sparklingPower = getProp('sv-sparklingPower');
          parts.push(`<span data-string="bonus-sv-sparklingPower-alt">${getString('bonus-sv-sparklingPower-alt', lang)}</span> ${sparklingPower}`);
        }
      }

      else if (shiny.game === 'za') {
        if (getProp('za-sparklingPower')) {
          const sparklingPower = getProp('za-sparklingPower');
          parts.push(`<span data-string="bonus-za-sparklingPower-alt">${getString('bonus-za-sparklingPower-alt', lang)}</span> ${sparklingPower}`);
        }
      }

      countString = parts.join(', ');

      element.innerHTML = countString || `<span class="empty" data-string="shiny-card-method-details-empty">${getString('shiny-card-method-details-empty', lang)}</span>`;
    }

    // Temps de capture / date
    {
      const time = shiny.catchTime;
      const element = this.shadow.querySelector('[data-type="catchTime"]')!;
      if (time > 825289200000) {
        const date = new Intl.DateTimeFormat(lang, JSON.parse(element.getAttribute('data-format') ?? '{}'))
                             .format(new Date(time));
        element.innerHTML = date;
        element.setAttribute('data-datetime', String(time));
      } else {
        // Si la date est avant la sortie du premier jeu Pokémon au Japon,
        // marquer la date comme inconnue.
        element.innerHTML = `<span data-string="shiny-card-unknown-date">${getString('shiny-card-unknown-date', lang)}</span>`;
      }
    }

    // Jeu
    {
      const game = shiny.game;
      const element = this.shadow.querySelector('[data-type="game"]')!
      element.setAttribute('data-icon', `game/${game}`);
      element.setAttribute('data-label', `game/${game}`);
      element.setAttribute('aria-label', getString(`game/${game}` as TranslatedString, lang));
    }

    // Ball
    {
      const ball = shiny.ball || '';
      const element = this.shadow.querySelector('[data-type="ball"]')!;
      element.setAttribute('data-icon', `ball/${ball}`);
      element.setAttribute('data-label', `${ball}-ball`);
      element.setAttribute('aria-label', getString(`${ball}-ball` as TranslatedString, lang));
      if (ball) element.classList.remove('off');
      else      element.classList.add('off');
    }

    // Notes
    {
      const element = this.shadow.querySelector<HTMLElement>('[data-type="notes"]')!;
      if (shiny.notes) element.innerText = shiny.notes;
      else element.innerHTML = `<span class="empty" data-string="shiny-card-notes-empty">${getString('shiny-card-notes-empty', lang)}</span>`;
    }

    // Checkmark
    {
      const origin = shiny.appliedOriginMark;
      const element = this.shadow.querySelector('[data-type="originMark"]')!;
      element.setAttribute('data-icon', `origin-mark/${origin}`);
      element.setAttribute('data-label', `legit-confirmed`);
      element.setAttribute('aria-label', getString(`legit-confirmed`, lang));
      if (origin) element.classList.remove('off');
      else        element.classList.add('off');
    }

    // Gène (gigamax ou alpha)
    {
      const gene = shiny.gene;
      const element = this.shadow.querySelector('[data-type="gene"]')!;
      element.setAttribute('data-icon', `gene/${gene}`);
      element.setAttribute('data-label', `capture-gene-${gene}`);
      element.setAttribute('aria-label', getString(`capture-gene-${gene}` as TranslatedString, lang));
      if (gene) element.classList.remove('off');
      else      element.classList.add('off');
    }

    // Icône d'échange
    {
      const traded = !shiny.originalTrainer;
      const element = this.shadow.querySelector('[data-type="originalTrainer"]')!;
      element.setAttribute('data-icon', `other/${traded ? 'traded' : ''}`);
      element.setAttribute('data-label', 'capture-originalTrainer');
      element.setAttribute('aria-label', getString('capture-originalTrainer'));
      if (traded) element.classList.remove('off');
      else        element.classList.add('off');
    }

    // Méthode
    {
      const element = this.shadow.querySelector<HTMLElement>('[data-type="method"]')!;
      const method = getString(`method/${shiny.method}` as TranslatedString, lang);
      element.setAttribute('data-string', `method/${shiny.method}`);
      element.innerText = method;
    }

    // Charme chroma et shiny rate
    {
      const srContainer = this.shadow.querySelector('.shiny-rate') as HTMLElement;
      shinyCard.updateShinyRateDisplay(srContainer, shiny);
    }

    // Filters
    const filters = computeShinyFilters(shiny);
    for (const [filter, value] of Object.entries(filters)) {
      this.setAttribute(`data-${filter}`, String(value));
    }
    applyOrders(this, shiny, this.orderMap);

    this.rendering = false;
    this.dispatchEvent(new Event('rendering-complete'));
  }


  static updateShinyRateDisplay(
    srContainer: HTMLElement,
    shiny: Shiny,
  ) {
    try {
      const charm = shiny.charm;
      const shinyRate = shiny.shinyRate ?? 0;
      const methode = shiny.method || '';
      const game = shiny.jeuObj;

      // Icône du charme chroma
      if (charmlessMethods == null) charmlessMethods = Shiny.methodes('charmless').map(m => m.id);
      if (charm && !(charmlessMethods.includes(methode)) && game.hasCharm) {
        srContainer.classList.add('with-charm');
      } else {
        srContainer.classList.remove('with-charm');
      }

      // Affichage du shiny rate
      if (shinyRate > 0 && shiny.mine) {
        srContainer.classList.remove('off');
      } else {
        srContainer.classList.add('off');
      }
      
      const element = srContainer.querySelector('.shiny-rate-text.denominator')!;
      element.innerHTML = String(shinyRate || '???');

      // Couleur du shiny rate
      srContainer.classList.remove('full-odds', 'charm-ods', 'one-odds', 'unknown-odds');

      if (!shinyRate) {
        srContainer.classList.add('unknown-odds');
      } else if (
        (game.gen <= 5 && shinyRate >= 8192 - 1) ||
        (game.gen > 5 && shinyRate >= 4096 - 1)
      ) {
        srContainer.classList.add('full-odds');
      } else if (charm && !(charmlessMethods.includes(methode)) && (
        (game.gen <= 5 && shinyRate >= 2731 - 1) ||
        (game.gen > 5 && shinyRate >= 1365 - 1) ||
        ((game.id === 'pla' || game.id === 'za') && shinyRate >= 1024 - 1)
      )) {
        srContainer.classList.add('charm-odds');
      } else if (shinyRate <= 1) {
        srContainer.classList.add('one-odds');
      }

      // Couleur de la bordure (0 = high shiny denominator / hard, 1 = low shiny denominator / easy)
      const hardestRate = (game.gen <= 5 ? 2731 : 1365);
      const easiestRate = 256;
      const hueCoeff = (hardestRate - Math.min(Math.max(easiestRate, shinyRate), hardestRate)) / (hardestRate - easiestRate);
      srContainer.style.setProperty('--hue-coeff', String(hueCoeff));
    } catch (error) {}
  }


  /**
   * Affiche les notes d'une carte au clic.
   */
  toggleNotes() {
    const currentState = this.getAttribute('open') === 'true';
    const menuButtons = [...this.shadow.querySelectorAll('.menu button')];

    if (!currentState) {
      this.setAttribute('open', 'true');
      menuButtons.forEach(button => {
        button.removeAttribute('disabled');
        button.setAttribute('tabindex', '0');
      });
    } else {
      this.removeAttribute('open');
      menuButtons.forEach(button => {
        button.setAttribute('disabled', '');
        button.setAttribute('tabindex', '-1');
      });
    }
  }


  /**
   * Vérifie si la carte correspond à un filtre.
   */
  fitsFilter(filterid: string): boolean {
    return JSON.parse(this.getAttribute('filtres') || '[]').includes(filterid);
  }


  /**
   * Créer une chasse pour éditer un shiny au long clic sur une carte.
   */
  async makeEdit() {
    try {
      let k = await huntStorage.getItem(this.huntid);
      if (k != null) {
        throw getString('error-already-editing');
      }

      const card = document.createElement('hunt-card');
      card.setAttribute('huntid', this.huntid);

      const hunt = await Hunt.getOrMake(this.huntid);
      if (!(hunt instanceof Hunt)) throw new Error(getString('error-creating-edit'));
      hunt.caught = true;
      if (hunt.caughtAsDexid) hunt.hasEvolved = true;
      await huntStorage.setItem(hunt.huntid, hunt);

      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['chasses-en-cours'],
          ids: [this.huntid],
          sync: false
        }
      }));

      const navLink = document.querySelector('.nav-link[data-nav-section="chasses-en-cours"]');
      if (!(navLink instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
      navLink.click();
    } catch (error) {
      const message = (typeof error === 'string') ? error : getString('error-cant-edit');
      console.error(error);
      if (previousEditNotification) previousEditNotification.remove();
      previousEditNotification = new Notif(message);
      previousEditNotification.prompt();
    }
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


  connectedCallback() {
    translationObserver.serve(this, { method: 'attribute' });

    // Détecte le clic pour "ouvrir" la carte
    const openButton = this.shadow.querySelector('[data-action="open"]');
    if (!(openButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    openButton.addEventListener('click', this.openHandler);
    
    this.addEventListener('click', this.clickHandler = event => openButton.click());

    const editButton = this.shadow.querySelector('[data-action="edit"]');
    if (!(editButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    editButton.addEventListener('click', this.editHandler);

    const restoreButton = this.shadow.querySelector('[data-action="restore"]');
    if (!(restoreButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    restoreButton.addEventListener('click', this.restoreHandler);

    // Peuple le contenu de la carte
    if (this.needsRefresh && this.huntid) {
      this.dataToContent();
      this.needsRefresh = false;
    }
  }


  disconnectedCallback() {
    translationObserver.unserve(this);

    const openButton = this.shadow.querySelector('[data-action="open"]');
    if (!(openButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    openButton.removeEventListener('click', this.openHandler);

    this.removeEventListener('click', this.clickHandler);

    const editButton = this.shadow.querySelector('[data-action="edit"]');
    if (!(editButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    editButton.removeEventListener('click', this.editHandler);

    const restoreButton = this.shadow.querySelector('[data-action="restore"]');
    if (!(restoreButton instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
    restoreButton.removeEventListener('click', this.restoreHandler);
  }


  static get observedAttributes() {
    return ['huntid', 'lang'];
  }


  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'huntid': {
        this.huntid = newValue;
        this.dataToContent();
        this.needsRefresh = false;
        this.style.setProperty('--unique-name', `${this.tagName.toLowerCase()}-${this.huntid}`);
      } break;

      case 'lang':
        translationObserver.translate(this, newValue ?? '');
        break;
    }
  }
}

if (!customElements.get('shiny-card')) customElements.define('shiny-card', shinyCard);