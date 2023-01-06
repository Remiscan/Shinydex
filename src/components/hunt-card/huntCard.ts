import { DexDatalist } from '../../DexDatalist.js';
import { Hunt, huntedPokemon } from '../../Hunt.js';
import { warnBeforeDestruction } from '../../Params.js';
import { Count, Forme, Pokemon, Shiny } from '../../Pokemon.js';
import { huntStorage, pokemonData, shinyStorage } from '../../localForage.js';
import { Notif } from '../../notification.js';
import pokemonSprite from '../pokemon-sprite/pokemonSprite.js';
import template from './template.js';
// @ts-expect-error
import materialIconsSheet from '../../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import iconSheet from '../../../images/iconsheet.css' assert { type: 'css' };
// @ts-expect-error
import commonSheet from '../../../styles/common.css' assert { type: 'css' };
// @ts-expect-error
import sheet from './styles.css' assert { type: 'css' };
// @ts-expect-error
import gameStrings from '../../../strings/games.json' assert { type: 'json' };
// @ts-expect-error
import methodStrings from '../../../strings/methods.json' assert { type: 'json' };



const gameIds: Set<string> = new Set(Pokemon.jeux.map(jeu => jeu.id));
const gameSpecificSheet = new CSSStyleSheet();
gameSpecificSheet.replaceSync(`
  :host [data-game],:host [data-method] { display: none; }
  ${[...gameIds].map(id => `:host([data-game="${id}"]) [data-game~="${id}"] { display: var(--display, revert); }`).join('')}
  ${Shiny.allMethodes.map(m => `:host([data-method="${m.id}"]) [data-method~="${m.id}"] { display: var(--display, revert); }`).join('')}
`);


const compteurProps: Array<keyof Shiny['count']> = ['usum-distance', 'usum-rings', 'lgpe-catchCombo', 'lgpe-lure', 'lgpe-nextSpawn', 'swsh-dexKo', 'pla-dexResearch', 'sv-outbreakCleared', 'sv-sparklingPower'];



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
  element: Element | null;
  type: string;
  function: (e: Event) => void;
}

interface HandlerMap {
  [name: string]: Handler
}

function handle(handler: Handler) {
  handler.element?.addEventListener(handler.type, handler.function);
}

function unhandle(handler: Handler) {
  handler.element?.removeEventListener(handler.type, handler.function);
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
    this.shadow.adoptedStyleSheets = [materialIconsSheet, iconSheet, commonSheet, sheet, gameSpecificSheet];
    this.genereJeux();
    this.genereMethodes();
  }

  async getHunt() {
    return await Hunt.getOrMake(this.huntid ?? undefined);
  }


  /**
   * Soumet la chasse à la BDD locale des shiny.
   */
  async submit() {
    const hunt = await this.getHunt();
    hunt.lastUpdate = Date.now();

    try {
      const shiny = new Shiny(hunt);
      await shinyStorage.setItem(this.huntid, shiny);
      await this.delete(false);

      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['mes-chromatiques', 'chasses-en-cours'],
          ids: [this.huntid],
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
  async delete(populate = true) {
    await huntStorage.removeItem(this.huntid);

    if (populate) {
      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['chasses-en-cours'],
          ids: [this.huntid],
        }
      }));
    }
  }

  
  /**
   * Supprime la chasse et le shiny qu'elle éditait, et déplace ce dernier dans la corbeille.
   */
  async deleteShiny() {
    const storedShiny = await shinyStorage.getItem(this.huntid);
    const edit = storedShiny != null;
    if (!edit) {
      new Notif('Cette chasse n\'est pas dans la base de données').prompt();
      return;
    }

    const hunt = await this.getHunt();
    hunt.lastUpdate = Date.now();
    hunt.deleted = true;
    await huntStorage.setItem(this.huntid, hunt);

    // On marque le shiny comme supprimé (pour que la suppression se synchronise en ligne)
    const shiny = new Shiny(storedShiny);
    shiny.lastUpdate = hunt.lastUpdate;
    shiny.deleted = true;
    // Si la synchronisation en ligne est désactivée, marquer le shiny comme à 'destroy' immédiatement
    // if (!onlineSync) shiny.destroy = true;
    await shinyStorage.setItem(this.huntid, shiny);

    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['mes-chromatiques', 'chasses-en-cours'],
        ids: [this.huntid],
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
      const input = this.shadow.querySelector(`input[name="${prop}"], select[name="${prop}"], textarea[name="${prop}"]`);

      switch (prop) {
        case 'dexid': {
          if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
          const value = hunt.dexid;
          let name = '';
          if (value > 0) {
            const allNames = await Pokemon.names();
            name = allNames[value];
          }
          input.value = name;
          this.genereFormes(name, hunt.forme);
        } break;

        case 'game': {
          if (!(input instanceof HTMLSelectElement)) throw new TypeError(`Expecting HTMLSelectElement`);
          const value = hunt.game;
          input.value = value;
          this.updateAttribute('game', value);
        } break;

        case 'method': {
          if (!(input instanceof HTMLSelectElement)) throw new TypeError(`Expecting HTMLSelectElement`);
          const value = hunt.method;
          input.value = value;
          this.updateAttribute('method', value);
        } break;

        case 'forme':
        case 'ball':
        case 'hacked': {
          if (!(input instanceof HTMLSelectElement)) throw new TypeError(`Expecting HTMLSelectElement`);
          const value = String(hunt[prop]);
          input.value = value;
        } break;

        case 'name': {
          if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
          const value = String(hunt[prop]);
          input.value = value;
        } break;

        case 'notes': {
          if (!(input instanceof HTMLTextAreaElement)) throw new TypeError(`Expecting HTMLTextAreaElement`);
          const value = String(hunt[prop]);
          input.value = value;
        } break;

        case 'gene':
        case 'originMark': {
          const value = hunt[prop];
          const input = this.shadow.querySelector(`input[name="${prop}"][value="${value}"]`);
          if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
          input.checked = true;
        } break;

        case 'charm': {
          if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
          const value = hunt[prop];
          input.checked = value;
        } break;

        case 'count': {
          if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
          const value = hunt.count;
          input.value = String(value['encounters'] || 0);

          for (const compteurProp of compteurProps) {
            const input = this.shadow.querySelector(`input[name="${compteurProp}"], select[name="${compteurProp}"]`);
            if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement)) throw new TypeError(`Expecting HTMLInputElement or HTMLSelectElement`);
            const propValue = String(value[compteurProp] || 0);
            if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = input.value === propValue;
            else input.value = propValue;
          }
        } break;

        case 'catchTime': {
          if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
          const value = hunt.catchTime || 0;
          const date = (new Date(value)).toISOString().split('T')[0];
          input.value = date;
        } break;

        case 'caught': {
          if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
          const value = hunt.caught;
          input.checked = value;
          const form = this.shadow.querySelector('form');
          if (value) form?.classList.add('caught');
          else       form?.classList.remove('caught');
        } break;

        case 'huntid': {
          const value = hunt.huntid;
          const form = this.shadow.querySelector('form');
          const edit = (await shinyStorage.getItem(value)) != null;
          if (edit) form?.setAttribute('data-edit', '');
          else      form?.removeAttribute('data-edit');
        } break;
      }
    }
  }

  async dataToContent() { return this.huntToForm(); }


  /**
   * Met à jour la Hunt sauvegardée à partir des informations saisies dans le formulaire.
   */
  async formToHunt(formData: FormData): Promise<Hunt> {
    for (const pair of formData.entries()) {
      console.log(`${pair[0]}, ${pair[1]}`);
    }
    const hunt = await this.getHunt();

    for (const [prop, value] of formData.entries()) {
      switch (prop) {
        case 'dexid': {
          const allNames = await Pokemon.names();
          const dexid = allNames.findIndex(s => s === String(value).toLowerCase());
          hunt.dexid = dexid > 0 ? dexid : 0;
          hunt.forme = '';
        } break;

        case 'forme':
        case 'gene':
        case 'name':
        case 'method':
        case 'game':
        case 'ball':
        case 'originMark':
        case 'notes': {
          Object.assign(hunt, { [prop]: String(value) });
        } break;

        case 'hacked': {
          Object.assign(hunt, { [prop]: parseInt(String(value)) });
        } break;

        case 'caught':
        case 'charm': {
          const boolean = value === 'false' ? false : true;
          Object.assign(hunt, { [prop]: boolean });
        } break;

        case 'count': {
          const compteur: Shiny['count'] = new Count({
            encounters: Number(value) || 0
          });

          for (const compteurProp of compteurProps) {
            const val = parseInt(String(formData.get(compteurProp))) || 0;
            if (val > 0) compteur[compteurProp] = val;
          }

          hunt.count = compteur;
        } break;

        case 'catchTime': {
          const timeCapture = hunt.catchTime || 0;
          const oldDate = (new Date(timeCapture)).toISOString().split('T')[0];
          const newTime = value !== oldDate ? (new Date(String(value))).getTime() : timeCapture;
          if (!isNaN(newTime)) hunt.catchTime = newTime;
        } break;
      }
    }

    return hunt;
  }


  async formChangeHandler(event: Event) {
    const nonce = {};
    this.changeNonce = nonce;

    const form = this.shadow.querySelector('form');
    // Update locally saved data with changes from the form
    if (form) {
      const formData = new FormData(form);
    
      // Add checkboxes state to formData
      const checkboxes = [...this.shadow.querySelectorAll('input[type="checkbox"][name]')];
      checkboxes.forEach(checkbox => {
        if (!(checkbox instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
        const name = checkbox.getAttribute('name')!;
        if (!checkbox.checked) formData.append(name, 'false');
      });

      const hunt = await this.formToHunt(formData);
      
      this.updateAttribute('method', hunt.method);
      this.updateAttribute('game', hunt.game);

      if (this.changeNonce !== nonce) return;
      await huntStorage.setItem(hunt.huntid, hunt);

      // Update some visuals with changes from the form
      await this.updateVisuals(hunt);
    }
  }


  async updateVisuals(_hunt?: Hunt) {
    const hunt = _hunt ?? (await this.getHunt());
    
    const gameIcon = this.shadow.querySelector(`[data-icon^="game"]`)!;
    if (hunt.game) {
      gameIcon.classList.add('icon');
      gameIcon.setAttribute('data-icon', `game/${hunt.game}`);
    } else {
      gameIcon.classList.remove('icon');
      gameIcon.setAttribute('data-icon', 'game');
    }

    const ballIcon = this.shadow.querySelector(`[data-icon^="ball"]`)!;
    if (hunt.ball) {
      ballIcon.classList.add('icon');
      ballIcon.setAttribute('data-icon', `ball/${hunt.ball}`);
    } else {
      ballIcon.classList.remove('icon');
      ballIcon.setAttribute('data-icon', 'ball');
    }

    const sprite = this.shadow.querySelector('pokemon-sprite')!;
    sprite.setAttribute('dexid', String(hunt.dexid));
    sprite.setAttribute('forme', hunt.forme);
    sprite.setAttribute('shiny', String(hunt.caught));
  }


  updateAttribute(attr: string, value: string) {
    switch (attr) {
      case 'method': {
        this.setAttribute('data-method', value);
        const methode = Shiny.allMethodes.find(methode => methode.id === value);
        this.setAttribute('data-method-mine', String(methode?.mine ?? false));
      } break;

      case 'game': {
        const jeu = Pokemon.jeux.find(jeu => jeu.uid === value);
        this.setAttribute('data-game', jeu?.id ?? '');
        const charmAvailable = jeu ? jeu.gen >= 5 : false;
        this.setAttribute('data-charm-available', String(charmAvailable));
        const virtualconsoleGen = jeu ? (jeu.gen === 1 || jeu.gen === 2) : false;
        this.setAttribute('data-gen-vc', String(virtualconsoleGen));
      } break;
    }
  }


  connectedCallback() {   
    // 🔽 Active les boutons du formulaire

    const form = this.shadow.querySelector('form');
    if (!(form instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

    // Active les boutons d'incrémentation du compteur
    const inputCompteur = this.shadow.querySelector('input[name="count"]');
    if (!(inputCompteur instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);

    this.handlers.counterAdd = {
      element: this.shadow.querySelector('button.counter.add'),
      type: 'click',
      function: event => {
        const value = Number(inputCompteur.value);
        const newValue = Math.min(value + 1, 999999);
        inputCompteur.value = String(newValue);
        form.dispatchEvent(new Event('change'));
      }
    };
    handle(this.handlers.counterAdd);

    this.handlers.counterSub = {
      element: this.shadow.querySelector('button.counter.sub'),
      type: 'click',
      function: event => {
        const value = Number(inputCompteur.value);
        const newValue = Math.max(value - 1, 0);
        inputCompteur.value = String(newValue);
        form.dispatchEvent(new Event('change'));
      }
    };
    handle(this.handlers.counterSub);

    // Active le bouton "capturé"
    this.handlers.caught = {
      element: this.shadow.querySelector('input[name="caught"]'),
      type: 'change',
      function: async event => {
        if (!form.checkValidity()) {
          if (!(event.currentTarget instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
          event.currentTarget.checked = false;
          form.dispatchEvent(new Event('change'));
          return;
        }

        form.classList.toggle('caught');
        const inputDate = this.shadow.querySelector('input[name="catchTime"]');
        if (!(inputDate instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
        const sprite: pokemonSprite | null = this.shadow.querySelector('pokemon-sprite');
  
        if (form.classList.contains('caught')) {
          sprite?.setAttribute('shiny', 'true');
          sprite?.sparkle();
          if (!form.getAttribute('edit') != null) {
            inputDate.value = new Date().toISOString().split('T')[0];
            form.dispatchEvent(new Event('change'));
          }
        } else {
          sprite?.setAttribute('shiny', 'false');
        }
      }
    };
    handle(this.handlers.caught);

    // Active le bouton "annuler"
    this.handlers.cancel = {
      element: this.shadow.querySelector('button.edit-cancel'),
      type: 'click',
      function: async event => {
        const cancelMessage = 'Cette chasse sera supprimée.';
        if (!(event.currentTarget instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
        const userResponse = await warnBeforeDestruction(event.currentTarget, cancelMessage);
        if (userResponse)  await this.delete();
      }
    };
    handle(this.handlers.cancel);

    // Active le bouton "supprimer"
    this.handlers.delete = {
      element: this.shadow.querySelector('button.hunt-delete'),
      type: 'click',
      function: async event => {
        const cancelMessage = 'Cette chasse sera supprimée.';
        if (!(event.currentTarget instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
        const userResponse = await warnBeforeDestruction(event.currentTarget, cancelMessage);
        if (userResponse)  await this.delete();
      }
    };
    handle(this.handlers.delete);

    // Active le bouton "enregistrer"
    this.handlers.submit = {
      element: this.shadow.querySelector('form'),
      type: 'submit',
      function: async event => {
        event.preventDefault();

        const hunt = await this.getHunt();
  
        // Gestion des erreurs de formulaire
        const erreurs = [];
        if (hunt.dexid == 0) erreurs.push('Pokémon');
        if (hunt.game == '') erreurs.push('jeu');
        if (hunt.method == '')  erreurs.push('méthode');
        if (hunt.catchTime == 0) erreurs.push('date');
  
        if (erreurs.length > 0) {
          let message = `Les champs suivants sont mal remplis : `;
          erreurs.forEach(e => message += `${e}, `);
          message = message.replace(/,\ $/, '.');
          new Notif(message).prompt();
          return;
        } else {
          const boutonSubmit = this.shadow.querySelector('button.submit');
          if (!(boutonSubmit instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
          const userResponse = await warnBeforeDestruction(boutonSubmit, 'Ajouter ce Pokémon à vos chromatiques ?', 'done');
          if (userResponse) await this.submit();
        }
      }
    };
    handle(this.handlers.submit);

    // Active le bouton "supprimer"
    this.handlers.deleteShiny = {
      element: this.shadow.querySelector('button.full-delete'),
      type: 'click',
      function: async event => {
        const deleteMessage = 'Ce Pokémon chromatique sera supprimé et déplacé dans la corbeille.';
        if (!(event.currentTarget instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
        const userResponse = await warnBeforeDestruction(event.currentTarget, deleteMessage);
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
    const inputEspece = this.shadow.querySelector('[list="datalist-pokedex"]');
    if (!(inputEspece instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
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

    // Peuple le contenu de la carte
    if (this.huntid) this.updateVisuals();
  }


  /** Génère la liste des formes à partir du Pokémon entré. */
  async genereFormes(value: string, formeToSelect?: string) {
    const select = this.shadow.querySelector('select[name="forme"]');
    if (!(select instanceof HTMLSelectElement)) throw new TypeError(`Expecting HTMLSelectElement`);
    select.innerHTML = '';

    const allNames = await Pokemon.names();
    const k = allNames.findIndex(p => p == value.toLowerCase());
    if (k == -1) return 'Pokémon inexistant';
    else {
      const pkmn = await pokemonData.getItem(String(k));
      const formes: Forme[] = pkmn.formes.slice().sort((a: Forme, b: Forme) => { if (a.nom == '') return -1; else return 0;});
      for (const forme of formes) {
        if (forme.noShiny == true) continue;

        const selected = forme.dbid === formeToSelect;
        select.innerHTML += `<option value="${forme.dbid}"${selected ? ' selected' : ''}>${forme.nom || 'Forme normale'}</option>`;
      }
    }
  }


  /** Génère la liste des méthodes à partir du jeu entré. */
  genereMethodes() {
    const select = this.shadow.querySelector('select[name="method"]');
    if (!(select instanceof HTMLSelectElement)) throw new TypeError(`Expecting HTMLSelectElement`);
    const lang = document.documentElement.getAttribute('lang');
    for (const methode of Shiny.allMethodes) {
      const nom = methodStrings[lang][methode.id];
      const gameIds = new Set(methode.jeux.map(jeu => jeu.id));
      select.innerHTML += `<option value="${methode.id}" data-game="${[...gameIds].join(' ')}">${nom}</option>`;
    }
  }


  /** Génère la liste des jeux. */
  genereJeux() {
    const select = this.shadow.querySelector('select[name="game"]');
    if (!(select instanceof HTMLSelectElement)) throw new TypeError(`Expecting HTMLSelectElement`);
    const lang = document.documentElement.getAttribute('lang');
    for (const jeu of [...Pokemon.jeux].reverse()) {
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