import { Params, noAccent, wait } from '../../Params.js';
import { Pokemon, Shiny } from '../../Pokemon.js';
import { huntStorage, pokemonData, shinyStorage } from '../../localForage.js';
import { Notif } from '../../notification.js';
import template from './template.js';
// @ts-expect-error
import methodStrings from '../../../strings/methods.json' assert { type: 'json' };
// @ts-expect-error
import materialIconsSheet from '../../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import iconSheet from '../../../images/iconsheet.css' assert { type: 'css' };
// @ts-expect-error
import commonSheet from '../../../styles/common.css' assert { type: 'css' };
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };



let currentCardId: string | null;
let charmlessMethods: string[];
let longClic = false;



export class pokemonCard extends HTMLElement {
  shadow: ShadowRoot;
  huntid: string = '';
  clickHandler: (e: Event) => any = () => {};
  pointerdownHandler: (e: MouseEvent) => any = () => {};


  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [materialIconsSheet, iconSheet, commonSheet, sheet];
  }


  /**
   * Met à jour le contenu de la carte à partir des données sauvegardées.
   */
  async dataToContent() {
    let shiny: Shiny;
    try {
      shiny = new Shiny(await shinyStorage.getItem(this.huntid));
    } catch (e) {
      console.error('Échec de création du Shiny', e);
      throw e;
    }

    if (shiny.deleted) return this.remove();

    this.setAttribute('last-update', String(shiny.lastUpdate));

    const lang = document.documentElement.getAttribute('lang');
    const pokemon = await pokemonData.getItem(String(shiny.dexid));

    // Espèce
    {
      const element = this.shadow.querySelector('[data-type="species"]')!;
      const name = pokemon.name[lang ?? 'fr'];
      element.innerHTML = name;

      const sprite = this.shadow.querySelector('pokemon-sprite')!;
      sprite.setAttribute('dexid', String(shiny.dexid));
    }

    // Forme
    {
      const sprite = this.shadow.querySelector('pokemon-sprite')!;
      sprite.setAttribute('forme', shiny.forme);
    }

    // Surnom
    {
      const element = this.shadow.querySelector('[data-type="name"]')!;
      element.innerHTML = shiny.name;
    }

    // Compteur
    {
      const element = this.shadow.querySelector('[data-type="count"]')!;
      let countString: string = '';

      const getProp = (prop: keyof Shiny['count']) => shiny.count[prop] || 0;

      const parts = [];
      if (getProp('encounters')) parts.push(`${getProp('encounters')} rencontres`);

      if ((shiny.game === 'ultrasun' || shiny.game === 'ultramoon') && shiny.method === 'ultrawormhole') {
        parts.push(`Distance ${getProp('usum-distance')}m, ${getProp('usum-rings')} anneaux`);
      }

      else if (shiny.game === 'letsgopikachu' || shiny.game === 'letsgoeevee') {
        if (getProp('lgpe-nextSpawn')) parts.push(`Combo Capture ${getProp('lgpe-catchCombo')}`);
        if (getProp('lgpe-lure')) parts.push('Parfum utilisé');
      }

      else if (shiny.game === 'sword' || shiny.game === 'shield') {
        if (getProp('swsh-dexKo')) parts.push(`Compteur de KO ${getProp('swsh-dexKo')}`);
      }

      else if (shiny.game === 'legendsarceus') {
        if (getProp('pla-dexResearch')) {
          const dexResearch = getProp('pla-dexResearch');
          const niv = dexResearch === 2 ? '100%' : dexResearch === 1 ? '10' : '9 ou -';
          parts.push(`niv. rech. ${niv}`);
        };
      }

      else if (shiny.game === 'scarlet' || shiny.game === 'violet') {
        if (getProp('sv-outbreakCleared')) {
          const outbreakCleared = getProp('sv-outbreakCleared');
          const num = outbreakCleared === 2 ? '60+'
                    : outbreakCleared === 1 ? '30 à 59'
                    : '29-';
          parts.push(`${num} KO`);
        }

        if (getProp('sv-sparklingPower')) {
          const sparklingPower = getProp('sv-sparklingPower');
          parts.push(`Rencontre brillance niv ${sparklingPower}`);
        }
      }

      countString = parts.join(', ');

      element.innerHTML = countString;
    }

    // Temps de capture / date
    {
      const time = shiny.catchTime;
      const element = this.shadow.querySelector('[data-type="catchTime"]')!;
      if (time > 0) {
        const date = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})
                            .format(new Date(time));
        element.innerHTML = date;
      } else {
        element.innerHTML = '';
      }
    }

    // Jeu
    {
      const game = shiny.game;
      const element = this.shadow.querySelector('[data-type="game"]')!
      element.setAttribute('data-icon', `game/${game}`);
    }

    // Ball
    {
      const ball = shiny.ball || '';
      const element = this.shadow.querySelector('[data-type="ball"]')!;
      element.setAttribute('data-icon', `ball/${ball}`);
      if (shiny.mine && ball) element.classList.remove('off');
      else                    element.classList.add('off');
    }

    // Notes
    {
      const notes = shiny.notes || '<span class="empty">Pas de note.</span>';
      const element = this.shadow.querySelector('.pokemon-notes__texte')!;
      element.innerHTML = notes;
    }

    // Checkmark
    {
      const origin = shiny.appliedOriginMark;
      const element = this.shadow.querySelector('[data-type="originMark"]')!;
      element.setAttribute('data-icon', `origin-mark/${origin}`);
      if (origin) element.classList.remove('off');
      else        element.classList.add('off');
    }

    // Gène (gigamax ou alpha)
    {
      const gene = shiny.gene;
      const element = this.shadow.querySelector('[data-type="gene"]')!;
      element.setAttribute('data-icon', `gene/${gene}`);
      if (gene) element.classList.remove('off');
      else      element.classList.add('off');
    }

    // Méthode
    {
      const element = this.shadow.querySelector('[data-type="method"]')!;
      element.innerHTML = methodStrings[lang][shiny.method] ?? '';
    }

    // Charme chroma et shiny rate
    {
      const srContainer = this.shadow.querySelector('.shiny-rate')!;
      const charm = shiny.charm;
      const shinyRate = shiny.shinyRate ?? 0;
      const methode = shiny.method || '';

      // Icône du charme chroma
      if (charmlessMethods == null) charmlessMethods = Shiny.methodes('charmless').map(m => m.id);
      if (charm && !(charmlessMethods.includes(methode))) {
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
      
      const element = this.shadow.querySelector('.shiny-rate-text.denominator')!;
      element.innerHTML = String(shinyRate || '???');

      // Couleur du shiny rate
      const game = shiny.jeuObj;
      srContainer.classList.remove('full-odds', 'charm-ods', 'one-odds');
      if (
        (game.gen <= 5 && shinyRate >= 8192 - 1) ||
        (game.gen > 5 && shinyRate >= 4096 - 1)
      ) {
        srContainer.classList.add('full-odds');
      } else if (
        (game.gen <= 5 && shinyRate >= 2731 - 1) ||
        (game.gen > 5 && shinyRate >= 1365 - 1)
      ) {
        srContainer.classList.add('charm-odds');
      } else if (shinyRate <= 1) {
        srContainer.classList.add('one-odds');
      }
    }

    // Filters
    this.setAttribute('data-mine', String(shiny.mine));
    this.setAttribute('data-legit', String(shiny.hacked === 0));
    this.setAttribute('data-species', noAccent(String(pokemon.name)).toLowerCase());
    this.setAttribute('data-name', noAccent(shiny.name).toLowerCase());
    this.setAttribute('data-game', shiny.game);

    // Order
    this.style.setProperty('--catchTime-order', String(shiny.catchTime));
    this.style.setProperty('--shinyRate-order', String(shiny.shinyRate || 0));
    this.style.setProperty('--dexid-order', String(shiny.dexid));
    // --species-order - Species (alphabetical) can't be done just with CSS
    // --name-order - Name (alphabetical) can't be done just with CSS
    this.style.setProperty('--game-order', String(Pokemon.jeux.findIndex(jeu => jeu.uid === shiny.game)));
    this.style.setProperty('--lastUpdate-order', String(shiny.lastUpdate));
  }


  /**
   * Affiche les notes d'une carte au clic.
   */
  toggleNotes() {
    const huntid = this.getAttribute('huntid');

    // On ferme la carte déjà ouverte
    if (currentCardId != null)
      document.querySelector(`pokemon-card[huntid="${currentCardId}"]`)!.removeAttribute('open');

    // Si la carte demandée n'est pas celle qu'on vient de fermer, on l'ouvre
    if (huntid != currentCardId) {
      this.setAttribute('open', 'true');
      currentCardId = huntid;
    } else {
      currentCardId = null;
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
  async makeEdit(event: Event) {
    let act = true;

    const editIcon = this.shadow.querySelector('.edit-icon')!;
    let appear = editIcon.animate([
      { opacity: '0' },
      { opacity: '1' }
    ], {
      easing: Params.easingStandard,
      duration: 150,
      fill: 'forwards'
    });
    appear.pause();
    const circle = editIcon.querySelector('.edit-icon circle')!;
    let anim = circle.animate([
      { strokeDashoffset: '157' },
      { strokeDashoffset: '0' }
    ], {
      easing: 'linear',
      duration: 1000
    });
    anim.pause();

    const cancelEvents = ['pointerleave', 'pointerout', 'pointercancel', 'pointerup'];

    const clear = () => {
      act = false;
      appear.cancel(); anim.cancel();
      setTimeout(() => { longClic = false; }, 50);

      for (const eventType of cancelEvents) {
        this.removeEventListener(eventType, clear);
      }
    };

    for (const eventType of cancelEvents) {
      this.addEventListener(eventType, clear);
    }

    await wait(500);

    if (!act) return;
    longClic = true;

    appear.play();
    await wait(appear);
    anim.play();
    await wait(anim);

    if (!act) return;

    try {
      let k = await huntStorage.getItem(this.huntid);
      if (k != null) {
        throw `Ce Pokémon est déjà en cours de modification.`;
      }

      const card = document.createElement('hunt-card');
      card.setAttribute('huntid', this.huntid);

      const navLink = document.querySelector('.nav-link[data-section="chasses-en-cours"]');
      if (!(navLink instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
      navLink.click();
    } catch (error) {
      const message = (typeof error === 'string') ? error : `Erreur : impossible de modifier ce Pokémon.`;
      console.error(error);
      new Notif(message).prompt();
    }

    appear.cancel();
    anim.cancel();
    longClic = false;
  }


  connectedCallback() {
    // Détecte le long clic pour éditer
    this.addEventListener('click', this.clickHandler = () => {
      if (!longClic) this.toggleNotes();
      longClic = false;
    });
    this.addEventListener('pointerdown', this.pointerdownHandler = async (event) => {
      this.makeEdit(event);
    });

    // Peuple le contenu de la carte
    this.dataToContent();
  }


  disconnectedCallback() {
    this.removeEventListener('click', this.clickHandler);
    this.removeEventListener('pointerdown', this.pointerdownHandler);
  }


  static get observedAttributes() {
    return ['huntid'];
  }


  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'huntid': {
        this.huntid = newValue;
        this.dataToContent();
      } break
    }
  }
}

if (!customElements.get('pokemon-card')) customElements.define('pokemon-card', pokemonCard);