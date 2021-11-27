/////////////////////////////////////////////////////////////////////////////////////////////
// Affiche une notification en bas de l'écran pendant duree ms, avec un texte de description,
// un bouton (texte + icône), et une action au clic sur le bouton
let notifTimeLimit;
let actionFunction;

export function notify(texteDesc: string, texteBouton = '', iconeBouton = 'close', action = unNotify, duree = 5000) {
  const notif = document.getElementById('notification');
  const fab = document.querySelector('.fab');

  notif.classList.remove('off');
  if (notif.classList.contains('on'))
    return;
  
  const notifTexte = notif.querySelector('.notif-texte');
  const notifBouton = notif.querySelector('.notif-bouton');
  const notifTexteBouton = notifBouton.querySelector('span');
  const notifIcone = notifBouton.querySelector('i');

  notifTexte.innerHTML = texteDesc;
  notifTexteBouton.innerHTML = texteBouton;
  notifIcone.innerHTML = iconeBouton;
  actionFunction = action;
  notifBouton.addEventListener('click', actionFunction);

  requestAnimationFrame(() => {
    notif.classList.add('on');
    fab.classList.add('notif');
    if (iconeBouton == 'loading') notif.classList.add('loading');
    else notif.classList.remove('loading');
  });
  notifTimeLimit = setTimeout(() => {
    if (notif.classList.contains('installing')) return;
    unNotify();
  }, duree);
}


////////////////////////////////////////////////////////
// Masque la notification appelée par la fonction notify
export function unNotify()
{
  const notif = document.getElementById('notification');
  const fab = document.querySelector('.fab');
  clearTimeout(notifTimeLimit);
  notif.classList.remove('on');
  fab.classList.remove('notif');
  const notifBouton = notif.querySelector('.notif-bouton');
  notifBouton.removeEventListener('click', actionFunction);
}