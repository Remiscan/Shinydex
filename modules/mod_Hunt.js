import { Pokemon, Shiny } from './mod_Pokemon.js';
import { notify } from './mod_notification.js';
import { wait, Params, loadAllImages } from './mod_Params.js';
import { navigate } from './mod_navigate.js';
import { DexDatalist } from './mod_DexDatalist.js';
import { deferCards } from './mod_filtres.js';
import { startBackup } from './mod_appLifeCycle.js';

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
    caught = false,
    uploaded = false
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
    this.uploaded = uploaded;
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
    caught = false,
    uploaded = false
  } = {}, start = false) {
    const hunt = new Hunt({ dexid, forme, surnom, methode, compteur, date, jeu, ball, description, origin, monjeu, charm, hacked, aupif, id, caught, uploaded });
    await huntStorage.setItem(String(id), hunt);
    await hunt.buildHunt(start);
    return hunt;
  }


  // Construit la carte qui affiche la chasse en HTML
  async buildHunt(start = false)
  {
    const template = document.getElementById('template-hunt');
    const card = template.content.cloneNode(true).querySelector('.hunt-card');
    card.id = 'hunt-' + this.id;
    //if (this.dexid == 0) card.classList.add('new');
    Array.from(card.querySelectorAll('[id^="hunt-{id}"]')).forEach(el => el.id = el.id.replace('{id}', this.id));
    Array.from(card.querySelectorAll('[for^="hunt-{id}"]')).forEach(el => el.setAttribute('for', el.getAttribute('for').replace('{id}', this.id)));
    Array.from(card.querySelectorAll('[name^="hunt-{id}"]')).forEach(el => el.name = el.name.replace('{id}', this.id));

    // 825379200 = timestamp du jour de la sortie de Pokémon au Japon
    const k = await shinyStorage.getItem(String(this.id));
    const edit = (k != null);
    //const edit = (this.id < 825379200) ? true : false;
    if (edit) card.classList.add('edit');

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

    // Active le bouton "annuler"
    const boutonEffacer = card.querySelector('.bouton-hunt-remove');
    const boutonAnnuler = card.querySelector('.bouton-hunt-edit');
    [boutonEffacer, boutonAnnuler].forEach(bouton => {
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
      if (span.innerHTML == 'Enregistrer')
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
        setTimeout(() => span.innerHTML = 'Enregistrer', 3000);
      }
      else if (span.innerHTML == 'Confirmer ?')
      {
        if (edit) await this.submitHunt(true);
        else await this.submitHunt();
      }
    });

    // Active le bouton "supprimer"
    const boutonSupprimer = card.querySelector('.bouton-hunt-eraseDB');
    boutonSupprimer.addEventListener('click', async event => {
      event.preventDefault();

      if (!edit)
        return notify('Cette chasse n\'est pas dans la base de données');

      if (!navigator.onLine)
        return notify('Pas de connexion internet');

      const span = boutonSupprimer.querySelector('span');
      if (span.innerHTML == 'Supprimer')
      {
        span.innerHTML = 'Vraiment ?';
        setTimeout(() => span.innerHTML = 'Supprimer', 3000);
      }
      else if (span.innerHTML == 'Vraiment ?')
      {
        await this.deleteHuntFromDB();
      }
    });

    // Détecte les modifications du formulaire
    card.addEventListener('input', async () => await this.updateHunt());

    document.querySelector('#chasses-en-cours>.section-contenu').appendChild(card);
    document.querySelector('#chasses-en-cours').classList.remove('vide');

    // Animation de la carte
    if (this.dexid == 0) {
      card.animate([
        { opacity: '0' },
        { opacity: '1' }
      ], {
        easing: Params.easingStandard,
        fill: 'backwards',
        duration: 200
      });

      const height = card.getBoundingClientRect().height;
      document.querySelector('#chasses-en-cours>.section-contenu').animate([
        { transform: 'translate3D(0, -' + height + 'px, 0)' },
        { transform: 'translate3D(0, 0, 0)' }
      ], {
        easing: Params.easingStandard,
        fill: 'backwards',
        duration: 200
      });
    }

    // On met à jour la carte avec les valeurs de this
    this.updateSprite();
    this.updateJeu();
    this.updateBall();
    let pkmn = await pokemonData.getItem(String(this.dexid));
    document.getElementById(`hunt-${this.id}-espece`).value = (pkmn.dexid > 0) ? pkmn.namefr : '';
    await this.genereFormes();
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

    if (this.uploaded !== false) card.dataset.loading = this.uploaded;

    // Génère la liste des formes au choix d'un Pokémon
    // et génère la liste des Pokémon correspondants quand on commence à écrire un nom
    const inputEspece = card.querySelector('[list="datalist-pokedex"]');
    inputEspece.addEventListener('input', async () => {
      DexDatalist.build(inputEspece.value);
      this.genereFormes();
    });

    // Génère la liste des méthodes au choix du jeu
    const inputJeu = card.querySelector('[list=datalist-jeux]');
    inputJeu.addEventListener('input', () => this.genereMethodes());

    if (this.caught) card.classList.add('caught');

    //if (this.dexid == 0) setTimeout(() => card.classList.remove('new'), 400);

    if (start) return;
    deferCards('chasses-en-cours');
  }


  // Génère la liste des formes à partir du Pokémon entré
  async genereFormes()
  {
    const card = document.getElementById('hunt-' + this.id);
    const inputEspece = card.querySelector('[list="datalist-pokedex"]');
    const idFormes = inputEspece.id.replace('espece', 'forme');
    const select = document.getElementById(idFormes);
    select.innerHTML = '';

    const allNames = await Pokemon.namesfr();
    const k = allNames.findIndex(p => p == inputEspece.value);
    if (k == -1)
      return 'Pokémon inexistant';
    else {
      const pkmn = await pokemonData.getItem(String(k));
      const formes = pkmn.formes.slice().sort((a, b) => { if (a.nom == '') return -1; else return 0;});
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

    const allNames = await Pokemon.namesfr();
    let k = allNames.findIndex(p => p == document.getElementById(`hunt-${this.id}-espece`).value);
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

    k = await huntStorage.getItem(String(this.id));
    if (k == null) throw 'Chasse inexistante';
    return await huntStorage.setItem(String(this.id), this);
  }


  // Met à jour le sprite
  async updateSprite()
  {
    const card = document.getElementById('hunt-' + this.id);
    const sprite = card.querySelector('.pokemon-sprite');
    const displayShiny = card.classList.contains('edit') || this.caught;

    const pkmn = new Pokemon(await pokemonData.getItem(String(this.dexid)));
    const formes = pkmn.formes;
    const k = formes.findIndex(forme => forme.dbid == this.forme);
    const forme = formes[k];
    if (k != -1)
      sprite.style.setProperty('--sprite', `url('${pkmn.getSprite(forme, { shiny: displayShiny, big: false })}')`);
    else
      sprite.style.setProperty('--sprite', `url('${pkmn.getSprite(formes[0], { shiny: displayShiny, big: false })}')`);
  }


  // Met à jour l'icône de jeu
  updateJeu()
  {
    const card = document.getElementById('hunt-' + this.id);
    const icone = card.querySelector('.icones.jeu');

    const k = Pokemon.jeux.findIndex(jeu => jeu.nom == this.jeu);
    if (k != -1)
      icone.classList.add(this.jeu.replace(/[ \']/g, ''));
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
    const k = await huntStorage.getItem(String(this.id));
    if (k == null) throw 'Chasse inexistante';

    const card = document.getElementById('hunt-' + this.id);
    card.remove();

    await huntStorage.removeItem(String(this.id));

    const keys = await huntStorage.keys();
    if (keys.length == 0) document.querySelector('#chasses-en-cours').classList.add('vide');
  }


  // Envoie la chasse dans la BDD
  async submitHunt(edit = false)
  {
    this.lastupdate = Date.now();
    this.huntid = this.id;

    try {
      const onlineBackup = await dataStorage.getItem('online-backup');
      const shiny = await Shiny.build(this);

      // Vérifions si sprites.php est obsolète
      let obsolete = false;
      test: {
        if (!edit) {
          obsolete = true;
          break test;
        }
        const oldData = await shinyStorage.getItem(String(this.id));
        if (oldData['numero_national'] != shiny.dexid || oldData['forme'] != shiny.forme) {
          obsolete = true;
          break test;
        }
      }

      // On marque la chasse comme uploadée
      /*this.uploaded = 'cloud_upload';
      await huntStorage.setItem(String(this.id), this);*/
      await shinyStorage.setItem(String(this.id), shiny.format());

      await this.destroyHunt();
      await dataStorage.setItem('version-bdd', this.lastupdate);
      window.dispatchEvent(new CustomEvent('populate', { detail: { version: this.lastupdate, obsolete } }));
      if (onlineBackup) await startBackup();
    }
    catch(error) {
      console.error(error);
    }
  }


  // Supprime la chasse de la BDD
  async deleteHuntFromDB()
  {
    this.lastupdate = Date.now();

    try {
      const onlineBackup = await dataStorage.getItem('online-backup');

      // On marque le shiny comme supprimé
      const shiny = await Shiny.build(await shinyStorage.getItem(String(this.id)));
      shiny.deleted = true;
      await shinyStorage.setItem(String(this.id), shiny.format());

      await this.destroyHunt();
      await dataStorage.setItem('version-bdd', this.lastupdate);
      window.dispatchEvent(new CustomEvent('populate', { detail: { version: this.lastupdate, obsolete: false } }));
      if (onlineBackup) await startBackup();
    }
    catch(error) {
      console.error(error);
    }
  }
}



////////////////////////////////////////////////////////////
// Créer une chasse pour mettre à jour une carte dans la BDD
export async function editHunt(id, nav = true) {
  let k = await huntStorage.getItem(String(id));
  if (k != null) {
    const message = 'Cette chasse est déjà en cours d\'édition.';
    notify(message);
    return false;
  }

  const pkmn = await shinyStorage.getItem(String(id));
  const parseTheseInts = ['id', 'origin', 'monjeu', 'charm', 'hacked', 'aupif'];
  parseTheseInts.forEach(int => pkmn[int] = parseInt(pkmn[int]));
  pkmn.dexid = parseInt(pkmn['numero_national']);
  pkmn.id = id;
  const hunt = await Hunt.build(pkmn);
  if (nav) navigate('chasses-en-cours');
  return hunt;
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
export async function initHunts() {
  await Promise.all([huntStorage.ready(), dataStorage.ready()]);

  // On vérifie quelles chasses ont été uploadées par le service worker depuis la dernière visite
  let uploadConfirmed = await dataStorage.getItem('uploaded-hunts');
  if (uploadConfirmed == null) {
    uploadConfirmed = [];
    await dataStorage.setItem('uploaded-hunts', []);
  }

  // On supprime ces chasses
  for (huntid of uploadConfirmed) {
    await huntStorage.removeItem(huntid);
  }

  // On génère les chasses restantes
  const keys = await huntStorage.keys();
  if (keys.length == 0)
    document.querySelector('#chasses-en-cours').classList.add('vide');
  else
    keys.forEach(async k => Hunt.build(await huntStorage.getItem(k), true));
}