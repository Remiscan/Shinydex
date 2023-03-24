import '../pokemon-sprite/pokemonSprite.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <div class="container surface variant elevation-0 interactive">
    <div class="friend-infos__identity body-large">
      <span data-type="username"></span>
      <button type="button" class="surface interactive icon-button only-icon menu-hint" data-action="open">
        <span class="material-icons">more_horiz</span>
      </button>
    </div>
    
    <div class="pokemon-preview">
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
      <pokemon-sprite size="112" shiny="true" class="surface standard"></pokemon-sprite>
      <button type="button" class="surface interactive icon-button only-icon" data-action="see-pokemon">
        <span class="material-icons">arrow_forward_ios</span>
      </button>
    </div>

    <div class="menu surface standard">
      <button type="button" class="surface interactive filled tonal outlined only-text" data-action="remove-friend" disabled tabindex="-1">
        <span class="label-large">Retirer des amis</span>
      </button>
    </div>
  </div>
`;

export default template;