import { Pokemon } from './Pokemon.js';



let previousLength = 0;
let allNames = [];

export class DexDatalist {
  correspondances: string[] = [];
  datalist: string = '';

  static async build(string: string) {
    const dexDataList = new DexDatalist();

    await getNames();

    if (string.length == 2 && previousLength == 3) return; // si on revient aux mêmes 2 caractères qu'au départ, on garde la même liste
    previousLength = string.length;
    if (string.length < 2) return dexDataList.tohtml(); // si on repasse à 1 ou 0 caractères, on efface la liste
    if (string.length > 2) return; // si le string grandit, la liste d'avant reste bonne
    // Donc au final, on construit une nouvelle liste quand on passe de 1 à 2 caractères

    const pkmnNumber = allNames.length;

    for (let p = 1; p < pkmnNumber; p++) {
      const name = allNames[p];
      if (name.startsWith(string.toLowerCase())) dexDataList.correspondances.push(name);
    }

    for (const corr of dexDataList.correspondances) {
      dexDataList.datalist += `<option value="${corr}">`;
    }

    dexDataList.tohtml();
  }

  tohtml() {
    const conteneur = document.getElementById('datalist-pokedex');
    conteneur.innerHTML = this.datalist;
  }
}

export async function getNames() {
  if (allNames.length == 0) allNames = await Pokemon.namesfr();
  return;
}