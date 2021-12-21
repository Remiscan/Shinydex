import '../pokemon-sprite/pokemonSprite.js';
import '../shiny-switch/shinySwitch.js';



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
<a class="icone bouton-retour">
  <i class="material-icons">close</i>
</a>
<div class="switch-shiny-regular">
  <shiny-switch hint="icon"></shiny-switch>
</div>
`;

export default template;