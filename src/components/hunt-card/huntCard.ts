import { DexDatalist } from '../../DexDatalist.js';
import { Hunt, huntedPokemon } from '../../Hunt.js';
import { huntStorage, pokemonData, shinyStorage } from '../../localforage.js';
import { Notif } from '../../notification.js';
import { warnBeforeDestruction } from '../../Params.js';
import { Forme, Methode, Pokemon, Shiny } from '../../Pokemon.js';
import pokemonSprite from '../pokemon-sprite/pokemonSprite.js';
import template from './template.js';



interface HuntUpdateEvent extends CustomEvent {
  detail: {
    shiny: huntedPokemon;
  }
}

declare global {
  interface HTMLElementEventMap {
    huntupdate: HuntUpdateEvent;
  }
}



type huntProperty = keyof Hunt;
type querySelector = string;

interface Handler {
  element: Element;
  type: string;
  function: (e: Event) => void;
}

interface HandlerMap {
  [name: string]: Handler
}

function handle(handler: Handler) {
  handler.element.addEventListener(handler.type, handler.function);
}

function unhandle(handler: Handler) {
  handler.element.removeEventListener(handler.type, handler.function);
}



export class huntCard extends HTMLElement {
  ready: boolean = false;
  hunt: Hunt = new Hunt();
  pokemon?: Pokemon;
  handlers: HandlerMap = {};
  changeHandlers: HandlerMap = {};
  propMap: Map<huntProperty, querySelector> = new Map([
    ['dexid', '#hunt-{id}-espece'],
    ['forme', '#hunt-{id}-forme'],
    ['surnom', '#hunt-{id}-surnom'],
    ['methode', '#hunt-{id}-methode'],
    ['compteur', '#hunt-{id}-compteur'],
    ['timeCapture', '#hunt-{id}-date'],
    ['jeu', '#hunt-{id}-jeu'],
    ['ball', '#hunt-{id}-ball'],
    ['notes', '#hunt-{id}-notes'],
    ['checkmark', 'input[name="hunt-{id}-origin-icon"]'],
    ['DO', 'input[name="hunt-{id}-monjeu"]'],
    ['charm', 'input[name="hunt-{id}-charm"]'],
    ['hacked', 'input[name="hunt-{id}-hacked"]'],
    ['horsChasse', 'input[name="hunt-{id}-aupif"]']
  ]);


  constructor() {
    super();
  }


  /**
   * Soumet la chasse à la BDD locale des shiny.
   */
  async submit() {
    this.hunt.lastUpdate = Date.now();

    try {
      const shiny = new Shiny(this.hunt);
      await shinyStorage.setItem(this.hunt.huntid, shiny);
      await this.delete();

      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['mes-chromatiques', 'chasses-en-cours'],
          ids: [this.hunt.huntid],
        }
      }));
    }
    catch(error) {
      console.error(error);
    }
  }

  
  /**
   * Supprime la chasse.
   */
  async delete() {
    this.hunt.lastUpdate = Date.now();
    this.hunt.deleted = true;
    this.remove();

    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['chasses-en-cours', 'corbeille'],
        ids: [this.hunt.huntid],
      }
    }));

    const hunts = (await Promise.all((await huntStorage.keys()).map(key => huntStorage.getItem(key)))).filter(hunt => !(hunt.deleted));
    if (hunts.length === 0) document.querySelector('#chasses-en-cours')!.classList.add('vide');
  }

  
  /**
   * Supprime la chasse et le shiny qu'elle éditait.
   */
  async deleteShiny() {
    this.delete();

    // On marque le shiny comme supprimé (pour que la suppression se synchronise en ligne)
    const shiny = new Shiny(await shinyStorage.getItem(this.hunt.huntid));
    shiny.lastUpdate = this.hunt.lastUpdate;
    shiny.deleted = true;
    // Si la synchronisation en ligne est désactivée, marquer le shiny comme à 'destroy' immédiatement
    // if (!onlineSync) shiny.destroy = true;
    await shinyStorage.setItem(this.hunt.huntid, shiny);

    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['mes-chromatiques'],
        ids: [this.hunt.huntid],
      }
    }));
  }

  
  /**
   * Met à jour le contenu de la carte à partir d'un objet Hunt.
   */
  async dataToContent(event: HuntUpdateEvent): Promise<void> {
    if (!this.ready) return;
    //if (event.detail.shiny.deleted) return this.remove();

    let hunt: Hunt;
    try {
      hunt = new Hunt(event.detail.shiny);
      this.hunt = hunt;
    } catch (e) {
      console.error('Échec de création de chasse', e);
      throw e;
    }

    const card = this;
    const mine = hunt.mine;

    // Associe la carte au bon ID de chasse
    card.setAttribute('id', `hunt-${hunt.huntid}`);
    for (const el of Array.from(this.querySelectorAll('[data-id]'))) {
      const attr = (el as HTMLElement).dataset.id || '';
      el.setAttribute('id', attr.replace('{id}', hunt.huntid));
    }
    for (const el of Array.from(this.querySelectorAll('[data-for]'))) {
      const attr = (el as HTMLElement).dataset.for || '';
      el.setAttribute('id', attr.replace('{id}', hunt.huntid));
    }
    for (const el of Array.from(this.querySelectorAll('[data-name]'))) {
      const attr = (el as HTMLElement).dataset.name || '';
      el.setAttribute('id', attr.replace('{id}', hunt.huntid));
    }

    // Détermine si la chasse est une édition ou une création de Pokémon
    const edit = (await shinyStorage.getItem(hunt.huntid)) != null;
    if (edit) this.classList.add('edit');
    else      this.classList.remove('edit');

    const jeu = hunt.jeu.replace(/[ \']/g, '');

    /*


    STILL NOT DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


    */
  }

  
  /**
   * Met à jour la Hunt sauvegardée à partir des informations saisies dans le formulaire.
   */
  async inputToData() {
    const hunt = this.hunt;
    const getInput = (s: string) => this.querySelector(`#hunt-${hunt.huntid}-${s}`) as HTMLInputElement;
    const sprite = this.querySelector('pokemon-sprite')!;

    espece: {
      const input = getInput('espece');
      const allNames = await Pokemon.namesfr();
      const dexid = allNames.findIndex(s => s === input.value);
      hunt.dexid = dexid > 0 ? dexid : 0;
    }
    
    for (const prop of ['forme', 'surnom', 'methode', 'jeu', 'ball', 'notes']) {
      const input = getInput(prop);
      Object.assign(hunt, { [prop as keyof Omit<Hunt, 'shinyRate' | 'mine' | 'Jeu'>]: input.value });
    }

    // Icônes
    this.querySelector(`.icones.jeu`)!.className = `icones jeu ${hunt.jeu.replace(/[ \']/g, '')}`;
    this.querySelector(`.icones.ball`)!.className = `pkspr item ball-${hunt.ball}`;

    // Sprite
    sprite.setAttribute('dexid', String(hunt.dexid));
    sprite.setAttribute('forme', hunt.forme);
    sprite.setAttribute('shiny', String(hunt.caught));

    for (const prop of ['checkmark', 'DO', 'charm', 'hacked', 'horsChasse']) {
      const input = this.querySelector(`input[name="hunt-${hunt.huntid}-${prop}"]:checked`) as HTMLInputElement;
      let value: any = input.value;
      switch (prop) {
        case 'checkmark':
        case 'hacked':
          value = parseInt(value);
          break;
        default:
          value = Boolean(parseInt(value));
      }
      Object.assign(hunt, { [prop as keyof Omit<Hunt, 'shinyRate' | 'mine' | 'Jeu'>]: value });
    }

    compteur: {
      if (hunt.methode === 'Ultra-Brèche') {
        hunt.compteur = JSON.stringify({
          distance: parseInt((this.querySelector(`#hunt-${hunt.huntid}-compteur-distance`) as HTMLInputElement).value),
          rings: parseInt((this.querySelector(`#hunt-${hunt.huntid}-compteur-anneaux`) as HTMLInputElement).value)
        });
      } else if (hunt.methode === 'Chaîne de captures') {
        hunt.compteur = JSON.stringify({
          chain: parseInt((this.querySelector(`#hunt-${hunt.huntid}-compteur`) as HTMLInputElement).value),
          lure: ((document.querySelector(`input[name="hunt-${hunt.huntid}-compteur-leurre"]:checked`) as HTMLInputElement).value === '1') ? true : false
        });
      } else {
        hunt.compteur = (this.querySelector(`#hunt-${hunt.huntid}-compteur`) as HTMLInputElement).value;
      }
    }

    date: {
      const input = getInput('date');
      const date = input.value;
      const oldDate = (new Date(hunt.timeCapture)).toISOString().split('T')[0];
      const newTime = date !== oldDate ? (new Date(date)).getTime() : hunt.timeCapture;
      hunt.timeCapture = newTime;
    }

    this.dataset.methode = hunt.methode;
    this.dataset.jeu = hunt.jeu;

    return await huntStorage.setItem(hunt.huntid, hunt);
  }


  connectedCallback() {
    // Crée le HTML de la carte
    this.appendChild(template.content.cloneNode(true));
    for (const el of [...this.querySelectorAll('[id^="hunt-{id}"]')]) {
      (el as HTMLElement).dataset.id = el.getAttribute('id') || '';
    }

    for (const el of [...this.querySelectorAll('[for^="hunt-{id}"]')]) {
      (el as HTMLElement).dataset.for = el.getAttribute('for') || '';
    }

    for (const el of [...this.querySelectorAll('[name^="hunt-{id}"]')]) {
      (el as HTMLElement).dataset.name = el.getAttribute('name') || '';
    }
    this.ready = true;

    // 🔽 Active les boutons du formulaire

    // Active les boutons d'incrémentation du compteur
    const boutonAdd = this.querySelector('.bouton-compteur.add')!;
    const boutonSub = this.querySelector('.bouton-compteur.sub')!;
    const inputCompteur = this.querySelector('input[id$="-compteur"]') as HTMLInputElement;

    this.handlers.counterAdd = {
      element: boutonAdd,
      type: 'click',
      function: async event => {
        const value = Number(inputCompteur.value);
        const newValue = Math.min(value + 1, 999999);
        inputCompteur.value = String(newValue);
      }
    };
    handle(this.handlers.counterAdd);

    this.handlers.counterSub = {
      element: boutonSub,
      type: 'click',
      function: async event => {
        const value = Number(inputCompteur.value);
        const newValue = Math.max(value - 1, 0);
        inputCompteur.value = String(newValue);
      }
    };
    handle(this.handlers.counterSub);

    // Active le bouton "capturé"
    const boutonCaught = this.querySelector('.bouton-hunt-caught')!;

    this.handlers.caught = {
      element: boutonCaught,
      type: 'click',
      function: async event => {
        const container = boutonCaught.parentElement!.parentElement!;
        container.classList.toggle('caught');
        const inputDate = this.querySelector('input[type="date"]') as HTMLInputElement;
  
        if (inputDate.value == '') inputDate.value = new Date().toISOString().split('T')[0];
        if (container.classList.contains('caught')) this.hunt.caught = true;
        else                                        this.hunt.caught = false;

        (this.querySelector('pokemon-sprite')! as pokemonSprite).sparkle();
      }
    };
    handle(this.handlers.caught);

    // Active le bouton "annuler"
    const boutonDelete = this.querySelector('.bouton-hunt-remove')!;
    const boutonCancel = this.querySelector('.bouton-hunt-edit')!;

    this.handlers.delete = {
      element: boutonDelete,
      type: 'click',
      function: async event => {
        const cancelMessage = 'Les modifications ne seront pas enregistrées.';
        const userResponse = await warnBeforeDestruction((event.currentTarget! as Element), event.currentTarget === boutonCancel ? cancelMessage : undefined);
        if (userResponse)  await this.delete();
      }
    };
    handle(this.handlers.delete);

    this.handlers.cancel = {
      element: boutonCancel,
      type: 'click',
      function: this.handlers.delete.function
    };
    handle(this.handlers.cancel);

    // Active le bouton "enregistrer"
    const boutonSubmit = this.querySelector('.bouton-hunt-submit')!;

    this.handlers.submit = {
      element: this,
      type: 'submit',
      function: async event => {
        event.preventDefault();
  
        // Gestion des erreurs de formulaire
        const erreurs = [];
        if (this.hunt.dexid == 0) erreurs.push('Pokémon');
        if (this.hunt.jeu == '') erreurs.push('jeu');
        if (this.hunt.methode == '')  erreurs.push('méthode');
        if (this.hunt.timeCapture == 0) erreurs.push('date');
  
        if (erreurs.length > 0) {
          let message = `Les champs suivants sont mal remplis : `;
          erreurs.forEach(e => message += `${e}, `);
          message = message.replace(/,\ $/, '.');
          new Notif(message).prompt();
          return;
        } else {
          const userResponse = await warnBeforeDestruction(boutonSubmit, 'Ajouter ce Pokémon à vos chromatiques ?', 'done');
          if (userResponse) await this.submit();
        }
      }
    };
    handle(this.handlers.submit);

    // Active le bouton "supprimer"
    const boutonDeleteShiny = this.querySelector('.bouton-hunt-eraseDB')!;

    this.handlers.deleteShiny = {
      element: boutonDeleteShiny,
      type: 'click',
      function: async event => {
        const edit = (await shinyStorage.getItem(this.hunt.huntid)) != null;
        if (!edit) {
          new Notif('Cette chasse n\'est pas dans la base de données').prompt();
          return;
        }
  
        const userResponse = await warnBeforeDestruction(boutonDeleteShiny);
        if (userResponse) await this.deleteShiny();
      }
    };
    handle(this.handlers.deleteShiny);

    // 🔽 Détecte les changements dans le formulaire :

    // Changements de tous les inputs
    this.handlers.form = {
      element: this,
      type: 'change',
      function: () => this.inputToData()
    }
    handle(this.handlers.form);

    // Génère la liste des formes au choix d'un Pokémon
    // et génère la liste des Pokémon correspondants quand on commence à écrire un nom
    const inputEspece = this.querySelector('[list="datalist-pokedex"]')! as HTMLInputElement;
    this.handlers.listeFormes = {
      element: inputEspece,
      type: 'input',
      function: async () => {
        DexDatalist.build(inputEspece.value);
        this.genereFormes();
      }
    }

    // Génère la liste des méthodes au choix du jeu
    this.handlers.listeMethodes = {
      element: this.querySelector('[list="datalist-jeux"]')!,
      type: 'input',
      function: () => this.genereMethodes()
    }
    handle(this.handlers.listeMethodes);
  }


  /** Génère la liste des formes à partir du Pokémon entré. */
  async genereFormes() {
    const inputEspece = this.querySelector('[list="datalist-pokedex"]') as HTMLInputElement;
    const idFormes = inputEspece.id.replace('espece', 'forme');
    const select = document.getElementById(idFormes)!;
    select.innerHTML = '';

    const allNames = await Pokemon.namesfr();
    const k = allNames.findIndex(p => p == inputEspece.value);
    if (k == -1) return 'Pokémon inexistant';
    else {
      const pkmn = await pokemonData.getItem(String(k));
      const formes: Forme[] = pkmn.formes.slice().sort((a: Forme, b: Forme) => { if (a.nom == '') return -1; else return 0;});
      formes.forEach(forme => {
        if (forme.noShiny == true) return;

        if (forme.dbid != '') select.innerHTML += `<option value="${forme.dbid}">${forme.nom}</option>`;
        else select.innerHTML += `<option value="" selected>${forme.nom || 'Forme normale'}</option>`;
      });
    }
  }


  /** Génère la liste des méthodes à partir du jeu entré. */
  genereMethodes() {
    const inputJeu = this.querySelector('[list=datalist-jeux]') as HTMLInputElement;
    const idMethodes = inputJeu.id.replace('jeu', 'methode');
    const select = document.getElementById(idMethodes)!;
    select.innerHTML = '';

    const k = Pokemon.jeux.findIndex(jeu => jeu.nom == inputJeu.value);
    if (k == -1) return 'Jeu inexistant';
    else {
      const methodes: Methode[] = [];

      for (const methode of Shiny.allMethodes) {
        const k = methode.jeux.findIndex(jeu => jeu.nom == inputJeu.value);
        if (k != -1) methodes.push(methode);
      }
  
      for (const methode of methodes) {
        select.innerHTML += `<option>${methode.nom}</option>`;
      }
    }
  }
  

  disconnectedCallback() {
    this.ready = false;

    // Désactive les boutons du formulaire
    for (const [name, handler] of Object.entries(this.handlers)) {
      unhandle(handler);
    }

    // Désactive la surveillance du formulaire
    for (const [name, handler] of Object.entries(this.changeHandlers)) {
      unhandle(handler);
    }
  }
}

if (!customElements.get('hunt-card')) customElements.define('hunt-card', huntCard);