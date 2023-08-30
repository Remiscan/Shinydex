import '../pokemon-sprite/pokemonSprite.js';
import '../shinySwitch.js';



const template = document.createElement('template');
template.innerHTML = `
<div class="sprite-scroller">
  <div class="sprite-list shiny"></div>
  <div class="sprite-list regular"></div>
</div>
<div class="sprite-viewer-dex-info surface surface-container-high label-medium">
  <span class="info-dexid"></span>
</div>
<a class="icon-button surface interactive bouton-retour" data-label="button-close">
  <span class="material-icons">close</span>
</a>
<form name="switch-shiny-regular">
  <label for="shiny-switch">
    <shiny-switch icons="checked" name="shiny" id="shiny-switch"></shiny-switch>
  </label>
</form>
`;

export default template;