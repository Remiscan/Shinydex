import { callBackend } from './callBackend.js';
import { RadioGroup } from './components/radioGroup.js';
import { dataStorage } from './localForage.js';
import { Notif } from './notification.js';
import { setTheme, updateMetaThemeColorTag, updateThemeHue } from './theme.js';
// @ts-ignore
import { queueable } from '../../../_common/js/per-function-async-queue/mod.js';
import * as Auth from './auth.js';
import { InputSelect } from './components/inputSelect.js';
import { SupportedLang, isSupportedLang } from './jsonData.js';
import { getCurrentPushSubscription, subscribeToPush, unsubscribeFromPush } from './pushSubscription.js';
import { getCurrentLang, getString, translationObserver } from './translation.js';



type Theme = 'system' | 'light' | 'dark';
const supportedThemes: Theme[] = ['system', 'light', 'dark'];
function isSupportedTheme(string: string): string is Theme {
  return supportedThemes.includes(string as Theme);
}



export class Settings {
  'lang': SupportedLang = getCurrentLang();
  'theme': Theme = 'system';
  'theme-hue': number = 255;
  'cache-all-sprites': boolean = false;
  'anti-spoilers-pokedex': boolean = false;
  'anti-spoilers-friends': boolean = false;
  'anti-spoilers-public': boolean = false;
  'enable-notifications': boolean = false;

  constructor(data?: FormData | object) {
    if (!data) return;

    if (data instanceof FormData) {
      const formLang = String(data.get('lang'));
      if (isSupportedLang(formLang)) this['lang'] = formLang;

      const formTheme = String(data.get('theme'));
      if (isSupportedTheme(formTheme)) this['theme'] = formTheme;

      const formThemeHue = Number(data.get('theme-hue'));
      this['theme-hue'] = formThemeHue || this['theme-hue'];

      const formCacheAllSprites = String(data.get('cache-all-sprites'));
      this['cache-all-sprites'] = formCacheAllSprites === 'true';

      const antiSpoilersPokedex = String(data.get('anti-spoilers-pokedex'));
      this['anti-spoilers-pokedex'] = antiSpoilersPokedex === 'true';

      const antiSpoilersFriends = String(data.get('anti-spoilers-friends'));
      this['anti-spoilers-friends'] = antiSpoilersFriends === 'true';

      const antiSpoilersPublic = String(data.get('anti-spoilers-public'));
      this['anti-spoilers-public'] = antiSpoilersPublic === 'true';

      const notifications = String(data.get('enable-notifications'));
      this['enable-notifications'] = notifications === 'true';
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

      if ('anti-spoilers-pokedex' in data) {
        this['anti-spoilers-pokedex'] = Boolean(data['anti-spoilers-pokedex']);
      }

      if ('anti-spoilers-friends' in data) {
        this['anti-spoilers-friends'] = Boolean(data['anti-spoilers-friends']);
      }

      if ('anti-spoilers-public' in data) {
        this['anti-spoilers-public'] = Boolean(data['anti-spoilers-public']);
      }

      if ('enable-notifications' in data) {
        this['enable-notifications'] = Boolean(data['enable-notifications']);
      }
    }
  }


  static #toForm(setting: keyof Settings, value: any) {
    const settingsForm = document.querySelector('form[name="app-settings"]');
    if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

    const input = settingsForm.querySelector(`[name="${setting}"]`);
    switch (input?.tagName.toLowerCase()) {
      case 'input-select': {
        const parsedValue = String(value);
        if (input instanceof InputSelect) input.value = parsedValue;
        else input.setAttribute('value', String(value));
      } break;

      case 'radio-group': {
        if (input instanceof RadioGroup) input.value = String(value);
        else input.setAttribute('value', String(value));
      } break;

      case 'input-slider': {
        if ('value' in input) input.value = Number(value);
        else input.setAttribute('value', String(value));
      } break;

      case 'input-switch': {
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        if ('checked' in input) input.checked = Boolean(value);
        else input.setAttribute('checked', String(Boolean(value)));
      } break;
    }
  }


  static #apply(setting: keyof Settings, value: any, { initial = false }) {
    switch (setting) {
      case 'lang': {
        const html = document.documentElement;
        html.lang = value;

        if (initial) {
          html.addEventListener('translate', event => {
            translationObserver.translate(html, (event as CustomEvent).detail.lang);
          });
          translationObserver.serve(html);
        }
      } break;

      case 'theme': {
        setTheme(value);
      } break;

      case 'theme-hue': {
        const palette = updateThemeHue(value);
        const css = palette.toCSS();
        const container = document.querySelector('style#palette');
        if (!(container instanceof HTMLStyleElement)) throw new TypeError(`Expecting HTMLStyleElement`);
        container.innerHTML = `:root { ${css} }`;
        updateMetaThemeColorTag(palette);
      } break;

      case 'cache-all-sprites': {
        if (initial) {
          if (value) {
            const progressContainer = document.querySelector('[data-sprites-progress]');
            dataStorage.getItem('sprites-cache-progress')
            .then(val => {
              if (progressContainer && val) progressContainer.innerHTML = val;
            });

            // If:
            // - the option is turned on,
            // - the sprites cache version changed according to last service worker install,
            // then check if there are new sprites to cache on app launch.
            // Don't do it on all app launches, because it causes causes slow loading of other stuff.
            dataStorage.getItem('should-update-sprites-cache')
            .then(shouldUpdateCache => {
              if (shouldUpdateCache) return cacheAllSprites(true, { priority: 'low' });
              else return true;
            })
            .then(result => dataStorage.setItem('should-update-sprites-cache', !(result ?? false)));
          }
        } else {
          cacheAllSprites(value);
        }
      } break;

      case 'anti-spoilers-pokedex':
        document.body.setAttribute('data-anti-spoilers-pokedex', value ? 'on' : 'off');
        break;

      case 'anti-spoilers-friends':
        document.body.setAttribute('data-anti-spoilers-friends', value ? 'on' : 'off');
        break;

      case 'anti-spoilers-public':
        document.body.setAttribute('data-anti-spoilers-public', value ? 'on' : 'off');
        break;

      case 'enable-notifications':
        Auth.ready()
        .then(() => {
          // Si le navigateur ne supporte pas les notifs Push : on prévient l'utilisateur et on désactive le paramètre
          if (!('Notification' in window) || !('PushManager' in window)) {
            if (!initial) new Notif(getString('notif-notifications-not-supported')).prompt();
            return Settings.set('enable-notifications', false, { apply: false, toForm: true });
          }

          // Au lancement de l'appli
          if (initial) {
            getCurrentPushSubscription()
            .then(currentSubscription => {
              // Si le paramètre est activé
              if (value) {
                // Si une souscription existe
                if (currentSubscription) {
                  // Si la permission est refusée : on dé-souscrit et on désactive le paramètre
                  if (Notification.permission === 'denied') {
                    unsubscribeFromPush();
                    return Settings.set('enable-notifications', false, { apply: false, toForm: true });
                  }
                }

                // Si pas de souscription actuelle : on désactive le paramètre
                else return Settings.set('enable-notifications', false, { apply: false, toForm: true });
              }

              // Si le paramètre est désactivé
              else {
                // Si une souscription existe : on dé-souscrit
                if (currentSubscription) unsubscribeFromPush();
              }
            })
          }

          // Au changement manuel de paramètre
          else {
            // Si l'utilisateur veut souscrire
            if (value) {
              // Si la permission est déjà accordée : on souscrit pour lui
              if (Notification.permission === "granted") {
                subscribeToPush();
              }
              
              // Si la permission est déjà refusée : on le prévient, on désactive le paramètre et on dé-souscrit
              else if (Notification.permission === 'denied') {
                new Notif(getString('notif-notifications-permission-denied')).prompt();
                unsubscribeFromPush();
                return Settings.set('enable-notifications', false, { apply: false, toForm: true });
              }
              
              // Si la permission est en attende, on la demande
              else {
                Notification.requestPermission()
                .then((permission) => {
                  // Si elle est accordée : on souscrit
                  if (permission === "granted") subscribeToPush();
                  // Sinon : on désactive le paramètre et on dé-souscrit
                  else {
                    unsubscribeFromPush();
                    return Settings.set('enable-notifications', false, { apply: false, toForm: true });
                  }
                });
              }
            }
            
            // Si l'utilisateur veur dé-souscrire : on dé-souscrit
            else {
              unsubscribeFromPush();
            }

            // On réinitialise le flag de dismissal des notifications, pour les proposer à nouveau au prochain ajout d'ami
            dataStorage.setItem('dismissed-push-notif-prompt', false);
          }

          document.body.setAttribute('data-notifications', value ? 'on' : 'off');
          document.querySelectorAll('[name="enable-notifications"]').forEach(input => {
            if ('checked' in input) input.checked = Boolean(value);
            else input.setAttribute('checked', String(Boolean(value)));
          });
        });
        break;
    }
  }


  async #save() {
    await dataStorage.ready();
    dataStorage.setItem('app-settings', this);
  }


  static async restore({ include = [], exclude = [] }: { include?: string[], exclude?: string[] } = {}) {
    await dataStorage.ready();
    const savedSettings = new Settings(await dataStorage.getItem('app-settings'));

    if (include.length === 0) {
      include = Object.keys(savedSettings);
    }
    include = include.filter(s => !(exclude.includes(s)));
    
    for (const setting of include as Array<keyof Settings>) {
      const value = savedSettings[setting];
      Settings.#toForm(setting, value);
      Settings.#apply(setting, value, { initial: true });
    }
    return;
  }


  static async set(setting: keyof Settings, value: any, { apply = true, toForm = true }: { apply?: boolean, toForm?: boolean } = {}) {
    await dataStorage.ready();
    const currentSettings = new Settings(await dataStorage.getItem('app-settings'));

    switch (setting) {
      case 'lang':
        if (isSupportedLang(value)) currentSettings.lang = value;
        break;

      case 'theme':
        if (isSupportedTheme(value)) currentSettings.theme = value;
        break;

      case 'theme-hue':
        if (!isNaN(parseInt(value))) currentSettings['theme-hue'] = parseInt(value);
        break;

      case 'cache-all-sprites':
      case 'anti-spoilers-pokedex':
      case 'anti-spoilers-friends':
      case 'anti-spoilers-public':
      case 'enable-notifications':
        if (['true', 'false', true, false].includes(value)) currentSettings[setting] = String(value) === 'true';
        break;
    }

    if (toForm) Settings.#toForm(setting, currentSettings[setting]);
    if (apply) Settings.#apply(setting, currentSettings[setting], { initial: false });
    await currentSettings.#save();
  }


  static async get(id: keyof Settings): Promise<any> {
    await dataStorage.ready();
    const currentSettings = new Settings(await dataStorage.getItem('app-settings'));

    if (id in currentSettings) return currentSettings[id as keyof Settings];
    else throw new Error(`${id} is not a valid setting`);
  }


  static initChangeHandler() {
    const settingsForm = document.querySelector('form[name="app-settings"]');
    if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

    settingsForm.addEventListener('change', event => {
      const setting = (event.target as EventTarget & { name: string })?.name;
      const settings = new Settings(new FormData(settingsForm));
      if (setting in settings) {
        Settings.set(setting as keyof Settings, settings[setting as keyof Settings], { apply: true, toForm: false });
      }
    });
  }
}



/**
 * Fills or empties the the sprites cache.
 * @param bool - true to fill the cache, false to empty it.
 * @returns true if there was no error, false if there was one.
 */
let downloadNotification: Notif;
export async function cacheAllSprites(bool: boolean, fetchOptions: RequestInit & { priority?: string } = {}): Promise<boolean> {
  const worker = (await navigator.serviceWorker.ready).active;
  if (!worker) throw new Error('No service worker available to cache all sprites');

  const input = document.querySelector('[name="cache-all-sprites"]');

  if (downloadNotification) {
    downloadNotification.dismissable = true;
    downloadNotification.remove();
  }
  downloadNotification = new Notif(getString('updating-sprites-cache'), undefined, '', undefined, false);

  try {
    if (input && 'disabled' in input) input.disabled = true;

    const progressContainer = document.querySelector('[data-sprites-progress]');
    let notificationMessageContainer: HTMLElement | null | undefined;

    // If we're updating the sprites cache, display a notification so the user knows why the app is lagging
    if (bool) {
      await downloadNotification.prompt();
      downloadNotification.element?.classList.add('loading');
      notificationMessageContainer = downloadNotification.element?.querySelector('.snackbar-message');
    }
    
    // If we're deleting the sprites cache
    else {
      if (progressContainer) progressContainer.innerHTML = '';
      worker.postMessage({ 'action': 'delete-all-sprites' });
      return true;
    }

    if (progressContainer) progressContainer.innerHTML = getString('preparing-sprites-cache');

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

          const progressMessage = `${progress}% : ${displayedSize} ${unit}`;
          progressContainer.innerHTML = progressMessage;
          if (notificationMessageContainer) {
            const newNotificationMessage = notificationMessageContainer.innerHTML.replace(/\((.*?)\)/, `(${progressMessage})`);
            notificationMessageContainer.innerHTML = newNotificationMessage;
          }

          if (progress === 100) resolve(true);
          else if (progressWithErrors === 100) resolve(false);
        }
      };
    
      channel.port1.onmessageerror = event => {
        reject(event);
      };
      
      worker.postMessage({ 'action': `cache-all-sprites`, 'options': fetchOptions }, [channel.port2]);
    });

    await dataStorage.setItem('sprites-cache-progress', `${progress}% : ${(size / (10 ** unitPower)).toFixed(2)} ${unit}`);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    if (input && 'disabled' in input) input.disabled = false;
    else input?.removeAttribute('disabled');

    downloadNotification.dismissable = true;
    downloadNotification.remove();
  }
}



/* User profile management */



type UserProfileData = {
  username?: string|null;
  public?: boolean;
  appearInFeed?: boolean;
  lastUpdate?: number;
}

/** Updates the stored user profile data. */
let updateUserProfile = async (data: UserProfileData = {}) => {
  const userProfile = (await dataStorage.getItem('user-profile')) ?? {};
  if (data.username) userProfile.username = data.username;
  if (data.public) userProfile.public = data.public;
  if (data.appearInFeed) userProfile.appearInFeed = data.appearInFeed;
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


/** Asks the backend to update the user's presence in the public feed. */
export async function updateUserPresenceInFeed(visibility: boolean) {
  const settingsForm = document.querySelector('form[name="app-settings"]');
  if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);
  
  try {
    await callBackend('update-user-profile', { appearInFeed: String(visibility) }, true);
    await updateUserProfile({ appearInFeed: visibility });
  } catch (error) {
    throw new Error(getString('error-changing-presence-in-feed'), { cause: error ?? undefined })
  }
}


/** Handles changes to the presence in feed input. */
export function initFeedPresenceChangeHandler() {
  const settingsForm = document.querySelector('form[name="app-settings"]');
  if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

  const input = settingsForm.querySelector('[name="appear-in-feed"]');
  if (!input || !('disabled' in input) || !('checked' in input)) throw new TypeError(`Expecting InputSwitch`);

  input.addEventListener('change', event => {
    updateUserPresenceInFeed(Boolean(input.checked))
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