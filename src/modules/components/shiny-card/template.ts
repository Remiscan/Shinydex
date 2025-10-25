import '../pokemon-sprite/pokemonSprite.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <div class="container surface surface-container-highest interactive">
    <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>

    <div class="menu surface surface-container-low">
      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="edit" disabled tabindex="-1">
        <span class="label-large" data-string="edit-shiny"></span>
      </button>

      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="restore" disabled tabindex="-1">
        <span class="label-large" data-string="restore-hunt"></span>
      </button>

      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="auto-translate" disabled tabindex="-1">
        <span class="label-large" data-string="auto-translate"></span>
      </button>

      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="undo-auto-translate">
        <span class="label-large" data-string="undo-auto-translate"></span>
      </button>
    </div>

    <div class="pokemon-infos__identity body-large">
      <span data-type="ball" class="icon"></span>
      <span data-type="name" class="title-large"></span>
      <span data-type="species"></span>
      <span data-type="forme"></span>

      <span class="identity-icons">
        <span data-type="gene" class="icon"></span>
        <span data-type="originMark" class="icon"></span>
        <span data-type="originalTrainer" class="icon"></span>
        <button type="button" class="surface interactive icon-button only-icon menu-hint" data-action="open" data-label="shiny-card-menu">
          <span class="material-icons">more_horiz</span>
        </button>
      </span>
    </div>

    <div class="pokemon-infos__capture body-medium">
      <span data-type="game" class="icon"></span>
      <span data-type="method"></span>
      <span data-type="catchTime" data-format='{"day":"numeric","month":"short","year":"numeric"}'></span>

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

      <!--<p class="count-container surface standard elevation-2 body-medium">
        <span class="arrow surface standard elevation-2"></span>
        <span data-type="count"></span>
      </p>-->
    </div>

    <div class="pokemon-notes surface body-large">
      <div class="pokemon-notes__arrow surface"></div>
      <span class="pokemon-notes__texte">
        <h2 class="title-medium" data-string="shiny-card-method-details"></h2>
        <p class="body-medium" data-type="count"></p>
        <hr>
        <h2 class="title-medium" data-string="shiny-card-notes"></h2>
        <p class="body-medium" data-type="notes"></p>
      </span>
    </div>
  </div>
`;

export default template;