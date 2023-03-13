import { Uint8ArrayToHexString, getCookie, sha256 } from './Params.js';
import { Settings } from './Settings.js';
import { dataStorage } from './localForage.js';
import { Notif } from './notification.js';
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

  return await response.json();
}



type SignInProvider = 'google' | 'shinydex';
async function signIn(provider: SignInProvider, token: string = '') {
  // Display "signing in" notification
  const signInNotification = new Notif('Connexion en cours...');
  signInNotification.element?.classList.add('loading');
  signInNotification.dismissable = false;
  signInNotification.prompt();

  // Generate code verifier
  codeVerifier = Uint8ArrayToHexString(crypto.getRandomValues(new Uint8Array(32)));
  const hashedCodeVerifier = await sha256(codeVerifier);

  // Send the token to the backend for verification
  const responseBody = await callBackend('sign-in', {
    challenge: hashedCodeVerifier,
    provider: provider,
    token: token
  });

  // Remove "signing in" notification
  signInNotification.dismissable = true;
  signInNotification.remove();

  if ('success' in responseBody) {
    await dataStorage.setItem('session-code-verifier', codeVerifier); // make it accessible from service worker
    
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
    const error = new Error('Échec de la connexion');
    new Notif(error.message).prompt();
    throw error;
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

async function initGoogleSignIn() {
  // @ts-expect-error
  await import('https://accounts.google.com/gsi/client');

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

  // Place a sign-in button in settings
  const signInButtonContainer = document.getElementById('google-signin-button-container');
  if (signInButtonContainer) google?.accounts?.id?.renderButton(signInButtonContainer, {
    shape: 'pill',
  });
}



export async function init() {
  // If last user session ID is available, automatically sign-in
  if (getCookie('session')) {
    await signIn('shinydex');
  }

  // If no user session ID is available, display sign-in buttons
  else {
    await initGoogleSignIn();
  }

  // Initialize sign out button
  document.querySelector('[data-action="sign-out"]')?.addEventListener('click', event => {
    signOut();
  });

  

  window.addEventListener('error', event => console.log('error caught', event));
}