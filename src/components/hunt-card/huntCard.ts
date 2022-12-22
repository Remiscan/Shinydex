import { DexDatalist } from '../../DexDatalist.js';
import { Hunt, huntedPokemon } from '../../Hunt.js';
import { warnBeforeDestruction } from '../../Params.js';
import { Forme, Methode, Pokemon, Shiny } from '../../Pokemon.js';
import { huntStorage, pokemonData, shinyStorage } from '../../localForage.js';
import { Notif } from '../../notification.js';
import pokemonSprite from '../pokemon-sprite/pokemonSprite.js';
import template from './template.js';
// @ts-expect-error
import pokespriteSheet from '../../../ext/pokesprite.css' assert { type: 'css' };
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
// @ts-expect-error
import gameStrings from '../../../strings/games.json' assert { type: 'json' };
// @ts-expect-error
import methodStrings from '../../../strings/methods.json' assert { type: 'json' };



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
  shadow: ShadowRoot;
  huntid: string = '';
  pokemon?: Pokemon;
  handlers: HandlerMap = {};
  changeNonce: Object = {};


  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [pokespriteSheet, sheet];
    this.genereJeux();
  }

  async getHunt() {
    return await Hunt.make(this.huntid ?? undefined);
  }


  /**
   * Soumet la chasse à la BDD locale des shiny.
   */
  async submit() {
    const hunt = await this.getHunt();
    hunt.lastUpdate = Date.now();

    try {
      const shiny = new Shiny(hunt);
      await shinyStorage.setItem(hunt.huntid, shiny);
      await this.delete();

      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['mes-chromatiques', 'chasses-en-cours'],
          ids: [hunt.huntid],
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
    const hunt = await this.getHunt();
    hunt.lastUpdate = Date.now();
    hunt.deleted = true;
    this.remove();

    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['chasses-en-cours', 'corbeille'],
        ids: [hunt.huntid],
      }
    }));

    const hunts = (await Promise.all(
      (await huntStorage.keys()).map(key => huntStorage.getItem(key))
    )).filter(hunt => !(hunt.deleted));
    if (hunts.length === 0) document.querySelector('#chasses-en-cours')!.classList.add('vide');
  }

  
  /**
   * Supprime la chasse et le shiny qu'elle éditait.
   */
  async deleteShiny() {
    const hunt = await this.getHunt();

    this.delete();

    // On marque le shiny comme supprimé (pour que la suppression se synchronise en ligne)
    const shiny = new Shiny(await shinyStorage.getItem(hunt.huntid));
    shiny.lastUpdate = hunt.lastUpdate;
    shiny.deleted = true;
    // Si la synchronisation en ligne est désactivée, marquer le shiny comme à 'destroy' immédiatement
    // if (!onlineSync) shiny.destroy = true;
    await shinyStorage.setItem(hunt.huntid, shiny);

    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['mes-chromatiques'],
        ids: [hunt.huntid],
      }
    }));
  }

  
  /**
   * Met à jour le contenu de la carte à partir d'un objet Hunt.
   */
  async huntToForm(): Promise<void> {
    let hunt: Hunt;
    try {
      hunt = await this.getHunt();
    } catch (e) {
      console.error('Échec de création de chasse', e);
      throw e;
    }

    for (const prop of hunt.orderedKeys) {
      const input = this.shadow.querySelector(`input[name="${prop}"], select[name="${prop}"], textarea[name="${prop}"]`) as HTMLInputElement;

      switch (prop as huntProperty) {
        case 'dexid': {
          const value = hunt.dexid;
          let name = '';
          if (value > 0) {
            const allNames = await Pokemon.names();
            name = allNames[value];
          }
          input.value = name;
          this.genereFormes(name);
        } break;

        case 'jeu': {
          const value = hunt.jeu;
          input.value = value;
          this.genereMethodes(value);
        } break;

        case 'surnom':
        case 'notes':
        case 'forme':
        case 'gene':
        case 'methode':
        case 'ball': {
          const value = hunt[prop] as string;
          input.value = value;
        } break;

        case 'checkmark':
        case 'hacked': {
          const value = hunt[prop] as number;
          const input = this.shadow.querySelector(`input[name="${prop}"][value="${value}"]`) as HTMLInputElement;
          input.checked = true;
        } break;

        case 'charm':
        case 'hacked':
        case 'horsChasse': {
          const value = hunt[prop] as boolean;
          input.checked = value;
        } break;

        case 'compteur': {
          const value = hunt.compteur;
          const methode = hunt.methode;
          const jeu = hunt.jeu;
          const compteur = value ? JSON.parse(value) : 0;

          if (methode === 'Ultra-Brèche') {
            const inputDistance = this.shadow.querySelector(`input[name="usum-distance"]`) as HTMLInputElement;
            inputDistance.value = String(compteur.distance);

            const inputRings = this.shadow.querySelector(`select[name="usum-rings"]`) as HTMLInputElement;
            inputRings.value = String(compteur.rings);
          }

          else if (methode === 'Chaîne de captures') {
            input.value = String(compteur.chain);

            const inputLure = this.shadow.querySelector(`input[name="lgpe-lure"]`) as HTMLInputElement;
            inputLure.checked = compteur.lure;
          }

          else if (jeu === 'Légendes Arceus') {
            input.value = String(compteur.count);

            const inputDexResearch = this.shadow.querySelector(`input[name="pla-dexResearch"][value="${compteur.dexResearch}"]`) as HTMLInputElement;
            inputDexResearch.checked = true;
          }

          else {
            input.value = value;
          }
        } break;

        case 'timeCapture': {
          const value = hunt.timeCapture;
          const date = (new Date(value)).toISOString().split('T')[0];
          input.value = date;
        } break;

        case 'caught': {
          const value = hunt.caught;
          const form = this.shadow.querySelector('form');
          if (value) form?.classList.add('caught');
          else       form?.classList.remove('caught');
        } break;
      }
    }
  }

  async dataToContent() { return this.huntToForm(); }


  /**
   * Met à jour la Hunt sauvegardée à partir des informations saisies dans le formulaire.
   */
  async formToHunt(formData: FormData): Promise<Hunt> {
    const hunt = await this.getHunt();

    for (const [prop, value] of formData.entries()) {
      switch (prop as huntProperty) {
        case 'dexid': {
          const allNames = await Pokemon.names();
          const dexid = allNames.findIndex(s => s === (value as string).toLowerCase());
          hunt.dexid = dexid > 0 ? dexid : 0;
        } break;

        case 'forme':
        case 'gene':
        case 'surnom':
        case 'methode':
        case 'jeu':
        case 'ball':
        case 'notes': {
          Object.assign(hunt, { [prop]: value });
        } break;

        case 'checkmark':
        case 'hacked': {
          Object.assign(hunt, { [prop]: parseInt(value as string) });
        } break;

        case 'charm':
        case 'hacked':
        case 'horsChasse': {
          Object.assign(hunt, { [prop]: Boolean(parseInt(value as string)) });
        } break;

        case 'compteur': {
          const methode = formData.get('methode');
          const jeu = formData.get('jeu');

          if (methode === 'Ultra-Brèche') {
            hunt.compteur = JSON.stringify({
              distance: parseInt(formData.get('usum-distance') as string),
              rings: parseInt(formData.get('usum-rings') as string)
            });
          }

          else if (methode === 'Chaîne de captures') {
            hunt.compteur = JSON.stringify({
              chain: parseInt(value as string),
              lure: formData.get('lgpe-lure') === '1',
            });
          }

          else if (jeu === 'Légendes Arceus') {
            hunt.compteur = JSON.stringify({
              count: parseInt(value as string),
              dexResearch: parseInt(formData.get('pla-dexResearch') as string)
            });
          }

          else {
            hunt.compteur = (value as string) || '0';
          }
        } break;

        case 'timeCapture': {
          const oldDate = (new Date(hunt.timeCapture)).toISOString().split('T')[0];
          const newTime = value !== oldDate ? (new Date(value as string)).getTime() : hunt.timeCapture;
          hunt.timeCapture = newTime;
        } break;
      }
    }

    return hunt;
  }


  async formChangeHandler(event: Event) {
    console.log(event);
    const nonce = {};
    this.changeNonce = nonce;

    const form = this.shadow.querySelector('form');
    if (form) {
      // Update locally saved data with changes from the form
      const formData = new FormData(form);
      const hunt = await this.formToHunt(formData);

      this.setAttribute('data-methode', hunt.methode);
      this.setAttribute('data-jeu', hunt.jeu);

      if (this.changeNonce !== nonce) return;
      await huntStorage.setItem(hunt.huntid, hunt);

      // Update some visuals with changes from the form
      await this.updateVisuals(hunt);
    }
  }


  async updateVisuals(_hunt?: Hunt) {
    const hunt = _hunt ?? (await this.getHunt());
    
    // Icons
    this.shadow.querySelector(`[data-icon="jeu"]`)!.className = `icones jeu ${hunt.jeu}`;
    this.shadow.querySelector(`[data-icon="ball"]`)!.className = `pkspr item ball-${hunt.ball}`;

    // Pokémon sprite
    const sprite = this.shadow.querySelector('pokemon-sprite')!;
    sprite.setAttribute('dexid', String(hunt.dexid));
    sprite.setAttribute('forme', hunt.forme);
    sprite.setAttribute('shiny', String(hunt.caught));
  }


  connectedCallback() {   
    // 🔽 Active les boutons du formulaire

    const form = this.shadow.querySelector('form') as HTMLFormElement;

    // Active les boutons d'incrémentation du compteur
    const inputCompteur = this.shadow.querySelector('input[name="compteur"]') as HTMLInputElement;

    this.handlers.counterAdd = {
      element: this.shadow.querySelector('button.counter.add') as HTMLButtonElement,
      type: 'click',
      function: event => {
        const value = Number(inputCompteur.value);
        const newValue = Math.min(value + 1, 999999);
        inputCompteur.value = String(newValue);
      }
    };
    handle(this.handlers.counterAdd);

    this.handlers.counterSub = {
      element: this.shadow.querySelector('button.counter.sub') as HTMLButtonElement,
      type: 'click',
      function: event => {
        const value = Number(inputCompteur.value);
        const newValue = Math.max(value - 1, 0);
        inputCompteur.value = String(newValue);
      }
    };
    handle(this.handlers.counterSub);

    // Active le bouton "capturé"
    this.handlers.caught = {
      element: this.shadow.querySelector('button.capture') as HTMLButtonElement,
      type: 'click',
      function: async event => {
        if (!form.checkValidity()) return;
        
        const hunt = await this.getHunt();

        form.classList.toggle('caught');
        const inputDate = this.shadow.querySelector('input[name="timeCapture"]') as HTMLInputElement;
        const sprite = this.shadow.querySelector('pokemon-sprite')! as pokemonSprite;
  
        if (form.classList.contains('caught')) {
          hunt.caught = true;
          sprite.setAttribute('shiny', 'true');
          sprite.sparkle();
          inputDate.value = new Date().toISOString().split('T')[0];
        } else {
          hunt.caught = false;
          sprite.setAttribute('shiny', 'false');
        }

        await huntStorage.setItem(hunt.huntid, hunt);
      }
    };
    handle(this.handlers.caught);

    // Active le bouton "annuler"
    const boutonCancel = this.shadow.querySelector('button.cancel') as HTMLButtonElement;
    this.handlers.cancel = {
      element: boutonCancel,
      type: 'click',
      function: async event => {
        const cancelMessage = 'Les modifications ne seront pas enregistrées.';
        const userResponse = await warnBeforeDestruction((event.currentTarget! as Element), event.currentTarget === boutonCancel ? cancelMessage : undefined);
        if (userResponse)  await this.delete();
      }
    };
    handle(this.handlers.cancel);

    // Active le bouton "enregistrer"
    this.handlers.submit = {
      element: this.shadow.querySelector('form') as HTMLFormElement,
      type: 'submit',
      function: async event => {
        event.preventDefault();

        const hunt = await this.getHunt();
  
        // Gestion des erreurs de formulaire
        const erreurs = [];
        if (hunt.dexid == 0) erreurs.push('Pokémon');
        if (hunt.jeu == '') erreurs.push('jeu');
        if (hunt.methode == '')  erreurs.push('méthode');
        if (hunt.timeCapture == 0) erreurs.push('date');
  
        if (erreurs.length > 0) {
          let message = `Les champs suivants sont mal remplis : `;
          erreurs.forEach(e => message += `${e}, `);
          message = message.replace(/,\ $/, '.');
          new Notif(message).prompt();
          return;
        } else {
          const boutonSubmit = this.shadow.querySelector('button.submit') as HTMLButtonElement;
          const userResponse = await warnBeforeDestruction(boutonSubmit, 'Ajouter ce Pokémon à vos chromatiques ?', 'done');
          if (userResponse) await this.submit();
        }
      }
    };
    handle(this.handlers.submit);

    // Active le bouton "supprimer"
    this.handlers.deleteShiny = {
      element: this.shadow.querySelector('button.delete') as HTMLButtonElement,
      type: 'click',
      function: async event => {
        const hunt = await this.getHunt();

        const edit = (await shinyStorage.getItem(hunt.huntid)) != null;
        if (!edit) {
          new Notif('Cette chasse n\'est pas dans la base de données').prompt();
          return;
        }
  
        const userResponse = await warnBeforeDestruction(event.currentTarget as Element);
        if (userResponse) await this.deleteShiny();
      }
    };
    handle(this.handlers.deleteShiny);

    // 🔽 Détecte les changements dans le formulaire :

    // Changements de tous les inputs
    this.handlers.form = {
      element: form,
      type: 'change',
      function: this.formChangeHandler.bind(this)
    }
    handle(this.handlers.form);

    // Génère la liste des formes au choix d'un Pokémon
    // et génère la liste des Pokémon correspondants quand on commence à écrire un nom
    const inputEspece = this.shadow.querySelector('[list="datalist-pokedex"]') as HTMLInputElement;
    this.handlers.listeFormes = {
      element: inputEspece,
      type: 'focus',
      function: event => {
        const inputHandler = (inputEvent: Event) => {
          DexDatalist.build(inputEspece.value, this.shadow.querySelector('datalist#datalist-pokedex')!);
          this.genereFormes(inputEspece.value);
        };

        const blurHandler = (blurEvent: Event) => {
          inputEspece.removeEventListener('input', inputHandler);
          inputEspece.removeEventListener('blur', blurHandler);
        };

        inputEspece.addEventListener('input', inputHandler);
        inputEspece.addEventListener('blur', blurHandler);
      }
    }
    handle(this.handlers.listeFormes);

    // Génère la liste des méthodes au choix du jeu
    const inputJeu = this.shadow.querySelector('select[name="jeu"]') as HTMLInputElement;
    this.handlers.listeMethodes = {
      element: inputJeu,
      type: 'focus',
      function: event => {
        const inputHandler = (inputEvent: Event) => {
          this.genereMethodes(inputJeu.value);
        };

        const blurHandler = (blurEvent: Event) => {
          inputJeu.removeEventListener('input', inputHandler);
          inputJeu.removeEventListener('blur', blurHandler);
        };

        inputJeu.addEventListener('input', inputHandler);
        inputJeu.addEventListener('blur', blurHandler);
      }
    }
    handle(this.handlers.listeMethodes);

    // Peuple le contenu de la carte
    if (this.huntid) this.updateVisuals();
  }


  /** Génère la liste des formes à partir du Pokémon entré. */
  async genereFormes(value: string) {
    const select = this.shadow.querySelector('select[name="forme"]') as HTMLInputElement;
    select.innerHTML = '';

    const allNames = await Pokemon.names();
    const k = allNames.findIndex(p => p == value.toLowerCase());
    if (k == -1) return 'Pokémon inexistant';
    else {
      const pkmn = await pokemonData.getItem(String(k));
      const formes: Forme[] = pkmn.formes.slice().sort((a: Forme, b: Forme) => { if (a.nom == '') return -1; else return 0;});
      for (const forme of formes) {
        if (forme.noShiny == true) return;

        if (forme.dbid != '') select.innerHTML += `<option value="${forme.dbid}">${forme.nom}</option>`;
        else select.innerHTML += `<option value="">${forme.nom || 'Forme normale'}</option>`;
      }
    }
  }


  /** Génère la liste des méthodes à partir du jeu entré. */
  genereMethodes(value: string) {
    const select = this.shadow.querySelector('select[name="methode"]') as HTMLInputElement;
    select.innerHTML = '';

    const k = Pokemon.jeux.findIndex(jeu => jeu.uid == value);
    if (k == -1) return 'Jeu inexistant';
    else {
      const methodes: Methode[] = [];

      for (const methode of Shiny.allMethodes) {
        const k = methode.jeux.findIndex(jeu => jeu.uid == value);
        if (k != -1) methodes.push(methode);
      }
  
      const lang = document.documentElement.getAttribute('lang');
      for (const methode of methodes) {
        const nom = methodStrings[lang][methode.id];
        select.innerHTML += `<option value="${methode.id}">${nom}</option>`;
      }
    }
  }


  /** Génère la liste des jeux. */
  genereJeux() {
    const select = this.shadow.querySelector('select[name="jeu"]')!;
    const lang = document.documentElement.getAttribute('lang');
    for (const jeu of Pokemon.jeux.reverse()) {
      const nom = gameStrings[lang][jeu.uid];
      select.innerHTML += `<option value="${jeu.uid}">${nom}</option>`;
    }
  }
  

  disconnectedCallback() {
    for (const [name, handler] of Object.entries(this.handlers)) {
      unhandle(handler);
    }
  }


  static get observedAttributes() {
    return ['huntid'];
  }


  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'huntid': {
        this.huntid = newValue;
        this.huntToForm();
      } break
    }
  }
}

if (!customElements.get('hunt-card')) customElements.define('hunt-card', huntCard);