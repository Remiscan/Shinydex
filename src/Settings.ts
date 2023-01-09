import { dataStorage } from './localForage.js';



type Theme = 'system' | 'light' | 'dark';
const supportedThemes: Theme[] = ['system', 'light', 'dark'];
function isSupportedTheme(string: string): string is Theme {
  return supportedThemes.includes(string as Theme);
}



let appliedSettings: Settings;



export class Settings {
  'theme': Theme = 'system';
  'cache-all-sprites': boolean = false;

  constructor(data?: FormData | object) {
    if (!data) return;

    if (data instanceof FormData) {
      const storedTheme = String(data.get('theme'));
      if (isSupportedTheme(storedTheme)) this['theme'] = storedTheme;

      this['cache-all-sprites'] = data.get('cache-all-sprites') === 'true';
    } else {
      if ('theme' in data && typeof data['theme'] === 'string' && isSupportedTheme(data['theme'])) {
        this['theme'] = data['theme'];
      }

      if ('cache-all-sprites' in data) {
        this['cache-all-sprites'] = Boolean(data['cache-all-sprites']);
      }
    }
  }


  toForm() {
    const form = document.querySelector('form[name="app-settings"]');
    if (!(form instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

    {
      // Theme
      const input = form.querySelector(`[name="theme"][value="${this.theme}"]`);
      if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expecting HTMLInputElement`);
      input.checked = true;
    }

    {
      // Cache all sprites
      const input = form.querySelector('[name="cache-all-sprites"]');
      if (!input || !('checked' in input)) throw new TypeError(`Expecting InputSwitch`);
      input.checked = this['cache-all-sprites'];
    }
  }


  apply() {
    // Theme
    if (!appliedSettings || this['theme'] !== appliedSettings['theme'])
      setTheme(this['theme']);

    // Cache all sprites
    if (!appliedSettings || this['cache-all-sprites'] !== appliedSettings['cache-all-sprites'])
      if (this['cache-all-sprites']) cacheAllSprites(true);

    appliedSettings = this;
  }


  async save() {
    await dataStorage.ready();
    dataStorage.setItem('app-settings', this);
  }


  static async restore() {
    await dataStorage.ready();
    const savedSettings = new Settings(await dataStorage.getItem('app-settings'));
    savedSettings.toForm();
    savedSettings.apply();
    return;
  }


  static get(id: string): any {
    if (id in appliedSettings) return appliedSettings[id as keyof Settings];
    else throw new Error(`${id} is not a valid setting`);
  }
}



//////////////////////
// Définition du thème
export async function setTheme(askedTheme?: string) {
  let html = document.documentElement;
  html.dataset.theme = askedTheme || '';

  // Thème par défaut
  const defaultTheme = 'dark';

  // Thème préféré selon l'OS
  let osTheme;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) osTheme = 'dark';
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) osTheme = 'light';

  // Thème appliqué (askedTheme > osTheme > defaultTheme)
  const theme = ['light', 'dark'].includes(askedTheme || '') ? askedTheme : (osTheme || defaultTheme);
  
  let themeColor = (theme == 'dark') ? 'rgb(34, 34, 34)' : 'rgb(224, 224, 224)';
  document.querySelector("meta[name=theme-color]")!.setAttribute('content', themeColor);

  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}



export async function cacheAllSprites(bool: boolean) {
  const worker = (await navigator.serviceWorker.ready).active;
  worker?.postMessage({ 'action': `${bool ? 'cache' : 'delete'}-all-sprites` });
}