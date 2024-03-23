import { noAccent } from "../Params.js";
import { Pokemon } from "../Pokemon.js";



function normalizeString(str: string): string {
  return noAccent(str.toLowerCase());
}

type DatalistOption = {
  value: string,
  label: string,
}



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <datalist></datalist>
`;



export class DexDatalist extends HTMLDataListElement {
  suggestions: DatalistOption[] = [];

  constructor() {
	  super();
  }


  suggestionsFromInput(input: string | null): DatalistOption[] {
    if (!input) return [];
    if (input.length < 2) return [];

    const allNames = Pokemon.names();

    const correspondances: DatalistOption[] = [];
    const simplifiedInput = normalizeString(input);

    for (let p = 1; p < allNames.length; p++) {
      const name = allNames[p];
      const simplifiedName = normalizeString(name);
      if (simplifiedName.startsWith(simplifiedInput)) {
        correspondances.push({
          value: simplifiedName.replace(simplifiedInput, input),
          label: name,
        });
      }
    }

    /*if (correspondances.length === 1 && normalizeString(correspondances[0].value) === simplifiedInput) {
      return []; // si on a entré un nom exact, cacher la suggestion puisqu'elle est identique
    }*/

    return correspondances;
  }


  static get observedAttributes() { return ['input', 'slot-into']; }

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    switch (attr) {
      case 'input': {
        this.suggestions = this.suggestionsFromInput(newValue);
        let html = '';
        for (const suggestion of this.suggestions) {
          html += `<option value="${suggestion}"></option>`;
        }
        this.innerHTML = html;
      } break;
    }
  }
}

if (!customElements.get('dex-datalist')) customElements.define('dex-datalist', DexDatalist, { extends: 'datalist' });