import { Hunt } from '../../Hunt.js';
import { Forme, Pokemon } from '../../Pokemon.js';
import { Count, Shiny } from '../../Shiny.js';
import { huntStorage, shinyStorage } from '../../localForage.js';
import { Notif, warnBeforeDestruction } from '../../notification.js';
import { getCurrentLang, getString, translationObserver } from '../../translation.js';
import { InputSelect } from '../inputSelect.js';
import { pokemonSprite } from '../pokemon-sprite/pokemonSprite.js';
import { TextArea } from '../textArea.js';
import { TextField } from '../textField.js';
import template from './template.js';
import materialIconsSheet from '../../../../ext/material_icons.css' assert { type: 'css' };
import themesSheet from '../../../../styles/themes.css.php' assert { type: 'css' };
import iconSheet from '../../../../images/iconsheet.css' assert { type: 'css' };
import commonSheet from '../../../../styles/common.css' assert { type: 'css' };
import { gameStrings, isSupportedGameID, isSupportedLang, isSupportedMethodID, methodStrings, pokemonData } from '../../jsonData.js';
import { CheckBox } from '../checkBox.js';
import { DexDatalist } from '../dexDatalist.js';
import sheet from './styles.css' assert { type: 'css' };
import { noAccent } from '../../Params.js';



const gameIds: Set<string> = new Set(Pokemon.jeux.map(jeu => jeu.id));
const gameSpecificSheet = new CSSStyleSheet();
gameSpecificSheet.replaceSync(`
  :host [data-game],:host [data-method] { display: none; }
  ${[...gameIds].map(id => `:host([data-game="${id}"]) [data-game~="${id}"] { display: flex; }`).join('')}
  ${Shiny.allMethodes.map(m => `:host([data-method="${m.id}"]) [data-method~="${m.id}"] { display: flex; }`).join('')}
`);


const compteurProps = Object.keys(new Shiny().count).filter(e => {
  return !(['encounters'].includes(e));
}) as Array<keyof Shiny['count']>;



type Handler = {
  element: Element,
  type: string,
  callback: (e: Event) => void
};



export class huntCard extends HTMLElement {
  #shadow: ShadowRoot;
  #huntid: string = '';
  #handlers: Handler[] = [];
  #changeNonce: Object = {};
  needsRefresh = true;


  /** Adds 1 encounter. */
  #counterAddHandler = (event: Event) => {
    event.preventDefault(); // prevent from focusing the input field
    
    const inputCompteur = this.getInput('count');
    if (!(inputCompteur instanceof TextField)) throw new TypeError(`Expecting TextField`);

    const value = Number(inputCompteur.value);
    const newValue = Math.min(value + 1, 999999);
    inputCompteur.value = String(newValue);
    this.form.dispatchEvent(new Event('change'));
  };


  /** Substracts 1 encounter. */
  #counterSubHandler = (event: Event) => {
    event.preventDefault(); // prevent from focusing the input field
    
    const inputCompteur = this.getInput('count');
    if (!(inputCompteur instanceof TextField)) throw new TypeError(`Expecting TextField`);

    const value = Number(inputCompteur.value);
    const newValue = Math.max(value - 1, 0);
    inputCompteur.value = String(newValue);
    this.form.dispatchEvent(new Event('change'));
  };


  /** Marks the Pokémon as caught. */
  #catchHandler = async (event: Event) => {
    const form = this.form;

    // Allow marking as caught only if first part of the form is valid
    if (!form.checkValidity()) {
      if (!(event.currentTarget instanceof CheckBox)) throw new TypeError(`Expecting CheckBox`);
      event.currentTarget.checked = false;
      form.dispatchEvent(new Event('change'));
      return;
    }
    form.classList.toggle('caught');
    
    const sprite: pokemonSprite | null = this.#shadow.querySelector('pokemon-sprite');

    if (form.classList.contains('caught')) {
      // Update Pokémon sprite to shiny form
      sprite?.setAttribute('shiny', 'true');
      sprite?.sparkle();

      // If it's not an edit, update catch time to current time
      const edit = await this.isEdit();
      if (!edit) {
        const inputDate = this.getInput('catchTime');
        if (!(inputDate instanceof TextField)) throw new TypeError(`Expecting TextField`);

        inputDate.value = new Date().toISOString().split('T')[0];
        form.dispatchEvent(new Event('change'));
      }
    } else {
      // Update Pokémon sprite to regular form
      sprite?.setAttribute('shiny', 'false');
    }
  };


  /** Cancels edit and doesn't save modifications to shinyStorage. */
  #cancelHandler = async (event: Event) => {
    const cancelMessage = getString('notif-modifications-will-be-lost');
    if (!(event.currentTarget instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    const userResponse = await warnBeforeDestruction(event.currentTarget, cancelMessage);
    if (userResponse)  await this.cancelEdit();
  };


  /** Deletes a hunt. */
  #deleteHandler = async (event: Event) => {
    const cancelMessage = getString('notif-hunt-will-be-deleted');
    if (!(event.currentTarget instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    const userResponse = await warnBeforeDestruction(event.currentTarget, cancelMessage);
    if (userResponse)  await this.delete();
  };


  /** Submits a hunt and saves it to shinyStorage. */
  #submitHandler = async (event: Event) => {
    event.preventDefault();

    const hunt = await this.getHunt();

    // Manage form errors
    const erreurs = [];
    if (hunt.dexid == 0) erreurs.push('Pokémon');
    if (hunt.game == '') erreurs.push('jeu');
    if (hunt.method == '')  erreurs.push('méthode');
    if (hunt.catchTime < 0) erreurs.push('date');

    if (erreurs.length > 0) {
      let message = getString('error-badly-filled-inputs');
      erreurs.forEach(e => message += ` ${e},`);
      message = message.replace(/,$/, '.');
      new Notif(message).prompt();
      return;
    }

    const edit = await this.isEdit();
    if (edit) {
      // If it's an edit, ask for user confirmation before overwriting shinyStorage
      const boutonSubmit = this.getButton('save-shiny');
      if (!(boutonSubmit instanceof HTMLButtonElement)) throw new TypeError(`Expecting HTMLButtonElement`);
      const userResponse = await warnBeforeDestruction(boutonSubmit, getString('notif-save-edits'), 'done');
      if (!userResponse) return;
    }

    await this.submit();
  };


  /** Deletes a hunt being edited AND the associated shiny in shinyStorage. */
  #deleteShinyHandler = async (event: Event) => {
    const deleteMessage = getString('notif-shiny-will-be-deleted');
    if (!(event.currentTarget instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    const userResponse = await warnBeforeDestruction(event.currentTarget, deleteMessage);
    if (userResponse) await this.deleteShiny();
  };


  /** Generates datalist of Pokémon species when the user starts writing a species name. */
  #previousSpeciesString = '';
  #speciesInputHandler = (event: Event) => {
    const inputEspece = event.currentTarget;
    if (!(inputEspece instanceof TextField)) throw new TypeError(`Expecting TextField`);

    const string = inputEspece.value;

    // Generate datalist
    // - Si on revient aux mêmes 2 caractères qu'au départ, on garde la même liste
    if (string.length == 2 && this.#previousSpeciesString.length == 3) return;
    this.#previousSpeciesString = string;

    const datalist = this.#shadow.querySelector('datalist');
    if (datalist instanceof DexDatalist) {
      datalist.setAttribute('input', string);
      inputEspece.setAttribute('datalist-options', JSON.stringify(datalist.suggestions));

      const especeIndex = datalist.suggestions.findIndex(v => v.value === string);
      if (especeIndex >= 0) {
        inputEspece.value = datalist.suggestions[especeIndex].label;
        inputEspece.dispatchEvent(new Event('change', { bubbles: true }));
        datalist.setAttribute('input', '');
        inputEspece.setAttribute('datalist-options', '[]');
      }
    }
  }


  #formChangeHandler = async (event: Event) => {
    const nonce = {};
    this.#changeNonce = nonce;

    const form = this.form;
    // Update locally saved data with changes from the form
    if (form) {
      const formData = new FormData(form);
    
      // Add checkboxes state to formData
      const checkboxes = [...this.#shadow.querySelectorAll('input[type="checkbox"][name]')];
      checkboxes.forEach(checkbox => {
        if (!(checkbox instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
        const name = checkbox.getAttribute('name')!;
        if (!checkbox.checked) formData.append(name, 'false');
      });

      const hunt = await this.formToHunt(formData);
      
      this.genereFormes(hunt.dexid, hunt.forme);
      this.genereMethodes(hunt.game, hunt.method)
      this.updateAttribute('method', hunt.method);
      this.updateAttribute('game', hunt.game);

      const caughtCheckBox = this.getInput('caught');
      // In a setTimeout because it needs to happen after genereMethodes causes the input-select to auto-select a method
      setTimeout(() => {
        if (!this.checkFormUncaughtPartValidity()) caughtCheckBox?.setAttribute('disabled', '');
        else                                       caughtCheckBox?.removeAttribute('disabled');
      });

      if (this.#changeNonce !== nonce) return;
      await huntStorage.setItem(hunt.huntid, hunt);

      // Update some visuals with changes from the form
      await this.updateVisuals(hunt);
    }
  }


  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.#shadow.appendChild(template.content.cloneNode(true));
    this.#shadow.adoptedStyleSheets = [materialIconsSheet, iconSheet, themesSheet, commonSheet, sheet, gameSpecificSheet];
    this.genereJeux();
  }


  async getHunt() {
    return await Hunt.getOrMake(this.#huntid ?? undefined);
  }


  async isEdit() {
    return (await shinyStorage.getItem(this.#huntid)) != null;
  }


  get form() {
    const form = this.#shadow.querySelector('form');
    if (!(form instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
    return form;
  }

  getInput(name: string) {
    return this.#shadow.querySelector(`[name="${name}"]`);
  }

  getButton(action: string) {
    return this.#shadow.querySelector(`[data-action="${action}"]`);
  }


  handle(element: Element | null, type: string, callback: (e: Event) => void) {
    if (element) {
      this.#handlers.push({ element, type, callback });
      element.addEventListener(type, callback);
    }
  }


  /**
   * Soumet la chasse à la BDD locale des shiny.
   */
  async submit() {
    const hunt = await this.getHunt();
    hunt.lastUpdate = Date.now();

    try {
      const shiny = new Shiny(hunt);
      await shinyStorage.setItem(this.#huntid, shiny);
      await huntStorage.removeItem(this.#huntid);

      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['mes-chromatiques', 'chasses-en-cours'],
          ids: [this.#huntid],
          sync: true
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
    const hunt = await this.getHunt();

    try {
      // Si la chasse n'a pas été modifiée, on la supprime complètement
      if (hunt.isEmpty()) {
        await huntStorage.removeItem(this.#huntid);

        window.dispatchEvent(new CustomEvent('dataupdate', {
          detail: {
            sections: ['chasses-en-cours'],
            ids: [this.#huntid],
            sync: false
          }
        }));
      }

      // Sinon, on déplace la chasse dans la corbeille
      else {
        hunt.lastUpdate = Date.now();
        hunt.deleted = true;
        hunt.destroy = true;
        await huntStorage.setItem(this.#huntid, hunt);

        if (populate) {
          window.dispatchEvent(new CustomEvent('dataupdate', {
            detail: {
              sections: ['chasses-en-cours', 'corbeille'],
              ids: [this.#huntid],
              sync: false
            }
          }));
        }
      }
    } catch (error) {
      console.error(error);
    }
  }


  /**
   * Annule l'édition d'un Pokémon shiny, en supprimant les modifications pour toujours.
   */
  async cancelEdit() {
    const storedShiny = await shinyStorage.getItem(this.#huntid);
    const edit = storedShiny != null;
    if (!edit) {
      new Notif(getString('error-cant-cancel-edit')).prompt();
      return;
    }

    // On supprime la chasse, sans toucher au shiny associé
    await huntStorage.removeItem(this.#huntid);

    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['chasses-en-cours'],
        ids: [this.#huntid],
        sync: false
      }
    }));
  }

  
  /**
   * Supprime la chasse et le shiny qu'elle éditait, et déplace ce dernier dans la corbeille.
   */
  async deleteShiny() {
    const storedShiny = await shinyStorage.getItem(this.#huntid);
    const edit = storedShiny != null;
    if (!edit) {
      new Notif(getString('error-cant-delete-hunt')).prompt();
      return;
    }

    const hunt = await this.getHunt();
    hunt.lastUpdate = Date.now();
    hunt.deleted = true;
    await huntStorage.setItem(this.#huntid, hunt);

    // On supprime le shiny associé
    await shinyStorage.removeItem(this.#huntid);

    window.dispatchEvent(new CustomEvent('dataupdate', {
      detail: {
        sections: ['mes-chromatiques', 'chasses-en-cours', 'corbeille'],
        ids: [this.#huntid],
        sync: true
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
      const input = this.getInput(prop);

      switch (prop) {
        case 'dexid': {
          const value = hunt.dexid;
          let name = '';
          if (value > 0) {
            const allNames = Pokemon.names();
            name = allNames[value];
          }

          if (input instanceof TextField) input.value = name;
          else input?.setAttribute('value', name);

          this.genereFormes(hunt.dexid, hunt.forme);
        } break;

        case 'game': {
          const value = hunt.game;

          if (input instanceof InputSelect) input.value = value;
          else input?.setAttribute('value', value);

          this.genereMethodes(value, hunt.method);
          this.updateAttribute('game', value);
        } break;

        case 'method': {
          const value = hunt.method;
          
          if (input instanceof InputSelect) input.value = value;
          else input?.setAttribute('value', value);

          this.updateAttribute('method', value);
        } break;

        case 'forme':
        case 'ball':
        case 'gene': {
          const value = String(hunt[prop]);
          
          if (input instanceof InputSelect) input.value = value;
          else input?.setAttribute('value', value);
        } break;

        case 'name': {
          const value = String(hunt[prop]);
          
          if (input instanceof TextField) input.value = value;
          else input?.setAttribute('value', value);
        } break;

        case 'notes': {
          const value = String(hunt[prop]);
          
          if (input instanceof TextArea) input.value = value;
          else input?.setAttribute('value', value);
        } break;

        case 'charm': {
          const value = hunt[prop];
          
          if (input instanceof CheckBox) input.checked = value;
          else input?.setAttribute('checked', String(value));
        } break;

        case 'originalTrainer': {
          // The field is reversed! It asks if the Pokémon is traded, i.e. if you are NOT its original trainer
          const value = !hunt[prop];
          
          if (input instanceof CheckBox) input.checked = value;
          else input?.setAttribute('checked', String(value));
        } break;

        case 'count': {
          const value = hunt.count;
          const encounters = value['encounters'] || 0;

          if (input instanceof TextField) input.value = String(encounters);
          else input?.setAttribute('value', String(encounters));

          for (const compteurProp of compteurProps) {
            const input = this.getInput(compteurProp);
            const propValue = value[compteurProp] || 0;

            if (input instanceof TextField) input.value = String(propValue);
            else if (input instanceof InputSelect) input.value = String(propValue);
            else if (input instanceof CheckBox) input.checked = propValue > 0;
            else if (input && input.tagName === 'CHECK-BOX') input.setAttribute('checked', String(propValue > 0));
            else input?.setAttribute('value', String(propValue));
          }
        } break;

        case 'catchTime': {
          const value = hunt.catchTime || 0;
          const date = (new Date(value)).toISOString().split('T')[0];
          
          if (input instanceof TextField) input.value = date;
          else input?.setAttribute('value', date);

          const dateUnknown = !(value > 825289200000);
          const unknownInput = this.getInput('catchTime-unknown');
          if (unknownInput instanceof CheckBox) unknownInput.checked = dateUnknown;
          else if (unknownInput && unknownInput.tagName === 'CHECK-BOX') unknownInput.setAttribute('checked', String(dateUnknown));
        } break;

        case 'caught': {
          const value = hunt.caught;

          if (input instanceof CheckBox) input.checked = value;
          else input?.setAttribute('checked', String(value));

          const form = this.form;
          if (value) {
            form.classList.add('caught');
            input?.removeAttribute('disabled');
          } else {
            form.classList.remove('caught');
            if (!this.checkFormUncaughtPartValidity()) input?.setAttribute('disabled', '');
            else                                       input?.removeAttribute('disabled');
          }
        } break;

        case 'huntid': {
          const value = hunt.huntid;
          const form = this.form;
          const edit = (await shinyStorage.getItem(value)) != null;
          if (edit) form.setAttribute('data-edit', '');
          else      form.removeAttribute('data-edit');
        } break;
      }
    }
  }

  async dataToContent() { 
    await this.huntToForm();
    await this.updateVisuals();
  }


  /**
   * Met à jour la Hunt sauvegardée à partir des informations saisies dans le formulaire.
   */
  async formToHunt(formData: FormData): Promise<Hunt> {
    const hunt = await this.getHunt();

    for (const [prop, value] of formData.entries()) {
      switch (prop) {
        case 'dexid': {
          const allNames = Pokemon.names();
          const normalizeString = (str: string) => noAccent(str.toLowerCase());
          const dexid = allNames.findIndex(s => normalizeString(s) === normalizeString(String(value)));
          hunt.dexid = dexid > 0 ? dexid : 0;
        } break;

        case 'forme': {
          const formes = pokemonData[hunt.dexid].formes;
          const k = formes.findIndex(form => form.dbid === value);
          hunt.forme = k >= 0 ? String(value) : '';
        } break;

        case 'gene':
        case 'name':
        case 'method':
        case 'game':
        case 'ball':
        case 'originMark':
        case 'notes': {
          Object.assign(hunt, { [prop]: String(value) });
        } break;

        case 'caught':
        case 'charm': {
          const boolean = value === 'false' ? false : true;
          Object.assign(hunt, { [prop]: boolean });
        } break;

        case 'originalTrainer': {
          // The field is reversed! It asks if the Pokémon is traded, i.e. if you are NOT its original trainer
          const boolean = !(value === 'false' ? false : true);
          Object.assign(hunt, { [prop]: boolean });
        } break;

        case 'count': {
          const compteur: Shiny['count'] = new Count({
            encounters: Math.max(0, Math.min(Number(value) || 0, 999999))
          });

          for (const compteurProp of compteurProps) {
            const val = String(formData.get(compteurProp));
            let propVal: number | boolean = parseInt(val);
            if (isNaN(propVal)) {
              propVal = Number(val === 'true');
            } else {
              propVal = Math.max(0, Math.min(propVal || 0, 999999));
            }

            if (propVal > 0) compteur[compteurProp] = propVal;
            else delete compteur[compteurProp];
          }

          hunt.count = compteur;
        } break;

        case 'catchTime': {
          const unknown = formData.get('catchTime-unknown') === 'false' ? false : true;
          const timeCapture = hunt.catchTime || 0;
          const oldDate = (new Date(timeCapture)).toISOString().split('T')[0];
          const newTime = value !== oldDate ? (new Date(String(value))).getTime() : timeCapture;
          if (!isNaN(newTime)) hunt.catchTime = unknown ? 825289200000 : newTime;
        } break;
      }
    }

    return hunt;
  }


  /** Checks whether the part of the form displayed when the "caught" checkbox isn't checked is valid. */
  checkFormUncaughtPartValidity(): boolean {
    const form = this.form;
    const inputs = [...form.querySelectorAll('text-field, input-select, check-box')]
      .filter(input => !input.matches('.capture-button-group ~ *'));
    return inputs.every(input => 'checkValidity' in input && typeof input.checkValidity === 'function' && input.checkValidity());
  }


  async updateVisuals(_hunt?: Hunt) {
    const hunt = _hunt ?? (await this.getHunt());
    
    const gameIcon = this.#shadow.querySelector(`[data-icon^="game"]`)!;
    if (hunt.game) {
      gameIcon.setAttribute('data-icon', `game/${hunt.game}`);
    } else {
      gameIcon.setAttribute('data-icon', 'game');
    }

    const ballIcon = this.#shadow.querySelector(`[data-icon^="ball"]`)!;
    if (hunt.ball) {
      ballIcon.setAttribute('data-icon', `ball/${hunt.ball}`);
    } else {
      ballIcon.setAttribute('data-icon', 'ball');
    }

    const geneIcon = this.#shadow.querySelector('[data-icon^="gene"]')!;
    if (hunt.gene) {
      geneIcon.setAttribute('data-icon', `gene/${hunt.gene}`);
    } else {
      geneIcon.setAttribute('data-icon', 'gene');
    }

    const sprite = this.#shadow.querySelector('pokemon-sprite')!;
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
        const charmAvailable = jeu ? jeu.hasCharm : false;
        this.setAttribute('data-charm-available', String(charmAvailable));
        const virtualconsoleGen = jeu ? (jeu.gen === 1 || jeu.gen === 2) : false;
        this.setAttribute('data-gen-vc', String(virtualconsoleGen));
      } break;
    }
  }


  /** 
   * Génère la liste des formes à partir du Pokémon entré.
   * Ne doit PAS être async, pour préserver l'ordre d'exécution dans huntToForm.
   */
  genereFormes(dexid: number, formeToSelect?: string) {
    const select = this.getInput('forme');
    if (!select) throw new TypeError(`Expecting InputSelect`);

    select.querySelectorAll('option').forEach(option => option.remove());
    select.removeAttribute('default-label');

    const pkmn = new Pokemon(pokemonData[dexid]);
    const formes = pkmn.formes.slice()
                              .sort((a: Forme, b: Forme) => { if (a.name['fr'] == '') return -1; else return 0;})
                              .filter(f => f.catchable);

    // Initially auto select a valid form in any case
    if (formes.findIndex(f => f.dbid === formeToSelect ?? '') < 0) formeToSelect = '';
    if (formes.findIndex(f => f.dbid === '') < 0) formeToSelect = formes[0]?.dbid ?? '';
    select.setAttribute('value', formeToSelect ?? ''); // set initial value before regenerating the options

    let availableChoices = 0;
    for (const forme of formes) {
      if ('noShiny' in forme && forme.noShiny == true) continue;
      select.innerHTML += `<option value="${forme.dbid}" data-string="pokemon/${pkmn.dexid}/forme/${forme.dbid}">${pkmn.getFormeName(forme.dbid, false)}</option>`;
      availableChoices++;
    }
    if (availableChoices > 0) {
      select.setAttribute('default-label', getString('forme-select-label'));
    }
    if (availableChoices <= 1) {
      select.classList.add('single-choice');
    } else {
      select.classList.remove('single-choice');
    }
  }


  /**
   * Génère la liste des méthodes à partir du jeu entré.
   * Ne doit PAS être async, pour préserver l'ordre d'exécution dans huntToForm.
   */
  genereMethodes(game: string, methodToSelect?: string) {
    const select = this.getInput('method');
    if (!select) throw new TypeError(`Expecting InputSelect`);

    select.querySelectorAll('option').forEach(option => option.remove());
    select.removeAttribute('default-label');

    const gameid = Pokemon.jeux.find(jeu => jeu.uid === game)?.id;
    if (!gameid) return;
    
    select.setAttribute('value', methodToSelect ?? 'wild'); // set initial value before regenerating the options

    const lang = getCurrentLang();
    let availableChoices = 0;
    for (const methode of Shiny.allMethodes) {
      const gameIds = new Set(methode.jeux.map(jeu => jeu.id));
      if (!(gameIds.has(gameid))) continue;
      let nom = '';
      if (isSupportedLang(lang) && isSupportedMethodID(methode.id)) {
        nom = methodStrings[lang][methode.id];
      }
      select.innerHTML += `<option value="${methode.id}" data-string="method/${methode.id}">${nom}</option>`;
      availableChoices++;
    }
    if (availableChoices > 0) select.setAttribute('default-label', getString('method-select-label'));
  }


  /** Génère la liste des jeux. */
  genereJeux() {
    const select = this.getInput('game');
    if (!select) throw new TypeError(`Expecting InputSelect`);
    
    const lang = getCurrentLang();
    for (const jeu of [...Pokemon.jeux].reverse()) {
      let nom = '';
      if (isSupportedLang(lang) && isSupportedGameID(jeu.uid)) {
        nom = gameStrings[lang][jeu.uid];
      }
      select.innerHTML += `<option value="${jeu.uid}" data-string="game/${jeu.uid}">${nom}</option>`;
    }

    select.setAttribute('default-label', getString('game-select-label'));
  }


  connectedCallback() {
    translationObserver.serve(this, { method: 'attribute' });

    // 🔽 Active les boutons du formulaire
    this.handle(this.getButton('count-add'), 'click', this.#counterAddHandler);
    this.handle(this.getButton('count-sub'), 'click', this.#counterSubHandler);
    this.handle(this.getButton('cancel-edit'), 'click', this.#cancelHandler);
    this.handle(this.getButton('delete-hunt'), 'click', this.#deleteHandler);
    this.handle(this.getButton('delete-shiny'), 'click', this.#deleteShinyHandler);

    // 🔽 Détecte les changements dans le formulaire :
    this.handle(this.getInput('dexid'), 'input', this.#speciesInputHandler);
    this.handle(this.getInput('caught'), 'change', this.#catchHandler);
    this.handle(this.form, 'change', this.#formChangeHandler);
    this.handle(this.form, 'submit', this.#submitHandler);

    // Peuple le contenu de la carte
    if (this.needsRefresh && this.#huntid) {
      this.dataToContent();
      this.needsRefresh = false;
    }
  }
  

  disconnectedCallback() {
    translationObserver.unserve(this);

    for (const { element, type, callback } of this.#handlers) {
      element.removeEventListener(type, callback);
    }
  }


  static get observedAttributes() {
    return ['huntid', 'lang'];
  }


  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'huntid': {
        this.#huntid = newValue;
        this.dataToContent();
        this.needsRefresh = false;
      } break;

      case 'lang': {
        {
          const input = this.getInput('game');
          if (input && input.querySelectorAll('option').length > 0) input.setAttribute('default-label', getString('game-select-label'));
        } {
          const input = this.getInput('method');
          if (input && input.querySelectorAll('option').length > 0) input.setAttribute('default-label', getString('method-select-label'));
        } {
          const input = this.getInput('forme');
          if (input && input.querySelectorAll('option').length > 0) input.setAttribute('default-label', getString('forme-select-label'));
        }
        translationObserver.translate(this, newValue ?? '');
      } break;
    }
  }
}

if (!customElements.get('hunt-card')) customElements.define('hunt-card', huntCard);