import { startBackup } from './appLifeCycle.js';
import { DexDatalist } from './DexDatalist.js';
import { dataStorage, huntStorage, pokemonData, shinyStorage } from './localforage.js';
import { navigate } from './navigate.js';
import { notify } from './notification.js';
import { Params } from './Params.js';
import { Forme, frontendShiny, Methode, Pokemon, Shiny } from './Pokemon.js';



// Structure d'un Pokémon en cours de chasse tel que stocké dans la BDD locale
export interface huntedPokemon extends Omit<frontendShiny, 'id' | 'destroy'> {
  caught: boolean,
  uploaded: boolean,
}

export class Hunt implements huntedPokemon {
  huntid: string = String(new Date().getTime());
  lastUpdate: number = 0;
  dexid: number = 0;
  formid: string = '';
  surnom: string = '';
  methode: string = '';
  compteur: string = '';
  timeCapture: number = 0;
  jeu: string = '';
  ball: string = 'poke';
  notes: string = '';
  checkmark: number = 0;
  DO: boolean = false;
  charm: boolean = false;
  hacked: number = 0;
  horsChasse: boolean = false;
  deleted: boolean = false;
  caught: boolean = false;
  uploaded: boolean = false;
  
  constructor(pokemon?: frontendShiny) {
    if (pokemon == null) return;
    Object.assign(this, pokemon);
  }

  static async build(pokemon?: huntedPokemon, start: boolean = false) {
    const hunt = new Hunt(pokemon);
    await huntStorage.setItem(String(pokemon?.huntid || hunt.huntid), hunt);
    await hunt.buildHunt(start);
    return hunt;
  }


  // Construit la carte qui affiche la chasse en HTML
  async buildHunt(start: boolean = false) {
    const template = document.getElementById('template-hunt') as HTMLTemplateElement;
    const card = (template.content.cloneNode(true) as Element).querySelector('.hunt-card') as HTMLElement;
    card.id = 'hunt-' + this.huntid;
    
    for (const el of Array.from(card.querySelectorAll('[id^="hunt-{id}"]'))) {
      el.id = el.id.replace('{id}', String(this.huntid));
    }

    for (const el of Array.from(card.querySelectorAll('[for^="hunt-{id}"]'))) {
      el.setAttribute('for', (el.getAttribute('for') || '').replace('{id}', String(this.huntid)));
    }

    for (const el of Array.from(card.querySelectorAll('[name^="hunt-{id}"]'))) {
      el.setAttribute('name', (el.getAttribute('name') || '').replace('{id}', String(this.huntid)));
    }

    const k = await shinyStorage.getItem(String(this.huntid));
    const edit = (k != null);
    if (edit) card.classList.add('edit');

    // Active le bouton "compteur++";
    const boutonAdd = card.querySelector('.bouton-compteur.add')!;
    const boutonSub = card.querySelector('.bouton-compteur.sub')!;
    const inputCompteur = card.querySelector('input[id$="-compteur"]') as HTMLInputElement;

    boutonAdd.addEventListener('click', async event => {
      event.preventDefault();
      const value = Number(inputCompteur.value);
      const newValue = Math.min(value + 1, 999999);
      inputCompteur.value = String(newValue);
      await this.updateHunt();
    });

    boutonSub.addEventListener('click', async event => {
      event.preventDefault();
      const value = Number(inputCompteur.value);
      const newValue = Math.max(value - 1, 0);
      inputCompteur.value = String(newValue);
      await this.updateHunt();
    });

    // Active le bouton "shiny capturé"
    const boutonCaught = card.querySelector('.bouton-hunt-caught')!;
    boutonCaught.addEventListener('click', async event => {
      event.preventDefault();
      boutonCaught.parentElement!.parentElement!.classList.toggle('caught');
      const inputDate = card.querySelector('input[type="date"]') as HTMLInputElement;

      if (inputDate.value == '') inputDate.value = new Date().toISOString().split('T')[0];
      if (boutonCaught.parentElement!.parentElement!.classList.contains('caught')) this.caught = true;
      else                                                                         this.caught = false;

      await this.updateHunt();
    });

    // Active le bouton "annuler"
    const boutonEffacer = card.querySelector('.bouton-hunt-remove');
    const boutonAnnuler = card.querySelector('.bouton-hunt-edit');

    for (const bouton of [boutonEffacer, boutonAnnuler] as HTMLButtonElement[]) {
      bouton.addEventListener('click', async event => {
        event.preventDefault();
  
        const span = bouton.querySelector('span')!;
        if (span.innerHTML == 'Supprimer' || span.innerHTML == 'Annuler') {
          span.innerHTML = 'Vraiment ?';
          setTimeout(() => span.innerHTML = 'Supprimer', 3000);
        } else if (span.innerHTML == 'Vraiment ?') {
          await this.destroyHunt();
        }
      });
    }

    // Active le bouton "enregistrer"
    const boutonSubmit = card.querySelector('.bouton-hunt-submit')!;
    boutonSubmit.addEventListener('click', async event => {
      event.preventDefault();

      if (!navigator.onLine) return notify('Pas de connexion internet');

      const span = boutonSubmit.querySelector('span')!;
      if (span.innerHTML == 'Enregistrer') {
        // Gestion des erreurs de formulaire
        const erreurs = [];
        if (this.dexid == 0) erreurs.push('Pokémon');
        if (this.jeu == '') erreurs.push('jeu');
        if (this.methode == '')  erreurs.push('méthode');
        if (this.timeCapture == 0) erreurs.push('date');

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
    const boutonSupprimer = card.querySelector('.bouton-hunt-eraseDB')!;
    boutonSupprimer.addEventListener('click', async event => {
      event.preventDefault();

      if (!edit) return notify('Cette chasse n\'est pas dans la base de données');
      if (!navigator.onLine) return notify('Pas de connexion internet');

      const span = boutonSupprimer.querySelector('span')!;
      if (span.innerHTML == 'Supprimer') {
        span.innerHTML = 'Vraiment ?';
        setTimeout(() => span.innerHTML = 'Supprimer', 3000);
      } else if (span.innerHTML == 'Vraiment ?') {
        await this.deleteHuntFromDB();
      }
    });

    // Détecte les modifications du formulaire
    card.addEventListener('input', async () => await this.updateHunt());

    document.querySelector('#chasses-en-cours>.section-contenu')!.appendChild(card);
    document.querySelector('#chasses-en-cours')!.classList.remove('vide');

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
      document.querySelector('#chasses-en-cours>.section-contenu')!.animate([
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
    (document.getElementById(`hunt-${this.huntid}-espece`) as HTMLInputElement).value = (pkmn.dexid > 0) ? pkmn.namefr : '';
    await this.genereFormes();
    (document.getElementById(`hunt-${this.huntid}-forme`) as HTMLInputElement).value = this.formid;
    (document.getElementById(`hunt-${this.huntid}-surnom`) as HTMLInputElement).value = this.surnom;
    
    if (this.methode == 'Ultra-Brèche') {
      (document.getElementById(`hunt-${this.huntid}-compteur-distance`) as HTMLInputElement).value = JSON.parse(this.compteur).distance;
      (document.getElementById(`hunt-${this.huntid}-compteur-anneaux`) as HTMLInputElement).value = JSON.parse(this.compteur).rings;
      (document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value = '0';
    } else if (this.methode == 'Chaîne de captures') {
      (document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value = JSON.parse(this.compteur).chain;
      switch (JSON.parse(this.compteur).lure) {
        case true:
          (document.querySelector(`input[id="hunt-${this.huntid}-compteur-leurre-oui"]`) as HTMLInputElement).checked = true;
          break;
        default:
          (document.querySelector(`input[id="hunt-${this.huntid}-compteur-leurre-non"]`) as HTMLInputElement).checked = true;
      }
      (document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value = '0';
    } else
    (document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value = this.compteur;

    (document.getElementById(`hunt-${this.huntid}-date`) as HTMLInputElement).value = (new Date(this.timeCapture)).toISOString().split('T')[0];
    (document.getElementById(`hunt-${this.huntid}-jeu`) as HTMLInputElement).value = this.jeu;
    this.genereMethodes();
    (document.getElementById(`hunt-${this.huntid}-methode`) as HTMLInputElement).value = this.methode;
    (document.getElementById(`hunt-${this.huntid}-ball`) as HTMLInputElement).value = this.ball;
    (document.getElementById(`hunt-${this.huntid}-notes`) as HTMLInputElement).value = this.notes;
    (document.querySelector(`input[name="hunt-${this.huntid}-origin-icon"][value="${this.checkmark}"]`) as HTMLInputElement).checked = true;
    (document.querySelector(`input[name="hunt-${this.huntid}-monjeu"][value="${this.DO}"]`) as HTMLInputElement).checked = true;
    (document.querySelector(`input[name="hunt-${this.huntid}-charm"][value="${this.charm}"]`) as HTMLInputElement).checked = true;
    (document.querySelector(`input[name="hunt-${this.huntid}-hacked"][value="${this.hacked}"]`) as HTMLInputElement).checked = true;
    (document.querySelector(`input[name="hunt-${this.huntid}-aupif"][value="${this.horsChasse}"]`) as HTMLInputElement).checked = true;
    card.dataset.methode = this.methode;
    card.dataset.jeu = this.jeu;

    if (this.uploaded !== false) card.dataset.loading = String(this.uploaded);

    // Génère la liste des formes au choix d'un Pokémon
    // et génère la liste des Pokémon correspondants quand on commence à écrire un nom
    const inputEspece = card.querySelector('[list="datalist-pokedex"]') as HTMLInputElement;
    inputEspece.addEventListener('input', async () => {
      DexDatalist.build(inputEspece.value);
      this.genereFormes();
    });

    // Génère la liste des méthodes au choix du jeu
    const inputJeu = card.querySelector('[list=datalist-jeux]')!;
    inputJeu.addEventListener('input', () => this.genereMethodes());

    if (this.caught) card.classList.add('caught');

    //if (this.dexid == 0) setTimeout(() => card.classList.remove('new'), 400);

    if (start) return;
    //deferCards('chasses-en-cours');
  }


  // Génère la liste des formes à partir du Pokémon entré
  async genereFormes()
  {
    const card = document.getElementById('hunt-' + this.huntid)!;
    const inputEspece = card.querySelector('[list="datalist-pokedex"]') as HTMLInputElement;
    const idFormes = inputEspece.id.replace('espece', 'forme');
    const select = document.getElementById(idFormes)!;
    select.innerHTML = '';

    const allNames = await Pokemon.namesfr();
    const k = allNames.findIndex(p => p == inputEspece.value);
    if (k == -1)
      return 'Pokémon inexistant';
    else {
      const pkmn = await pokemonData.getItem(String(k));
      const formes: Forme[] = pkmn.formes.slice().sort((a: Forme, b: Forme) => { if (a.nom == '') return -1; else return 0;});
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
    const card = document.getElementById('hunt-' + this.huntid)!;
    const inputJeu = card.querySelector('[list=datalist-jeux]') as HTMLInputElement;
    const idMethodes = inputJeu.id.replace('jeu', 'methode');
    const select = document.getElementById(idMethodes)!;
    select.innerHTML = '';

    const k = Pokemon.jeux.findIndex(jeu => jeu.nom == inputJeu.value);
    if (k == -1)
      return 'Jeu inexistant';
    else {
      const methodes: Methode[] = [];
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
  async updateHunt() {
    const card = document.getElementById('hunt-' + this.huntid)!;

    const allNames = await Pokemon.namesfr();
    let k = allNames.findIndex(p => p == (document.getElementById(`hunt-${this.huntid}-espece`) as HTMLInputElement).value);
    
    this.dexid = (k != -1) ? k : 0;
    this.formid = (document.getElementById(`hunt-${this.huntid}-forme`) as HTMLInputElement).value;
    this.surnom = (document.getElementById(`hunt-${this.huntid}-surnom`) as HTMLInputElement).value;
    this.methode = (document.getElementById(`hunt-${this.huntid}-methode`) as HTMLInputElement).value;

    if (this.methode == 'Ultra-Brèche') {
      this.compteur = JSON.stringify({
        distance: parseInt((document.getElementById(`hunt-${this.huntid}-compteur-distance`) as HTMLInputElement).value),
        rings: parseInt((document.getElementById(`hunt-${this.huntid}-compteur-anneaux`) as HTMLInputElement).value)
      });
    } else if (this.methode == 'Chaîne de captures') {
      this.compteur = JSON.stringify({
        chain: parseInt((document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value),
        lure: ((document.querySelector(`input[name="hunt-${this.huntid}-compteur-leurre"]:checked`) as HTMLInputElement).value === '1') ? true : false
      });
    } else
      this.compteur = (document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value;
    
    // Pour ne pas perdre de précision temporelle
    const date = (document.getElementById(`hunt-${this.huntid}-date`) as HTMLInputElement).value;
    const oldDate = (new Date(this.timeCapture)).toISOString().split('T')[0];
    const newTime = date !== oldDate ? (new Date(date)).getTime() : this.timeCapture;
    this.timeCapture = newTime;

    this.jeu = (document.getElementById(`hunt-${this.huntid}-jeu`) as HTMLInputElement).value;
    this.ball = (document.getElementById(`hunt-${this.huntid}-ball`) as HTMLInputElement).value;
    this.notes = (document.getElementById(`hunt-${this.huntid}-notes`) as HTMLInputElement).value;
    this.checkmark = parseInt((document.querySelector(`input[name="hunt-${this.huntid}-origin-icon"]:checked`) as HTMLInputElement).value);
    this.DO = Boolean(parseInt((document.querySelector(`input[name="hunt-${this.huntid}-monjeu"]:checked`) as HTMLInputElement).value));
    this.charm = Boolean(parseInt((document.querySelector(`input[name="hunt-${this.huntid}-charm"]:checked`) as HTMLInputElement).value));
    this.hacked = parseInt((document.querySelector(`input[name="hunt-${this.huntid}-hacked"]:checked`) as HTMLInputElement).value);
    this.horsChasse = Boolean(parseInt((document.querySelector(`input[name="hunt-${this.huntid}-aupif"]:checked`) as HTMLInputElement).value));

    card.dataset.methode = this.methode;
    card.dataset.jeu = this.jeu;

    this.updateSprite();
    this.updateJeu();
    this.updateBall();

    k = await huntStorage.getItem(String(this.huntid));
    if (k == null) throw 'Chasse inexistante';
    return await huntStorage.setItem(String(this.huntid), this);
  }


  // Met à jour le sprite
  async updateSprite() {
    const card = document.getElementById('hunt-' + this.huntid)!;
    const sprite = card.querySelector('.pokemon-sprite') as HTMLElement;
    const displayShiny = card.classList.contains('edit') || this.caught;

    const pkmn = new Pokemon(await pokemonData.getItem(String(this.dexid)));
    const formes = pkmn.formes;
    const k = formes.findIndex(forme => forme.dbid == this.formid);
    const forme = formes[k];
    if (k != -1) sprite.style.setProperty('--sprite', `url('${pkmn.getSprite(forme, { shiny: displayShiny, size: 112, format: Params.preferredImageFormat })}')`);
    else         sprite.style.setProperty('--sprite', `url('${pkmn.getSprite(formes[0], { shiny: displayShiny, size: 112, format: Params.preferredImageFormat })}')`);
  }


  // Met à jour l'icône de jeu
  updateJeu() {
    const card = document.getElementById('hunt-' + this.huntid)!;
    const icone = card.querySelector('.icones.jeu')!;

    const k = Pokemon.jeux.findIndex(jeu => jeu.nom == this.jeu);
    if (k != -1) icone.classList.add(this.jeu.replace(/[ \']/g, ''));
    else         icone.className = 'icones jeu';
  }


  // Met à jour l'icône de la Ball
  updateBall() {
    const card = document.getElementById('hunt-' + this.huntid)!;
    const icone = card.querySelector('.ball>.pkspr')!;

    icone.className = `pkspr item ball-${this.ball}`;
  }


  // Supprime la chasse complètement
  async destroyHunt() {
    const k = await huntStorage.getItem(String(this.huntid));
    if (k == null) throw 'Chasse inexistante';

    const card = document.getElementById('hunt-' + this.huntid)!;
    card.remove();

    await huntStorage.removeItem(String(this.huntid));

    const keys = await huntStorage.keys();
    if (keys.length == 0) document.querySelector('#chasses-en-cours')!.classList.add('vide');
  }


  // Envoie la chasse dans la BDD
  async submitHunt(edit = false) {
    this.lastUpdate = Date.now();
    this.huntid = this.huntid;

    try {
      const onlineBackup = await dataStorage.getItem('online-backup');
      const shiny = new Shiny(this);

      // Vérifions si sprites.php est obsolète
      let obsolete = false;
      test: {
        if (!edit) {
          obsolete = true;
          break test;
        }
        const oldData = await shinyStorage.getItem(String(this.huntid));
        if (oldData['numero_national'] != shiny.dexid || oldData['forme'] != (await shiny.getForme()).dbid) {
          obsolete = true;
          break test;
        }
      }

      // On marque la chasse comme uploadée
      /*this.uploaded = 'cloud_upload';
      await huntStorage.setItem(String(this.huntid), this);*/
      await shinyStorage.setItem(String(this.huntid), shiny);

      await this.destroyHunt();
      await dataStorage.setItem('version-bdd', this.lastUpdate);
      window.dispatchEvent(new CustomEvent('populate', { detail: {
        version: this.lastUpdate,
        obsolete: (obsolete ? [String(this.huntid)] : []),
        modified: [String(this.huntid)]
      } }));
      if (onlineBackup) await startBackup();
    }
    catch(error) {
      console.error(error);
    }
  }


  // Supprime la chasse de la BDD
  async deleteHuntFromDB()
  {
    this.lastUpdate = Date.now();

    try {
      const onlineBackup = await dataStorage.getItem('online-backup');

      // On marque le shiny comme supprimé
      const shiny = new Shiny(await shinyStorage.getItem(String(this.huntid)));
      shiny.lastUpdate = this.lastUpdate;
      shiny.deleted = true;
      await shinyStorage.setItem(String(this.huntid), shiny);

      await this.destroyHunt();
      await dataStorage.setItem('version-bdd', this.lastUpdate);
      window.dispatchEvent(new CustomEvent('populate', { detail: {
        version: this.lastUpdate,
        obsolete: [],
        modified: [String(this.huntid)]
      } }));
      if (onlineBackup) await startBackup();
    }
    catch(error) {
      console.error(error);
    }
  }
}



////////////////////////////////////////////////////////////
// Créer une chasse pour mettre à jour une carte dans la BDD
export async function editHunt(id: number, nav = true) {
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



//////////////////////////////////////
// Initialise les chasses sauvegardées
export async function initHunts() {
  // On initialise la datalist des jeux
  initGamesDatalist();

  await Promise.all([huntStorage.ready(), dataStorage.ready()]);

  // On vérifie quelles chasses ont été uploadées par le service worker depuis la dernière visite
  let uploadConfirmed = await dataStorage.getItem('uploaded-hunts');
  if (uploadConfirmed == null) {
    uploadConfirmed = [];
    await dataStorage.setItem('uploaded-hunts', []);
  }

  // On supprime ces chasses
  for (const huntid of uploadConfirmed) {
    await huntStorage.removeItem(huntid);
  }

  // On génère les chasses restantes
  const keys = await huntStorage.keys();
  if (keys.length == 0)
    document.querySelector('#chasses-en-cours')!.classList.add('vide');
  else
    keys.forEach(async k => Hunt.build(await huntStorage.getItem(k), true));
}


// Crée la datalist Jeux
function initGamesDatalist() {
  const datalistJeux = document.getElementById('datalist-jeux')!;
  Pokemon.jeux.forEach(jeu => {
    datalistJeux.innerHTML += `<option value="${jeu.nom}">`;
  });
}