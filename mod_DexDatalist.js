import { Pokemon } from './mod_Pokemon.js';

let previousLength = 0;

export class DexDatalist {
  constructor(string) {
    this.correspondances = [];
    this.datalist = '';

    if (string.length == 2 && previousLength == 3) return; // si on revient aux mêmes 2 caractères qu'au départ, on garde la même liste
    previousLength = string.length;
    if (string.length < 2) return this.build(); // si on repasse à 1 ou 0 caractères, on efface la liste
    if (string.length > 2) return; // si le string grandit, la liste d'avant reste bonne
    // Donc au final, on construit une nouvelle liste quand on passe de 1 à 2 caractères

    const pokemons = Pokemon.pokemonData;
    pokemons.forEach(pkmn => {
      if (pkmn.namefr.startsWith(string.toLowerCase())) this.correspondances.push(pkmn.namefr);
    });

    this.correspondances.forEach(corr => {
      this.datalist += `<option value="${corr}">`;
    });

    this.build();
  }

  build() {
    const conteneur = document.getElementById('datalist-pokedex');
    conteneur.innerHTML = this.datalist;
  }
}