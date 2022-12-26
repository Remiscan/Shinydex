const template = document.createElement('template');
template.innerHTML = /*html*/`
<form>
  <datalist id="datalist-pokedex"></datalist>

  <pokemon-sprite size="112"></pokemon-sprite>

  <div class="yes-edit">
    <span>Mode édit.</span>
  </div>


  <!-- Espèce, forme -->
  <fieldset>
    <legend>Pokémon</legend>

    <input type="text" name="dexid" required list="datalist-pokedex" autocomplete="off" placeholder="Bulbizarre" size="8">
    <label for="forme">Forme :</label>
    <select name="forme" id="forme"></select>
  </fieldset>


  <!-- Jeu, méthode -->
  <fieldset>
    <legend>Jeu et méthode</legend>

    <span data-icon="game"></span>
    <label for="game">Jeu :</label>
    <select name="game" id="game" required></select>

    <label for="method">Méthode :</label>
    <select name="method" id="method"></select>
  </fieldset>


  <!-- Compteur de rencontres -->
  <fieldset>
    <legend>Compteur de rencontres</legend>

    <button type="button" class="counter sub">
      <i class="material-icons">remove</i>
    </button>
    <input type="number" name="count" id="count" min="0" max="999999" value="0">
    <button type="button" class="counter add">
      <i class="material-icons">add</i>
    </button>
  </fieldset>


  <!-- Bonus globaux -->
  <fieldset>
    <legend>Bonus globaux</legend>

    <input type="checkbox" name="charm" id="charm">
    <label for="charm">
      <span>
        <span class="icon" data-icon="key/shiny-charm"></span>
        Charme chroma possédé
      </span>
    </label>
  </fieldset>


  <!-- Bonus de Écarlate / Violet (SV) -->
  <fieldset data-game="sv">
    <legend>Bonus de Pokémon Écarlate et Violet</legend>

    <label for="sv-outbreakCleared" data-method="massoutbreak">Nombre de Pokémon battus dans cette apparition massive</label>
    <select name="sv-outbreakCleared" id="sv-outbreakCleared" data-method="massoutbreak">
      <option value="0" selected>Entre 0 et 29</option>
      <option value="1">Entre 30 et 59</option>
      <option value="2">Plus de 60</option>
    </select>

    <label for="sv-sparklingPower">Niveau de Rencontre brillante du sandwich actif</label>
    <select name="sv-sparklingPower" id="sv-sparklingPower">
      <option value="0" selected>Aucun</option>
      <option value="1">Niveau 1</option>
      <option value="2">Niveau 2</option>
      <option value="3">Niveau 3</option>
    </select>
  </fieldset>


  <!-- Bonus de Legends Arceus (PLA) -->
  <fieldset data-game="pla">
    <legend>Bonus de Légendes Pokémon: Arceus</legend>

    <label for="pla-dexResearch">Niveau de recherche de la page du Pokédex</label>
    <select name="pla-dexResearch" id="pla-dexResearch">
      <option value="0" selected>Page incomplète (niv &lt;9)</option>
      <option value="1">Page complétée (niv 10)</option>
      <option value="2">Page complétée à 100%</option>
    </select>
  </fieldset>


  <!-- Bonus de Épée / Bouclier (SWSH) -->
  <fieldset data-game="swsh">
    <legend>Bonus de Pokémon Épée et Bouclier</legend>

    <label for="swsh-dexKo">Compteur de KO du Pokédex</label>
    <input type="text" name="swsh-dexKo" id="swsh-dexKo" inputmode="numeric" pattern="[0-9]*" value="0">
  </fieldset>


  <!-- Bonus de Let's Go Pikachu / Évoli (LGPE) -->
  <fieldset data-game="lgpe">
    <legend>Bonus de Pokémon Let's Go Pikachu et Évoli</legend>

    <label for="lgpe-catchCombo" data-method="wild">Combo Capture</label>
    <select name="lgpe-catchCombo" id="lgpe-catchCombo" data-method="wild">
      <option value="0" selected>Entre 0 et 10</option>
      <option value="1">Entre 11 et 20</option>
      <option value="2">Entre 21 et 30</option>
      <option value="3">Plus de 31</option>
    </select>

    <input type="checkbox" name="lgpe-lure" id="lgpe-lure" value="1">
    <label for="lpge-lure">Parfum utilisé</label>

    <input type="checkbox" name="lgpe-nextSpawn" id="lgpe-nextSpawn" data-method="wild" value="1">
    <label for="lpge-nextSpawn" data-method="wild">Le chromatique est apparu immédiatement après avoir augmenté le Combo Capture</label>
  </fieldset>


  <!-- Bonus de Ultra Soleil / Lune (USUM) -->
  <fieldset data-game="usum">
    <legend>Bonus de Pokémon Ultra-Soleil et Ultra-Lune</legend>

    <label for="usum-distance" data-method="ultrawormhole">Distance</label>
    <input type="text" name="usum-distance" id="usum-distance" inputmode="numeric" pattern="[0-9]*" value="0" data-method="ultrawormhole">

    <label for="usum-rings" data-method="ultrawormhole">Anneaux</label>
    <select name="usum-rings" id="usum-rings" data-method="ultrawormhole">
      <option selected>0</option>
      <option>1</option>
      <option>2</option>
      <option>3</option>
    </select>
  </fieldset>


  <!-- Boutons de capture / annulation -->
  <div class="confirm-buttons">
    <button type="button" class="hunt-delete not-edit">
      <i class="material-icons">delete</i>
      <span>Supprimer</span>
    </button>

    <button type="button" class="edit-cancel yes-edit">
      <i class="material-icons">cancel</i>
      <span>Annuler</span>
    </button>

    <input type="checkbox" name="caught" id="caught">
    <label for="caught">Capturé</label>
  </div>


  <!-- Surnom, date, ball -->
  <fieldset class="capture-data">
    <legend>Données de la capture</legend>

    <label for="name">Surnom</label>
    <input type="text" name="name" id="name">

    <label for="catchTime">Date de capture</label>
    <input type="date" name="catchTime" id="catchTime">

    <span data-icon="ball"></span>
    <label for="ball">Capturé dans une</label>
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
  </fieldset>


  <!-- Origine -->
  <div class="pokemon-data" data-checkmark-unsure>
    <fieldset>
      <legend>Origine</legend>

      <input type="radio" name="originMark" id="checkmark-none" value="old" checked>
      <label for="checkmark-none">Autre</label>
  
      <input type="radio" name="originMark" id="checkmark-paldea" value="paldea" data-game="sv">
      <label for="checkmark-paldea" data-game="sv">
        <span>
          <span class="icon" data-icon="origin-mark/paldea"></span>
          Paldea
        </span>
      </label>
  
      <input type="radio" name="originMark" id="checkmark-hisui" value="hisui" data-game="pla">
      <label for="checkmark-hisui" data-game="pla">
        <span>
          <span class="icon" data-icon="origin-mark/hisui"></span>
          Hisui
        </span>
      </label>
  
      <input type="radio" name="originMark" id="checkmark-bdsp" value="sinnoh-gen8" data-game="bdsp">
      <label for="checkmark-bdsp" data-game="bdsp">
        <span>
          <span class="icon" data-icon="origin-mark/sinnoh-gen8"></span>
          Sinnoh (DÉ/PS)
        </span>
      </label>
  
      <input type="radio" name="originMark" id="checkmark-galar" value="galar" data-game="swsh">
      <label for="checkmark-galar" data-game="swsh">
        <span>
          <span class="icon" data-icon="origin-mark/galar"></span>
          Galar
        </span>
      </label>
  
      <input type="radio" name="originMark" id="checkmark-letsgo" value="lets-go" data-game="lgpe">
      <label for="checkmark-letsgo" data-game="lgpe">
        <span>
          <span class="icon" data-icon="origin-mark/lets-go"></span>
          Kanto (Let's Go)
        </span>
      </label>
  
      <input type="radio" name="originMark" id="checkmark-alola" value="alola" data-game="sm usum">
      <label for="checkmark-alola" data-game="sm usum">
        <span>
          <span class="icon" data-icon="origin-mark/alola"></span>
          Alola
        </span>
      </label>
  
      <input type="radio" name="originMark" id="checkmark-kalos" value="gen6" data-game="xy oras">
      <label for="checkmark-kalos" data-game="xy oras">
        <span>
          <span class="icon" data-icon="origin-mark/gen6"></span>
          Kalos
        </span>
      </label>
  
      <input type="radio" name="originMark" id="checkmark-vc" value="game-boy" data-game="rb yellow gs crystal">
      <label for="checkmark-vc" data-game="rb yellow gs crystal">
        <span>
          <span class="icon" data-icon="origin-mark/game-boy"></span>
          Console Virtuelle
        </span>
      </label>
  
      <input type="radio" name="originMark" id="checkmark-go" value="go" data-game="go">
      <label for="checkmark-go" data-game="go">
        <span>
          <span class="icon" data-icon="origin-mark/go"></span>
          Pokémon GO
        </span>
      </label>
    </fieldset>

    <fieldset data-game="swsh pla">
      <legend>Gène</legend>

      <input type="radio" name="gene" id="gene-none" value="0" checked>
      <label for="gene-none">Aucun</label>

      <input type="radio" name="gene" id="gene-gigamax" value="gigamax" data-game="swsh">
      <label for="gene-gigamax" data-game="swsh">
        <span>
          <span class="icon" data-icon="gene/gigantamax"></span>
          Gigamax
        </span>
      </label>

      <input type="radio" name="gene" id="gene-alpha" value="alpha" data-game="pla">
      <label for="gene-alpha" data-game="pla">
        <span>
          <span class="icon" data-icon="gene/alpha"></span>
          Baron
        </span>
      </label>
    </fieldset>
  </div>


  <!-- Données de légitimité -->
  <div class="legality-data" data-not-mine>
    <fieldset>
      <legend>Légitimité du Pokémon</legend>

      <input type="radio" name="hacked" id="hacked-no" value="0" checked>
      <label for="hacked-no">Legit</label>

      <input type="radio" name="hacked" id="hacked-maybe" value="1">
      <label for="hacked-maybe">
        <span>
          <span class="icones explain ptethack"></span>
          Pas sûr
        </span>
      </label>

      <input type="radio" name="hacked" id="hacked-yes" value="2">
      <label for="hacked-yes">
        <span>
          <span class="icones explain hack"></span>
          Hacké
        </span>
      </label>

      <input type="radio" name="hacked" id="hacked-clone" value="3">
      <label for="hacked-clone">
        <span>
          <span class="icones explain clone"></span>
          Cloné
        </span>
      </label>
    </fieldset>
  </div>


  <!-- Notes -->
  <label for="notes">Notes additionnelles</label>
  <textarea name="notes" id="notes" rows="3"></textarea>


  <!-- Boutons supprimer / enregistrer -->
  <button type="button" class="full-delete yes-edit">
    <i class="material-icons">delete_forever</i>
    Supprimer définitivement
  </button>

  <button type="submit" class="submit">
    <i class="material-icons">backup</i>
    Enregistrer
  </button>
</form>
`;

export default template;