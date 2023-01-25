import '../checkBox.js';
import '../inputSelect.js';
import '../pokemon-sprite/pokemonSprite.js';
import '../textArea.js';
import '../textField.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form class="surface variant">
    <div class="intro">
      <div class="sprite-container">
        <span data-edit class="edit-notice label-large secondary elevation-2">Modification</span>
        <pokemon-sprite size="112" class="surface standard elevation-2"></pokemon-sprite>
      </div>

      <!-- Espèce, forme -->
      <fieldset name="which-pokemon">
        <legend class="invisible">Pokémon, jeu et méthode</legend>

        <text-field name="dexid" required list="datalist-pokedex" autocomplete="off" spellcheck="false" placeholder="Bulbizarre">
          <span slot="label">Espèce</span>
          <datalist id="datalist-pokedex"></datalist>
        </text-field>

        <input-select name="forme" default-value="">
          <span slot="label">Forme</span>
        </input-select>

        <input-select name="game" icons="leading" default-label="Choisir un jeu" required>
          <span slot="leading-icon" class="icon" data-icon="game"></span>
          <span slot="label">Jeu</span>
        </input-select>

        <input-select name="method" default-value="wild">
          <span slot="label">Méthode de chasse</span>
        </input-select>

        <text-field name="count" inputmode="numeric" pattern="[0-9]*" default-value="0" icons="leading trailing">
          <span slot="label">Rencontres</span>
          
          <button slot="leading-icon" type="button" class="surface interactive icon-button only-icon" data-action="count-sub">
            <span class="material-icons">remove</span>
          </button>

          <button slot="trailing-icon" type="button" class="surface interactive icon-button only-icon" data-action="count-add">
            <span class="material-icons">add</span>
          </button>
        </text-field>
      </fieldset>
    </div>


    <fieldset name="bonus">
      <legend>
        <span class="title-medium">Bonus affectant les chances de rencontrer un Pokémon chromatique</span>
      </legend>


      <!-- Bonus globaux -->
      <fieldset name="common-bonus">
        <legend>
          <span class="title-small">Bonus communs</span>
        </legend>

        <check-box name="charm">Charme chroma possédé</check-box>
      </fieldset>


      <!-- Bonus de Écarlate / Violet (SV) -->
      <fieldset data-game="sv">
        <legend>
          <span class="title-small">Bonus de Pokémon Écarlate et Violet</span>
        </legend>

        <input-select name="sv-outbreakCleared" default-value="0" data-method="massoutbreak">
          <span slot="label">Nombre de Pokémon battus dans cette apparition massive</span>
          <option value="0">Entre 0 et 29</option>
          <option value="1">Entre 30 et 59</option>
          <option value="2">Plus de 60</option>
        </input-select>

        <input-select name="sv-sparklingPower" default-value="0">
          <span slot="label">Niveau de Rencontre brillante du sandwich actif</span>
          <option value="0">Aucun</option>
          <option value="1">Niveau 1</option>
          <option value="2">Niveau 2</option>
          <option value="3">Niveau 3</option>
        </input-select>
      </fieldset>


      <!-- Bonus de Legends Arceus (PLA) -->
      <fieldset data-game="pla">
        <legend>
          <span class="title-small">Bonus de Légendes Pokémon: Arceus</span>
        </legend>

        <input-select name="pla-dexResearch" default-value="0">
          <span slot="label">Niveau de recherche de la page du Pokédex</span>
          <option value="0">Page incomplète (niv &lt;9)</option>
          <option value="1">Page complétée (niv 10)</option>
          <option value="2">Page complétée à 100%</option>
        </input-select>
      </fieldset>


      <!-- Bonus de Épée / Bouclier (SWSH) -->
      <fieldset data-game="swsh">
        <legend>
          <span class="title-small">Bonus de Pokémon Épée et Bouclier</span>
        </legend>

        <text-field name="swsh-dexKo" inputmode="numeric" pattern="[0-9]*" default-value="0">
          <span slot="label">Compteur de KO du Pokédex</span>
        </text-field>
      </fieldset>


      <!-- Bonus de Let's Go Pikachu / Évoli (LGPE) -->
      <fieldset data-game="lgpe">
        <legend>
          <span class="title-small">Bonus de Pokémon Let's Go Pikachu et Évoli</span>
        </legend>

        <input-select name="lgpe-catchCombo" default-value="0" data-method="wild">
          <span slot="label">Combo Capture</span>
          <option value="0">Entre 0 et 10</option>
          <option value="1">Entre 11 et 20</option>
          <option value="2">Entre 21 et 30</option>
          <option value="3">Plus de 31</option>
        </input-select>

        <check-box name="lgpe-lure">Parfum utilisé</check-box>
        <check-box name="lgpe-nextSpawn" data-method="wild">Le chromatique est apparu immédiatement après avoir augmenté le Combo Capture</check-box>
      </fieldset>


      <!-- Bonus de Ultra Soleil / Lune (USUM) -->
      <fieldset data-game="usum">
        <legend>
          <span class="title-small">Bonus de Pokémon Ultra-Soleil et Ultra-Lune</span>
        </legend>

        <text-field name="usum-distance" inputmode="numeric" pattern="[0-9]*" default-value="0" data-method="ultrawormhole">
          <span slot="label">Distance</span>
        </text-field>

        <input-select name="usum-rings" default-value="0" data-method="ultrawormhole">
          <span slot="label">Anneaux</span>
          <option>0</option>
          <option>1</option>
          <option>2</option>
          <option>3</option>
        </input-select>
      </fieldset>
    </fieldset>


      <!-- Boutons de capture / annulation -->
      <div class="group button-group capture-button-group">
        <button type="button" class="surface interactive filled danger only-text elevation-2" data-action="delete-hunt" data-not-edit>
          <span class="label-large">Supprimer cette chasse</span>
        </button>

        <button type="button" class="surface interactive filled danger only-text elevation-2" data-action="cancel-edit" data-edit>
          <span class="label-large">Annuler les modifications</span>
        </button>

        <check-box name="caught">Capturé</check-box>
      </div>


      <!-- Surnom, date, ball -->
      <fieldset class="capture-data">
        <legend>
          <span class="title-medium">Données de la capture</span>
        </legend>

        <text-field name="name" autocomplete="off" spellcheck="false">
          <span slot="label">Surnom</span>
        </text-field>

        <input-select name="gene" default-value="" icons="leading" data-game="swsh pla">
          <span slot="leading-icon" class="icon" data-icon="gene"></span>
          <span slot="label">Gène</span>
          <option value="">Aucun</option>
          <option value="gigantamax">Gigamax</option>
          <option value="alpha">Baron</option>
        </input-select>

        <text-field name="catchTime" type="date">
          <span slot="label">Date de capture</span>
        </text-field>

        <input-select name="ball" default-value="poke" icons="leading">
          <span slot="leading-icon" class="icon" data-icon="ball"></span>
          <span slot="label">Capturé dans une</span>
          <option value="lure">Appât Ball</option>
          <option value="repeat">Bis Ball</option>
          <option value="timer">Chrono Ball</option>
          <option value="friend">Copain Ball</option>
          <option value="wing" data-game="pla">Envol Ball de Hisui</option>
          <option value="nest">Faiblo Ball</option>
          <option value="net">Filet Ball</option>
          <option value="gigaton" data-game="pla">Gigamasse Ball de Hisui</option>
          <option value="premier">Honor Ball</option>
          <option value="ultra">Hyper Ball</option>
          <option value="hisuian-ultra" data-game="pla">Hyper Ball de Hisui</option>
          <option value="love">Love Ball</option>
          <option value="moon">Lune Ball</option>
          <option value="luxury">Luxe Ball</option>
          <option value="heavy">Masse Ball</option>
          <option value="hisuian-heavy" data-game="pla">Masse Ball de Hisui</option>
          <option value="master">Master Ball</option>
          <option value="leaden" data-game="pla">Mégamasse Ball de Hisui</option>
          <option value="cherish">Mémoire Ball</option>
          <option value="level">Niveau Ball</option>
          <option value="origin" data-game="pla">Origine Ball de Hisui</option>
          <option value="feather" data-game="pla">Plume Ball de Hisui</option>
          <option value="poke" selected>Poké Ball</option>
          <option value="hisuian-poke" data-game="pla">Poké Ball de Hisui</option>
          <option value="jet" data-game="pla">Propulse Ball de Hisui</option>
          <option value="quick">Rapide Ball</option>
          <option value="dream">Rêve Ball</option>
          <option value="safari">Safari Ball</option>
          <option value="dive">Scuba Ball</option>
          <option value="heal">Soin Ball</option>
          <option value="dusk">Sombre Ball</option>
          <option value="fast">Speed Ball</option>
          <option value="sport">Sport Ball</option>
          <option value="great">Super Ball</option>
          <option value="hisuian-great" data-game="pla">Super Ball de Hisui</option>
          <option value="beast">Ultra Ball</option>
          <option value="strange">Étrange Ball</option>
        </input-select>
      </fieldset>


      <!-- Notes -->
      <fieldset>
        <legend>
          <span class="title-medium">Informations additionnelles</span>
        </legend>

        <text-area name="notes" rows="3">
          <span slot="label">Notes</span>
        </text-area>
      </fieldset>


      <!-- Boutons supprimer / enregistrer -->
      <div class="group button-group">
        <button type="button" class="surface interactive filled danger elevation-2" data-action="delete-shiny" data-edit>
          <span class="material-icons">delete_forever</span>
          <span class="label-large">Supprimer ce Pokémon <shiny-stars></shiny-stars></span>
        </button>

        <button type="button" class="surface interactive filled elevation-2 only-text" data-action="save-shiny">
          <span class="label-large">Enregistrer dans mes Pokémon <shiny-stars></shiny-stars></span>
        </button>
      </div>
  </form>
`;

export default template;