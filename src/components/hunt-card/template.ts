const template = document.createElement('template');
template.innerHTML = /*html*/`
<form>
  <datalist id="datalist-pokedex"></datalist>

  <span data-edit class="edit-notice">Modification</span>


  <!-- Espèce, forme -->
  <fieldset>
    <legend>Pokémon</legend>

    <pokemon-sprite size="112"></pokemon-sprite>

    <span class="one-input">
      <label for="dexid">Espèce :</label>
      <input type="text" name="dexid" required list="datalist-pokedex" autocomplete="off" placeholder="Bulbizarre" size="8">
    </span>

    <span class="one-input">
      <label for="forme">Forme :</label>
      <select name="forme" id="forme"></select>
    </span>
  </fieldset>


  <!-- Jeu, méthode -->
  <fieldset>
    <legend>Méthode de chasse</legend>

    <span class="one-input">
      <span data-icon="game"></span>
      <label for="game">Jeu :</label>
      <select name="game" id="game" required></select>
    </span>

    <span class="one-input">
      <label for="method">Méthode :</label>
      <select name="method" id="method"></select>
    </span>
  </fieldset>


  <!-- Compteur de rencontres -->
  <fieldset>
    <legend>Compteur de rencontres</legend>

    <span class="one-input">
      <button type="button" class="counter sub">
        <i class="material-icons">remove</i>
      </button>
      <input type="number" name="count" id="count" min="0" max="999999" value="0">
      <button type="button" class="counter add">
        <i class="material-icons">add</i>
      </button>
    </span>
  </fieldset>


  <!-- Bonus globaux -->
  <fieldset>
    <legend>Bonus globaux</legend>

    <span class="one-input">
      <input type="checkbox" name="charm" id="charm">
      <label for="charm">
        <span>
          Charme chroma possédé
          <span class="icon" data-icon="key/shiny-charm"></span>
        </span>
      </label>
    </span>
  </fieldset>


  <!-- Bonus de Écarlate / Violet (SV) -->
  <fieldset data-game="sv">
    <legend>Bonus de Pokémon Écarlate et Violet</legend>

    <span class="one-input" data-method="massoutbreak">
      <label for="sv-outbreakCleared">Nombre de Pokémon battus dans cette apparition massive :</label>
      <select name="sv-outbreakCleared" id="sv-outbreakCleared">
        <option value="0" selected>Entre 0 et 29</option>
        <option value="1">Entre 30 et 59</option>
        <option value="2">Plus de 60</option>
      </select>
    </span>

    <span class="one-input">
      <label for="sv-sparklingPower">Niveau de Rencontre brillante du sandwich actif :</label>
      <select name="sv-sparklingPower" id="sv-sparklingPower">
        <option value="0" selected>Aucun</option>
        <option value="1">Niveau 1</option>
        <option value="2">Niveau 2</option>
        <option value="3">Niveau 3</option>
      </select>
    </span>
  </fieldset>


  <!-- Bonus de Legends Arceus (PLA) -->
  <fieldset data-game="pla">
    <legend>Bonus de Légendes Pokémon: Arceus</legend>

    <span class="one-input">
      <label for="pla-dexResearch">Niveau de recherche de la page du Pokédex :</label>
      <select name="pla-dexResearch" id="pla-dexResearch">
        <option value="0" selected>Page incomplète (niv &lt;9)</option>
        <option value="1">Page complétée (niv 10)</option>
        <option value="2">Page complétée à 100%</option>
      </select>
    </span>
  </fieldset>


  <!-- Bonus de Épée / Bouclier (SWSH) -->
  <fieldset data-game="swsh">
    <legend>Bonus de Pokémon Épée et Bouclier</legend>

    <span class="one-input">
      <label for="swsh-dexKo">Compteur de KO du Pokédex :</label>
      <input type="text" name="swsh-dexKo" id="swsh-dexKo" inputmode="numeric" pattern="[0-9]*" value="0">
    </span>
  </fieldset>


  <!-- Bonus de Let's Go Pikachu / Évoli (LGPE) -->
  <fieldset data-game="lgpe">
    <legend>Bonus de Pokémon Let's Go Pikachu et Évoli</legend>

    <span class="one-input" data-method="wild">
      <label for="lgpe-catchCombo">Combo Capture :</label>
      <select name="lgpe-catchCombo" id="lgpe-catchCombo">
        <option value="0" selected>Entre 0 et 10</option>
        <option value="1">Entre 11 et 20</option>
        <option value="2">Entre 21 et 30</option>
        <option value="3">Plus de 31</option>
      </select>
    </span>

    <span class="one-input">
      <input type="checkbox" name="lgpe-lure" id="lgpe-lure" value="1">
      <label for="lgpe-lure">Parfum utilisé</label>
    </span>

    <span class="one-input" data-method="wild">
      <input type="checkbox" name="lgpe-nextSpawn" id="lgpe-nextSpawn" value="1">
      <label for="lgpe-nextSpawn">Le chromatique est apparu immédiatement après avoir augmenté le Combo Capture</label>
    </span>
  </fieldset>


  <!-- Bonus de Ultra Soleil / Lune (USUM) -->
  <fieldset data-game="usum">
    <legend>Bonus de Pokémon Ultra-Soleil et Ultra-Lune</legend>

    <span class="one-input" data-method="ultrawormhole">
      <label for="usum-distance">Distance :</label>
      <input type="text" name="usum-distance" id="usum-distance" inputmode="numeric" pattern="[0-9]*" value="0">
    </span>

    <span class="one-input" data-method="ultrawormhole">
      <label for="usum-rings">Anneaux :</label>
      <select name="usum-rings" id="usum-rings">
        <option selected>0</option>
        <option>1</option>
        <option>2</option>
        <option>3</option>
      </select>
    </span>
  </fieldset>


  <!-- Boutons de capture / annulation -->
  <div class="group button-group capture-button-group">
    <button type="button" class="hunt-delete danger" data-not-edit>
      <i class="material-icons">delete</i>
      <span>Supprimer</span>
    </button>

    <button type="button" class="edit-cancel ghost danger" data-edit>
      <i class="material-icons">cancel</i>
      <span>Annuler</span>
    </button>

    <input type="checkbox" name="caught" id="caught">
    <label for="caught">Capturé</label>
  </div>


  <!-- Surnom, date, ball -->
  <fieldset class="capture-data">
    <legend>Données de la capture</legend>

    <span class="one-input">
      <label for="name">Surnom :</label>
      <input type="text" name="name" id="name">
    </span>

    <span class="one-input">
      <label for="catchTime">Date de capture :</label>
      <input type="date" name="catchTime" id="catchTime">
    </span>

    <span class="one-input">
      <span data-icon="ball"></span>
      <label for="ball">Capturé dans une :</label>
      <select name="ball" id="ball">
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
      </select>
    </span>

    <span class="one-input" data-not-mine>
      <label for="hacked">Légitimité :</label>
      <select name="hacked" id="hacked">
        <option value="0" selected>Legit</option>
        <option value="1">Pas sûr</option>
        <option value="2">Hacké</option>
        <option value="3">Cloné</option>
      </select>
    </span>
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

    <span class="one-input">
      <label for="notes">Notes :</label>
      <textarea name="notes" id="notes" rows="4" cols="40"></textarea>
    </span>
  </fieldset>


  <!-- Boutons supprimer / enregistrer -->
  <div class="group button-group">
    <button type="button" class="full-delete danger" data-edit>
      <i class="material-icons">delete_forever</i>
      <span>Supprimer définitivement</span>
    </button>

    <button type="submit" class="submit">
      <i class="material-icons">backup</i>
      <span>Enregistrer dans mes Pokémon <shiny-stars></shiny-stars></span>
    </button>
  </div>
</form>
`;

export default template;