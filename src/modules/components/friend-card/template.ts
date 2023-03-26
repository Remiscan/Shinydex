import '../pokemon-sprite/pokemonSprite.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <div class="container surface variant elevation-0">
    <div class="friend-infos__identity">
      <span data-type="username" class="title-large"></span>
      <button type="button" class="surface interactive icon-button only-icon menu-hint" data-action="open">
        <span class="material-icons">more_horiz</span>
      </button>
    </div>
    
    <div class="pokemon-preview">
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
    </div>

    <a href="#" class="icon-button surface standard interactive" data-nav-section="chromatiques-ami">
      <span class="material-icons">arrow_forward_ios</span>
    </a>

    <div class="menu surface standard">
      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="remove-friend" disabled tabindex="-1">
        <span class="label-large">Retirer de mes amis</span>
      </button>
    </div>
  </div>
`;

export default template;