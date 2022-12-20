const template = document.createElement('template');
template.innerHTML = /*html*/`
<form>
  <pokemon-sprite size="112"></pokemon-sprite>

  <div class="hunt-edit">
    <span>Mode édit.</span>
  </div>


  <!-- Espèce, forme -->
  <fieldset class="pokemon-inputs">
    <legend>Pokémon</legend>

    <input type="text" name="species" list="datalist-pokedex" autocomplete="off" placeholder="Bulbizarre" size="8">
    <select name="forme">
      <option value="">Forme normale</option>
    </select>
  </fieldset>


  <!-- Jeu, méthode -->
  <fieldset class="game-method-inputs">
    <legend>Jeu et méthode</legend>

    <label for="game">Jeu :</label>
    <input type="text" name="game" id="game" list="datalist-jeux" autocomplete="off" placeholder="Epee" size="8">

    <label for="method">Méthode :</label>
    <select name="method" id="method">
      <option>Sauvage</option>
    </select>
  </fieldset>


  <!-- Compteur de rencontres -->
  <fieldset class="counter-inputs">
    <legend>Compteur de rencontres</legend>

    <button type="button">
      <i class="material-icons">remove</i>
    </button>
    <input type="number" name="counter" id="counter" min="0" max="999999" value="0">
    <button type="button">
      <i class="material-icons">add</i>
    </button>
  </fieldset>


  <!-- Bonus de Legends Arceus (PLA) -->
  <div class="pla-inputs">
    <fieldset>
      <legend>Niveau de recherche de la page du Pokédex</legend>

      <input type="radio" name="pla-dex-research" id="pla-dex-incomplete" value="0" checked>
      <label for="pla-dex-incomplete" class="radio">
        <span>Page incomplète (niv &lt;9)</span>
      </label>

      <input type="radio" name="pla-dex-research" id="pla-dex-complete" value="1">
      <label for="pla-dex-complete" class="radio">
        <span>Page complétée (niv 10)</span>
      </label>

      <input type="radio" name="pla-dex-research" id="pla-dex-perfect" value="2">
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
    <button type="button" class="cancel">
      <i class="material-icons">cancel</i>
      <span>Annuler</span>
    </button>

    <button type="button" class="capture">
      <i class="material-icons">done</i>
      <span>Capturé</span>
    </button>
  </div>


  <!-- Surnom, date, ball -->
  <fieldset class="capture-data">
    <legend>Données de la capture</legend>

    <label for="name">Surnom</label>
    <input type="text" name="name" id="name">

    <label for="date">Date de capture</label>
    <input type="date" name="date" id="date" min="1996-02-27">

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

      <input type="radio" name="checkmark" id="checkmark-none" value="0" checked>
      <label for="checkmark-none">Autre</label>
  
      <input type="radio" name="checkmark" id="checkmark-paldea" value="9">
      <label for="checkmark-paldea">
        <span class="icones explain paldeaborn"></span>
        Paldea
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-hisui" value="8">
      <label for="checkmark-hisui">
        <span class="icones explain hisuiborn"></span>
        Hisui
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-bdsp" value="7">
      <label for="checkmark-bdsp">
        <span class="icones explain bdspborn"></span>
        Sinnoh (DÉ/PS)
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-galar" value="6">
      <label for="checkmark-galar">
        <span class="icones explain galarborn"></span>
        Galar
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-letsgo" value="4">
      <label for="checkmark-letsgo">
        <span class="icones explain letsgoborn"></span>
        Kanto (Let's Go)
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-alola" value="2">
      <label for="checkmark-alola">
        <span class="icones explain alolaborn"></span>
        Alola
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-kalos" value="1">
      <label for="checkmark-kalos">
        <span class="icones explain kalosborn"></span>
        Kalos
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-vc" value="3">
      <label for="checkmark-vc">
        <span class="icones explain vcborn"></span>
        Console Virtuelle
      </label>
  
      <input type="radio" name="checkmark" id="checkmark-go" value="5">
      <label for="checkmark-go">
        <span class="icones explain goborn"></span>
        Pokémon GO
      </label>
    </fieldset>

    <fieldset>
      <legend>Gène</legend>

      <input type="radio" name="gene" id="gene-none" value="0" checked>
      <label for="gene-none">Aucun</label>

      <input type="radio" name="gene" id="gene-gigamax" value="gigamax">
      <label for="gene-gigamax">
        <span class="icones explain gigamax"></span>
        Gigamax
      </label>

      <input type="radio" name="gene" id="gene-alpha" value="alpha">
      <label for="gene-alpha">
        <span class="icones explain alpha"></span>
        Baron
      </label>
    </fieldset>
  </div>


  <!-- Données de légitimité -->
  <div class="legality-data">
    <input type="checkbox" name="shiny-charm" id="shiny-charm">
    <label for="shiny-charm">
      <span class="icones explain charm"></span>
      Charme chroma possédé
    </label>

    <input type="checkbox" name="not-hunted" id="not-hunted">
    <label for="not-hunted">
      <span class="icones explain lucky"></span>
      Trouvé au hasard, sans le chasser
    </label>

    <input type="checkbox" name="from-my-game" id="from-my-game">
    <label for="from-my-game">
      <span class="icones explain mine"></span>
      <span class="egg">Œuf</span><span class="raid">Raid</span> trouvé dans mon jeu
    </label>

    <fieldset>
      <legend>Légitimité du Pokémon</legend>

      <input type="radio" name="hacked" id="hacked-no" value="0" checked>
      <label for="hacked-no">Legit</label>

      <input type="radio" name="hacked" id="hacked-maybe" value="1">
      <label for="hacked-maybe">
        <span class="icones explain ptethack"></span>
        Pas sûr
      </label>

      <input type="radio" name="hacked" id="hacked-yes" value="2">
      <label for="hacked-yes">
        <span class="icones explain hack"></span>
        Hacké
      </label>

      <input type="radio" name="hacked" id="hacked-clone" value="3">
      <label for="hacked-clone">
        <span class="icones explain clone"></span>
        Cloné
      </label>
    </fieldset>
  </div>


  <!-- Notes -->
  <label for="notes">Notes additionnelles</label>
  <textarea name="notes" id="notes" rows="3"></textarea>


  <!-- Boutons supprimer / enregistrer -->
  <button type="button" class="delete">
    <i class="material-icons">delete_forever</i>
    Supprimer
  </button>

  <button type="button" class="submit">
    <i class="material-icons">backup</i>
    Enregistrer
  </button>
</form>
`;

export default template;