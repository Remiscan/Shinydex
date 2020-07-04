import { Pokemon, Shiny } from './mod_Pokemon.js';
import { checkUpdate } from './mod_appLifeCycle.js';
import { notify } from './mod_notification.js';
import { wait } from './mod_Params.js';
import { navigate } from './mod_navigate.js';
import { DexDatalist } from './mod_DexDatalist.js';

const huntStorage = localforage.createInstance({
  name: 'remidex',
  storeName: 'hunts',
  driver: localforage.INDEXEDDB
});

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
  }

  static async build({
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

    const hunt = new Hunt({ dexid, forme, surnom, methode, compteur, date, jeu, ball, description, origin, monjeu, charm, hacked, aupif, id, caught });
    await huntStorage.setItem(id, hunt);
    hunt.buildHunt();
    return hunt;
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
    boutonAdd.addEventListener('click', async event => {
      event.preventDefault();
      inputCompteur.value = (inputCompteur.value < 999999) ? parseInt(inputCompteur.value) + 1 : 999999;
      await this.updateHunt();
    });
    boutonSub.addEventListener('click', async event => {
      event.preventDefault();
      inputCompteur.value = (inputCompteur.value > 0) ? parseInt(inputCompteur.value) - 1 : 0;
      await this.updateHunt();
    });

    // Active le bouton "shiny capturé"
    const boutonCaught = card.querySelector('.bouton-hunt-caught');
    boutonCaught.addEventListener('click', async event => {
      event.preventDefault();
      boutonCaught.parentElement.parentElement.classList.toggle('caught');
      if (card.querySelector('input[type="date"]').value == '')
        card.querySelector('input[type="date"]').value = new Date().toISOString().split('T')[0];
      if (boutonCaught.parentElement.parentElement.classList.contains('caught'))
        this.caught = true;
      else
        this.caught = false;
      await this.updateHunt();
    });

    // Active le bouton "supprimer"
    const boutonSupprimer = card.querySelector('.bouton-hunt-remove');
    const boutonAnnuler = card.querySelector('.bouton-hunt-edit');
    [boutonSupprimer, boutonAnnuler].forEach(bouton => {
      bouton.addEventListener('click', async event => {
        event.preventDefault();
  
        const span = bouton.querySelector('span');
        if (span.innerHTML == 'Supprimer' || span.innerHTML == 'Annuler')
        {
          span.innerHTML = 'Vraiment ?';
          setTimeout(() => span.innerHTML = 'Supprimer', 3000);
        }
        else if (span.innerHTML == 'Vraiment ?')
        {
          await this.destroyHunt();
        }
      });
    });

    // Active le bouton "enregistrer"
    const boutonSubmit = card.querySelector('.bouton-hunt-submit');
    boutonSubmit.addEventListener('click', async event => {
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
        await this.submitHunt();
      }
    });

    // Détecte les modifications du formulaire
    card.addEventListener('input', async () => await this.updateHunt());

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
  async updateHunt()
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

    k = await huntStorage.getItem(this.id);
    if (k == null) throw 'Chasse inexistante';
    return await huntStorage.setItem(this.id, this);
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
  async destroyHunt()
  {
    const k = await huntStorage.getItem(this.id);
    if (k == null) throw 'Chasse inexistante';

    const keys = await huntStorage.keys();
    if (keys.length == 0) document.querySelector('#chasses-en-cours').classList.add('vide');

    const card = document.getElementById('hunt-' + this.id);
    card.remove();

    return await huntStorage.removeItem(this.id);
  }


  // Envoie la chasse dans la BDD
  async submitHunt()
  {
    document.body.dataset.huntUploading = true;

    // On demande au service worker d'upload la chasse dans la BDD en ligne
    if (!'serviceWorker' in navigator || !'syncManager' in window)
      throw 'Upload de la chasse impossible.';

    const reg = await navigator.serviceWorker.ready;
    console.log('[sync] Envoi de la chasse au sw');
    try {
      await reg.sync.register('HUNT-ADD-' + this.id);
      // Faire "comme si" la chasse était envoyée, c'est-à-dire :
      // - masquer la carte de la chasse après une animation d'envoi
      // - ajouter le shiny à la BDD locale
      // - ajouter la carte du shiny à la liste, et re-filtrer, etc
      // Si la chasse a bien été envoyée, la prochaine mise à jour correspondra automatiquement
      // à ces modifications manuelles et l'utilisateur ne verra pas la différence.
      // Sinon, la prochaine mise à jour effacera le nouveau shiny de la BDD locale,
      // et la chasse sera affichée dans la section "chasse" comme si de rien n'était.
      // /!\ Il faut gérer le masquage de la chasse tant qu'elle est ajoutée manuellement à la BDD
      //     locale mais n'a pas encore été confirmée ajoutée à la BDD distante.
      //     Pour cela, je peux ajouter une propriété "huntid" au shiny dans shinyStorage,
      //     récupérer la liste des shiny ayant cette propriété, et comparer chaque chasse
      //     à cette liste avant de l'afficher.
    } catch(error) {
      console.log('[sync] Erreur lors de la requête de synchronisation');
    }
  }
}



////////////////////////////////////////////////////////////
// Créer une chasse pour mettre à jour une carte dans la BDD
export async function updateHunt(id) {
  let k = await huntStorage.getItem(id);
  if (k != null) {
    const message = 'Cette chasse est déjà en cours d\'édition.';
    notify(message);
    return;
  }

  const pkmn = await shinyStorage.getItem(id);
  const parseTheseInts = ['id', 'origin', 'monjeu', 'charm', 'hacked', 'aupif'];
  parseTheseInts.forEach(int => pkmn[int] = parseInt(pkmn[int]));
  pkmn.dexid = parseInt(pkmn['numero_national']);
  const hunt = await Hunt.build(pkmn);
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
async function initHunts() {
  const keys = await huntStorage.keys();
  if (keys.length == 0)
    document.querySelector('#chasses-en-cours').classList.add('vide');
  else
    keys.forEach(async k => Hunt.build(await huntStorage.getItem(k)));
}