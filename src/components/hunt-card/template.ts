const template = document.createElement('template');
template.innerHTML = /*html*/`
<form>
  <datalist id="datalist-pokedex"></datalist>

  <pokemon-sprite size="112"></pokemon-sprite>

  <div class="yes-edit">
    <span>Mode édit.</span>
  </div>


  <!-- Espèce, forme -->
  <fieldset class="pokemon-inputs">
    <legend>Pokémon</legend>

    <input type="text" name="dexid" required list="datalist-pokedex" autocomplete="off" placeholder="Bulbizarre" size="8">
    <select name="forme"></select>
  </fieldset>


  <!-- Jeu, méthode -->
  <fieldset class="game-method-inputs">
    <legend>Jeu et méthode</legend>

    <span data-icon="game"></span>
    <label for="jeu">Jeu :</label>
    <select name="jeu" id="jeu" required></select>

    <label for="methode">Méthode :</label>
    <select name="methode" id="methode"></select>
  </fieldset>


  <!-- Compteur de rencontres -->
  <fieldset class="counter-inputs">
    <legend>Compteur de rencontres</legend>

    <button type="button" class="counter sub">
      <i class="material-icons">remove</i>
    </button>
    <input type="number" name="compteur" id="compteur" min="0" max="999999" value="0">
    <button type="button" class="counter add">
      <i class="material-icons">add</i>
    </button>
  </fieldset>


  <!-- Bonus globaux -->
  <div class="bonus-inputs">
    <input type="checkbox" name="charm" id="charm">
    <label for="charm">
      <span>
        <span class="icon" data-icon="key/shiny-charm"></span>
        Charme chroma possédé
      </span>
    </label>
  </div>


  <!-- Bonus de Legends Arceus (PLA) -->
  <div class="pla-inputs">
    <fieldset>
      <legend>Niveau de recherche de la page du Pokédex</legend>

      <input type="radio" name="pla-dexResearch" id="pla-dex-incomplete" value="0" checked>
      <label for="pla-dex-incomplete" class="radio">
        <span>Page incomplète (niv &lt;9)</span>
      </label>

      <input type="radio" name="pla-dexResearch" id="pla-dex-complete" value="1">
      <label for="pla-dex-complete" class="radio">
        <span>Page complétée (niv 10)</span>
      </label>

      <input type="radio" name="pla-dexResearch" id="pla-dex-perfect" value="2">
      <label for="pla-dex-perfect" class="radio">
        <span>Page parfaite <shiny-stars></shiny-stars></span>
      </label>
    </fieldset>
  </div>


  <!-- Bonus de Let's Go Pikachu / Évoli (LGPE) -->
  <div class="lgpe-inputs">
    <input type="checkbox" name="lgpe-lure" id="lgpe-lure">
    <label for="lpge-lure">Parfum utilisé</label>
  </div>


  <!-- Bonus de Ultra Soleil / Lune (USUM) -->
  <div class="usum-inputs">
    <label for="usum-distance">Distance</label>
    <input type="text" name="usum-distance" id="usum-distance" inputmode="numeric" pattern="[0-9]*" value="0">

    <label for="usum-rings">Anneaux</label>
    <select name="usum-rings" id="usum-rings">
      <option selected>0</option>
      <option>1</option>
      <option>2</option>
      <option>3</option>
    </select>
  </div>


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

    <label for="surnom">Surnom</label>
    <input type="text" name="surnom" id="surnom">

    <label for="timeCapture">Date de capture</label>
    <input type="date" name="timeCapture" id="timeCapture">

    <span data-icon="ball"></span>
    <label for="ball">Capturé dans une</label>
    <select name="ball" id="ball">
      <option value="lure">Appât Ball</option>
      <option value="repeat">Bis Ball</option>
      <option value="timer">Chrono Ball</option>
      <option value="friend">Copain Ball</option>
      <option value="wing">Envol Ball de Hisui</option>
      <option value="nest">Faiblo Ball</option>
      <option value="net">Filet Ball</option>
      <option value="gigaton">Gigamasse Ball de Hisui</option>
      <option value="premier">Honor Ball</option>
      <option value="ultra">Hyper Ball</option>
      <option value="hisuian-ultra">Hyper Ball de Hisui</option>
      <option value="love">Love Ball</option>
      <option value="moon">Lune Ball</option>
      <option value="luxury">Luxe Ball</option>
      <option value="heavy">Masse Ball</option>
      <option value="hisuian-heavy">Masse Ball de Hisui</option>
      <option value="master">Master Ball</option>
      <option value="leaden">Mégamasse Ball de Hisui</option>
      <option value="cherish">Mémoire Ball</option>
      <option value="level">Niveau Ball</option>
      <option value="origin">Origine Ball de Hisui</option>
      <option value="feather">Plume Ball de Hisui</option>
      <option value="poke" selected>Poké Ball</option>
      <option value="hisuian-poke">Poké Ball de Hisui</option>
      <option value="jet">Propulse Ball de Hisui</option>
      <option value="quick">Rapide Ball</option>
      <option value="dream">Rêve Ball</option>
      <option value="safari">Safari Ball</option>
      <option value="dive">Scuba Ball</option>
      <option value="heal">Soin Ball</option>
      <option value="dusk">Sombre Ball</option>
      <option value="fast">Speed Ball</option>
      <option value="sport">Sport Ball</option>
      <option value="great">Super Ball</option>
      <option value="hisuian-great">Super Ball de Hisui</option>
      <option value="beast">Ultra Ball</option>
      <option value="strange">Étrange Ball</option>
    </select>
  </fieldset>


  <!-- Origine -->
  <div class="pokemon-data">
    <fieldset>
      <legend>Origine</legend>

      <input type="radio" name="checkmark" id="checkmark-none" value="old" checked>
      <label for="checkmark-none">Autre</label>
  
      <input type="radio" name="checkmark" id="checkmark-paldea" value="paldea">
      <label for="checkmark-paldea">
        <span>
          <span class="icon" data-icon="origin-mark/paldea"></span>
          Paldea
        </span>
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-hisui" value="hisui">
      <label for="checkmark-hisui">
        <span>
          <span class="icon" data-icon="origin-mark/hisui"></span>
          Hisui
        </span>
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-bdsp" value="sinnoh-gen8">
      <label for="checkmark-bdsp">
        <span>
          <span class="icon" data-icon="origin-mark/sinnoh-gen8"></span>
          Sinnoh (DÉ/PS)
        </span>
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-galar" value="galar">
      <label for="checkmark-galar">
        <span>
          <span class="icon" data-icon="origin-mark/galar"></span>
          Galar
        </span>
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-letsgo" value="lets-go">
      <label for="checkmark-letsgo">
        <span>
          <span class="icon" data-icon="origin-mark/lets-go"></span>
          Kanto (Let's Go)
        </span>
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-alola" value="clover">
      <label for="checkmark-alola">
        <span>
          <span class="icon" data-icon="origin-mark/clover"></span>
          Alola
        </span>
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-kalos" value="pentagon">
      <label for="checkmark-kalos">
        <span>
          <span class="icon" data-icon="origin-mark/pentagon"></span>
          Kalos
        </span>
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-vc" value="game-boy">
      <label for="checkmark-vc">
        <span>
          <span class="icon" data-icon="origin-mark/game-boy"></span>
          Console Virtuelle
        </span>
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-go" value="go">
      <label for="checkmark-go">
        <span>
          <span class="icon" data-icon="origin-mark/go"></span>
          Pokémon GO
        </span>
      </label>
    </fieldset>

    <fieldset>
      <legend>Gène</legend>

      <input type="radio" name="gene" id="gene-none" value="0" checked>
      <label for="gene-none">Aucun</label>

      <input type="radio" name="gene" id="gene-gigamax" value="gigamax">
      <label for="gene-gigamax">
        <span>
          <span class="icon" data-icon="gene/gigantamax"></span>
          Gigamax
        </span>
      </label>

      <input type="radio" name="gene" id="gene-alpha" value="alpha">
      <label for="gene-alpha">
        <span>
          <span class="icon" data-icon="gene/alpha"></span>
          Baron
        </span>
      </label>
    </fieldset>
  </div>


  <!-- Données de légitimité -->
  <div class="legality-data">
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