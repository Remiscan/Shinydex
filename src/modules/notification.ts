import { Params } from './Params.js';



export const template = document.createElement('template');
template.innerHTML = /*html*/`
  <div class="snackbar elevation-3-shadow">
    <span class="snackbar-message body-medium"></span>
    <button type="button" class="snackbar-action surface interactive text-button only-text">
      <span class="label-large"></span>
    </button>
    <button type="button" class="snackbar-dismiss surface interactive icon-button only-icon">
      <span class="material-icons">close</span>
    </button>
    <load-spinner></load-spinner>
  </div>
`;



const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    document.body.style.setProperty('--notification-container-height', String(entry.contentRect.height));
  }
});

const notificationContainer = document.querySelector('.notification-container');
if (notificationContainer) observer.observe(notificationContainer);



export class Notif {
  message: string;
  duration: number;
  actionText: string;
  action?: () => any;
  dismissable: boolean;

  timer?: number;
  element?: Element;


  constructor(message: string, duration: number = 5000, actionText: string = '', action?: () => any, dismissable: boolean = true) {
    this.message = message;
    this.duration = duration;
    this.actionText = actionText;
    this.action = action;
    this.dismissable = dismissable ?? true;
  }


  /** Makes the HTML content of the notification. */
  toHtml(): Element {
    const html = template.content.cloneNode(true) as DocumentFragment;

    const snackbar = html.querySelector('.snackbar');

    const messageContainer = html.querySelector('.snackbar-message');
    if (messageContainer) messageContainer.innerHTML = this.message;

    const actionButton = html.querySelector('.snackbar-action');
    const actionTextContainer = actionButton?.querySelector('span');
    if (actionTextContainer) actionTextContainer.innerHTML = this.actionText;

    if (this.action) {
      actionButton?.addEventListener('click', () => this.action?.(), { once: true });
    } else {
      snackbar?.classList.add('no-action');
    }

    const dismissButton = html.querySelector('.snackbar-dismiss');
    if (this.dismissable) {
      dismissButton?.addEventListener('click', () => this.remove(), { once: true });
    } else {
      snackbar?.classList.add('no-dismiss');
    }

    if (snackbar) {
      this.element = snackbar;
      return this.element;
    } else {
      throw new TypeError('Expecting Element');
    }
  }


  /** Deletes the notification. */
  remove() {
    if (this.element && this.dismissable) {
      const closingAnimation = this.element.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], {
        duration: 200,
        easing: Params.easingStandard,
        fill: 'forwards'
      });
      closingAnimation?.addEventListener('finish', () => {
        notificationContainer?.classList.add('no-animation');
        this.element?.remove();
        requestAnimationFrame(() => requestAnimationFrame(() => notificationContainer?.classList.remove('no-animation')));
      });
    }
  }


  /**
   * Affiche la notification et attend la réaction de l'utilisateur.
   * @returns Si l'utilisateur a cliqué sur le bouton d'action de la notification ou non.
   */
  async prompt(): Promise<boolean> {
    const html = this.toHtml();
    notificationContainer?.appendChild(html);

    const actionButton = html.querySelector('.snackbar-action');
    const dismissButton = html.querySelector('.snackbar-dismiss');

    const userResponse: boolean = await new Promise(resolve => {
      if (this.action)      actionButton?.addEventListener('click', event => resolve(true));
      if (this.dismissable) dismissButton?.addEventListener('click', event => resolve(false));
      if (this.duration)    this.timer = setTimeout(() => { this.remove(); resolve(false); }, this.duration);
    });

    if (!this.action) return Promise.resolve(true);
    
    clearTimeout(this.timer);
    return userResponse;
  }


  /** Délai de notification maximum. */
  static get maxDelay() {
    return 2147483000;
  }
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Envoie une notification et attend confirmation de l'utilisateur avant de réaliser une action destructrice.
export async function warnBeforeDestruction(bouton: Element, message: string = 'Supprimer définitivement ces données ?', icon: string = 'delete') {
  bouton.setAttribute('disabled', 'true');
  const warning = `Êtes-vous sûr ? ${message}`;

  const action = () => window.dispatchEvent(new Event('destructionconfirmed'));
  const notification = new Notif(warning, undefined, 'Confirmer', action, true);

  const userResponse = await notification.prompt();
  notification.remove();
  bouton.removeAttribute('disabled');

  return userResponse;
}