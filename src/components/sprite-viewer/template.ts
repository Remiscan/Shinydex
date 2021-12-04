import '../pokemon-sprite/pokemonSprite.js';



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
  <input type="checkbox" id="switch-shy-reg" value="shiny" checked>
  <label for="switch-shy-reg" class="switch">
    <shiny-stars></shiny-stars>
  </label>
</div>
`;

export default template;