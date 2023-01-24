import '../checkBox.js';
import '../inputSelect.js';
import '../pokemon-sprite/pokemonSprite.js';
import '../textArea.js';
import '../textField.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form class="surface variant">
    <div class="container surface standard elevation-2">
      <datalist id="datalist-pokedex"></datalist>

      <span data-edit class="edit-notice">Modification</span>

      <!--
      <input type="text" name="Test0" required>

      <text-field name="Test1" icons="leading trailing" required>
        <span slot="leading-icon" class="material-icons">search</span>
        <span slot="label">Label</span>
      </text-field>

      <text-area name="Test6">
        <span slot="label">Text area</span>
      </text-area>
      -->


      <!-- Espèce, forme -->
      <fieldset class="intro">
        <legend>Pokémon, jeu et méthode</legend>

        <pokemon-sprite size="112"></pokemon-sprite>

        <text-field name="dexid" required list="datalist-pokedex" autocomplete="off" spellcheck="off" placeholder="Bulbizarre">
          <span slot="label">Espèce</span>
          <datalist id="datalist-pokedex"></datalist>
        </text-field>

        <input-select name="forme" default-value="">
          <span slot="label">Forme</span>
        </input-select>

        <input-select name="game" icons="leading" required>
          <span slot="leading-icon" data-icon="game"></span>
          <span slot="label">Jeu</span>
        </input-select>

        <input-select name="method" default-value="wild">
          <span slot="label">Méthode</span>
        </input-select>
      </fieldset>


      <!-- Compteur de rencontres -->
      <fieldset>
        <legend>Compteur de rencontres</legend>

        <span class="one-input">
          <button type="button" class="counter sub">
            <span class="material-icons">remove</span>
          </button>
          <input type="number" name="count" id="count" min="0" max="999999" value="0">
          <button type="button" class="counter add">
            <span class="material-icons">add</span>
          </button>
        </span>
      </fieldset>


      <!-- Bonus globaux -->
      <fieldset>
        <legend>Bonus globaux</legend>

        <check-box name="charm">Charme chroma possédé</check-box>
      </fieldset>


      <!-- Bonus de Écarlate / Violet (SV) -->
      <fieldset data-game="sv">
        <legend>Bonus de Pokémon Écarlate et Violet</legend>

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
        <legend>Bonus de Légendes Pokémon: Arceus</legend>

        <input-select name="pla-dexResearch" default-value="0">
          <span slot="label">Niveau de recherche de la page du Pokédex</span>
          <option value="0">Page incomplète (niv &lt;9)</option>
          <option value="1">Page complétée (niv 10)</option>
          <option value="2">Page complétée à 100%</option>
        </input-select>
      </fieldset>


      <!-- Bonus de Épée / Bouclier (SWSH) -->
      <fieldset data-game="swsh">
        <legend>Bonus de Pokémon Épée et Bouclier</legend>

        <text-field name="swsh-dexKo" inputmode="numeric" pattern="[0-9]*" default-value="0">
          <span slot="label">Compteur de KO du Pokédex</span>
        </text-field>
      </fieldset>


      <!-- Bonus de Let's Go Pikachu / Évoli (LGPE) -->
      <fieldset data-game="lgpe">
        <legend>Bonus de Pokémon Let's Go Pikachu et Évoli</legend>

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
        <legend>Bonus de Pokémon Ultra-Soleil et Ultra-Lune</legend>

        <text-field name="usum-distance" inputmode="numeric" pattern="[0-9]*" default-value="0" data-method="ultra-wormhole">
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


      <!-- Boutons de capture / annulation -->
      <div class="group button-group capture-button-group">
        <button type="button" class="hunt-delete danger" data-not-edit>
          <span class="material-icons" aria-hidden="true">delete</span>
          <span>Supprimer cette chasse</span>
        </button>

        <button type="button" class="edit-cancel ghost danger" data-edit>
          <span class="material-icons" aria-hidden="true">cancel</span>
          <span>Annuler les modifications</span>
        </button>

        <input type="checkbox" name="caught" id="caught">
        <label for="caught">Capturé</label>
      </div>


      <!-- Surnom, date, ball -->
      <fieldset class="capture-data">
        <legend>Données de la capture</legend>

        <text-field name="name">
          <span slot="label">Surnom</span>
        </text-field>

        <span class="one-input">
          <label for="catchTime">Date de capture :</label>
          <input type="date" name="catchTime" id="catchTime">
        </span>

        <input-select name="ball" icons="leading" required>
          <span slot="leading-icon" data-icon="ball"></span>
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


      <!-- Origine -->
      <fieldset data-checkmark-unsure class="single">
        <legend>Marque d'origine</legend>

        <span class="one-input">
          <input type="radio" name="originMark" id="checkmark-none" value="old" checked>
          <label for="checkmark-none">
            <span>
              Autre
              <span class="icon" data-icon="origin-mark/old"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="sv">
          <input type="radio" name="originMark" id="checkmark-paldea" value="paldea">
          <label for="checkmark-paldea">
            <span>
              Paldea
              <span class="icon" data-icon="origin-mark/paldea"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="pla">
          <input type="radio" name="originMark" id="checkmark-hisui" value="hisui">
          <label for="checkmark-hisui">
            <span>
              Hisui
              <span class="icon" data-icon="origin-mark/hisui"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="bdsp">
          <input type="radio" name="originMark" id="checkmark-bdsp" value="sinnoh-gen8">
          <label for="checkmark-bdsp">
            <span>
              Sinnoh (DÉ/PS)
              <span class="icon" data-icon="origin-mark/sinnoh-gen8"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="swsh">
          <input type="radio" name="originMark" id="checkmark-galar" value="galar">
          <label for="checkmark-galar">
            <span>
              Galar
              <span class="icon" data-icon="origin-mark/galar"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="lgpe">
          <input type="radio" name="originMark" id="checkmark-letsgo" value="lets-go">
          <label for="checkmark-letsgo">
            <span>
              Kanto (Let's Go)
              <span class="icon" data-icon="origin-mark/lets-go"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="sm usum">
          <input type="radio" name="originMark" id="checkmark-alola" value="alola">
          <label for="checkmark-alola">
            <span>
              Alola
              <span class="icon" data-icon="origin-mark/alola"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="xy oras">
          <input type="radio" name="originMark" id="checkmark-kalos" value="gen6">
          <label for="checkmark-kalos">
            <span>
              Kalos
              <span class="icon" data-icon="origin-mark/gen6"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="rb yellow gs crystal">
          <input type="radio" name="originMark" id="checkmark-vc" value="game-boy">
          <label for="checkmark-vc">
            <span>
              Console Virtuelle
              <span class="icon" data-icon="origin-mark/game-boy"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="go">
          <input type="radio" name="originMark" id="checkmark-go" value="go">
          <label for="checkmark-go">
            <span>
              Pokémon GO
              <span class="icon" data-icon="origin-mark/go"></span>
            </span>
          </label>
        </span>
      </fieldset>

      <fieldset data-game="swsh pla" class="single">
        <legend>Gène</legend>

        <span class="one-input">
          <input type="radio" name="gene" id="gene-none" value="" checked>
          <label for="gene-none">Aucun</label>
        </span>

        <span class="one-input" data-game="swsh">
          <input type="radio" name="gene" id="gene-gigamax" value="gigamax">
          <label for="gene-gigamax">
            <span>
              Gigamax
              <span class="icon" data-icon="gene/gigantamax"></span>
            </span>
          </label>
        </span>

        <span class="one-input" data-game="pla">
          <input type="radio" name="gene" id="gene-alpha" value="alpha">
          <label for="gene-alpha">
            <span>
              Baron
              <span class="icon" data-icon="gene/alpha"></span>
            </span>
          </label>
        </span>
      </fieldset>


      <!-- Notes -->
      <fieldset>
        <legend>Informations additionnelles</legend>

        <text-area name="notes">Notes</text-area>
      </fieldset>


      <!-- Boutons supprimer / enregistrer -->
      <div class="group button-group">
        <button type="button" class="full-delete danger" data-edit>
          <span class="material-icons" aria-hidden="true">delete_forever</span>
          <span>Supprimer définitivement</span>
        </button>

        <button type="submit" class="submit">
          <span class="material-icons" aria-hidden="true">backup</span>
          <span>Enregistrer dans mes Pokémon <shiny-stars></shiny-stars></span>
        </button>
      </div>
    </div>
  </form>
`;

export default template;