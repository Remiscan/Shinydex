import { getCookie } from './Params.js';
import { backgroundSync, periodicSync } from './syncBackup.js';



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



/** Handles the response from Google's One-Tap sign-in. */
async function signinCallback(body: any) {
  // Send the token to the backend for verification
  body.provider = 'google';
  const response = await fetch('/shinydex/backend/sign-in.php', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  if (response.status != 200)
    throw '[:(] Erreur ' + response.status + ' lors de la requête';

  const responseBody = await response.json();

  if ('success' in responseBody) {
    console.log('User successfully signed in');
    document.body.setAttribute('data-logged-in', 'true');
    await periodicSync(true);
    await backgroundSync();
  }
}



/** Signs a user out. */
async function signOut() {
  // Ask the backend to sign the user out
  const response = await fetch('/shinydex/backend/sign-out.php');
  if (response.status != 200)
    throw '[:(] Erreur ' + response.status + ' lors de la requête';

  const responseBody = await response.json();

  if ('success' in responseBody) {
    google?.accounts?.id?.disableAutoSelect();
    console.log('User successfully signed out');
    document.body.setAttribute('data-logged-in', 'false');
    await periodicSync(false);
  }
}



function renderGoogleButton() {
  // Place a sign-in button in settings
  const signInButtonContainer = document.getElementById('google-signin-button-container');
  if (signInButtonContainer) google?.accounts?.id?.renderButton(signInButtonContainer, {
    shape: 'pill',
  });
}



export function init() {
  // Initialize logged in or logged out interface
  const loggedIn = getCookie('loggedin') === 'true';
  if (loggedIn) document.body.setAttribute('data-logged-in', 'true');
  else           document.body.setAttribute('data-logged-in', 'false');

  // Initialize sign out button
  document.querySelector('[data-action="sign-out"]')?.addEventListener('click', event => {
    signOut();
  });

  google?.accounts?.id?.initialize({
    client_id: '255145207710-8jq1qg3o43venoa7l0un3mr5s3ep8j2n.apps.googleusercontent.com',
    auto_select: true,
    callback: signinCallback,
    cancel_on_tap_outside: true,
    prompt_parent_id: 'google-one-tap-container',
    itp_support: true,
    context: 'signin',
    ux_mode: 'popup',
  });

  // Show sign-in prompt if not logged in
  if (!loggedIn) {
    google?.accounts?.id?.prompt(notification => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
        renderGoogleButton();
      }
    });
  } else {
    renderGoogleButton();
  }

  window.addEventListener('error', event => console.log('error caught', event));
}