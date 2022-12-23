import '../pokemon-sprite/pokemonSprite.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <pokemon-sprite size="112"></pokemon-sprite>

  <div class="edit-icon">
    <i class="material-icons">edit</i>
    <svg><circle r="25" cx="25" cy="25"/></svg>
  </div>

  <div class="pokemon-infos">
    <div class="pokemon-infos__nom">
      <span data-type="ball"></span>
      <span data-type="surnom"></span>
      <span data-type="espece"></span>
      <span data-type="gene"></span>
    </div>

    <div class="pokemon-infos__capture">
      <span data-type="jeu"></span>
      <span data-type="methode"></span>
      <span data-type="timeCapture"></span>
      <span data-type="compteur"></span>
    </div>
  </div>

  <div class="pokemon-icones">
    <span data-type="checkmark"></span>
    <span data-type="do"></span>
    <span data-type="horsChasse"></span>
    <span data-type="hacked"></span>

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

export default template;