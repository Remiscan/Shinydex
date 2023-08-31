import '../pokemon-sprite/pokemonSprite.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <div class="container surface surface-container-highest">
    <div class="friend-infos__identity">
      <span data-type="username" class="title-large"></span>
      <button type="button" class="surface interactive icon-button only-icon menu-hint" data-action="open" data-label="friend-card-menu">
        <span class="material-icons">more_horiz</span>
      </button>
    </div>
    
    <div class="pokemon-preview">
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface surface-container-low"></pokemon-sprite>
    </div>

    <a href="#" class="icon-button surface surface-container-low interactive" data-nav-section="chromatiques-ami" data-label="see-friends-pokemon">
      <span class="material-icons surface">arrow_forward_ios</span>
    </a>

    <div class="menu surface surface-container-low">
      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="remove-friend" disabled tabindex="-1">
        <span class="label-large" data-string="remove-friend"></span>
      </button>
    </div>
  </div>
`;

export default template;