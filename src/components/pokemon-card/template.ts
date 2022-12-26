import '../pokemon-sprite/pokemonSprite.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <pokemon-sprite size="112" shiny="true"></pokemon-sprite>

  <div class="edit-icon">
    <i class="material-icons">edit</i>
    <svg><circle r="25" cx="25" cy="25"/></svg>
  </div>

  <div class="pokemon-infos__identity">
    <span data-type="ball" class="icon"></span>
    <span data-type="name"></span>
    <span data-type="species"></span>
    <span data-type="gene"></span>
  </div>

  <div class="pokemon-infos__misc">
    <span data-type="originMark" class="icon"></span>
  </div>

  <div class="pokemon-infos__capture">
    <span data-type="game" class="icon"></span>
    <span data-type="method"></span>
    <span data-type="catchTime"></span>
    <span data-type="count"></span>
  </div>

  <div class="shiny-rate">
    <div class="shiny-charm">
      <span class="icon" data-icon="key/shiny-charm"></span>
    </div>
    <div class="shiny-rate-data">
      <span class="shiny-rate-text numerator">1</span>
      <span class="shiny-rate-text separator">/</span>
      <span class="shiny-rate-text denominator">4096</span>
    </div>
  </div>

  <div class="pokemon-notes">
    <span class="pokemon-notes__texte"></span>
  </div>
`;

export default template;