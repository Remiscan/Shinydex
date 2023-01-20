const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form class="search-options" name="search-options">

    <div class="orders" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours partage">
      <h2 class="title-medium if-ordre">Ordonner par :</h2>

      <fieldset class="liste-options if-ordre" aria-labelledby="label-ordre">
        <input type="checkbox" name="orderReversed" id="orderReversed" value="true">
        <label for="orderReversed" aria-label="Inverser l'ordre" class="surface interactive">
          <span class="material-icons"></span>
          <span class="label-large">Inverser l'ordre</span>
        </label>

        <input type="radio" name="order" id="ordre-date" value="catchTime" checked data-section="mes-chromatiques corbeille chromatiques-ami">
        <label for="ordre-date" class="radio surface interactive" data-section="mes-chromatiques corbeille chromatiques-ami">
          <span class="material-icons"></span>
          <span class="label-large">Date de capture</span>
        </label>

        <input type="radio" name="order" id="ordre-rate" value="shinyRate" data-section="mes-chromatiques corbeille chromatiques-ami">
        <label for="ordre-rate" class="radio surface interactive" data-section="mes-chromatiques corbeille chromatiques-ami">
          <span class="material-icons"></span>
          <span class="label-large">Taux de chromatiques</span>
        </label>

        <input type="radio" name="order" id="ordre-dex" value="dexid" data-section="mes-chromatiques corbeille chromatiques-ami">
        <label for="ordre-dex" class="radio surface interactive" data-section="mes-chromatiques corbeille chromatiques-ami">
          <span class="material-icons"></span>
          <span class="label-large">N° du Pokédex</span>
        </label>

        <input type="radio" name="order" id="ordre-species" value="species" data-section="mes-chromatiques corbeille chromatiques-ami">
        <label for="ordre-species" class="radio surface interactive" data-section="mes-chromatiques corbeille chromatiques-ami">
          <span class="material-icons"></span>
          <span class="label-large">Espèce (alphabétique)</span>
        </label>

        <input type="radio" name="order" id="ordre-name" value="name" data-section="mes-chromatiques corbeille chromatiques-ami">
        <label for="ordre-name" class="radio surface interactive" data-section="mes-chromatiques corbeille chromatiques-ami">
          <span class="material-icons"></span>
          <span class="label-large">Surnom (alphabétique)</span>
        </label>

        <input type="radio" name="order" id="ordre-game" value="game" data-section="mes-chromatiques corbeille chromatiques-ami">
        <label for="ordre-game" class="radio surface interactive" data-section="mes-chromatiques corbeille chromatiques-ami">
          <span class="material-icons"></span>
          <span class="label-large">Jeu (date de sortie)</span>
        </label>

        <input type="radio" name="order" id="ordre-added" value="creationTime" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours">
        <label for="ordre-added" class="radio surface interactive" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours">
          <span class="material-icons"></span>
          <span class="label-large">Date d'ajout</span>
        </label>

        <input type="radio" name="order" id="ordre-username" value="username" class="if-partage" data-section="partage">
        <label for="ordre-username" class="radio surface interactive if-partage" data-section="partage">
          <span class="material-icons"></span>
          <span class="label-large">Pseudo (alphabétique)</span>
        </label>
      </fieldset>
    </div>

    <div class="filters" data-section="mes-chromatiques corbeille chromatiques-ami">
      <h2 class="title-medium if-ordre">Afficher :</h2>

      <div class="cote-a-cote if-filters">
        <fieldset class="liste-options" data-section="mes-chromatiques corbeille chromatiques-ami">
          <legend class="titre-options title-small">Pokémon dont le dresseur d'origine est :</legend>

          <input type="checkbox" name="filter-mine-true" id="filter-mine-true" value="true">
          <label for="filter-mine-true" class="checkbox surface interactive">
            <span class="material-icons"></span>
            <span class="label-large">Moi</span>
          </label>

          <input type="checkbox" name="filter-mine-false" id="filter-mine-false" value="true">
          <label for="filter-mine-false" class="checkbox surface interactive">
            <span class="material-icons"></span>
            <span class="label-large">Quelqu'un d'autre</span>
          </label>
        </fieldset>

        <fieldset class="liste-options" data-section="mes-chromatiques corbeille chromatiques-ami">
          <legend class="titre-options title-small">Pokémon dont la légitimité est :</legend>

          <input type="checkbox" name="filter-legit-true" id="filter-legit-true" value="true">
          <label for="filter-legit-true" class="checkbox surface interactive">
            <span class="material-icons"></span>
            <span class="label-large">Confirmée</span>
          </label>

          <input type="checkbox" name="filter-legit-false" id="filter-legit-false" value="true">
          <label for="filter-legit-false" class="checkbox surface interactive">
            <span class="material-icons"></span>
            <span class="label-large">Non confirmée</span>
          </label>
        </fieldset>
      </div>
    </div>
  </form>
`;

export default template;