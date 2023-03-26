import { updateUserProfile } from './Settings.js';
import { dataStorage, friendStorage } from './localForage.js';



interface BackendPartialShiny {
  dexid: number,
  forme: string,
};



export class Friend {
  username: string;
  pokemonList: BackendPartialShiny[] = [];

  constructor(username: string, pokemonList: Array<object> = []) {
    if (typeof username !== 'string') throw new Error('Invalid argument');
    if (!Array.isArray(pokemonList)) throw new Error('Invalid argument');
    if (!pokemonList.every(pkmn => typeof pkmn === 'object')) throw new Error('Invalid argument');

    this.username = username;
    this.pokemonList = [];
    for (const pkmn of pokemonList) {
      this.pokemonList.push({
        dexid: 'dexid' in pkmn ? Number(pkmn.dexid) || 0 : 0,
        forme: 'forme' in pkmn ? String(pkmn.forme) : ''
      });
    }
  }


  async save() {
    await friendStorage.setItem(this.username, this.pokemonList);
    const userProfile = (await dataStorage.getItem('user-profile')) ?? {};
    userProfile.lastUpdate = Date.now();
    await updateUserProfile(userProfile);
  }
}