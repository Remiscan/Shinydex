import '../pokemon-sprite/pokemonSprite.js';
import '../shinySwitch.js';



const template = document.createElement('template');
template.innerHTML = `
<div class="sprite-scroller">
  <div class="sprite-list shiny"></div>
  <div class="sprite-list regular"></div>
</div>
<div class="sprite-viewer-dex-info">
  <span class="info-dexid"></span>
  <span class="info-nom"></span>
</div>
<a class="icon-button surface interactive bouton-retour">
  <span class="material-icons">close</span>
</a>
<div class="switch-shiny-regular">
  <shiny-switch hint="icon"></shiny-switch>
</div>
`;

export default template;