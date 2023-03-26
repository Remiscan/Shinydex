import '../pokemon-sprite/pokemonSprite.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <div class="container surface variant elevation-0 interactive">
    <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>

    <div class="menu surface standard">
      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="edit" disabled tabindex="-1">
        <span class="label-large">Éditer</span>
      </button>

      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="restore" disabled tabindex="-1">
        <span class="label-large">Restaurer</span>
      </button>
    </div>

    <div class="pokemon-infos__identity body-large">
      <span data-type="ball" class="icon"></span>
      <span data-type="name" class="title-large"></span>
      <span data-type="species"></span>
      <span data-type="gene"></span>
    </div>

    <div class="pokemon-infos__misc">
      <span data-type="originMark" class="icon"></span>
      <button type="button" class="surface interactive icon-button only-icon menu-hint" data-action="open">
        <span class="material-icons">more_horiz</span>
      </button>
    </div>

    <div class="pokemon-infos__capture body-medium">
      <span data-type="game" class="icon"></span>
      <span data-type="method"></span>
      <span data-type="catchTime"></span>
    </div>

    <div class="shiny-rate body-large">
      <div class="shiny-rate-background surface"></div>
      <div class="shiny-charm">
        <span class="icon" data-icon="key/shiny-charm"></span>
      </div>
      <div class="shiny-rate-data">
        <span class="shiny-rate-text numerator">1</span>
        <span class="shiny-rate-text separator">/</span>
        <span class="shiny-rate-text denominator">4096</span>
      </div>
    </div>

    <div class="pokemon-notes surface body-large">
      <div class="pokemon-notes__arrow surface"></div>
      <span class="pokemon-notes__texte">
        <h2 class="title-medium">Méthode de chasse - détails :</h2>
        <p class="body-medium" data-type="count"></p>
        <hr>
        <h2 class="title-medium">Notes additionnelles :</h2>
        <p class="body-medium" data-type="notes"></p>
      </span>
    </div>
  </div>
`;

export default template;