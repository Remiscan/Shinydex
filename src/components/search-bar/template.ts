const template = document.createElement('template');
template.innerHTML = `
  <a class="icone bouton-retour">
    <i class="material-icons">arrow_back</i>
  </a>
  <i class="material-icons search-icon">search</i>
  <input type="text" inputmode="search" enterkeyhint="search" role="searchbox">
  <button type="button" class="reset-icon">
    <i class="material-icons">close</i>
  </button>
  <ul class="search-suggestions">
    <li class="espece">Pokémon d'espèce <strong>truc</strong></li>
    <li class="surnom">Pokémon surnommés <strong>truc</strong></li>
    <li class="jeu">Pokémon capturés dans la version <strong>truc</strong></li>
    <li class="methode">Pokémon trouvés par la méthode <strong>truc</strong></li>
  </ul>
`;

export default template;