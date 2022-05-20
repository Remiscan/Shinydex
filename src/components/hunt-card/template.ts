const template = document.createElement('template');
template.innerHTML = `
<form class="pokemon-card hunt-card" id="hunt-{id}">
  <div class="hunt-loader">
    <load-spinner></load-spinner>
    <i class="material-icons"></i>
  </div>

  <pokemon-sprite size="112"></pokemon-sprite>

  <div class="hunt-edit">
    <span>Mode édit.</span>
  </div>



  <!-- Espèce, forme, jeu, méthode -->

  <div class="on-top">
    <div class="titre-options">
      <span><label for="hunt-{id}-espece">Pokémon :</label></span>
    </div>
    <div class="liste-options">
      <input type="text" id="hunt-{id}-espece" list="datalist-pokedex" autocomplete="off" placeholder="Bulbizarre" size="8">
      <select id="hunt-{id}-forme">
        <option value="">Forme normale</option>
      </select>
    </div>

    <div class="jeu-methode">
      <span class="icones jeu"></span>
      <div class="option-jeu">
        <div class="titre-options">
          <span><label for="hunt-{id}-jeu">Jeu :</label></span>
        </div>
        <input type="text" id="hunt-{id}-jeu" list="datalist-jeux" autocomplete="off" placeholder="Epee" size="8">
      </div>
      <div class="option-methode">
        <div class="titre-options">
          <span><label for="hunt-{id}-methode">Méthode :</label></span>
        </div>
        <select id="hunt-{id}-methode">
          <option>Sauvage</option>
        </select>
      </div>
    </div>
  </div>



  <!-- Compteur de rencontres -->

  <div class="sous-titre">
    <span><label for="hunt-{id}-compteur">Compteur de rencontres :</label></span>
  </div>

  <div class="liste-options options-compteur">
    <button type="button" class="icone bouton-compteur sub ghost">
      <i class="material-icons">remove</i>
    </button>
    <input type="number" id="hunt-{id}-compteur" min="0" max="999999" value="0">
    <button type="button" class="icone bouton-compteur add">
      <i class="material-icons">add</i>
    </button>
  </div>



  <!-- Bonus de Legends Arceus -->

  <div class="titre-options options-bonus-legends-arceus">
    <span>Niveau de recherches de la page Pokédex</span>
  </div>

  <div class="liste-options options-bonus-legends-arceus">
    <input type="radio" name="hunt-{id}-dex-research" id="hunt-{id}-dex-incomplete" value="0" checked>
    <label for="hunt-{id}-dex-incomplete" class="radio">
      <span>Page incomplète (niv <9)</span>
    </label>

    <input type="radio" name="hunt-{id}-dex-research" id="hunt-{id}-dex-complete" value="1">
    <label for="hunt-{id}-dex-complete" class="radio">
      <span>Page complétée (niv 10)</span>
    </label>

    <input type="radio" name="hunt-{id}-dex-research" id="hunt-{id}-dex-perfect" value="2">
    <label for="hunt-{id}-dex-perfect" class="radio">
      <span>Page parfaite <shiny-stars></shiny-stars></span>
    </label>
  </div>



  <!-- Bonus de Let's Go Pikachu / Évoli -->

  <div class="titre-options options-compteur-chaine-letsgo">
    <span>Parfum utilisé :</span>
  </div>

  <div class="liste-options options-compteur-chaine-letsgo">
    <input type="radio" name="hunt-{id}-compteur-leurre" id="hunt-{id}-compteur-leurre-non" value="0" checked>
    <label for="hunt-{id}-compteur-leurre-non" class="radio">
      <span class="texte">Non</span>
    </label>

    <input type="radio" name="hunt-{id}-compteur-leurre" id="hunt-{id}-compteur-leurre-oui" value="1">
    <label for="hunt-{id}-compteur-leurre-oui" class="radio">
      <span class="texte">Oui</span>
    </label>
  </div>



  <!-- Bonus de Ultra Soleil / Lune -->

  <div class="cote-a-cote options-compteur-breche">
    <div class="liste-options">
      <div class="titre-options">
        <span><label for="hunt-{id}-compteur-distance">Distance :</label></span>
      </div>
      <input type="text" id="hunt-{id}-compteur-distance" inputmode="numeric" pattern="[0-9]*" value="0">
    </div>

    <div class="liste-options">
      <div class="titre-options">
        <span><label for="hunt-{id}-compteur-anneaux">Anneaux :</label></span>
      </div>
      <select id="hunt-{id}-compteur-anneaux">
        <option selected>0</option>
        <option>1</option>
        <option>2</option>
        <option>3</option>
      </select>
    </div>
  </div>



  <!-- Boutons Capturé et Annuler -->

  <div class="form-element boutons">
    <button type="button" class="bouton-hunt-remove ghost danger">
      <i class="material-icons">delete_forever</i>
      <span>Annuler</span>
    </button>

    <button type="button" class="bouton-hunt-remove bouton-hunt-edit ghost danger">
      <i class="material-icons">cancel</i>
      <span>Annuler</span>
    </button>

    <button type="button" class="bouton-hunt-caught">
      <i class="material-icons">done</i>
      <span>Capturé</span>
    </button>
  </div>



  <!-- Surnom, date, ball -->

  <div class="sous-titre caught">
    <span>Données de la capture :</span>
  </div>

  <div class="cote-a-cote caught">
    <div class="liste-options">
      <div class="titre-options">
        <span><label for="hunt-{id}-surnom">Surnom :</label></span>
      </div>
      <input type="text" id="hunt-{id}-surnom">
    </div>

    <div class="liste-options">
      <div class="titre-options">
        <span><label for="hunt-{id}-date">Date de capture :</label></span>
      </div>
      <input type="date" id="hunt-{id}-date" min="1996-02-27">
    </div>
  </div>

  <div class="cote-a-cote caught">
    <div class="liste-options ball">
      <div class="titre-options">
        <span><label for="hunt-{id}-ball">Capturé avec :</label></span>
      </div>
      <span class="pkspr item ball-poke"></span>
      <select id="hunt-{id}-ball">
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
    </div>
  </div>



  <!-- Origine, charme chroma, légitimité -->

  <div class="sous-titre caught">
    <span>Détails supplémentaires :</span>
  </div>

  <div class="titre-options caught">
    <span>Origine :</span>
  </div>

  <div class="liste-options caught">
    <input type="radio" name="hunt-{id}-checkmark" id="hunt-{id}-checkmark-none" value="0" checked>
    <label for="hunt-{id}-checkmark-none" class="radio checkmark">
      <span class="texte">Autre</span>
    </label>

    <input type="radio" name="hunt-{id}-checkmark" id="hunt-{id}-checkmark-hisui" value="8">
    <label for="hunt-{id}-checkmark-hisui" class="radio checkmark">
      <span class="icones explain hisuiborn"></span>
      <span class="texte">Hisui</span>
    </label>

    <input type="radio" name="hunt-{id}-checkmark" id="hunt-{id}-checkmark-bdsp" value="7">
    <label for="hunt-{id}-checkmark-bdsp" class="radio checkmark">
      <span class="icones explain bdspborn"></span>
      <span class="texte">Sinnoh (DÉ/PS)</span>
    </label>

    <input type="radio" name="hunt-{id}-checkmark" id="hunt-{id}-checkmark-galar" value="6">
    <label for="hunt-{id}-checkmark-galar" class="radio checkmark">
      <span class="icones explain galarborn"></span>
      <span class="texte">Galar</span>
    </label>

    <input type="radio" name="hunt-{id}-checkmark" id="hunt-{id}-checkmark-letsgo" value="4">
    <label for="hunt-{id}-checkmark-letsgo" class="radio checkmark">
      <span class="icones explain letsgoborn"></span>
      <span class="texte">Kanto (Let's Go)</span>
    </label>

    <input type="radio" name="hunt-{id}-checkmark" id="hunt-{id}-checkmark-alola" value="2">
    <label for="hunt-{id}-checkmark-alola" class="radio checkmark">
      <span class="icones explain alolaborn"></span>
      <span class="texte">Alola</span>
    </label>

    <input type="radio" name="hunt-{id}-checkmark" id="hunt-{id}-checkmark-kalos" value="1">
    <label for="hunt-{id}-checkmark-kalos" class="radio checkmark">
      <span class="icones explain kalosborn"></span>
      <span class="texte">Kalos</span>
    </label>

    <input type="radio" name="hunt-{id}-checkmark" id="hunt-{id}-checkmark-vc" value="3">
    <label for="hunt-{id}-checkmark-vc" class="radio checkmark">
      <span class="icones explain vcborn"></span>
      <span class="texte">Console Virtuelle</span>
    </label>

    <input type="radio" name="hunt-{id}-checkmark" id="hunt-{id}-checkmark-go" value="5">
    <label for="hunt-{id}-checkmark-go" class="radio checkmark">
      <span class="icones explain goborn"></span>
      <span class="texte">Pokémon GO</span>
    </label>
  </div>

  <div class="titre-options caught">
    <span>Charme chroma possédé :</span>
  </div>

  <div class="liste-options caught">
    <input type="radio" name="hunt-{id}-charm" id="hunt-{id}-charm-non" value="0" checked>
    <label for="hunt-{id}-charm-non" class="radio charm">
      <span class="texte">Non</span>
    </label>

    <input type="radio" name="hunt-{id}-charm" id="hunt-{id}-charm-oui" value="1">
    <label for="hunt-{id}-charm-oui" class="radio charm">
      <span class="icones explain charm"></span>
      <span class="texte">Oui</span>
    </label>
  </div>

  <div class="titre-options caught options-DO">
    <span><span class="oeuf">Œuf</span><span class="raid">Raid</span> trouvé dans mon jeu :</span>
  </div>

  <div class="liste-options caught options-DO">
    <input type="radio" name="hunt-{id}-DO" id="hunt-{id}-DO-oui" value="1" checked>
    <label for="hunt-{id}-DO-oui" class="radio DO">
      <span class="icones explain mine"></span>
      <span class="texte">Oui</span>
    </label>

    <input type="radio" name="hunt-{id}-DO" id="hunt-{id}-DO-non" value="0">
    <label for="hunt-{id}-DO-non" class="radio DO">
      <span class="texte">Non</span>
    </label>
  </div>

  <div class="titre-options caught options-legit">
    <span>Pokémon légitime :</span>
  </div>

  <div class="liste-options caught options-legit">
    <input type="radio" name="hunt-{id}-hacked" id="hunt-{id}-hacked-non" value="0" checked>
    <label for="hunt-{id}-hacked-non" class="radio hacked">
      <span class="texte">Legit</span>
    </label>

    <input type="radio" name="hunt-{id}-hacked" id="hunt-{id}-hacked-maybe" value="1">
    <label for="hunt-{id}-hacked-maybe" class="radio hacked">
      <span class="icones explain ptethack"></span>
      <span class="texte">Pas sûr</span>
    </label>

    <input type="radio" name="hunt-{id}-hacked" id="hunt-{id}-hacked-yes" value="2">
    <label for="hunt-{id}-hacked-yes" class="radio hacked">
      <span class="icones explain hack"></span>
      <span class="texte">Hacké</span>
    </label>

    <input type="radio" name="hunt-{id}-hacked" id="hunt-{id}-hacked-clone" value="3">
    <label for="hunt-{id}-hacked-clone" class="radio hacked">
      <span class="icones explain clone"></span>
      <span class="texte">Cloné</span>
    </label>
  </div>

  <div class="titre-options caught options-horsChasse">
    <span>Trouvé pendant une shasse :</span>
  </div>

  <div class="liste-options caught options-horsChasse">
    <input type="radio" name="hunt-{id}-horsChasse" id="hunt-{id}-horsChasse-oui" value="0" checked>
    <label for="hunt-{id}-horsChasse-oui" class="radio horsChasse">
      <span class="texte">Oui</span>
    </label>

    <input type="radio" name="hunt-{id}-horsChasse" id="hunt-{id}-horsChasse-non" value="1">
    <label for="hunt-{id}-horsChasse-non" class="radio horsChasse">
      <span class="icones explain lucky"></span>
      <span class="texte">Non</span>
    </label>
  </div>



  <!-- Notes -->

  <div class="sous-titre caught">
    <span>Notes additionnelles :</span>
  </div>

  <div class="liste-options caught">
    <textarea id="hunt-{id}-notes" rows="3"></textarea>
  </div>

  <div class="form-element boutons caught">
    <button type="button" class="bouton-hunt-eraseDB bouton-hunt-edit danger">
      <i class="material-icons">delete_forever</i>
      <span>Supprimer</span>
    </button>

    <button type="submit" class="bouton-hunt-submit">
      <i class="material-icons">backup</i>
      <span>Enregistrer</span>
    </button>
  </div>
</form>
`;

export default template;