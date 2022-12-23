import { Params, wait } from '../../Params.js';
import { Shiny } from '../../Pokemon.js';
import { huntStorage, pokemonData, shinyStorage } from '../../localForage.js';
import { Notif } from '../../notification.js';
import template from './template.js';
// @ts-expect-error
import methodStrings from '../../../strings/methods.json' assert { type: 'json' };
// @ts-expect-error
import materialIconsSheet from '../../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import pokespriteSheet from '../../../ext/pokesprite.css' assert { type: 'css' };
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
    this.shadow.adoptedStyleSheets = [materialIconsSheet, pokespriteSheet, iconSheet, commonSheet, sheet];
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

    // Espèce
    {
      const dexid = String(shiny.dexid);
      const pokemon = await pokemonData.getItem(dexid);
      const element = this.shadow.querySelector('[data-type="espece"]')!;
      const name = pokemon.name[lang ?? 'fr'];
      element.innerHTML = name;

      const sprite = this.shadow.querySelector('pokemon-sprite')!;
      sprite.setAttribute('dexid', dexid);
    }

    // Forme
    {
      const sprite = this.shadow.querySelector('pokemon-sprite')!;
      sprite.setAttribute('forme', shiny.forme);
    }

    // Surnom
    {
      const element = this.shadow.querySelector('[data-type="surnom"]')!;
      element.innerHTML = shiny.surnom;
    }

    // Compteur
    {
      const compteur = JSON.parse(shiny.compteur || '0');
      const element = this.shadow.querySelector('[data-type="compteur"]')!;
      let compteurString: string;

      if (shiny.methode === 'ultrawormhole') {
        compteurString = `Distance : ${compteur.distance}m, ${compteur.rings} anneaux`;
      }

      else if (shiny.methode === 'catchcombo') {
        compteurString = `Combo Capture : ${compteur.chain}${compteur.lure ? ', avec parfum' : ''}`;
      }

      else if (shiny.jeu === 'legendsarceus') {
        compteurString = `${compteur.count > 0 ? `${compteur.count} rencontres, ` : ''}niv. rech. ${compteur.dexResearch}`;
      }

      else {
        compteurString = compteur.count > 0 ? `${compteur.count} rencontres` : '';
      }

      element.innerHTML = compteurString;
    }

    // Temps de capture / date
    {
      const time = shiny.timeCapture;
      const element = this.shadow.querySelector('[data-type="timeCapture"]')!;
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
      const jeu = shiny.jeu.replace(/[ \']/g, '') || '';
      const element = this.shadow.querySelector('[data-type="jeu"]')!
      element.className = `icones jeu ${jeu}`;
    }

    // Ball
    {
      const ball = shiny.ball || '';
      const element = this.shadow.querySelector('[data-type="ball"]')!;
      const baseClassList = 'pkspr';
      element.className = baseClassList;
      if (shiny.ball) {
        element.classList.add('item', `ball-${ball}`);
      } else {
        element.classList.add('off');
      }
    }

    // Notes
    {
      const notes = shiny.notes || 'Pas de note.';
      const element = this.shadow.querySelector('.pokemon-notes__texte')!;
      element.innerHTML = notes;
    }

    // Checkmark
    {
      const originsList = ['off', 'kalos', 'alola', 'vc', 'letsgo', 'go', 'galar', 'bdsp', 'hisui'];
      const origin = originsList[shiny.originMark] || 'off';
      const element = this.shadow.querySelector('[data-type="checkmark"]')!;
      element.className = `icones explain checkmark ${origin}born`;
    }

    // Gène (gigamax ou alpha)
    {
      const gene = shiny.gene;
      const element = this.shadow.querySelector('[data-type="gene"]')!;
      element.className = 'icones explain';
      if (gene) element.classList.add(gene);
      else      element.classList.add('off');
    }

    // DO
    {
      const mine = shiny.mine;
      const element = this.shadow.querySelector('[data-type="do"]')!;
      if (mine) element.classList.remove('off');
      else      element.classList.add('off');
    }

    // Méthode
    {
      const element = this.shadow.querySelector('[data-type="methode"]')!;
      element.innerHTML = methodStrings[lang][shiny.methode] ?? '';
    }

    // Charme chroma et shiny rate
    {
      const srContainer = this.shadow.querySelector('.shiny-rate')!;
      const charm = shiny.charm;
      const shinyRate = shiny.shinyRate ?? 0;
      const methode = shiny.methode || '';

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
      srContainer.classList.remove('full-odds', 'charm-ods', 'one-odds');
      if (!charm && [8192, 4096].includes(shinyRate)) {
        srContainer.classList.add('full-odds');
      } else if (charm && [2731, 1365].includes(shinyRate)) {
        srContainer.classList.add('charm-odds');
      } else if (shinyRate <= 1) {
        srContainer.classList.add('one-odds');
      }
    }

    // Legit ou hacké ?
    {
      const hacksList = ['off', 'ptethack', 'hack', 'clone'];
      const hack = hacksList[shiny.hacked] || 'off';
      const element = this.shadow.querySelector('[data-type="hacked"]')!;
      element.className = `icones explain hacked ${hack}`;
    }

    // Hors chasse ?
    {
      const element = this.shadow.querySelector('[data-type="horsChasse"]')!;
      if (shiny.horsChasse) element.classList.remove('off');
      else                  element.classList.add('off');
    }
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

      (document.querySelector('.nav-link[data-section="chasses-en-cours"]') as HTMLElement)?.click();
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