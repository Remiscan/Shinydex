// @ts-expect-error
import { TranslationObserver as TODef } from 'translation-observer';
import { appStrings, methodStrings, gameStrings, SupportedLang, isSupportedLang } from './jsonData.js';



class TranslationObserver extends TODef {
  serve(element: Element, { init = true, method = 'attribute' } = {}) {
    super.serve(element, { init, method });
  }

  unserve(element: Element) {
    super.unserve(element);
  }

  getSourceOf(element: Element): Element | null {
    return super.getSourceOf(element);
  }

  translate(container: Element, lang?: string, defaultLang: SupportedLang = 'en') {
    let currentLang: SupportedLang;
    if (lang) {
      currentLang = isSupportedLang(lang) ? lang : defaultLang;
    } else {
      const source = this.getSourceOf(container) ?? document.documentElement;
      const sourceLang = source.getAttribute('lang') ?? '';
      currentLang = isSupportedLang(sourceLang) ? sourceLang : defaultLang;
    }
    
    const getString = (id: string) => {
      const parts = id.split('/');
      let strings: { [key: string]: { [key: string]: string} };
      switch (parts[0]) {
        case 'method': strings = methodStrings; id = parts[1]; break;
        case 'game': strings = gameStrings; id = parts[1]; break;
        default: strings = appStrings;
      }
      return strings[currentLang]?.[id] ?? strings[defaultLang]?.[id] ?? 'undefined string';
    }

    // Translate all texts in the container
    let _container = container.shadowRoot ?? container;
    for (const e of [..._container.querySelectorAll('[data-string]')]) {
      const stringKey = e.getAttribute('data-string') ?? '';
      if (e.tagName == 'IMG') e.setAttribute('alt', getString(stringKey));
      else                    e.innerHTML = getString(stringKey);
    }
    for (const e of [..._container.querySelectorAll('[data-label]')]) {
      const stringKey = e.getAttribute('data-label') ?? '';
      e.setAttribute('aria-label', getString(stringKey));
    }
    for (const e of [..._container.querySelectorAll('[data-placeholder]')]) {
      const stringKey = e.getAttribute('data-placeholder') ?? '';
      e.setAttribute('placeholder', getString(stringKey));
    }
  }
}

export const translationObserver = new TranslationObserver();