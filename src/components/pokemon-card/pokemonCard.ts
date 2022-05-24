import { editHunt } from '../../Hunt.js';
import { pokemonData, shinyStorage } from '../../localforage.js';
import { Params, wait } from '../../Params.js';
import { Shiny } from '../../Pokemon.js';
import template from './template.js';



let currentCardId: string | null;
let charmlessMethods: string[];
let longClic = false;



export class pokemonCard extends HTMLElement {
  huntid: string = '';
  ready: boolean = false;
  clickHandler: (e: Event) => any = () => {};
  mousedownHandler: (e: MouseEvent) => any = () => {};
  touchstartHandler: (e: TouchEvent) => any = () => {};


  constructor() {
    super();
  }


  /**
   * Met à jour le contenu de la carte à partir des données sauvegardées.
   */
  async dataToContent() {
    if (!this.ready) return;

    let shiny: Shiny;
    try {
      shiny = new Shiny(await shinyStorage.getItem(this.huntid));
    } catch (e) {
      console.error('Échec de création du Shiny', e);
      throw e;
    }

    if (shiny.deleted) return this.remove();

    this.setAttribute('id', `pokemon-card-${shiny.huntid}`);
    this.setAttribute('last-update', String(shiny.lastUpdate));

    // Espèce
    {
      const dexid = String(shiny.dexid);
      const pokemon = await pokemonData.getItem(dexid);
      const element = this.querySelector('.pokemon-espece')!;
      element.innerHTML = pokemon.namefr;

      const surnom = this.getAttribute('surnom') || '';
      if (surnom === '' || surnom === pokemon.namefr) {
        this.querySelector('.pokemon-infos__nom')!.classList.add('no-surnom');
      } else {
        this.querySelector('.pokemon-infos__nom')!.classList.remove('no-surnom');
      }

      const sprite = this.querySelector('pokemon-sprite')!;
      sprite.setAttribute('dexid', dexid);
    }

    // Forme
    {
      const sprite = this.querySelector('pokemon-sprite')!;
      sprite.setAttribute('forme', shiny.forme);
    }

    // Surnom
    {
      const element = this.querySelector('.pokemon-surnom')!;
      element.innerHTML = shiny.surnom;
    }

    // Compteur
    {
      const compteur = JSON.parse(shiny.compteur || '0');
      const element = this.querySelector('.methode-compteur')!;
      element.innerHTML = '<span class="icones explain oeuf"></span>';
      if (this.getAttribute('methode') === 'Masuda' && typeof compteur === 'number' && compteur > 0) {
        element.innerHTML += compteur;
        element.classList.remove('off');
      }
      else element.classList.add('off');
    }

    // Temps de capture / date
    {
      const time = shiny.timeCapture;
      if (time > 0) {
        const date = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})
                            .format(new Date(time));
        const element = this.querySelector('.capture-date')!;
        element.innerHTML = date;
        this.querySelector('.pokemon-infos__capture')!.classList.remove('no-date');
      } else {
        this.querySelector('.pokemon-infos__capture')!.classList.add('no-date');
      }
    }

    // Jeu
    {
      const jeu = shiny.jeu.replace(/[ \']/g, '') || '';
      const element = this.querySelector('.icones.jeu')!
      element.className = `icones jeu ${jeu}`;
    }

    // Ball
    {
      const ball = shiny.ball || '';
      const element = this.querySelector('.pokemon-ball')!;
      const baseClassList = 'pkspr pokemon-ball';
      element.className = baseClassList;
      if (shiny.ball) {
        element.classList.add(ball);
        element.classList.add('item', `ball-${ball}`);
      } else {
        element.classList.add('off');
      }
    }

    // Notes
    {
      const element = this.querySelector('.pokemon-notes__texte')!;
      const notes = shiny.notes || 'Pas de note.';
      element.innerHTML = notes;
    }

    // Checkmark
    {
      const element = this.querySelector('.icones.checkmark')!;
      element.className = 'icones explain checkmark';

      const originsList = ['off', 'kalos', 'alola', 'vc', 'letsgo', 'go', 'galar', 'bdsp', 'hisui'];
      const origin = originsList[shiny.checkmark] || 'off';

      element.classList.add(`${origin}born`);
    }

    // Gène (gigamax ou alpha)
    {
      // à faire
    }

    // DO
    {
      const mine = shiny.mine;
      const element = this.querySelector('.icones.mine')!;
      if (mine) {
        element.classList.remove('off');
      } else {
        element.classList.add('off');
      }
    }

    // Méthode
    {
      const element = this.querySelector('.capture-methode')!;
      element.innerHTML = shiny.methode || '';
    }

    // Charme chroma et shiny rate
    {
      const srContainer = this.querySelector('.shiny-rate')!;
      const charm = shiny.charm;
      const shinyRate = shiny.shinyRate ?? 0;
      const methode = shiny.methode || '';

      // Icône du charme chroma
      if (charmlessMethods == null) charmlessMethods = Shiny.methodes('charmless').map(m => m.nom);
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
      
      const element = this.querySelector('.shiny-rate-text.denominator')!;
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
      const element = this.querySelector('.icones.hacked')!;
      element.className = 'icones explain hacked';

      const hacksList = ['off', 'ptethack', 'hack', 'clone'];
      const hack = hacksList[shiny.hacked] || 'off';

      element.classList.add(hack);
    }

    // Hors chasse ?
    {
      const element = this.querySelector('.icones.lucky')!;
      if (shiny.horsChasse) {
        element.classList.remove('off');
      } else {
        element.classList.add('off');
      }
    }
  }


  /**
   * Affiche les notes d'une carte au clic.
   */
  toggleNotes() {
    const huntid = this.getAttribute('huntid');

    // On ferme la carte déjà ouverte
    if (currentCardId != null)
      document.getElementById(`pokemon-card-${currentCardId}`)!.removeAttribute('open');

    // Si la carte demandée n'est pas celle qu'on vient de fermer, on l'ouvre
    if (huntid != currentCardId)
    {
      this.setAttribute('open', 'true');
      currentCardId = huntid;
    }
    else
      currentCardId = null;
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
    const card = this;

    const editIcon = card.querySelector('.edit-icon')!;
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

    const clear = () => {
      act = false;
      appear.cancel(); anim.cancel();
      setTimeout(() => { longClic = false; }, 50)
    };

    if (event.type == 'touchstart') {
      card.addEventListener('touchmove', clear, { passive: true });
      card.addEventListener('touchend', clear);
      card.addEventListener('touchcancel', clear);
    } else {
      card.addEventListener('mouseup', clear);
      card.addEventListener('mouseout', clear);
    }
    await wait(500);

    if (!act) return;
    longClic = true;

    appear.play();
    await new Promise(resolve => appear.addEventListener('finish', resolve));
    anim.play();
    await new Promise(resolve => anim.addEventListener('finish', resolve));

    if (!act) return;
    let ready = await editHunt(this.getAttribute('huntid') || '');
    ready = (ready != false);
    appear.cancel(); anim.cancel();
    if (ready) longClic = false;
  }


  connectedCallback() {
    // Crée le HTML de la carte
    this.appendChild(template.content.cloneNode(true));
    this.ready = true;

    // Détecte le long clic pour éditer
    this.addEventListener('click', this.clickHandler = () => {
      if (!longClic) this.toggleNotes();
      longClic = false;
    });
    this.addEventListener('mousedown', this.mousedownHandler = async (event) => {
      if (event.button != 0) return;
      this.makeEdit(event);
    });
    this.addEventListener('touchstart', this.touchstartHandler = async event => {
      this.makeEdit(event);
    }, { passive: true });

    // Peuple le contenu de la carte
    this.dataToContent();
  }


  disconnectedCallback() {
    this.ready = false;
    this.removeEventListener('click', this.clickHandler);
    this.removeEventListener('mousedown', this.mousedownHandler);
    this.removeEventListener('touchstart', this.touchstartHandler);
  }


  static get observedAttributes() {
    return ['huntid'];
  }


  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'huntid': {
        this.huntid = newValue;
        if (!this.ready) return;
        this.dataToContent();
      } break
    }
  }
}

if (!customElements.get('pokemon-card')) customElements.define('pokemon-card', pokemonCard);