import { Uint8ArrayToHexString, sha256 } from './Params.js';
import { Settings } from './Settings.js';
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



let codeVerifier: string = '';



export async function callBackend(request: string, data: any = null, signedIn: boolean = false): Promise<any> {
  if (signedIn) data.codeVerifier = codeVerifier;
  const response = await fetch(`/shinydex/backend/endpoint.php?request=${request}&date=${Date.now()}`, {
    method: data ? 'POST' : 'GET',
    body: data ? JSON.stringify(data) : undefined
  });

  if (response.status != 200)
    throw '[:(] Erreur ' + response.status + ' lors de la requête';

  const responseData = await response.json();
  if ('error' in responseData) {
    throw new Error(responseData.error);
  }
  return responseData;
}



type SignInProvider = 'google' | 'shinydex';
async function signIn(provider: SignInProvider, token: string = '', { notify = true } = {}) {
  // Display "signing in" notification
  const signInNotification = new Notif('Connexion en cours...');
  if (notify) {
    signInNotification.element?.classList.add('loading');
    signInNotification.dismissable = false;
    signInNotification.prompt();
  }

  // Generate code verifier
  codeVerifier = Uint8ArrayToHexString(crypto.getRandomValues(new Uint8Array(32)));
  const hashedCodeVerifier = await sha256(codeVerifier);

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
      await dataStorage.setItem('session-code-verifier', codeVerifier); // make it accessible from service worker
      await dataStorage.setItem('dismissed-signin', false); // Re-enable sign-in prompt after next sign-out
      
      // Display "successfully signed in" notification
      console.log('User successfully signed in');
      new Notif('Connexion réussie !').prompt();
      document.body.setAttribute('data-logged-in', 'true');

      // Apply user settings that were waved in database
      if ('username' in responseBody) {
        try {
          Settings.set('username', String(responseBody.username ?? ''), { toForm: true, apply: false });
        } catch (error) {}
      }

      if ('public' in responseBody) {
        try {
          Settings.set('public', Boolean(responseBody.public ?? false), { toForm: true, apply: false });
        } catch (error) {}
      }

      requestSync();
      document.body.setAttribute('data-logged-in', 'true');
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
export async function signOut() {
  const responseBody = await callBackend('sign-out', undefined, true);

  if ('success' in responseBody) {
    await dataStorage.removeItem('session-code-verifier');

    console.log('User successfully signed out');
    new Notif(`Vous n'êtes plus connecté.`).prompt();
    document.body.setAttribute('data-logged-in', 'false');
    return true;
  } else {
    const error = new Error('Échec de la déconnexion');
    new Notif(error.message).prompt();
    throw error;
  }
}



/*function renderGoogleButton() {
  // Place a sign-in button in settings
  const signInButtonContainer = document.getElementById('google-signin-button-container');
  if (signInButtonContainer) google?.accounts?.id?.renderButton(signInButtonContainer, {
    shape: 'pill',
  });
}*/

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