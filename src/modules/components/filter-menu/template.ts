import '../checkBox.js';
import '../radioGroup.js';
import '../shinyStars.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form class="search-options" name="search-options">

    <div class="orders" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours partage">
      <fieldset class="liste-options if-ordre" aria-labelledby="label-ordre">
        <template id="orders-select-options">
          <option value="catchTime" data-section="mes-chromatiques corbeille chromatiques-ami" data-string="order-catchTime"></option>
          <option value="shinyRate" data-section="mes-chromatiques corbeille chromatiques-ami" data-string="order-shinyRate"></option>
          <option value="dexid" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours" data-string="order-dexid"></option>
          <option value="species" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours" data-string="order-species"></option>
          <option value="name" data-section="mes-chromatiques corbeille chromatiques-ami" data-string="order-name"></option>
          <option value="game" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours" data-string="order-game"></option>
          <option value="creationTime" data-section="mes-chromatiques corbeille chromatiques-ami chasses-en-cours" data-string="order-creationTime"></option>
          <option value="username" data-section="partage" data-string="order-username"></option>
        </template>

        <input-select name="order">
          <span slot="label" data-string="orders-title"></span>
        </input-select>

        <check-box name="orderReversed">
          <span slot="icon-unchecked">vertical_align_bottom</span>
          <span slot="icon-checked">vertical_align_top</span>
          <span data-string="order-reverse"></span>
        </check-box>
      </fieldset>
    </div>

    <div class="filters" data-section="mes-chromatiques corbeille chromatiques-ami">
      <div class="cote-a-cote if-filters">
        <fieldset class="liste-options" data-section="mes-chromatiques corbeille chromatiques-ami">
          <legend class="titre-options title-small" data-string="filter-mine"></legend>

          <check-box name="filter-mine-true" data-string="filter-mine-true"></check-box>
          <check-box name="filter-mine-false" data-string="filter-mine-false"></check-box>
        </fieldset>

        <fieldset class="liste-options" data-section="mes-chromatiques corbeille chromatiques-ami">
          <legend class="titre-options title-small" data-string="filter-legit"></legend>

          <check-box name="filter-legit-true" data-string="filter-legit-true"></check-box>
          <check-box name="filter-legit-false" data-string="filter-legit-false"></check-box>
        </fieldset>

        <fieldset class="liste-options caught-filter" data-section="mes-chromatiques">
          <legend class="titre-options title-small" data-string="filter-caught"></legend>

          <check-box name="filter-caught-true" data-string="filter-caught-true"></check-box>
          <check-box name="filter-caught-false" data-string="filter-caught-false"></check-box>
        </fieldset>
      </div>
    </div>
  </form>
`;

export default template;