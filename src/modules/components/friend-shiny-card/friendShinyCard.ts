import { autoDetectLanguageAndTranslate } from '../../autoTranslation.js';
import { sectionsOrderMaps, type OrderMap } from '../../filtres.js';
import { friendShinyStorage, type LocalForage } from '../../localForage.js';
import { getCurrentLang, getString } from '../../translation.js';
import { shinyCard } from '../shiny-card/shinyCard.js';



const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  [data-action="edit"] {
    display: none;
  }

  @container style(--supports-auto-translation: true) {
    .container:has([data-type="notes"].auto-translated):not(:has([data-type="notes"] > .empty)) [data-action="undo-auto-translate"],
    .container:has([data-type="notes"]:not(.auto-translated)):not(:has([data-type="notes"] > .empty)) [data-action="auto-translate"] {
      display: flex;
    }
  }

  @container not style(--supports-auto-translation: true) {
    .menu {
      display: none;
    }
  }

  @container section-contenu (min-width: 650px) {
    .container {
      --state-opacity: 0 !important;
    }

    .menu-hint {
      display: none;
    }
  }

  pokemon-sprite:not([data-caught="true"])[dexid]:not([dexid="0"])::part(image) {
    filter: var(--anti-spoilers-filter);
  }
`);



export class friendShinyCard extends shinyCard {
  dataStore: LocalForage = friendShinyStorage;

  get orderMap(): OrderMap {
    return sectionsOrderMaps.get('chromatiques-ami') || new Map();
  }
  
  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [...this.shadow.adoptedStyleSheets, sheet];
    this.editHandler = (e: Event) => {};
  }


  async makeEdit() {}


  async autoTranslateNotes() {
    if (!this.shiny) return;
    const notesElement = this.shadow.querySelector<HTMLElement>('[data-type="notes"]');
    if (!notesElement) return;
    const originalNotes = this.shiny.notes || '';
    const targetLang = getCurrentLang();
    const translatedNotes = await autoDetectLanguageAndTranslate(originalNotes, targetLang);
    if (translatedNotes) {
      notesElement.innerText = translatedNotes;
      notesElement.classList.add('auto-translated');
    }
  }


  restoreOriginalNotes() {
    if (!this.shiny) return;
    const notesElement = this.shadow.querySelector<HTMLElement>('[data-type="notes"]');
    if (!notesElement) return;
    const originalNotes = this.shiny.notes || '';
    if (originalNotes) notesElement.innerText = originalNotes;
    else {
      const lang = getCurrentLang();
      notesElement.innerHTML = `<span class="empty" data-string="shiny-card-notes-empty">${getString('shiny-card-notes-empty', lang)}</span>`;
    }
    notesElement.classList.remove('auto-translated');
  }


  eventListenersAbortController = new AbortController();


  connectedCallback(): void {
    super.connectedCallback();
    this.eventListenersAbortController = new AbortController();

    const autoTranslateButton = this.shadow.querySelector('[data-action="auto-translate"]');
    if (autoTranslateButton instanceof HTMLButtonElement) {
      autoTranslateButton.addEventListener('click', async (event: Event) => {
        event.stopPropagation();
        event.preventDefault();
        this.autoTranslateNotes();
      }, { signal: this.eventListenersAbortController.signal });
    }

    const undoAutoTranslateButton = this.shadow.querySelector('[data-action="undo-auto-translate"]');
    if (undoAutoTranslateButton instanceof HTMLButtonElement) {
      undoAutoTranslateButton.addEventListener('click', async (event: Event) => {
        event.stopPropagation();
        event.preventDefault();
        this.restoreOriginalNotes();
      }, { signal: this.eventListenersAbortController.signal });
    }
  }


  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.eventListenersAbortController.abort();
  }
}

if (!customElements.get('friend-shiny-card')) customElements.define('friend-shiny-card', friendShinyCard);