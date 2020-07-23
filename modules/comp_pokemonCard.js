import { Shiny } from './mod_Pokemon.js';
import { editHunt } from './mod_Hunt.js';
import { Params, wait } from './mod_Params.js';

let currentCard;
let charmlessMethods;
let longClic = false;

const template = document.createElement('template');
template.innerHTML = `
<style>
  @import url('./images/iconsheet.css');
  @import url('./ext/pokesprite.css');

  :host {
    width: 100%;
    max-width: 500px;
    height: 120px;
    min-height: 120px;
    overflow: hidden;
    border-radius: 10px;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14);
    margin: 0 auto 6px;
    background-color: var(--card-bg-color);
    display: grid;
    grid-template-columns: 120px 1fr auto;
    grid-template-rows: 1fr;
    position: relative;
    order: var(--order, 0);
  }

  .pokemon-sprite,
  .edit-icon {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    width: 100%;
    height: 100%;
    background-color: var(--card-sprite-bg-color);
    display: grid;
    place-items: center;
    border-radius: 0 10px 10px 0;
  }

  .edit-icon {
    display: grid;
    background-color: var(--card-edit-bg-color);
    position: relative;
    opacity: 0;
  }

  .edit-icon>.material-icons {
    display: grid;
    width: 50px;
    height: 50px;
    place-items: center;
    background-color: var(--card-sprite-bg-color);
    border-radius: 50%;
  }

  .edit-icon svg {
    width: 50px;
    height: 50px;
    position: absolute;
    overflow: visible;
  }

  .edit-icon circle {
    --diametre: 50;
    fill: transparent;
    stroke: var(--progress-bar-color);
    stroke-width: 2;
    --perimetre: calc(3.14 * var(--diametre));
    stroke-dasharray: var(--perimetre);
    stroke-dashoffset: var(--perimetre);
    transform: rotate(-90deg);
    transform-origin: center;
  }

  .pokemon-sprite>.actual-sprite {
    display: block;
    --size: 112px;
    width: var(--size);
    height: var(--size);
    margin: auto;
    background-image: var(--link-sprites);
    --image-position: calc(-1 * var(--ordre-sprite) * 112px);
    background-position: 0 var(--image-position, 112px);
    background-repeat: no-repeat;
    background-size: 112px;
  }

  .pokemon-infos {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
    display: grid;
    grid-template-rows: 15px auto 1fr auto 15px;
  }

  .pokemon-infos__nom {
    grid-row: 2 / 3;
    display: grid;
    grid-template-rows: 32px auto;
    grid-template-columns: 32px auto;
    position: relative;
    left: -16px;
  }

  .pokemon-ball {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
    transition: all .2s var(--easing-decelerate);
    transform: translate(0) rotate(0);
  }

  :host([open]) .pokemon-ball {
    transition: all .11s var(--easing-accelerate);
    transform: translate(15px) rotate(120deg);
  }

  .pokemon-espece {
    grid-row: 2 / 3;
    grid-column: 2 / 3;
    font-size: 15px;
    font-weight: 300;
    text-transform: capitalize;
    opacity: .8;
    display: flex;
    justify-content: start;
    align-items: center;
    position: relative;
    left: 25px;
    top: -6px;
  }

  .pokemon-surnom,
  .no-surnom>.pokemon-espece {
    grid-row: 1 / 2;
    grid-column: 2 / 3;
    font-size: 24px;
    font-weight: 300;
    opacity: 1;
    display: flex;
    justify-content: start;
    align-items: center;
    text-shadow: 1px 1px var(--card-bg-color);
    position: relative;
    left: 0;
    top: 0;
  }

  .no-surnom>.pokemon-surnom {
    display: none;
  }

  .pokemon-infos__capture {
    grid-row: 4 / 5;
    color: var(--card-infos-text-color);
    font-size: 13px;
    display: grid;
    grid-template-areas:
        "icone methode compteur"
        "icone date compteur";
    grid-template-columns: 32px auto 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 0 5px;
    margin-left: 15px;
  }

  .pokemon-infos__capture.no-date {
    grid-template-rows: 1fr 0;
  }

  .pokemon-infos__capture>.icones.jeu {
    grid-area: icone;
  }
  .pokemon-infos__capture>.capture-methode {
    grid-area: methode;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    display: flex;
    align-items: center;
  }
  .pokemon-infos__capture>.capture-date {
    grid-area: date;
    display: flex;
    align-items: center;
  }
  .pokemon-infos__capture>.methode-compteur {
    grid-area: compteur;
    align-self: start;
  }
  .methode-compteur>.oeuf {
    transform: translateY(2px);
  }
  .pokemon-infos__capture>.gigamax {
    grid-area: compteur;
    align-self: center;
  }

  .pokemon-icones {
    grid-column: 3 / 4;
    grid-row: 1 / 2;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: flex-end;
    margin: 10px;
  }

  .pokemon-notes {
    grid-row: 1 / 2;
    grid-column: 2 / 4;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: 100%;
    font-size: 13px;
    text-align: justify;
    line-height: 20px;
    color: var(--text-color);
    background-color: var(--card-bg-color);
    padding: 10px;
    z-index: 4;
    opacity: 0;
    transform: translate3d(100px, 0, 0);
    pointer-events: none;
    transition: all .1s var(--easing-accelerate);
    overflow: hidden;
  }
  :host([open])>.pokemon-notes {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition: all .1s var(--easing-decelerate);
  }

  .pokemon-notes__texte {
    margin: auto;
  }



  /* Icônes */

  .icones.explain.oeuf {
    margin: 0;
    margin-right: 3px;
  }

  .spacer {
    flex-grow: 1;
  }



  /* Shiny rate */

  .shiny-rate {
    display: grid;
    grid-template-columns: auto;
    grid-template-rows: 20px;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 20px;
    position: relative;
    --hue-min: 30;
    --hue-max: 170;
    background: hsl(calc(var(--hue-min) + var(--coeff) * (var(--hue-max) - var(--hue-min))), 50%, 50%);
  }
  .full-odds {
    background: repeating-linear-gradient(-45deg, 
      hsl(2,80%,50%) 0, 
      hsl(24,100%,50%) 5px, 
      hsl(39,100%,50%) 10px, 
      hsl(70,100%,50%) 15px, 
      hsl(158,100%,50%) 20px, 
      hsl(230,70%,50%) 25px, 
      hsl(252,100%,70%) 30px, 
      hsl(2,80%,50%) 35px
    );
  }
  .charm-odds {
    background: repeating-linear-gradient(-45deg, 
      mediumslateblue 0, 
      cyan 5px, 
      white 10px, 
      cyan 15px, 
      mediumslateblue 20px
    );
  }
  .one-odds {
    background: white;
  }
  .shiny-rate::before {
    content: '';
    display: block;
    position: absolute;
    width: calc(100% - 4px);
    height: calc(100% - 4px);
    background-color: var(--card-bg-color);
    opacity: 1;
    top: 2px;
    left: 2px;
    border-radius: 20px;
  }
  .shiny-rate.with-charm {
    grid-template-columns: 13px auto;
  }
  .shiny-rate>div {
    display: flex;
    position: relative;
    justify-content: center;
    align-items: center;
  }
  .shiny-rate:not(.with-charm)>.shiny-charm {
    display: none;
  }
  .shiny-charm {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
  }
  .shiny-charm>.charm {
    top: -2px;
    position: relative;
    margin-left: -6px !important; /* Compense le placement décrit dans iconsheet.css */
    margin-right: -3px !important;
  }
  .shiny-rate-text {
    color: var(--card_supporting_text_color);
    font-size: 13px;
  }
  .numerator.shiny-rate-text {
    font-size: 8px;
    position: absolute;
    top: 0;
    left: 0;
  }
  .separator.shiny-rate-text {
    opacity: .6;
    margin: 0 1px 0 3px;
    font-size: 16px;
  }

  .off {
    display: none !important;
  }
</style>

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

class pokemonCard extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    const card = this.shadowRoot;

    // Active le long clic pour éditer
    card.addEventListener('click', () => { if (!longClic) this.toggleNotes(); longClic = false; });
    card.addEventListener('mousedown', async event => { if (event.button != 0) return; this.makeEdit(event); }); // souris
    card.addEventListener('touchstart', async event => { this.makeEdit(event); }, { passive: true }); // toucher
  }

  updateCard(toUpdate = pokemonCard.observedAttributes) {
    const card = this.shadowRoot;

    ordreSprite: {
      if (!toUpdate.includes('ordre-sprite')) break ordreSprite;
      card.querySelector('.pokemon-sprite').style.setProperty('--ordre-sprite', this.getAttribute('ordre-sprite'));
    }

    notes: {
      if (!toUpdate.includes('notes')) break notes;
      card.querySelector('.pokemon-notes__texte').innerHTML = this.getAttribute('notes');

      if (!this.getAttribute('notes').includes('Gigamax'))
        card.querySelector('.gigamax').classList.add('off');
      else
        card.querySelector('.gigamax').classList.remove('off');
    }

    surnom: {
      if (!toUpdate.includes('surnom')) break surnom;
      card.querySelector('.pokemon-surnom').innerHTML = this.getAttribute('surnom');
    }

    espece: {
      if (!toUpdate.includes('espece') && !toUpdate.includes('surnom')) break espece;
      card.querySelector('.pokemon-espece').innerHTML = this.getAttribute('espece');
      const surnom = this.getAttribute('surnom') || '';
      if (surnom == '' || surnom.toLowerCase() == this.getAttribute('espece'))
        card.querySelector('.pokemon-infos__nom').classList.add('no-surnom');
      else
        card.querySelector('.pokemon-infos__nom').classList.remove('no-surnom');
    }

    jeu: {
      if (!toUpdate.includes('jeu')) break jeu;
      card.querySelector('.icones.jeu').className = 'icones jeu';
      card.querySelector('.icones.jeu').classList.add(this.getAttribute('jeu'));
    }

    ball: {
      if (!toUpdate.includes('ball')) break ball;
      const element = card.querySelector('.pokemon-ball');
      const baseClassList = 'pkspr pokemon-ball';
      element.className = baseClassList;
      if (this.getAttribute('ball') != null) element.classList.add(this.getAttribute('ball'));
      else element.classList.add('off');
      element.classList.add('item', 'ball-' + this.getAttribute('ball'));
    }

    monjeu: {
      if (!toUpdate.includes('monjeu')) break monjeu;
      if (this.getAttribute('monjeu') == null)
        card.querySelector('.icones.mine').classList.add('off');
      else
        card.querySelector('.icones.mine').classList.remove('off');
    }

    methode: {
      if (!toUpdate.includes('methode')) break methode;
      card.querySelector('.capture-methode').innerHTML = this.getAttribute('methode');
    }

    compteur: {
      if (!toUpdate.includes('methode') && !toUpdate.includes('compteur')) break compteur;
      const compteur = this.getAttribute('compteur');
      const element = card.querySelector('.methode-compteur');
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
      const shinyRateBox = card.querySelector('.shiny-rate');
      const shinyRate = Number(this.getAttribute('shiny-rate'));
      const charm = Number(this.getAttribute('charm')) || null;

      if (charmlessMethods == null) charmlessMethods = Shiny.methodes('charmless');
      if (charm == true && !charmlessMethods.includes(this.getAttribute('methode')))
        shinyRateBox.classList.add('with-charm');

      if (shinyRate == null)
        shinyRateBox.classList.add('off');
      else
        shinyRateBox.classList.remove('off');

      card.querySelector('.shiny-rate-text.denominator').innerHTML = shinyRate || '???';

      shinyRateBox.classList.remove('full-odds', 'charm-ods', 'one-odds');
      if (charm == null && [8192, 4096].includes(shinyRate))
        shinyRateBox.classList.add('full-odds');
      else if (charm == true && [2731, 1365].includes(shinyRate))
        shinyRateBox.classList.add('charm-odds');
      else if (shinyRate == 1 || shinyRate == 0)
        shinyRateBox.classList.add('one-odds');

      const shinyRateCoeff = 1 - Math.min(1, Math.max(0, shinyRate / 1360));
      shinyRateBox.style.setProperty('--coeff', shinyRateCoeff);

      if (!this.getAttribute('monjeu')) shinyRateBox.classList.add('off');
      else shinyRateBox.classList.remove('off');
    }

    random: {
      if (!toUpdate.includes('random')) break random;
      if (this.getAttribute('random') == null)
        card.querySelector('.icones.lucky').remove();
    }

    checkmark: {
      if (!toUpdate.includes('checkmark')) break checkmark;
      const checkmark = this.getAttribute('checkmark');
      const element = card.querySelector('.icones.checkmark');
      element.className = 'icones explain checkmark';
      let origin;
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
      const hacked = this.getAttribute('hacked');
      const element = card.querySelector('.icones.hacked');
      element.className = 'icones explain hacked';
      let origin;
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
        card.querySelector('.pokemon-infos__capture').classList.remove('no-date');
        card.querySelector('.capture-date').innerHTML = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})
                                                                .format(new Date(this.getAttribute('date')));
      }
      else
        card.querySelector('.pokemon-infos__capture').classList.add('no-date');
    }
  }

  // Affiche les notes d'une carte au clic
  toggleNotes() {
    const card = this.shadowRoot;
    const huntid = this.getAttribute('huntid');

    // On ferme la carte déjà ouverte
    if (currentCard != null)
      document.getElementById(`pokemon-card-${currentCard}`).removeAttribute('open');

    // Si la carte demandée n'est pas celle qu'on vient de fermer, on l'ouvre
    if (huntid != currentCard)
    {
      this.setAttribute('open', true);
      currentCard = huntid;
    }
    else
      currentCard = null;
  }

  // Créer une chasse pour éditer un shiny au long clic sur une carte
  async makeEdit(event) {
    let act = true;
    const card = this.shadowRoot;

    const editIcon = card.querySelector('.edit-icon');
    let appear = editIcon.animate([
      { opacity: '0' },
      { opacity: '1' }
    ], {
      easing: Params.easingStandard,
      duration: 150,
      fill: 'forwards'
    });
    appear.pause();
    const circle = editIcon.querySelector('.edit-icon circle');
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
    card.classList.remove('editing');
    let ready = await editHunt(parseInt(this.getAttribute('huntid')));
    ready = (ready != false);
    appear.cancel(); anim.cancel();
    if (ready) longClic = false;
  }

  static get observedAttributes() {
    return ['ordre-sprite', 'notes', 'surnom', 'espece', 'jeu', 'ball', 'methode', 'compteur', 'charm', 'shiny-rate', 'random', 'monjeu', 'checkmark', 'hacked', 'date'];
  }

  connectedCallback() {
    this.updateCard();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.updateCard([name]);
  }
}
customElements.define("pokemon-card", pokemonCard);