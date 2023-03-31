import pokemonData from '../data/pokemon.json' assert { type: 'json' };
import gameStrings from '../strings/games.json' assert { type: 'json' };
import methodStrings from '../strings/methods.json' assert { type: 'json' };
import appStrings from '../strings/app.json' assert { type: 'json' };



export { gameStrings, methodStrings, pokemonData, appStrings };



// Strings languages
export type SupportedLang = keyof typeof gameStrings | keyof typeof methodStrings | keyof typeof appStrings;
export function isSupportedLang(string: string): string is SupportedLang {
  return Object.keys(gameStrings).includes(string as SupportedLang) || Object.keys(methodStrings).includes(string as SupportedLang);
}

// Game strings
export type SupportedGameID = keyof typeof gameStrings['fr'];
export function isSupportedGameID(string: string): string is SupportedGameID {
  return Object.keys(gameStrings['fr']).includes(string as SupportedGameID);
}

// Method strings
export type SupportedMethodID = keyof typeof methodStrings['fr'];
export function isSupportedMethodID(string: string): string is SupportedMethodID {
  return Object.keys(methodStrings['fr']).includes(string as SupportedMethodID);
}



// Pokémon names
export type SupportedPokemonLang = keyof typeof pokemonData[0]['name'];
export function isSupportedPokemonLang(string: string): string is SupportedPokemonLang {
  return Object.keys(pokemonData[0]['name']).includes(string as SupportedPokemonLang);
}