import { callBackend } from './callBackend.js';
import { RadioGroup } from './components/radioGroup.js';
import { dataStorage } from './localForage.js';
import { Notif } from './notification.js';
import { computePaletteCss, gradientString, setTheme, updateMetaThemeColorTag } from './theme.js';
// @ts-expect-error
import { queueable } from '../../../_common/js/per-function-async-queue.js';
import { SupportedLang, isSupportedLang } from './jsonData.js';
import { getCurrentLang, getString, translationObserver } from './translation.js';
import { InputSelect } from './components/inputSelect.js';



type Theme = 'system' | 'light' | 'dark';
const supportedThemes: Theme[] = ['system', 'light', 'dark'];
function isSupportedTheme(string: string): string is Theme {
  return supportedThemes.includes(string as Theme);
}



let appliedSettings: Settings;
let langChangeNotif: Notif;



export class Settings {
  'lang': SupportedLang = getCurrentLang();
  'theme': Theme = 'system';
  'theme-hue': number = 255;
  'cache-all-sprites': boolean = false;

  constructor(data?: FormData | object) {
    if (!data) return;

    if (data instanceof FormData) {
      const storedLang = String(data.get('lang'));
      if (isSupportedLang(storedLang)) this['lang'] = storedLang;

      const storedTheme = String(data.get('theme'));
      if (isSupportedTheme(storedTheme)) this['theme'] = storedTheme;

      this['theme-hue'] = Number(data.get('theme-hue')) || this['theme-hue'];

      this['cache-all-sprites'] = data.get('cache-all-sprites') === 'true';
    } else {
      if ('lang' in data && typeof data['lang'] === 'string' && isSupportedLang(data['lang'])) {
        this['lang'] = data['lang'];
      }

      if ('theme' in data && typeof data['theme'] === 'string' && isSupportedTheme(data['theme'])) {
        this['theme'] = data['theme'];
      }

      if ('theme-hue' in data && typeof data['theme-hue'] === 'number' && !isNaN(data['theme-hue'])) {
        this['theme-hue'] = data['theme-hue'];
      }

      if ('cache-all-sprites' in data) {
        this['cache-all-sprites'] = Boolean(data['cache-all-sprites']);
      }
    }
  }


  toForm() {
    const settingsForm = document.querySelector('form[name="app-settings"]');
    if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

    {
      // Lang
      const input = settingsForm.querySelector(`[name="lang"]`);
      if (!(input instanceof InputSelect)) throw new TypeError(`Expecting InputSelect`);
      input.value = this.lang;
    }

    {
      // Theme
      const input = settingsForm.querySelector(`[name="theme"]`);
      if (!(input instanceof RadioGroup)) throw new TypeError(`Expecting RadioGroup`);
      input.value = this.theme;
    }

    {
      // Theme hue
      const input = settingsForm.querySelector('[name="theme-hue"]');
      if (!input || !('value' in input) || !('style' in input)) throw new TypeError('Expecting InputSlider');
      input.value = this['theme-hue'];
      input.setAttribute('style', `--gradient:${gradientString};`);
    }

    {
      // Cache all sprites
      const input = settingsForm.querySelector('[name="cache-all-sprites"]');
      if (!input || !('checked' in input)) throw new TypeError(`Expecting InputSwitch`);
      input.checked = this['cache-all-sprites'];
    }
  }


  apply() {
    const settingsForm = document.querySelector('form[name="app-settings"]')
    if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

    {
      // Lang
      const html = document.documentElement;
      if (this.changedBy('lang', ['initial', 'manual'])) {
        html.lang = this['lang'];
      }
      if (this.changedBy('lang', ['initial'])) {
        html.addEventListener('translate', event => {
          translationObserver.translate(html, (event as CustomEvent).detail.lang);
        });
        translationObserver.serve(html);
      }
    }

    {
      // Theme
      if (this.changedBy('theme', ['initial', 'manual']))
        setTheme(this['theme']);
    }

    {
      // Theme hue
      if (this.changedBy('theme-hue', ['initial', 'manual'])) {
        const css = computePaletteCss(this['theme-hue']);
        const container = document.querySelector('style#palette');
        if (!(container instanceof HTMLStyleElement)) throw new TypeError(`Expecting HTMLStyleElement`);
        container.innerHTML = `:root { ${css} }`;
        updateMetaThemeColorTag();
      }
    }

    {
      // Cache all sprites
      if (this.changedBy('cache-all-sprites', ['initial'])) { // On app launch only
        if (this['cache-all-sprites']) {
          const progressContainer = document.querySelector('[data-sprites-progress]');
          dataStorage.getItem('sprites-cache-progress')
          .then(val => {
            if (progressContainer && val) progressContainer.innerHTML = val;
          });
          // cacheAllSprites(true); // Cache all new sprites
        }
      } else if (this.changedBy('cache-all-sprites', ['manual'])) { // On manual settings change,
        cacheAllSprites(this['cache-all-sprites']);                                                       // cache or delete all sprites.
      }
    }

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


  static set(id: string, value: any, { apply = true, toForm = true }: { apply?: boolean, toForm?: boolean } = {}) {
    const settingsForm = document.querySelector('form[name="app-settings"]')
    if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
    const formData = new FormData(settingsForm);
    formData.set(id, String(value));
    const settings = new Settings(formData);
    if (toForm) settings.toForm();
    if (apply)  settings.apply();
    settings.save();
  }


  /** Returns true if setting `id` was changed by one of `causes`. */
  changedBy(id: keyof Settings, causes: Array<'initial'|'manual'|'unchanged'>): boolean {
    let result = 0;
    for (const cause of causes) {
      let subResult = 0;
      switch (cause) {
        case 'initial':   if (!appliedSettings) subResult++; break;
        case 'manual':    if (appliedSettings && this[id] !== appliedSettings[id]) subResult++; break;
        case 'unchanged': if (appliedSettings && this[id] === appliedSettings[id]) subResult++; break;
      }
      result += subResult;
    }
    return result > 0;
  }
}



/**
 * Fills or empties the the sprites cache.
 * @param bool - true to fill the cache, false to empty it.
 * @returns true if there was no error, false if there was one.
 */
export async function cacheAllSprites(bool: boolean): Promise<boolean> {
  const worker = (await navigator.serviceWorker.ready).active;
  if (!worker) throw new Error('No service worker available to cache all sprites');

  const input = document.querySelector('[name="cache-all-sprites"]');

  try {
    if (input && 'disabled' in input) input.disabled = true;

    const progressContainer = document.querySelector('[data-sprites-progress]');
    if (!bool) {
      if (progressContainer) progressContainer.innerHTML = '';
      worker.postMessage({ 'action': 'delete-all-sprites' });
      return true;
    }

    if (progressContainer) progressContainer.innerHTML = 'Préparation...';

    let progress = 0, totalSize = 0, size = 0, unit = 'octets', unitPower = 0;
    await new Promise((resolve, reject) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = event => {
        if (progressContainer && event.data?.action === 'cache-all-sprites' && 'progress' in event.data) {
          progress = Math.floor(100 * (Number(event.data.progress) || 0));
          const progressWithErrors = Math.floor(100 * ((Number(event.data.progressWithErrors) || 0)));
          if (!totalSize) totalSize = event.data.totalSize;
          size = Math.round(event.data.totalSize * event.data.progress);
          unitPower = size > 10**6 ? 6 : size > 10**3 ? 3 : 0;
          unit = unitPower === 6 ? 'Mo' : unitPower === 3 ? 'ko' : 'octets';
          const displayedSize = (size / (10 ** unitPower)).toFixed(2);

          progressContainer.innerHTML = `${progress}% : ${displayedSize} ${unit}`;

          if (progress === 100) resolve(true);
          else if (progressWithErrors === 100) resolve(false);
        }
      };
    
      channel.port1.onmessageerror = event => {
        reject(event);
      };
      
      worker.postMessage({ 'action': `cache-all-sprites` }, [channel.port2]);
    });

    await dataStorage.setItem('sprites-cache-progress', `${progress}% : ${(size / (10 ** unitPower)).toFixed(2)} ${unit}`);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    if (input && 'disabled' in input) input.disabled = false;
  }
}



/* User profile management */



type UserProfileData = {
  username?: string|null;
  public?: boolean;
  lastUpdate?: number;
}

/** Updates the stored user profile data. */
let updateUserProfile = async (data: UserProfileData = {}) => {
  const userProfile = (await dataStorage.getItem('user-profile')) ?? {};
  if (data.username) userProfile.username = data.username;
  if (data.public) userProfile.public = data.public;
  if (data.lastUpdate) userProfile.lastUpdate = data.lastUpdate;
  await dataStorage.setItem('user-profile', userProfile);
};
updateUserProfile = queueable(updateUserProfile);
export { updateUserProfile };


/** Asks the backend to update the user's profile public visibility. */
export async function updateUserVisibility(visibility: boolean) {
  const settingsForm = document.querySelector('form[name="app-settings"]');
  if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
  
  try {
    await callBackend('update-user-profile', { public: String(visibility) }, true);
    settingsForm.setAttribute('data-public-profile', String(visibility));
    await updateUserProfile({ public: visibility });
    document.body.setAttribute('data-public-profile', String(visibility));
  } catch (error) {
    throw new Error(getString('error-changing-profile-visibility'), { cause: error ?? undefined })
  }
}


/** Handles changes to the profile visibility input. */
export function initVisibilityChangeHandler() {
  const settingsForm = document.querySelector('form[name="app-settings"]');
  if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

  const input = settingsForm.querySelector('[name="public"]');
  if (!input || !('disabled' in input) || !('checked' in input)) throw new TypeError(`Expecting InputSwitch`);

  input.addEventListener('change', event => {
    updateUserVisibility(Boolean(input.checked))
    .catch(error => {
      input.disabled = true;
      console.error(error);
    });
  });
}


/** Asks the backend to update the user's username. */
export async function updateUsername(username: string) {
  try {
    await callBackend('update-user-profile', { username }, true);
    await updateUserProfile({ username });
    document.body.setAttribute('data-has-username', 'true');
  } catch (error) {
    throw new Error(getString('error-changing-username'), { cause: error ?? undefined});
  }
}


/** Checks if the requested username is available. */
let usernamePrompt: Notif;
export async function checkUsernameavailability(username: string) {
  if (username.length === 0) return;
  const currentUsername = (await dataStorage.getItem('user-profile') ?? {})?.username ?? null;
  if (username === currentUsername) return;
  
  const response = await callBackend('check-username-available', { username }, true);
  if ('available' in response) {
    if (usernamePrompt instanceof Notif) {
      usernamePrompt.dismissable = true;
      usernamePrompt.remove();
    }

    if (response['available'] === true) {
      usernamePrompt = new Notif(getString('notif-username-available').replace('{username}', username), Notif.maxDelay, getString('notif-username-available-label'), () => {}, true);
      const userChoice = await usernamePrompt.prompt();
      if (userChoice) {
        await updateUsername(username);
        usernamePrompt.remove();
      }
    } else {
      usernamePrompt = new Notif(getString('notif-username-unavailable').replace('{username}', username));
    }
  } else {
    const message = getString('error-checking-username');
    new Notif(message).prompt();
    throw new Error(message, { cause: response.error ?? undefined });
  }
}


/** Handles changes to the username field. */
export function initUsernameChangeHandler() {
  const settingsForm = document.querySelector('form[name="app-settings"]');
  if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

  const input = settingsForm.querySelector('[name="username"]');
  if (!input || !('value' in input)) throw new TypeError(`Expecting TextField`);

  let timeout: number;
  input.addEventListener('input', event => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      checkUsernameavailability(String(input.value))
      .catch(error => {
        console.error(error);
      });
    }, 1000);
  });
}