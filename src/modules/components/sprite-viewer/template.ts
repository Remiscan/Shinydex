import '../pokemon-sprite/pokemonSprite.js';
import '../shinySwitch.js';



const template = document.createElement('template');
template.innerHTML = `
<div class="sprite-scroller">
  <div class="sprite-list shiny"></div>
  <div class="sprite-list regular"></div>
</div>

<button type="button" id="sprite-viewer-fab" class="surface interactive fab elevation-3-shadow">
  <span class="material-icons" aria-hidden="true">add</span>
  <span class="label-large fab-label"></span>
</button>

<form name="sprite-viewer-form" method="dialog">
  <div class="sprite-viewer-dex-info surface surface-container-high label-medium">
    <span class="icon" data-icon="ball/poke"></span>
    <span class="info-dexid"></span>
  </div>

  <button type="submit" class="surface interactive icon-button" data-label="button-close">
    <span class="material-icons">close</span>
  </button>

  <label for="shiny-switch">
    <shiny-switch icons="checked" name="shiny" id="shiny-switch"></shiny-switch>
  </label>
</form>
`;

export default template;