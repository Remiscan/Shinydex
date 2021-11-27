import { Methode, Shiny } from './Pokemon.js';
import { editHunt } from './Hunt.js';
import { Params, wait } from './Params.js';



let currentCardId: string | null;
let charmlessMethods: string[];
let longClic = false;

const template = document.createElement('template');
template.innerHTML = `
<div class="pokemon-sprite"><div class="actual-sprite"></div></div>
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
  }

  updateCard(toUpdate = pokemonCard.observedAttributes) {
    const card = this;
    if (!this.ready) return;

    ordreSprite: {
      if (!toUpdate.includes('ordre-sprite')) break ordreSprite;
      (card.querySelector('.pokemon-sprite') as HTMLElement).style.setProperty('--ordre-sprite', this.getAttribute('ordre-sprite'));
    }

    notes: {
      if (!toUpdate.includes('notes')) break notes;
      card.querySelector('.pokemon-notes__texte')!.innerHTML = this.getAttribute('notes') || '';

      if (!this.getAttribute('notes')!.includes('Gigamax'))
        card.querySelector('.gigamax')!.classList.add('off');
      else
        card.querySelector('.gigamax')!.classList.remove('off');
    }

    surnom: {
      if (!toUpdate.includes('surnom')) break surnom;
      card.querySelector('.pokemon-surnom')!.innerHTML = this.getAttribute('surnom') || '';
    }

    espece: {
      if (!toUpdate.includes('espece') && !toUpdate.includes('surnom')) break espece;
      card.querySelector('.pokemon-espece')!.innerHTML = this.getAttribute('espece') || '';
      const surnom = this.getAttribute('surnom') || '';
      if (surnom == '' || surnom.toLowerCase() == this.getAttribute('espece'))
        card.querySelector('.pokemon-infos__nom')!.classList.add('no-surnom');
      else
        card.querySelector('.pokemon-infos__nom')!.classList.remove('no-surnom');
    }

    jeu: {
      if (!toUpdate.includes('jeu')) break jeu;
      card.querySelector('.icones.jeu')!.className = 'icones jeu';
      card.querySelector('.icones.jeu')!.classList.add(this.getAttribute('jeu') || '');
    }

    ball: {
      if (!toUpdate.includes('ball')) break ball;
      const element = card.querySelector('.pokemon-ball')!;
      const baseClassList = 'pkspr pokemon-ball';
      element.className = baseClassList;
      if (this.getAttribute('ball') != null) element.classList.add(this.getAttribute('ball') || '');
      else element.classList.add('off');
      element.classList.add('item', 'ball-' + this.getAttribute('ball'));
    }

    monjeu: {
      if (!toUpdate.includes('monjeu')) break monjeu;
      if (this.getAttribute('monjeu') == null)
        card.querySelector('.icones.mine')!.classList.add('off');
      else
        card.querySelector('.icones.mine')!.classList.remove('off');
    }

    methode: {
      if (!toUpdate.includes('methode')) break methode;
      card.querySelector('.capture-methode')!.innerHTML = this.getAttribute('methode') || '';
    }

    compteur: {
      if (!toUpdate.includes('methode') && !toUpdate.includes('compteur')) break compteur;
      const compteur = Number(this.getAttribute('compteur'));
      const element = card.querySelector('.methode-compteur')!;
      element.innerHTML = '<span class="icones explain oeuf"></span>';
      if (this.getAttribute('methode') == 'Masuda' && compteur > 0) {
        element.innerHTML += compteur;
        element.classList.remove('off');
      }
      else
        element.classList.add('off');
    }

    shinyRate: {
      if (!toUpdate.includes('shiny-rate')) break shinyRate;
      const shinyRateBox = card.querySelector('.shiny-rate') as HTMLElement;
      const shinyRate = Number(this.getAttribute('shiny-rate'));
      const charm = Boolean(this.getAttribute('charm')) || null;

      if (charmlessMethods == null) charmlessMethods = Shiny.methodes('charmless').map(m => m.nom);
      if (charm === true && !charmlessMethods.includes(this.getAttribute('methode') || ''))
        shinyRateBox.classList.add('with-charm');

      if (shinyRate == null)
        shinyRateBox.classList.add('off');
      else
        shinyRateBox.classList.remove('off');

      card.querySelector('.shiny-rate-text.denominator')!.innerHTML = String(shinyRate) || '???';

      shinyRateBox.classList.remove('full-odds', 'charm-ods', 'one-odds');
      if (charm == null && [8192, 4096].includes(shinyRate))
        shinyRateBox.classList.add('full-odds');
      else if (charm == true && [2731, 1365].includes(shinyRate))
        shinyRateBox.classList.add('charm-odds');
      else if (shinyRate == 1 || shinyRate == 0)
        shinyRateBox.classList.add('one-odds');

      const shinyRateCoeff = 1 - Math.min(1, Math.max(0, shinyRate / 1360));
      shinyRateBox.style.setProperty('--coeff', String(shinyRateCoeff));

      if (!this.getAttribute('monjeu')) shinyRateBox.classList.add('off');
      else shinyRateBox.classList.remove('off');
    }

    random: {
      if (!toUpdate.includes('random')) break random;
      if (this.getAttribute('random') == null)
        card.querySelector('.icones.lucky')!.remove();
    }

    checkmark: {
      if (!toUpdate.includes('checkmark')) break checkmark;
      const checkmark = this.getAttribute('checkmark');
      const element = card.querySelector('.icones.checkmark')!;
      element.className = 'icones explain checkmark';
      let origin: string;
      switch (Number(checkmark)) {
        case 1:
          origin = 'kalos'; break;
        case 2:
          origin = 'alola'; break;
        case 3:
          origin = 'vc'; break;
        case 4:
          origin = 'letsgo'; break;
        case 5:
          origin = 'go'; break;
        case 6:
          origin = 'galar'; break;
        default:
          origin = 'off';
      }
      element.classList.add(`${origin}born`);
    }

    hacked: {
      if (!toUpdate.includes('hacked')) break hacked;
      const hacked = Number(this.getAttribute('hacked'));
      const element = card.querySelector('.icones.hacked')!;
      element.className = 'icones explain hacked';
      let origin: string;
      switch (hacked) {
        case 1:
          origin = 'ptethack'; break;
        case 2:
          origin = 'hack'; break;
        case 3:
          origin = 'clone'; break;
        default:
          origin = 'off';
      }
      element.classList.add(origin);
    }

    date: {
      if (!toUpdate.includes('date')) break date;
      const date = this.getAttribute('date');
      if (date != '1000-01-01') {
        card.querySelector('.pokemon-infos__capture')!.classList.remove('no-date');
        card.querySelector('.capture-date')!.innerHTML = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})
                                                                 .format(new Date(this.getAttribute('time-capture') || ''));
      }
      else
        card.querySelector('.pokemon-infos__capture')!.classList.add('no-date');
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
    let ready = await editHunt(parseInt(this.getAttribute('huntid') || ''));
    ready = (ready != false);
    appear.cancel(); anim.cancel();
    if (ready) longClic = false;
  }

  static get observedAttributes() {
    return ['ordre-sprite', 'notes', 'surnom', 'espece', 'jeu', 'ball', 'methode', 'compteur', 'charm', 'shiny-rate', 'random', 'monjeu', 'checkmark', 'hacked', 'date'];
  }

  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));
    this.ready = true;
    this.updateCard();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue == newValue) return;
    this.updateCard([name]);
  }
}
customElements.define("pokemon-card", pokemonCard);