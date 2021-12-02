const template = document.createElement('template');
template.innerHTML = `
<div class="pokemon-sprite">
  <img class="actual-sprite" width="112" height="112" loading="lazy"></img>
</div>
<div class="edit-icon">
  <i class="material-icons">edit</i>
  <svg><circle r="25" cx="25" cy="25"/></svg>
</div>

<div class="pokemon-infos">
  <div class="pokemon-infos__nom">
    <span class="pkspr pokemon-ball"></span>
    <span class="pokemon-surnom"></span>
    <span class="pokemon-espece"></span>
  </div>

  <div class="pokemon-infos__capture">
    <span class="icones jeu"></span>
    <span class="capture-methode"></span>
    <span class="capture-date"></span>
    <span class="methode-compteur">
      <span class="icones explain oeuf"></span>
    </span>
    <span class="icones explain gigamax"></span>
  </div>
</div>

<div class="pokemon-icones">
  <span class="icones explain checkmark"></span>
  <span class="icones explain mine"></span>
  <span class="icones explain lucky"></span>
  <span class="icones explain hacked"></span>
  <span class="spacer"></span>
  <div class="shiny-rate">
    <div class="shiny-charm">
      <span class="icones explain charm"></span>
    </div>
    <div class="shiny-rate-data">
      <span class="shiny-rate-text numerator">1</span>
      <span class="shiny-rate-text separator">/</span>
      <span class="shiny-rate-text denominator">4096</span>
    </div>
  </div>
</div>

<div class="pokemon-notes">
  <span class="pokemon-notes__texte"></span>
</div>
`;

export default template;