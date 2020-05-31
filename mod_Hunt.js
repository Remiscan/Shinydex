import { Pokemon, Shiny } from './mod_Pokemon.js';
import { checkUpdate } from './mod_appLifeCycle.js';
import { notify } from './mod_notification.js';
import { wait } from './mod_Params.js';
import { navigate } from './mod_navigate.js';
import { DexDatalist } from './mod_DexDatalist.js';

let currentHunts = JSON.parse(localStorage.getItem('remidex/chasses-en-cours')) || [];

export class Hunt {
  constructor({
    dexid = 0,
    forme = '',
    surnom = '',
    methode = '',
    compteur = 0,
    date = '',
    jeu = '',
    ball = 'poke',
    description = '',
    origin = 0,
    monjeu = 1,
    charm = 0,
    hacked = 0,
    aupif = 0,
    id = new Date().getTime(),
    caught = false
  } = {}) {
    this.dexid = dexid;
    this.forme = forme;
    this.surnom = surnom;
    this.methode = methode;
    this.compteur = compteur;
    this.date = date;
    this.jeu = jeu;
    this.ball = ball;
    this.description = description;
    this.origin = origin;
    this.monjeu = monjeu;
    this.charm = charm;
    this.hacked = hacked;
    this.aupif = aupif;
    this.id = id;
    this.caught = caught;

    const k = currentHunts.findIndex(hunt => hunt.id == this.id);
    if (k == -1) currentHunts.push(this);

    this.buildHunt();
  }


  // Construit la carte qui affiche la chasse en HTML
  buildHunt()
  {
    const template = document.getElementById('template-hunt');
    const card = template.content.cloneNode(true).querySelector('.hunt-card');
    card.id = 'hunt-' + this.id;
    if (this.dexid == 0) card.classList.add('new');
    Array.from(card.querySelectorAll('[id^="hunt-{id}"]')).forEach(el => el.id = el.id.replace('{id}', this.id));
    Array.from(card.querySelectorAll('[for^="hunt-{id}"]')).forEach(el => el.setAttribute('for', el.getAttribute('for').replace('{id}', this.id)));
    Array.from(card.querySelectorAll('[name^="hunt-{id}"]')).forEach(el => el.name = el.name.replace('{id}', this.id));

    if (this.id < 825379200) card.classList.add('edit');

    // Active le bouton "compteur++";
    const boutonAdd = card.querySelector('.bouton-compteur.add');
    const boutonSub = card.querySelector('.bouton-compteur.sub');
    const inputCompteur = card.querySelector('input[id$="-compteur"]');
    boutonAdd.addEventListener('click', event => {
      event.preventDefault();
      inputCompteur.value = (inputCompteur.value < 999999) ? parseInt(inputCompteur.value) + 1 : 999999;
      this.updateHunt();
    });
    boutonSub.addEventListener('click', event => {
      event.preventDefault();
      inputCompteur.value = (inputCompteur.value > 0) ? parseInt(inputCompteur.value) - 1 : 0;
      this.updateHunt();
    });

    // Active le bouton "shiny capturé"
    const boutonCaught = card.querySelector('.bouton-hunt-caught');
    boutonCaught.addEventListener('click', event => {
      event.preventDefault();
      boutonCaught.parentElement.parentElement.classList.toggle('caught');
      if (card.querySelector('input[type="date"]').value == '')
        card.querySelector('input[type="date"]').value = new Date().toISOString().split('T')[0];
      if (boutonCaught.parentElement.parentElement.classList.contains('caught'))
        this.caught = true;
      else
        this.caught = false;
      this.updateHunt();
    });

    // Active le bouton "supprimer"
    const boutonSupprimer = card.querySelector('.bouton-hunt-remove');
    const boutonAnnuler = card.querySelector('.bouton-hunt-edit');
    [boutonSupprimer, boutonAnnuler].forEach(bouton => {
      bouton.addEventListener('click', event => {
        event.preventDefault();
  
        const span = bouton.querySelector('span');
        if (span.innerHTML == 'Supprimer' || span.innerHTML == 'Annuler')
        {
          span.innerHTML = 'Vraiment ?';
          setTimeout(() => span.innerHTML = 'Supprimer', 3000);
        }
        else if (span.innerHTML == 'Vraiment ?')
        {
          this.destroyHunt();
        }
      });
    });

    // Active le bouton "enregistrer"
    const boutonSubmit = card.querySelector('.bouton-hunt-submit');
    boutonSubmit.addEventListener('click', event => {
      event.preventDefault();

      if (!navigator.onLine)
        return notify('Pas de connexion internet');

      const span = boutonSubmit.querySelector('span');
      if (span.innerHTML == 'Enregistrer dans mes chromatiques')
      {
        // Gestion des erreurs de formulaire
        const erreurs = [];
        if (this.dexid == 0) erreurs.push('Pokémon');
        if (this.jeu == '') erreurs.push('jeu');
        if (this.methode == '')  erreurs.push('méthode');
        if (this.date == '') erreurs.push('date');

        if (erreurs.length > 0) {
          let message = `Les champs suivants sont mal remplis : `;
          erreurs.forEach(e => message += `${e}, `);
          message = message.replace(/,\ $/, '.');
          return notify(message);
        }

        span.innerHTML = 'Confirmer ?';
        setTimeout(() => span.innerHTML = 'Enregistrer dans mes chromatiques', 3000);
      }
      else if (span.innerHTML == 'Confirmer ?')
      {
        this.submitHunt();
      }
    });

    // Détecte les modifications du formulaire
    card.addEventListener('input', () => this.updateHunt());

    document.querySelector('#chasses-en-cours>.section-contenu').appendChild(card);
    document.querySelector('#chasses-en-cours').classList.remove('vide');

    // On met à jour la carte avec les valeurs de this
    this.updateSprite();
    this.updateJeu();
    this.updateBall();
    let k = Pokemon.pokemonData.findIndex(pkmn => pkmn.dexid == this.dexid);
    document.getElementById(`hunt-${this.id}-espece`).value = (k > 0) ? Pokemon.pokemonData[k].namefr : '';
    this.genereFormes();
    document.getElementById(`hunt-${this.id}-forme`).value = this.forme;
    document.getElementById(`hunt-${this.id}-surnom`).value = this.surnom;
    
    if (this.methode == 'Ultra-Brèche') {
      document.getElementById(`hunt-${this.id}-compteur-distance`).value = JSON.parse(this.compteur).distance;
      document.getElementById(`hunt-${this.id}-compteur-anneaux`).value = JSON.parse(this.compteur).rings;
      document.getElementById(`hunt-${this.id}-compteur`).value = 0;
    } else if (this.methode == 'Chaîne de captures') {
      document.getElementById(`hunt-${this.id}-compteur`).value = JSON.parse(this.compteur).chain;
      switch (JSON.parse(this.compteur).lure) {
        case true:
          document.querySelector(`input[id="hunt-${this.id}-compteur-leurre-oui"]`).checked = true;
          break;
        default:
          document.querySelector(`input[id="hunt-${this.id}-compteur-leurre-non"]`).checked = true;
      }
      document.getElementById(`hunt-${this.id}-compteur`).value = 0;
    } else
    document.getElementById(`hunt-${this.id}-compteur`).value = parseInt(this.compteur);

    document.getElementById(`hunt-${this.id}-date`).value = this.date;
    document.getElementById(`hunt-${this.id}-jeu`).value = this.jeu;
    this.genereMethodes();
    document.getElementById(`hunt-${this.id}-methode`).value = this.methode;
    document.getElementById(`hunt-${this.id}-ball`).value = this.ball;
    document.getElementById(`hunt-${this.id}-description`).value = this.description;
    document.querySelector(`input[name="hunt-${this.id}-origin-icon"][value="${this.origin}"]`).checked = true;
    document.querySelector(`input[name="hunt-${this.id}-monjeu"][value="${this.monjeu}"]`).checked = true;
    document.querySelector(`input[name="hunt-${this.id}-charm"][value="${this.charm}"]`).checked = true;
    document.querySelector(`input[name="hunt-${this.id}-hacked"][value="${this.hacked}"]`).checked = true;
    document.querySelector(`input[name="hunt-${this.id}-aupif"][value="${this.aupif}"]`).checked = true;
    card.dataset.methode = this.methode;
    card.dataset.jeu = this.jeu;

    // Génère la liste des formes au choix d'un Pokémon
    // et génère la liste des Pokémon correspondants quand on commence à écrire un nom
    const inputEspece = card.querySelector('[list="datalist-pokedex"]');
    inputEspece.addEventListener('input', () => {
      this.genereFormes();
      new DexDatalist(inputEspece.value);
    });

    // Génère la liste des méthodes au choix du jeu
    const inputJeu = card.querySelector('[list=datalist-jeux]');
    inputJeu.addEventListener('input', () => this.genereMethodes());

    if (this.caught) card.classList.add('caught');

    if (this.dexid == 0) setTimeout(() => card.classList.remove('new'), 400);
  }


  // Génère la liste des formes à partir du Pokémon entré
  genereFormes()
  {
    const card = document.getElementById('hunt-' + this.id);
    const inputEspece = card.querySelector('[list="datalist-pokedex"]');
    const idFormes = inputEspece.id.replace('espece', 'forme');
    const select = document.getElementById(idFormes);
    select.innerHTML = '';

    const k = Pokemon.pokemonData.findIndex(pkmn => pkmn.namefr == inputEspece.value);
    if (k == -1)
      return 'Pokémon inexistant';
    else {
      const formes = Pokemon.pokemonData[k].formes.slice().sort((a, b) => { if (a.nom == '') return -1; else return 0;});
      formes.forEach(forme => {
        if (forme.noShiny == true)
          return;
        if (forme.dbid != '')
          select.innerHTML += `<option value="${forme.dbid}">${forme.nom}</option>`;
        else
          select.innerHTML += `<option value="" selected>${forme.nom || 'Forme normale'}</option>`;
      });
    }
  }


  // Génère la liste des méthodes à partir du jeu entré
  genereMethodes()
  {
    const card = document.getElementById('hunt-' + this.id);
    const inputJeu = card.querySelector('[list=datalist-jeux]');
    const idMethodes = inputJeu.id.replace('jeu', 'methode');
    const select = document.getElementById(idMethodes);
    select.innerHTML = '';

    const k = Pokemon.jeux.findIndex(jeu => jeu.nom == inputJeu.value);
    if (k == -1)
      return 'Jeu inexistant';
    else {
      const methodes = [];
      Shiny.allMethodes.forEach(methode => {
        const k = methode.jeux.findIndex(jeu => jeu.nom == inputJeu.value);
        if (k != -1)
          methodes.push(methode);
      });
      methodes.forEach(methode => {
        select.innerHTML += `<option>${methode.nom}</option>`;
      });
    }
  }


  // Met à jour l'objet Hunt à partir des modifications faites au formulaire
  updateHunt()
  {
    const card = document.getElementById('hunt-' + this.id);

    let k = Pokemon.pokemonData.findIndex(pkmn => pkmn.namefr == document.getElementById(`hunt-${this.id}-espece`).value);
    this.dexid = (k != -1) ? k : 0;
    this.forme = document.getElementById(`hunt-${this.id}-forme`).value;
    this.surnom = document.getElementById(`hunt-${this.id}-surnom`).value;
    this.methode = document.getElementById(`hunt-${this.id}-methode`).value;

    if (this.methode == 'Ultra-Brèche') {
      this.compteur = JSON.stringify({
        distance: parseInt(document.getElementById(`hunt-${this.id}-compteur-distance`).value),
        rings: parseInt(document.getElementById(`hunt-${this.id}-compteur-anneaux`).value)
      });
    } else if (this.methode == 'Chaîne de captures') {
      this.compteur = JSON.stringify({
        chain: parseInt(document.getElementById(`hunt-${this.id}-compteur`).value),
        lure: (document.querySelector(`input[name="hunt-${this.id}-compteur-leurre"]:checked`).value == 1) ? true : false
      });
    } else
      this.compteur = document.getElementById(`hunt-${this.id}-compteur`).value;
    
    this.date = document.getElementById(`hunt-${this.id}-date`).value;
    this.jeu = document.getElementById(`hunt-${this.id}-jeu`).value;
    this.ball = document.getElementById(`hunt-${this.id}-ball`).value;
    this.description = document.getElementById(`hunt-${this.id}-description`).value;
    this.origin = parseInt(document.querySelector(`input[name="hunt-${this.id}-origin-icon"]:checked`).value);
    this.monjeu = parseInt(document.querySelector(`input[name="hunt-${this.id}-monjeu"]:checked`).value);
    this.charm = parseInt(document.querySelector(`input[name="hunt-${this.id}-charm"]:checked`).value);
    this.hacked = parseInt(document.querySelector(`input[name="hunt-${this.id}-hacked"]:checked`).value);
    this.aupif = parseInt(document.querySelector(`input[name="hunt-${this.id}-aupif"]:checked`).value);

    card.dataset.methode = this.methode;
    card.dataset.jeu = this.jeu;

    this.updateSprite();
    this.updateJeu();
    this.updateBall();

    k = currentHunts.findIndex(hunt => hunt.id == this.id);
    if (k == -1) throw 'Chasse inexistante';
    currentHunts[k] = this;
    Hunt.saveHunts();
  }


  // Met à jour le sprite
  updateSprite()
  {
    const card = document.getElementById('hunt-' + this.id);
    const sprite = card.querySelector('.pokemon-sprite');

    const pkmn = new Pokemon(Pokemon.pokemonData[this.dexid]);
    const formes = pkmn.formes;
    const k = formes.findIndex(forme => forme.dbid == this.forme);
    const forme = formes[k];
    if (k != -1)
      sprite.style.setProperty('--sprite', `url('${pkmn.getSprite(forme, { shiny: this.caught })}'`);
    else
      sprite.style.setProperty('--sprite', `url('${pkmn.getSprite(formes[0], { shiny: this.caught })}'`);
  }


  // Met à jour l'icône de jeu
  updateJeu()
  {
    const card = document.getElementById('hunt-' + this.id);
    const icone = card.querySelector('.icones.jeu');

    const k = Pokemon.jeux.findIndex(jeu => jeu.nom == this.jeu);
    if (k != -1)
      icone.classList.add(this.jeu.replace(/ /g, ''));
    else
      icone.className = 'icones jeu';
  }


  // Met à jour l'icône de la Ball
  updateBall()
  {
    const card = document.getElementById('hunt-' + this.id);
    const icone = card.querySelector('.ball>.pkspr');

    icone.className = `pkspr item ball-${this.ball}`;
  }


  // Supprime la chasse complètement
  destroyHunt()
  {
    const k = currentHunts.findIndex(hunt => hunt.id == this.id);
    if (k == -1) throw 'Chasse inexistante';
    currentHunts.splice(k, 1);

    if (currentHunts.length == 0) document.querySelector('#chasses-en-cours').classList.add('vide');

    const card = document.getElementById('hunt-' + this.id);
    card.remove();

    Hunt.saveHunts();
  }


  // Envoie la chasse dans la BDD
  submitHunt()
  {
    document.body.dataset.huntUploading = true;

    const data = JSON.stringify(this);
    const formData = new FormData();
    formData.append('hunt', data);
    formData.append('mdp', localStorage.getItem('remidex/mdp-bdd'));

    console.log(data);
    return fetch('mod_sendHuntToDb.php', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      //response.text().then(r => console.log(r));
      if (response.status == 200)
        return response;
      else
        throw '[:(] Erreur ' + response.status + ' lors de la requête';
    })
    .then(response => response.json())
    .then(data => {
      if (data['mdp'] == false)
        throw '[:(] Mauvais mot de passe...';
      
      // Traiter la réponse et vérifier le bon ajout à la BDD
      console.log('Réponse reçue du serveur :', data);
      if (data['stored-data'] == false)
        throw '[:(] Chasse non stockée dans la BDD...';
      
      if (
        parseInt(data['stored-data']['numero_national']) == this.dexid
        && data['stored-data']['forme'] == this.forme
        && data['stored-data']['surnom'] == this.surnom
        && data['stored-data']['methode'] == this.methode
        && data['stored-data']['compteur'] == this.compteur
        && data['stored-data']['date'] == this.date
        && data['stored-data']['jeu'] == this.jeu
        && data['stored-data']['ball'] == this.ball
        && data['stored-data']['description'] == this.description
        && parseInt(data['stored-data']['origin']) == this.origin
        && parseInt(data['stored-data']['monjeu']) == this.monjeu
        && parseInt(data['stored-data']['charm']) == this.charm
        && parseInt(data['stored-data']['hacked']) == this.hacked
        && parseInt(data['stored-data']['aupif']) == this.aupif
      ) {
        return wait(2000)
        .then(() => {
          console.log('[:)] Chasse sauvegardée !');
          this.destroyHunt();
          checkUpdate();
          return;
        });
      } else {
        console.log(
          parseInt(data['stored-data']['numero_national']) == this.dexid,
          data['stored-data']['forme'] == this.forme,
          data['stored-data']['surnom'] == this.surnom,
          data['stored-data']['methode'] == this.methode,
          data['stored-data']['compteur'] == this.compteur,
          data['stored-data']['date'] == this.date,
          data['stored-data']['jeu'] == this.jeu,
          data['stored-data']['ball'] == this.ball,
          data['stored-data']['description'] == this.description,
          parseInt(data['stored-data']['origin']) == this.origin,
          parseInt(data['stored-data']['monjeu']) == this.monjeu,
          parseInt(data['stored-data']['charm']) == this.charm,
          parseInt(data['stored-data']['hacked']) == this.hacked,
          parseInt(data['stored-data']['aupif']) == this.aupif
        );
        throw '[:(] Erreur de copie pendant la sauvegarde de la chasse...';
      }
    })
    .catch(error => {
      console.error(error);
      notify(error);
      return;
    })
    .then(() => document.body.removeAttribute('data-hunt-uploading'));
  }


  // Sauvegarde les chasses
  static saveHunts() {
    localStorage.setItem('remidex/chasses-en-cours', JSON.stringify(currentHunts));
  }
}



////////////////////////////////////////////////////////////
// Créer une chasse pour mettre à jour une carte dans la BDD
export function updateHunt(id) {
  let k = currentHunts.findIndex(hunt => hunt.id == id);
  if (k != -1) {
    const message = 'Cette chasse est déjà en cours d\'édition.';
    notify(message);
    return;
  }

  const allShiny = JSON.parse(localStorage.getItem('remidex/data-shinies'));
   k = allShiny.findIndex(shiny => parseInt(shiny.id) == id);
  const pkmn = allShiny[k];
  const parseTheseInts = ['id', 'origin', 'monjeu', 'charm', 'hacked', 'aupif'];
  parseTheseInts.forEach(int => pkmn[int] = parseInt(pkmn[int]));
  pkmn.dexid = parseInt(pkmn['numero_national']);
  const hunt = new Hunt(pkmn);
  navigate('chasses-en-cours');
  console.log(hunt);
}



/*///////////////////////////
// Crée la datalist Pokédex
const datalistPokedex = document.getElementById('datalist-pokedex');
Pokemon.pokemonData.slice(1).forEach(pkmn => {
  datalistPokedex.innerHTML += `<option value="${pkmn.namefr}">`;
});*/

// Crée la datalist Jeux
const datalistJeux = document.getElementById('datalist-jeux');
Pokemon.jeux.forEach(jeu => {
  datalistJeux.innerHTML += `<option value="${jeu.nom}">`;
});



//////////////////////////////////////
// Initialise les chasses sauvegardées
if (currentHunts.length == 0) {
  Hunt.saveHunts();
  document.querySelector('#chasses-en-cours').classList.add('vide');
} else {
  // Créer une chasse par chasse sauvegardée
  currentHunts.forEach(hunt => new Hunt(hunt));
}