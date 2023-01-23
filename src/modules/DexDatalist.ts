import { Pokemon } from './Pokemon.js';



let previousLength = 0;

export class DexDatalist {
  correspondances: string[] = [];
  datalist: string = '';

  static async build(string: string, container: HTMLElement) {
    const dexDataList = new DexDatalist();

    const allNames = Pokemon.names();

    if (string.length == 2 && previousLength == 3) return; // si on revient aux mêmes 2 caractères qu'au départ, on garde la même liste
    //if (string.length > 2 && string.length > previousLength) return; // si le string grandit, la liste d'avant reste bonne
    previousLength = string.length;
    if (string.length < 2) return dexDataList.tohtml(container); // si on repasse à 1 ou 0 caractères, on efface la liste
    // Donc au final, on construit une nouvelle liste quand on passe de 1 à 2 caractères

    const pkmnNumber = allNames.length;

    for (let p = 1; p < pkmnNumber; p++) {
      const name = allNames[p];
      if (name.startsWith(string.toLowerCase())) dexDataList.correspondances.push(name);
    }

    if (dexDataList.correspondances.length === 1 && dexDataList.correspondances[0] === string.toLowerCase()) {
      dexDataList.correspondances = []; // si on a entré un nom exact, cacher la suggestion puisqu'elle est identique
    }

    for (const corr of dexDataList.correspondances) {
      dexDataList.datalist += `<option value="${corr}">`;
    }

    dexDataList.tohtml(container);
  }

  tohtml(container: HTMLElement) {
    container.innerHTML = this.datalist;
  }
}