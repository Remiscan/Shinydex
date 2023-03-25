import '../pokemon-sprite/pokemonSprite.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <div class="container surface surface-container interactive">
    <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>

    <div class="menu surface surface-container-low">
      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="edit" disabled tabindex="-1">
        <span class="label-large">Éditer</span>
      </button>

      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="restore" disabled tabindex="-1">
        <span class="label-large">Restaurer</span>
      </button>
    </div>

    <div class="pokemon-infos__identity body-large">
      <span data-type="ball" class="icon"></span>
      <span data-type="name"></span>
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
      <span data-type="count"></span>
    </div>

    <div class="shiny-rate body-large">
      <div class="shiny-rate-background surface surface-container"></div>
      <div class="shiny-charm">
        <span class="icon" data-icon="key/shiny-charm"></span>
      </div>
      <div class="shiny-rate-data">
        <span class="shiny-rate-text numerator">1</span>
        <span class="shiny-rate-text separator">/</span>
        <span class="shiny-rate-text denominator">4096</span>
      </div>
    </div>

    <div class="pokemon-notes surface surface-container body-large">
      <div class="pokemon-notes__arrow surface surface-container-low"></div>
      <span class="pokemon-notes__texte"></span>
    </div>
  </div>
`;

export default template;