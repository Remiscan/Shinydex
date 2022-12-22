const queue: Notif[] = [];



export class Notif {
  message: string;
  bouton: {
    texte: string,
    icone: string
  };
  action: () => any;
  duree: number;
  priorite: boolean = false;

  visible: boolean = false;
  handler: () => any = () => {};
  countdown?: number;


  /**
   * Crée une notification à afficher en bas de l'écran.
   * @param texteDesc - Texte de la notification.
   * @param texteBouton - Texte du bouton d'action.
   * @param iconeBouton - Icône du bouton d'action.
   * @param action - Fonction exécutée au clic sur le bouton d'action.
   * @param duree - Durée de présence de la notification à l'écran.
   * @param priorite - Si la notification doit rester affichée à l'écran, même si une autre notif arrive.
   * @returns Si la fonction d'action a été exécutée ou non.
   */
  constructor(message: string, texteBouton: string = '', iconeBouton: string = 'close', duree: number = 5000, action?: () => any, priorite = false) {
    this.message = message;
    this.bouton = {
      texte: texteBouton,
      icone: iconeBouton
    };
    this.duree = duree;
    this.action = action ?? this.hide;
  }


  /**
   * Affiche la notification et attend la réaction de l'utilisateur.
   * @returns Si l'utilisateur a cliqué sur le bouton d'action de la notification ou non.
   */
  async prompt(): Promise<boolean> {
    if (!(queue.includes(this))) queue.push(this);

    if (queue[0] === this) {
      this.visible = true;
      const notif = document.getElementById('notification')!;

      notif.classList.remove('off');
      if (notif.classList.contains('on')) return false;

      const notifTexte = notif.querySelector('.notif-texte')!;
      const notifBouton = notif.querySelector('.notif-bouton')! as HTMLButtonElement;
      const notifTexteBouton = notifBouton.querySelector('span')!;
      const notifIcone = notifBouton.querySelector('i')!;

      notifTexte.innerHTML = this.message;
      notifTexteBouton.innerHTML = this.bouton.texte;
      notifIcone.innerHTML = this.bouton.icone;

      return new Promise(resolve => {
        // Détecte le clic sur le bouton d'action
        notifBouton.addEventListener('click', this.handler = () => {
          resolve(true);
          this.hide();
          this.action();
        });
    
        // Fait apparaître la notification à l'écran
        const fab = document.querySelector('.fab')!;
        notif.classList.add('on');
        fab.classList.add('notif');
        this.visible = true;
        if (this.bouton.icone === 'loading') notif.classList.add('loading');
        else                                 notif.classList.remove('loading');
    
        // Fait disparaître la notification de l'écran
        // après avoir vérifié que le délai n'a pas changé.
        // Ainsi, on peut augmenter this.duree pendant le countdown.
        let dernierDelai: number = 0;
        const cacheOuProlonge = () => {
          if (dernierDelai < this.duree) {
            const tempsRestant = Math.max(0, this.duree - dernierDelai);
            dernierDelai = this.duree;
            setTimeout(cacheOuProlonge, tempsRestant)
          } else {
            if (this.visible) this.hide();
            resolve(false);
          }
        };
        cacheOuProlonge();
      });
    } else {
      const visibleNotif = queue[0];
      const maxWaitTime = 5000;
      if (visibleNotif instanceof Notif) {
        await new Promise(resolve => {
          window.addEventListener('notifqueueshift', resolve, { once: true });
          if (!(visibleNotif?.priorite)) setTimeout(resolve, maxWaitTime);
        });
        visibleNotif.hide();
      }
      return this.prompt();
    }
  }


  /**
   * Masque la notification et désactive son bouton d'action.
   */
  hide() {
    if (queue[0] !== this || !this.visible) return;

    const notif = document.getElementById('notification')!;
    const fab = document.querySelector('.fab')!;

    clearTimeout(this.countdown);
    notif.classList.remove('on');
    fab.classList.remove('notif');

    // Désactive le bouton d'action de la notification.
    const notifBouton = notif.querySelector('.notif-bouton')! as HTMLButtonElement;
    notifBouton.removeEventListener('click', this.handler);

    queue.shift();
    window.dispatchEvent(new Event('notifqueueshift'));
    this.visible = false;
  }


  /**
   * Délai de notification maximum.
   */
  static get maxDelay() {
    return 2147483000;
  }
}