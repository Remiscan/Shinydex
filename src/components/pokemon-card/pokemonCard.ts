import { editHunt } from '../../Hunt.js';
import { pokemonData } from '../../localforage.js';
import { Params, wait } from '../../Params.js';
import { frontendShiny, Shiny } from '../../Pokemon.js';



let currentCardId: string | null;
let charmlessMethods: string[];
let longClic = false;

interface CardUpdateEvent extends CustomEvent {
  detail: {
    shiny: frontendShiny;
  }
}

declare global {
  interface HTMLElementEventMap {
    cardupdate: CardUpdateEvent;
  }
}



const template = document.createElement('template');
template.innerHTML = `
<div class="pokemon-sprite">
  <img class="actual-sprite" width="112" height="112" loading="lazy"></img>
</div>
<div class="edit-icon">
  <i class="material-icons">edit</i>
  <svg><circle r="25" cx="25" cy="25"/></svg>
</div>

<div class="pokemon-infos">
  <div class="pokemon-infos__nom">
    <span class="pkspr pokemon-ball"></span>
    <span class="pokemon-surnom"></span>
    <span class="pokemon-espece"></span>
  </div>

  <div class="pokemon-infos__capture">
    <span class="icones jeu"></span>
    <span class="capture-methode"></span>
    <span class="capture-date"></span>
    <span class="methode-compteur">
      <span class="icones explain oeuf"></span>
    </span>
    <span class="icones explain gigamax"></span>
  </div>
</div>

<div class="pokemon-icones">
  <span class="icones explain checkmark"></span>
  <span class="icones explain mine"></span>
  <span class="icones explain lucky"></span>
  <span class="icones explain hacked"></span>
  <span class="spacer"></span>
  <div class="shiny-rate">
    <div class="shiny-charm">
      <span class="icones explain charm"></span>
    </div>
    <div class="shiny-rate-data">
      <span class="shiny-rate-text numerator">1</span>
      <span class="shiny-rate-text separator">/</span>
      <span class="shiny-rate-text denominator">4096</span>
    </div>
  </div>
</div>

<div class="pokemon-notes">
  <span class="pokemon-notes__texte"></span>
</div>
`;

export class pokemonCard extends HTMLElement {
  ready: boolean = false;

  constructor() {
    super();

    // Active le long clic pour éditer
    this.addEventListener('click', () => { if (!longClic) this.toggleNotes(); longClic = false; });
    this.addEventListener('mousedown', async event => { if (event.button != 0) return; this.makeEdit(event); }); // souris
    this.addEventListener('touchstart', async event => { this.makeEdit(event); }, { passive: true }); // toucher
    this.addEventListener('cardupdate', this.updateCard);
  }

  // Met à jour les attributs de la carte à partir d'un objet Shiny
  async updateCard(event: CardUpdateEvent) {
    let shiny: Shiny;
    try {
      shiny = new Shiny(event.detail.shiny);
    } catch (e) {
      console.error('Échec de création du Shiny', e);
      throw e;
    }

    const card = this;
    const mine = shiny.mine;

    card.setAttribute('id', `pokemon-card-${shiny.huntid}`);
    card.setAttribute('huntid', shiny.huntid);
    card.setAttribute('last-update', String(shiny.lastUpdate));
    card.setAttribute('dexid', String(shiny.dexid));
    card.setAttribute('surnom', shiny.surnom);
    card.setAttribute('methode', shiny.methode);
    card.setAttribute('compteur', shiny.compteur);
    card.setAttribute('time-capture', String(shiny.timeCapture));
    card.setAttribute('jeu', shiny.jeu.replace(/[ \']/g, ''));

    if (shiny.ball) card.setAttribute('ball', shiny.ball);
    else            card.removeAttribute('ball');

    card.setAttribute('notes', shiny.notes);

    if (shiny.checkmark) card.setAttribute('checkmark', String(shiny.checkmark));
    else                 card.removeAttribute('checkmark');

    if (mine) card.setAttribute('DO', '1');
    else      card.removeAttribute('DO');

    if (shiny.charm) card.setAttribute('charm', '1');
    else             card.removeAttribute('charm');

    if (mine) {
      const shinyRate = shiny.shinyRate != null ? shiny.shinyRate : 0;
      card.setAttribute('shiny-rate', String(shinyRate));
    } else {
      card.setAttribute('shiny-rate', '0');
    }

    if (shiny.hacked > 0) card.setAttribute('hacked', String(shiny.hacked));
    else                  card.removeAttribute('hacked');

    if (shiny.horsChasse) card.setAttribute('horsChasse', '1');
    else                  card.removeAttribute('horsChasse');

    card.setAttribute('sprite', await shiny.getSprite({ shiny: true, size: 112, format: Params.preferredImageFormat }));
  }

  // Met à jour le contenu de la carte à partir de ses attributs
  async updateContents(toUpdate = pokemonCard.observedAttributes) {
    if (!this.ready) return;

    for (const attr of toUpdate) {
      switch (attr) {

        // Espèce
        case 'dexid': {
          const dexid = this.getAttribute('dexid') || '';
          const pokemon = await pokemonData.getItem(dexid);
          const element = this.querySelector('.pokemon-espece')!;
          element.innerHTML = pokemon.namefr;

          const surnom = this.getAttribute('surnom') || '';
          if (surnom === '' || surnom === pokemon.namefr) {
            this.querySelector('.pokemon-infos__nom')!.classList.add('no-surnom');
          } else {
            this.querySelector('.pokemon-infos__nom')!.classList.remove('no-surnom');
          }
        } break;

        // Surnom
        case 'surnom': {
          const element = this.querySelector('.pokemon-surnom')!;
          element.innerHTML = this.getAttribute('surnom') || '';
        } break;

        // Compteur
        case 'compteur': {
          const compteur = JSON.parse(this.getAttribute('compteur') || '0');
          const element = this.querySelector('.methode-compteur')!;
          element.innerHTML = '<span class="icones explain oeuf"></span>';
          if (this.getAttribute('methode') === 'Masuda' && typeof compteur === 'number' && compteur > 0) {
            element.innerHTML += compteur;
            element.classList.remove('off');
          }
          else element.classList.add('off');
        } break;

        // Temps de capture / date
        case 'time-capture': {
          const time = Number(this.getAttribute('time-capture'));
          if (time > 0) {
            const date = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})
                                .format(new Date(time));
            const element = this.querySelector('.capture-date')!;
            element.innerHTML = date;
            this.querySelector('.pokemon-infos__capture')!.classList.remove('no-date');
          } else {
            this.querySelector('.pokemon-infos__capture')!.classList.add('no-date');
          }
        } break;

        // Jeu
        case 'jeu': {
          const element = this.querySelector('.icones.jeu')!
          element.className = `icones jeu ${this.getAttribute('jeu') || ''}`;
        } break;

        // Ball
        case 'ball': {
          const element = this.querySelector('.pokemon-ball')!;
          const baseClassList = 'pkspr pokemon-ball';
          element.className = baseClassList;
          if (this.getAttribute('ball') != null) {
            element.classList.add(this.getAttribute('ball') || '');
            element.classList.add('item', 'ball-' + this.getAttribute('ball'));
          } else {
            element.classList.add('off');
          }
        } break;

        // Notes
        case 'notes': {
          const element = this.querySelector('.pokemon-notes__texte')!;
          const notes = this.getAttribute('notes') || '';
          element.innerHTML = notes;

          const gigamaxElement = this.querySelector('.gigamax')!;
          if (notes.includes('Gigamax')) {
            gigamaxElement.classList.remove('off');
          } else {
            gigamaxElement.classList.add('off');
          }
        } break;

        // Checkmark
        case 'checkmark': {
          const checkmark = this.getAttribute('checkmark');
          const element = this.querySelector('.icones.checkmark')!;
          element.className = 'icones explain checkmark';
          let origin: string;
          switch (Number(checkmark)) {
            case 1: origin = 'kalos'; break;
            case 2: origin = 'alola'; break;
            case 3: origin = 'vc'; break;
            case 4: origin = 'letsgo'; break;
            case 5: origin = 'go'; break;
            case 6: origin = 'galar'; break;
            default: origin = 'off';
          }
          element.classList.add(`${origin}born`);
        } break;

        // DO
        case 'DO': {
          const element = this.querySelector('.icones.mine')!;
          if (this.getAttribute('DO') === '1') {
            element.classList.remove('off');
          } else {
            element.classList.add('off');
          }
        } // NO BREAK

        // Méthode
        case 'methode': {
          const element = this.querySelector('.capture-methode')!;
          element.innerHTML = this.getAttribute('methode') || '';
        } // NO BREAK

        // Charme chroma et shiny rate
        case 'charm':
        case 'shiny-rate': {
          const srContainer = this.querySelector('.shiny-rate')!;
          const charm = Boolean(this.getAttribute('charm'));
          const shinyRate = Number(this.getAttribute('shiny-rate'));
          const methode = this.getAttribute('methode') || '';

          // Icône du charme chroma
          if (charmlessMethods == null) charmlessMethods = Shiny.methodes('charmless').map(m => m.nom);
          if (charm && !(charmlessMethods.includes(methode))) {
            srContainer.classList.add('with-charm');
          } else {
            srContainer.classList.remove('with-charm');
          }

          // Affichage du shiny rate
          if (shinyRate > 0 && this.getAttribute('DO') === '1') {
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
        } break;

        // Legit ou hacké ?
        case 'hacked': {
          const hacked = Number(this.getAttribute('hacked'));
          const element = this.querySelector('.icones.hacked')!;
          element.className = 'icones explain hacked';
          let origin: string;
          switch (hacked) {
            case 1: origin = 'ptethack'; break;
            case 2: origin = 'hack'; break;
            case 3: origin = 'clone'; break;
            default: origin = 'off';
          }
          element.classList.add(origin);
        } break;

        // Hors chasse ?
        case 'hors-chasse': {
          const element = this.querySelector('.icones.lucky')!;
          if (this.getAttribute('hors-chasse') === '1') {
            element.classList.remove('off');
          } else {
            element.classList.add('off');
          }
        } break;

        // Sprite
        case 'sprite': {
          const sprite = this.getAttribute('sprite') || '';
          const img = this.querySelector('.actual-sprite')! as HTMLImageElement;
          img.src = sprite;
        } break;
      }
    }
  }

  // Affiche les notes d'une carte au clic
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

  // Vérifie si la carte correspond à un filtre
  fitsFilter(filterid: string): boolean {
    return JSON.parse(this.getAttribute('filtres') || '[]').includes(filterid);
  }

  // Créer une chasse pour éditer un shiny au long clic sur une carte
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

  static get observedAttributes() {
    return ['dexid', 'surnom', 'methode', 'compteur', 'time-capture', 'jeu', 'ball', 'notes', 'checkmark', 'DO', 'charm', 'shiny-rate', 'hacked', 'hors-chasse', 'sprite'];
  }

  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));
    this.ready = true;
    this.updateContents();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue == newValue) return;
    this.updateContents([name]);
  }
}
if (!customElements.get('pokemon-card')) customElements.define("pokemon-card", pokemonCard);