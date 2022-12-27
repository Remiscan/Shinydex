const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form class="search-header" name="search-bar">
    <a class="icone bouton-retour">
      <i class="material-icons">arrow_back</i>
    </a>

    <label for="search" class="search-icon">
      <i class="material-icons">search</i>
    </label>
    <input type="text" name="search" id="search" inputmode="search" enterkeyhint="search" role="searchbox">

    <button type="reset" class="reset-icon">
      <i class="material-icons">close</i>
    </button>
  </form>

  <form class="search-options" name="search-options">
    <fieldset class="search-hints" aria-label="Suggestions de recherche">
      <template id="search-hint-template">
        <input type="checkbox" name="chip-id" id="chip-id" value="value">
        <label class="chip" for="chip-id">
          <span>Type : valeur</span>
          <i class="material-icons">cancel</i>
        </label>
      </template>
    </fieldset>

    <div class="sous-titre if-ordre">
      <span id="label-ordre">Ordonner par :</span>

      <span class="reverse-order__container">
        <label for="orderReversed" aria-label="Inverser l'ordre">
          <i class="material-icons">vertical_align_bottom</i>
        </label>
        <input type="checkbox" name="orderReversed" id="orderReversed" value="true">
      </span>
    </div>

    <fieldset class="liste-options if-ordre" aria-labelledby="label-ordre">
      <input type="radio" name="order" id="ordre-date" value="catchTime" checked data-section="mes-chromatiques corbeille chromatiques-ami">
      <label for="ordre-date" class="radio" data-section="mes-chromatiques corbeille chromatiques-ami">
        <span>Date de capture</span>
      </label>

      <input type="radio" name="order" id="ordre-rate" value="shinyRate" data-section="mes-chromatiques corbeille chromatiques-ami">
      <label for="ordre-rate" class="radio" data-section="mes-chromatiques corbeille chromatiques-ami">
        <span>Taux</span>
      </label>

      <input type="radio" name="order" id="ordre-dex" value="dexid" data-section="mes-chromatiques corbeille chromatiques-ami">
      <label for="ordre-dex" class="radio" data-section="mes-chromatiques corbeille chromatiques-ami">
        <span>N° du Pokédex</span>
      </label>

      <input type="radio" name="order" id="ordre-species" value="species" data-section="mes-chromatiques corbeille chromatiques-ami">
      <label for="ordre-species" class="radio" data-section="mes-chromatiques corbeille chromatiques-ami">
        <span>Espèce (alphabétique)</span>
      </label>

      <input type="radio" name="order" id="ordre-name" value="name" data-section="mes-chromatiques corbeille chromatiques-ami">
      <label for="ordre-name" class="radio" data-section="mes-chromatiques corbeille chromatiques-ami">
        <span>Surnom (alphabétique)</span>
      </label>

      <input type="radio" name="order" id="ordre-game" value="game" data-section="mes-chromatiques corbeille chromatiques-ami">
      <label for="ordre-game" class="radio" data-section="mes-chromatiques corbeille chromatiques-ami">
        <span>Jeu (date de sortie)</span>
      </label>

      <input type="radio" name="order" id="ordre-added" value="modified" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours">
      <label for="ordre-added" class="radio" data-section="mes-chromatiques corbeille chromatiques-ami">
        <span>Date de modification</span>
      </label>

      <input type="radio" name="order" id="ordre-username" value="username" class="if-partage" data-section="partage">
      <label for="ordre-username" class="radio if-partage" data-section="partage">
        <span>Pseudo (alphabétique)</span>
      </label>
    </fieldset>

    <div class="sous-titre if-filtres">
      <span>Afficher :</span>
    </div>

    <div class="cote-a-cote if-filtres">
      <fieldset class="liste-options" data-section="mes-chromatiques corbeille chromatiques-ami">
        <legend class="titre-options">Dresseur d'origine :</legend>

        <input type="checkbox" name="filtre-do-moi" id="filtre-do-moi" value="moi">
        <label for="filtre-do-moi" class="checkbox">
          <span>Moi</span>
        </label>

        <input type="checkbox" name="filtre-do-autres" id="filtre-do-autres" value="autres">
        <label for="filtre-do-autres" class="checkbox">
          <span>Autres</span>
        </label>
      </fieldset>

      <fieldset class="liste-options" data-section="mes-chromatiques corbeille chromatiques-ami">
        <legend class="titre-options">Legit :</legend>

        <input type="checkbox" name="filtre-legit-oui" id="filtre-legit-oui" value="oui">
        <label for="filtre-legit-oui" class="checkbox">
          <span>Oui</span>
        </label>

        <input type="checkbox" name="filtre-legit-non" id="filtre-legit-non" value="non">
        <label for="filtre-legit-non" class="checkbox">
          <span>Non</span>
        </label>
      </fieldset>
    </div>
  </form>
`;

export default template;