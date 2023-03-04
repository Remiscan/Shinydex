import '../pokemon-sprite/pokemonSprite.js';
import '../shinySwitch.js';



const template = document.createElement('template');
template.innerHTML = `
<div class="sprite-scroller">
  <div class="sprite-list shiny"></div>
  <div class="sprite-list regular"></div>
</div>
<div class="sprite-viewer-dex-info surface variant elevation-0 label-medium">
  <span class="info-dexid"></span>
  <span class="info-nom"></span>
</div>
<a class="icon-button surface interactive bouton-retour">
  <span class="material-icons">close</span>
</a>
<label for="shiny-switch" class="switch-shiny-regular">
  <shiny-switch icons="checked" id="shiny-switch"></shiny-switch>
</label>
`;

export default template;