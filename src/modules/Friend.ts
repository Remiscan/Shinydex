import { updateUserProfile } from './Settings.js';
import { callBackend } from './callBackend.js';
import { dataStorage, friendStorage } from './localForage.js';
import { Notif } from './notification.js';
import { getString } from './translation.js';



interface BackendPartialShiny {
  dexid: number,
  forme: string,
  catchTime: number,
  total: number,
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
        forme: 'forme' in pkmn ? String(pkmn.forme) : '',
        catchTime: 'catchTime' in pkmn ? Number(pkmn.catchTime) : 0,
        total: 'total' in pkmn ? Number(pkmn.total) : 0,
      });
    }
  }


  async save() {
    await friendStorage.setItem(this.username, this.pokemonList);
    const userProfile = (await dataStorage.getItem('user-profile')) ?? {};
    userProfile.lastUpdate = Date.now();
    await updateUserProfile(userProfile);
  }


  static async addFriend(username: string): Promise<boolean> {
    // Ask backend if that username matches a public user
    const response = await callBackend('get-friend-data', { username, scope: 'partial' }, false);

    if ('matches' in response && response.matches === true) {
      // Add the requested user to the friends list
      const friend = new Friend(username, response.pokemon);
      await friend.save();

      // Populate friends list
      window.dispatchEvent(new CustomEvent('dataupdate', {
        detail: {
          sections: ['partage'],
          ids: [username],
          sync: true
        }
      }));
      
      // Notify that the user was successfully added as friend
      new Notif(getString('notif-added-friend').replace('{user}', username)).prompt();

      // Check if notifications are enabled or were previously dismissed by the user
      const appSettings = await dataStorage.getItem('app-settings');
      const arePushNotificationsEnabled = appSettings['enable-notifications'];
      const werePushNotificationsDismissed = await dataStorage.getItem('dismissed-push-notif-prompt');

      // If they are not enabled and were not previously dismissed, ask to enable them
      if (!arePushNotificationsEnabled && !werePushNotificationsDismissed) {
        const notifEnablePush = new Notif(
          getString('notif-notifications-prompt'),
          Notif.maxDelay,
          getString('notif-notifications-prompt-action'),
          () => {}, true
        );
        const userResponse = await notifEnablePush.prompt();

        // If the user says yes, actually enable them
        if (userResponse) {
          const input = document.querySelector('form[name="app-settings"] [name="enable-notifications"]');
          (input as HTMLElement)?.click();
          notifEnablePush.dismissable = true;
          notifEnablePush.remove();
        }
        
        // If the user says no, store that he dismissed the prompt to avoid asking again in the future
        else {
          await dataStorage.setItem('dismissed-push-notif-prompt', true);
        }
      }
      return true;
    } else {
      new Notif(getString('error-no-profile').replace('{user}', username)).prompt();
      return false;
    }

  }
}