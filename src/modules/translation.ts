// @ts-expect-error
import { TranslationObserver as TODef } from 'translation-observer';
import { SupportedLang, appStrings, gameStrings, isSupportedLang, methodStrings, pokemonData } from './jsonData.js';
import { Pokemon } from './Pokemon.js';
import { Params } from './Params.js';



const defaultLang = Params.defaultLang as SupportedLang;
export function getCurrentLang() {
  const langAttr = document.documentElement.lang;
  return isSupportedLang(langAttr) ? langAttr : defaultLang;
}



export type TranslatedString =
  keyof typeof appStrings['fr'] |
  `game/${keyof typeof gameStrings['fr']}` |
  `method/${keyof typeof methodStrings['fr']}` |
  `pokemon/${number}` |
  `pokemon/${number}/forme/${string}`;

export function getString(id: TranslatedString, lang: SupportedLang = getCurrentLang()): string {
  const parts = id.split('/');
  let strings: { [key: string]: { [key: string]: string} };
  switch (parts[0]) {
    case 'method': strings = methodStrings; id = (parts[1] as TranslatedString); break;
    case 'game': strings = gameStrings; id = (parts[1] as TranslatedString); break;
    case 'pokemon': {
      if (!isNaN(parseInt(parts[1]))) {
        const dexid = parseInt(parts[1]);
        if (parts[2] === 'forme') {
          const form = parts[3];
          const pkmn = new Pokemon(pokemonData[dexid]);
          return pkmn.getFormeName(form, false, lang);
        } else if (parts.length === 2) {
          return pokemonData[dexid].name[lang] ?? 'undefined Pokémon name';
        }
      }
    }
    default: strings = appStrings;
  }
  return strings[lang]?.[id] ?? strings[defaultLang]?.[id] ?? 'undefined string';
}




class TranslationObserver extends TODef {
  serve(element: Element, { init = true, method = 'attribute' } = {}) {
    super.serve(element, { init, method });
  }

  unserve(element: Element) {
    super.unserve(element);
  }

  getSourceOf(element: HTMLElement): HTMLElement | null {
    return super.getSourceOf(element);
  }

  translate(container: HTMLElement, lang?: string, defaultLang: SupportedLang = 'en') {
    let currentLang: SupportedLang;
    if (lang) {
      currentLang = isSupportedLang(lang) ? lang : defaultLang;
    } else {
      const source = this.getSourceOf(container) ?? document.documentElement;
      const sourceLang = source.lang ?? '';
      currentLang = isSupportedLang(sourceLang) ? sourceLang : defaultLang;
    }

    // Translate all texts in the container
    let _container = container.shadowRoot ?? container;
    for (const e of [..._container.querySelectorAll('[data-string]')]) {
      const stringKey = (e.getAttribute('data-string') ?? '') as TranslatedString;
      if (stringKey.length === 0) continue;
      if (e.tagName == 'IMG') e.setAttribute('alt', getString(stringKey));
      else                    e.innerHTML = getString(stringKey);
    }
    for (const e of [..._container.querySelectorAll('[data-label]')]) {
      const stringKey = (e.getAttribute('data-label') ?? '') as TranslatedString;
      if (stringKey.length === 0) continue;
      e.setAttribute('aria-label', getString(stringKey));
    }
    for (const e of [..._container.querySelectorAll('[data-placeholder]')]) {
      const stringKey = (e.getAttribute('data-placeholder') ?? '') as TranslatedString;
      if (stringKey.length === 0) continue;
      e.setAttribute('placeholder', getString(stringKey));
    }
  }
}

export const translationObserver = new TranslationObserver();