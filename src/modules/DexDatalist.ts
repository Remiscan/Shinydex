import { capitalizeFirstLetter } from './Params.js';
import { Pokemon } from './Pokemon.js';



export class DexDatalist {
  correspondances: string[] = [];
  datalist: string = '';

  constructor(string: string) {
    if (string.length < 2) return;

    const allNames = Pokemon.names();
    const pkmnNumber = allNames.length;

    for (let p = 1; p < pkmnNumber; p++) {
      const name = allNames[p];
      if (name.startsWith(string.toLowerCase())) {
        this.correspondances.push(capitalizeFirstLetter(name));
      }
    }

    if (this.correspondances.length === 1 && this.correspondances[0] === string.toLowerCase()) {
      this.correspondances = []; // si on a entré un nom exact, cacher la suggestion puisqu'elle est identique
    }
  }

  toElement() {
    const element = document.createElement('datalist');
    for (const corr of this.correspondances) {
      const option = document.createElement('option');
      option.setAttribute('value', corr);
      element.appendChild(option);
    }
    return element;
  }
}