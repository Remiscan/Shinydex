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

  <div class="search-options">
    <ul class="search-suggestions">
      <li class="espece">Pokémon d'espèce <strong>truc</strong></li>
      <li class="surnom">Pokémon surnommés <strong>truc</strong></li>
      <li class="jeu">Pokémon capturés dans la version <strong>truc</strong></li>
      <li class="methode">Pokémon trouvés par la méthode <strong>truc</strong></li>
    </ul>

    <div class="search-hints">
      <template id="search-hint-template">
        <span class="search-hint">type : valeur <i class="material-icons">close</i></span>
      </template>
      <span class="search-hint">Surnom : truc <i class="material-icons">close</i></span>
      <span class="search-hint">Jeu : truc <i class="material-icons">close</i></span>
    </div>

    <div class="menu-filtres">
      <div class="sous-titre">
        <span>Ordonner par :</span>
        <span class="reverse-order__container">
          <button type="button" class="reverse-order">
            <i class="material-icons">vertical_align_bottom</i>
          </button>
        </span>
      </div>

      <div class="liste-options">
        <input type="radio" name="ordre" id="ordre-date" value="date" checked>
        <label for="ordre-date" class="radio ordre">
          <span>Date</span>
        </label>

        <input type="radio" name="ordre" id="ordre-jeu" value="jeu">
        <label for="ordre-jeu" class="radio ordre">
          <span>Jeu</span>
        </label>

        <input type="radio" name="ordre" id="ordre-taux" value="taux">
        <label for="ordre-taux" class="radio ordre">
          <span>Taux</span>
        </label>

        <input type="radio" name="ordre" id="ordre-dex" value="dex">
        <label for="ordre-dex" class="radio ordre">
          <span>N° du Pokédex</span>
        </label>
      </div>

      <div class="sous-titre">
        <span>Afficher :</span>
      </div>

      <div class="cote-a-cote">
        <div class="liste-options">
          <span class="titre-options">Dresseur d'origine :</span>

          <input type="checkbox" id="filtre-do-moi" class="filtre filtre-do" value="do:moi" checked>
          <label for="filtre-do-moi" class="checkbox filtre filtre-do">
            <span>Moi</span>
          </label>

          <input type="checkbox" id="filtre-do-autres" class="filtre filtre-do" value="do:autre">
          <label for="filtre-do-autres" class="checkbox filtre filtre-do">
            <span>Autres</span>
          </label>
        </div>

        <div class="liste-options">
          <span class="titre-options">Legit :</span>

          <input type="checkbox" id="filtre-legit-oui" class="filtre filtre-legit" value="legit:oui" checked>
          <label for="filtre-legit-oui" class="checkbox filtre filtre-legit">
            <span>Oui</span>
          </label>

          <input type="checkbox" id="filtre-legit-non" class="filtre filtre-legit" value="legit:non">
          <label for="filtre-legit-non" class="checkbox filtre filtre-legit">
            <span>Non</span>
          </label>
        </div>
      </div>
    </div>
  </div>
`;

export default template;