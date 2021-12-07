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
    <div class="search-hints">
      <template id="search-hint-template">
        <input type="checkbox" id="chip-id" value="value">
        <label class="chip" for="chip-id">
          <span>Type : valeur</span>
          <i class="material-icons">cancel</i>
        </label>
      </template>

      <input type="checkbox" id="chip-ex1" value="value">
      <label class="chip" for="chip-ex1">
        <span>Espèce : truc</span>
        <i class="material-icons">cancel</i>
      </label>

      <input type="checkbox" id="chip-ex2" value="value" checked>
      <label class="chip" for="chip-ex2">
        <span>Surnom : truc</span>
        <i class="material-icons">cancel</i>
      </label>

      <input type="checkbox" id="chip-ex3" value="value" checked>
      <label class="chip" for="chip-ex3">
        <span>Jeu : truc</span>
        <i class="material-icons">cancel</i>
      </label>
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