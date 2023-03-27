import '../checkBox.js';
import '../radioGroup.js';
import '../shinyStars.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form class="search-options" name="search-options">

    <div class="orders" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours partage">
      <h2 class="title-medium if-ordre">Ordonner par :</h2>

      <fieldset class="liste-options if-ordre" aria-labelledby="label-ordre">
        <check-box name="orderReversed">
          <span slot="icon-unchecked">vertical_align_bottom</span>
          <span slot="icon-checked">vertical_align_top</span>
          <span>Inverser l'ordre</span>
        </check-box>

        <radio-group name="order">
          <option value="catchTime" data-section="mes-chromatiques corbeille chromatiques-ami">Date de capture</option>
          <option value="shinyRate" data-section="mes-chromatiques corbeille chromatiques-ami">Taux de chromatiques</option>
          <option value="dexid" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours">N° du Pokédex</option>
          <option value="species" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours">Espèce</option>
          <option value="name" data-section="mes-chromatiques corbeille chromatiques-ami">Surnom</option>
          <option value="game" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours">Jeu (date de sortie)</option>
          <option value="creationTime" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours">Date d'ajout</option>
          <option value="username" data-section="partage">Pseudo (alphabétique)</option>
        </radio-group>
      </fieldset>
    </div>

    <div class="filters" data-section="mes-chromatiques corbeille chromatiques-ami">
      <h2 class="title-medium if-ordre">Afficher :</h2>

      <div class="cote-a-cote if-filters">
        <fieldset class="liste-options" data-section="mes-chromatiques corbeille chromatiques-ami">
          <legend class="titre-options title-small">Pokémon <shiny-stars></shiny-stars> dont le dresseur d'origine est :</legend>

          <check-box name="filter-mine-true">Moi</check-box>
          <check-box name="filter-mine-false">Quelqu'un d'autre</check-box>
        </fieldset>

        <fieldset class="liste-options" data-section="mes-chromatiques corbeille chromatiques-ami">
          <legend class="titre-options title-small">Pokémon <shiny-stars></shiny-stars> dont la légitimité est :</legend>

          <check-box name="filter-legit-true">Confirmée</check-box>
          <check-box name="filter-legit-false">Non confirmée</check-box>
        </fieldset>

        <fieldset class="liste-options caught-filter" data-section="mes-chromatiques">
          <legend class="titre-options title-small">Pokémon <shiny-stars></shiny-stars> dans le Pokédex <shiny-stars></shiny-stars> qui sont :</legend>

          <check-box name="filter-caught-true">Capturés</check-box>
          <check-box name="filter-caught-false">Non capturés</check-box>
        </fieldset>
      </div>
    </div>
  </form>
`;

export default template;