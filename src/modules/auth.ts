import { Params, Uint8ArrayToHexString, sha256 } from './Params.js';
import { initUsernameChangeHandler, initVisibilityChangeHandler, updateUserProfile } from './Settings.js';
import { callBackend } from './callBackend.js';
import { dataStorage } from './localForage.js';
import { Notif, template as notifTemplate } from './notification.js';
import { requestSync } from './syncBackup.js';



declare var google: {
  accounts: {
    id: {
      initialize: (o: object) => void,
      prompt: (f?: (n: {
        isDisplayMoment: () => boolean,
        isDiplayed: () => boolean,
        isNotDisplayed: () => boolean,
        getNotDisplayedReason: () => string,
        isSkippedMoment: () => boolean,
        getSkippedReason: () => string,
        isDismissedMoment: () => boolean,
        getDismissedReason: () => string,
        getMomentType: () => string
      }) => void) => void,
      disableAutoSelect: () => void,
      renderButton: (parent: HTMLElement, options: object) => void
    }
  }
}



export let loggedIn = false;



const signInPromptsList: Set<SignInPrompt> = new Set();

/** Sign-in prompt notification. */
class SignInPrompt extends Notif {
  showMessage: boolean = true;

  constructor(showMessage = true) {
    super('Vous pourrez vous connecter plus tard depuis les paramètres.', Notif.maxDelay, '', () => {}, true);
    this.showMessage = showMessage;
  }

  /** Makes the HTML content of the notification. */
  toHtml(): Element {
    const html = notifTemplate.content.cloneNode(true) as DocumentFragment;

    const snackbar = html.querySelector('.snackbar');

    const messageContainer = html.querySelector('.snackbar-message');
    if (messageContainer) {
      if (this.showMessage) messageContainer.innerHTML = this.message;
      else messageContainer.remove();
    }

    const actionButton = html.querySelector('.snackbar-action');
    const signInButtonContainer = document.createElement('div');
    signInButtonContainer.className = 'signin-button-container';

    const dismissButton = html.querySelector('.snackbar-dismiss');
    dismissButton?.addEventListener('click', () => {
      this.remove();
      dataStorage.setItem('dismissed-signin', true);
    }, { once: true });

    if (snackbar) {
      this.element = snackbar;
      snackbar.classList.add('signin-prompt');
      snackbar.insertBefore(signInButtonContainer, actionButton);
      actionButton?.remove();
      initGoogleSignIn(signInButtonContainer);
      return this.element;
    } else {
      throw new TypeError('Expecting Element');
    }
  }

  prompt() {
    SignInPrompt.closeAll();
    signInPromptsList.add(this);
    return super.prompt();
  }

  remove() {
    signInPromptsList.delete(this);
    return super.remove();
  }

  static closeAll() {
    signInPromptsList.forEach(prompt => {
      prompt.dismissable = true;
      prompt.remove();
    });
  }
}



type SignInProvider = 'google' | 'shinydex';
async function signIn(provider: SignInProvider, token: string = '', { notify = true } = {}) {
  // Display "signing in" notification
  SignInPrompt.closeAll();
  const signInNotification = new Notif('Connexion en cours...');
  if (notify) {
    signInNotification.element?.classList.add('loading');
    signInNotification.dismissable = false;
    signInNotification.prompt();
  }

  // Generate code verifier
  Params.codeVerifier = Uint8ArrayToHexString(crypto.getRandomValues(new Uint8Array(32)));
  const hashedCodeVerifier = await sha256(Params.codeVerifier);

  try {
    // Send the token to the backend for verification
    const responseBody = await callBackend('sign-in', {
      challenge: hashedCodeVerifier,
      provider: provider,
      token: token
    });

    if (notify) {
      // Remove "signing in" notification
      signInNotification.dismissable = true;
      signInNotification.remove();
    }

    if ('success' in responseBody) {
      await dataStorage.setItem('session-code-verifier', Params.codeVerifier); // make it accessible from service worker
      await dataStorage.setItem('dismissed-signin', false); // Re-enable sign-in prompt after next sign-out

      // Locally store e-mail address to tell user which account they used to sign in
      if ('account' in responseBody) {
        await dataStorage.setItem('signed-in-account', responseBody.account);
        const currentAccountContainer = document.querySelector('[data-value="current-account"]');
        if (currentAccountContainer) currentAccountContainer.innerHTML = responseBody.account;
      }
      
      // Display "successfully signed in" notification
      console.log('User successfully signed in');
      document.body.setAttribute('data-logged-in', 'true');
      if (notify) {
        new Notif('Connexion réussie !').prompt();
      }

      // Apply user settings that were saved in database
      const userProfile = {
        username: responseBody.username ?? null,
        public: Boolean(responseBody.public ?? 0),
        lastUpdate: Number(responseBody.lastUpdate ?? 0)
      };
      await updateUserProfile(userProfile);

      const settingsForm = document.querySelector('form[name="app-settings"]');
      if (!(settingsForm instanceof HTMLFormElement)) throw new TypeError(`Expecting HTMLFormElement`);

      // Username
      try {
        const input = settingsForm.querySelector('[name="username"]');
        if (!input || !('value' in input)) throw new TypeError('Expecting TextField');
        if (userProfile.username) {
          input.value = userProfile.username;
          document.body.setAttribute('data-has-username', 'true');
        }
        initUsernameChangeHandler();
      } catch (error) {
        console.error(error);
      }

      // Visibility
      try {
        const input = settingsForm.querySelector('[name="public"]');
        if (!input || !('checked' in input)) throw new TypeError(`Expecting InputSwitch`);
        input.checked = userProfile.public;
        initVisibilityChangeHandler();
        settingsForm.setAttribute('data-public-profile', String(userProfile.public));
        document.body.setAttribute('data-public-profile', String(userProfile.public));
      } catch (error) {
        console.error(error);
      }

      requestSync();
      document.body.setAttribute('data-logged-in', 'true');
      loggedIn = true;
      return true;
    } else {
      if ('error' in responseBody) throw new Error(responseBody.error);
      else throw new Error('Échec de la connexion');
    }
  } catch (err) {    
    if (notify) {
      // Remove "signing in" notification
      signInNotification.dismissable = true;
      signInNotification.remove();

      const error = new Error('Échec de la connexion');
      new Notif(error.message).prompt();
    }

    throw err;
  }
}



/** Signs a user out. */
export async function signOutCallback() {
  await dataStorage.removeItem('session-code-verifier');
  console.log('User successfully signed out');
  new Notif(`Vous n'êtes plus connecté.`).prompt();
  document.body.setAttribute('data-logged-in', 'false');
  loggedIn = false;
}

export async function signOut() {
  const responseBody = await callBackend('sign-out', undefined, true);

  if ('success' in responseBody) {
    signOutCallback();
    return true;
  } else {
    const error = new Error('Échec de la déconnexion');
    new Notif(error.message).prompt();
    throw error;
  }
}



/** Handles the response from Google's One-Tap sign-in. */
async function googleSignInCallback(body: any) {
  return signIn('google', body.credential);
}

async function initGoogleSignIn(signInButtonContainer: HTMLElement) {
  // Load Google's sign-in library
  await new Promise<void>((resolve, reject) => {
    if (document.querySelector('script#google-gsi')) return resolve();
    const scriptElement = document.createElement('script');
    scriptElement.setAttribute('id', 'google-gsi');
    scriptElement.async = true;
    scriptElement.src = 'https://accounts.google.com/gsi/client';
    scriptElement.addEventListener('load', event => resolve());
    scriptElement.addEventListener('error', event => reject());
    document.head.appendChild(scriptElement);
  });

  google?.accounts?.id?.initialize({
    client_id: '255145207710-8jq1qg3o43venoa7l0un3mr5s3ep8j2n.apps.googleusercontent.com',
    auto_select: true,
    callback: googleSignInCallback,
    //cancel_on_tap_outside: true,
    //prompt_parent_id: 'google-one-tap-container',
    itp_support: true,
    context: 'signin',
    ux_mode: 'popup',
  });

  // Create the sign-in button
  if (signInButtonContainer) google?.accounts?.id?.renderButton(signInButtonContainer, {
    shape: 'pill',
    theme: 'filled_blue'
  });
}



export async function init() {
  // Try to sign-in automatically
  try {
    await signIn('shinydex', '', { notify: false });
  } catch (error) {
    console.log('Could not sign-in automatically');

    // Display sign-in prompt
    const ignorePrompt = await dataStorage.getItem('dismissed-signin');
    if (!ignorePrompt) {
      const signInPrompt = new SignInPrompt();
      signInPrompt.prompt();
    }
  }

  // Initialize current account display
  {
    const currentAccount = await dataStorage.getItem('signed-in-account');
    const currentAccountContainer = document.querySelector('[data-value="current-account"]');
    if (currentAccount && currentAccountContainer) currentAccountContainer.innerHTML = currentAccount;
  }


  // Initialize sign in button
  document.querySelector('[data-action="sign-in-prompt"]')?.addEventListener('click', event => {
    const signInPrompt = new SignInPrompt(false);
    signInPrompt.prompt();
  });

  // Initialize sign out button
  document.querySelector('[data-action="sign-out"]')?.addEventListener('click', event => {
    signOut();
  });

  window.addEventListener('error', event => console.log('error caught', event));
}