import '../checkBox.js';
import '../inputSelect.js';
import '../pokemon-sprite/pokemonSprite.js';
import '../textArea.js';
import '../textField.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form class="surface surface-container-low">
    <div class="intro">
      <div class="sprite-container">
        <span data-edit class="edit-notice label-large surface secondary" data-string="edit-notice"></span>
        <pokemon-sprite size="112" class="surface surface-container-highest"></pokemon-sprite>
      </div>

      <!-- Espèce, forme -->
      <fieldset name="which-pokemon">
        <legend class="invisible" data-string="fieldset-which-pokemon-legend"></legend>

        <text-field name="dexid" required list="datalist-pokedex" autocomplete="off" spellcheck="false" data-placeholder="species-placeholder">
          <span slot="label" data-string="species-label"></span>
          <datalist is="dex-datalist" id="datalist-pokedex"></datalist>
        </text-field>

        <input-select name="forme" default-value="" required>
          <span slot="label" data-string="forme-label"></span>
        </input-select>

        <input-select name="game" icons="leading" required>
          <span slot="leading-icon" class="icon" data-icon="game"></span>
          <span slot="label" data-string="game-label"></span>
        </input-select>

        <input-select name="method" default-value="wild" required>
          <span slot="label" data-string="method-label"></span>
        </input-select>

        <text-field name="count" inputmode="numeric" pattern="[0-9]*" default-value="0" icons="leading trailing">
          <span slot="label" data-string="encounters-label"></span>
          
          <button slot="leading-icon" type="button" class="surface interactive icon-button only-icon" data-action="count-sub" data-label="encounters-add-label">
            <span class="material-icons">remove</span>
          </button>

          <button slot="trailing-icon" type="button" class="surface interactive icon-button only-icon" data-action="count-add" data-label="encounters-sub-label">
            <span class="material-icons">add</span>
          </button>
        </text-field>
      </fieldset>
    </div>


    <fieldset name="bonus">
    
      <legend>
        <span class="title-medium" data-string="bonuses-title"></span>
      </legend>


      <!-- Bonus globaux -->
      <fieldset name="common-bonus">
        <legend>
          <span class="title-small" data-string="bonuses-common"></span>
        </legend>

        <check-box name="charm" data-string="bonus-chroma-charm"></check-box>
      </fieldset>


      <!-- Bonus de Écarlate / Violet (SV) -->
      <fieldset data-game="sv">
        <legend>
          <span class="title-small" data-string="bonuses-sv"></span>
        </legend>

        <input-select name="sv-outbreakCleared" default-value="0" data-method="massoutbreak massoutbreakevent">
          <span slot="label" data-string="bonus-sv-outbreakCleared"></span>
          <option value="0" data-string="bonus-sv-outbreakCleared-0"></option>
          <option value="1" data-string="bonus-sv-outbreakCleared-1"></option>
          <option value="2" data-string="bonus-sv-outbreakCleared-2"></option>
        </input-select>

        <input-select name="sv-sparklingPower" default-value="0">
          <span slot="label" data-string="bonus-sv-sparklingPower"></span>
          <option value="0" data-string="bonus-sv-sparklingPower-0"></option>
          <option value="1" data-string="bonus-sv-sparklingPower-1"></option>
          <option value="2" data-string="bonus-sv-sparklingPower-2"></option>
          <option value="3" data-string="bonus-sv-sparklingPower-3"></option>
        </input-select>
      </fieldset>


      <!-- Bonus de Legends Arceus (PLA) -->
      <fieldset data-game="pla">
        <legend>
          <span class="title-small" data-string="bonuses-pla"></span>
        </legend>

        <input-select name="pla-dexResearch" default-value="0">
          <span slot="label" data-string="bonus-pla-dexResearch"></span>
          <option value="0" data-string="bonus-pla-dexResearch-0"></option>
          <option value="1" data-string="bonus-pla-dexResearch-1"></option>
          <option value="2" data-string="bonus-pla-dexResearch-2"></option>
        </input-select>
      </fieldset>


      <!-- Bonus de Diamant Étincelant / Perle Scintillante (BDSP) -->
      <fieldset data-game="bdsp">
        <legend>
          <span class="title-small" data-string="bonuses-bdsp"></span>
        </legend>

        <check-box name="bdsp-diglettBonus" data-method="grandunderground" data-string="bonus-bdsp-diglettBonus"></check-box>
      </fieldset>


      <!-- Bonus de Épée / Bouclier (SWSH) -->
      <fieldset data-game="swsh">
        <legend>
          <span class="title-small" data-string="bonuses-swsh"></span>
        </legend>

        <text-field name="swsh-dexKo" inputmode="numeric" pattern="[0-9]*" default-value="0">
          <span slot="label" data-string="bonus-swsh-dexKo"></span>
        </text-field>
      </fieldset>


      <!-- Bonus de Let's Go Pikachu / Évoli (LGPE) -->
      <fieldset data-game="lgpe">
        <legend>
          <span class="title-small" data-string="bonuses-lgpe"></span>
        </legend>

        <input-select name="lgpe-catchCombo" default-value="0" data-method="wild">
          <span slot="label" data-string="bonus-lgpe-catchCombo"></span>
          <option value="0" data-string="bonus-lgpe-catchCombo-0"></option>
          <option value="1" data-string="bonus-lgpe-catchCombo-1"></option>
          <option value="2" data-string="bonus-lgpe-catchCombo-2"></option>
          <option value="3" data-string="bonus-lgpe-catchCombo-3"></option>
        </input-select>

        <check-box name="lgpe-lure" data-string="bonus-lgpe-lure"></check-box>
        <check-box name="lgpe-nextSpawn" data-method="wild" data-string="bonus-lgpe-nextSpawn"></check-box>
      </fieldset>


      <!-- Bonus de Ultra Soleil / Lune (USUM) -->
      <fieldset data-game="usum">
        <legend>
          <span class="title-small" data-string="bonuses-usum"></span>
        </legend>

        <text-field name="usum-distance" inputmode="numeric" pattern="[0-9]*" default-value="0" data-method="ultrawormhole">
          <span slot="label" data-string="bonus-usum-distance"></span>
        </text-field>

        <input-select name="usum-rings" default-value="0" data-method="ultrawormhole">
          <span slot="label" data-string="bonus-usum-rings"></span>
          <option>0</option>
          <option>1</option>
          <option>2</option>
          <option>3</option>
        </input-select>
      </fieldset>


      <!-- Bonus de Rubis Oméga / Saphir Alpha (ORAS) -->
      <fieldset data-game="oras">
        <legend>
          <span class="title-small" data-string="bonuses-oras"></span>
        </legend>

        <text-field name="oras-dexnavChain" inputmode="numeric" pattern="[0-9]*" default-value="0" data-method="dexnavchain">
          <span slot="label" data-string="bonus-oras-dexnavChain"></span>
        </text-field>

        <text-field name="oras-dexnavLevel" inputmode="numeric" pattern="[0-9]*" default-value="0" data-method="dexnavchain">
          <span slot="label" data-string="bonus-oras-dexnavLevel"></span>
        </text-field>
      </fieldset>


      <!-- Bonus de Rubis Oméga / Saphir Alpha (ORAS) -->
      <fieldset data-game="gsc">
        <legend>
          <span class="title-small" data-string="bonuses-gsc"></span>
        </legend>

        <check-box name="gsc-shinyParent" data-string="bonus-gsc-shinyParent"></check-box>
      </fieldset>

    </fieldset>


      <!-- Boutons de capture / annulation -->
      <div class="group button-group capture-button-group">
        <button type="button" class="surface interactive filled danger only-text elevation-2" data-action="delete-hunt" data-not-edit>
          <span class="label-large" data-string="delete-hunt"></span>
        </button>

        <button type="button" class="surface interactive filled danger only-text elevation-2" data-action="cancel-edit" data-edit>
          <span class="label-large" data-string="cancel-edit"></span>
        </button>

        <check-box name="caught" disabled data-string="caught"></check-box>
      </div>


      <!-- Surnom, date, ball -->
      <fieldset class="capture-data">
        <legend>
          <span class="title-medium" data-string="capture-data"></span>
        </legend>

        <text-field name="name" autocomplete="off" spellcheck="false" maxlength="50">
          <span slot="label" data-string="capture-name"></span>
        </text-field>

        <input-select name="gene" default-value="" icons="leading" data-game="swsh pla za">
          <span slot="leading-icon" class="icon" data-icon="gene"></span>
          <span slot="label" data-string="capture-gene"></span>
          <option value="" data-string="capture-gene-none" data-part="all"></option>
          <option value="gigantamax" data-string="capture-gene-gigantamax" data-part="swsh"></option>
          <option value="alpha" data-string="capture-gene-alpha" data-part="pla za"></option>
        </input-select>

        <text-field name="catchTime" type="datetime-local">
          <span slot="label" data-string="capture-date"></span>
        </text-field>

        <check-box name="catchTime-unknown" data-string="capture-date-unknown"></check-box>

        <input-select name="ball" default-value="poke" icons="leading">
          <span slot="leading-icon" class="icon" data-icon="ball"></span>
          <span slot="label" data-string="capture-ball"></span>
          <option value="poke" selected data-string="poke-ball"></option>
          <option value="great" data-string="great-ball"></option>
          <option value="ultra" data-string="ultra-ball"></option>
          <option value="master" data-string="master-ball"></option>
          <option value="safari" data-string="safari-ball"></option>
          <option value="lure" data-string="lure-ball"></option>
          <option value="sport" data-string="sport-ball"></option>
          <option value="friend" data-string="friend-ball"></option>
          <option value="love" data-string="love-ball"></option>
          <option value="moon" data-string="moon-ball"></option>
          <option value="heavy" data-string="heavy-ball"></option>
          <option value="level" data-string="level-ball"></option>
          <option value="fast" data-string="fast-ball"></option>
          <option value="repeat" data-string="repeat-ball"></option>
          <option value="timer" data-string="timer-ball"></option>
          <option value="nest" data-string="nest-ball"></option>
          <option value="net" data-string="net-ball"></option>
          <option value="premier" data-string="premier-ball"></option>
          <option value="luxury" data-string="luxury-ball"></option>
          <option value="dive" data-string="dive-ball"></option>
          <option value="cherish" data-string="cherish-ball"></option>
          <option value="quick" data-string="quick-ball"></option>
          <option value="heal" data-string="heal-ball"></option>
          <option value="dusk" data-string="dusk-ball"></option>
          <option value="dream" data-string="dream-ball"></option>
          <option value="beast" data-string="beast-ball"></option>
          <option value="strange" data-string="strange-ball"></option>
          <option value="hisuian-poke" data-game="pla" data-string="hisuian-poke-ball"></option>
          <option value="hisuian-great" data-game="pla" data-string="hisuian-great-ball"></option>
          <option value="hisuian-ultra" data-game="pla" data-string="hisuian-ultra-ball"></option>
          <option value="hisuian-heavy" data-game="pla" data-string="hisuian-heavy-ball"></option>
          <option value="leaden" data-game="pla" data-string="leaden-ball"></option>
          <option value="gigaton" data-game="pla" data-string="gigaton-ball"></option>
          <option value="feather" data-game="pla" data-string="feather-ball"></option>
          <option value="wing" data-game="pla" data-string="wing-ball"></option>
          <option value="jet" data-game="pla" data-string="jet-ball"></option>
          <option value="origin" data-game="pla" data-string="origin-ball"></option>
        </input-select>

        <check-box name="originalTrainer" data-string="capture-originalTrainer" data-mine></check-box>
      </fieldset>


      <!-- Notes -->
      <fieldset>
        <legend>
          <span class="title-medium" data-string="capture-misc"></span>
        </legend>

        <text-area name="notes" rows="3" maxlength="65535">
          <span slot="label" data-string="capture-notes"></span>
        </text-area>
      </fieldset>


      <!-- Boutons supprimer / enregistrer -->
      <div class="group button-group">
        <button type="button" class="surface interactive filled danger elevation-2" data-action="delete-shiny" data-edit>
          <span class="material-icons">delete_forever</span>
          <span class="label-large" data-string="delete-shiny"></span>
        </button>

        <button type="submit" class="surface interactive filled elevation-2 only-text" data-action="save-shiny">
          <span class="label-large" data-string="submit-hunt"></span>
        </button>
      </div>
  </form>
`;

export default template;