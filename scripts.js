import './modules/comp_loadSpinner.js';
import { Params, changeTheme, changeAutoMaj, callResize, saveDBpassword } from './modules/mod_Params.js';
import { navigate } from './modules/mod_navigate.js';
import { playEasterEgg } from './modules/mod_easterEgg.js';
import { appStart, checkUpdate, manualUpdate } from './modules/mod_appLifeCycle.js';
import { appPopulate, appDisplay } from './modules/mod_appContent.js';
import { openFiltres } from './modules/mod_filtres.js';
import { Hunt } from './modules/mod_Hunt.js';
import { notify, unNotify } from './modules/mod_notification.js';



//////////////
// NAVIGATION

// Active les liens de navigation
Array.from(document.querySelectorAll('[data-section]')).forEach(link => {
  link.addEventListener('click', () => navigate(link.dataset.section));
});

// Active le bouton retour / fermer
Array.from(document.querySelectorAll('.bouton-retour')).forEach(bouton => {
  bouton.addEventListener('click', () => history.back());
});



//////////
// FILTRES

// Active le FAB des filtres
document.querySelector('.fab').addEventListener('click', openFiltres);

// L'obfuscator ramène en arrière quand on clique dessus
document.querySelector('.obfuscator').addEventListener('click', () => history.back());



///////////////////
// CHASSES EN COURS

// Active le bouton de création de chasse
document.querySelector('.bouton-new-hunt').addEventListener('click', () => Hunt.build());



////////////////////////
// PARAMÈTRES & À PROPOS

// Active les switch des paramètres
dataStorage.getItem('theme').then(theme => {
  if (theme == 'light')
    document.getElementById('switch-theme').checked = false;
  else
    document.getElementById('switch-theme').checked = true;
});

dataStorage.getItem('check-updates').then(value => {
  if (value == 1)
    document.getElementById('switch-auto-maj').checked = true;
  else
    document.getElementById('switch-auto-maj').checked = false;
});

document.querySelector('[for=switch-theme]').onclick = async event => { event.preventDefault(); return await changeTheme(); };
document.querySelector('[for=switch-auto-maj]').onclick = async event => { event.preventDefault(); return await changeAutoMaj(); };

document.getElementById('mdp-bdd').addEventListener('input', async () => {
  return await saveDBpassword();
});

// Active l'easter egg de la section a-propos
document.querySelector('.easter-egg').onclick = playEasterEgg;

// Prépare le bouton de recherche de mise à jour
let longClic;
let needCheck = 1;
const majButton = document.querySelector('.bouton-recherche-maj');

majButton.addEventListener('mousedown', event => {
  event.preventDefault();
  if (event.button == 0)
  {
    clearTimeout(longClic);
    longClic = setTimeout(() => { needCheck = 0; manualUpdate(); }, 3000);

    majButton.addEventListener('mouseup', () => { clearTimeout(longClic); if (needCheck) checkUpdate(true); });
    majButton.addEventListener('mouseout', () => clearTimeout(longClic));
  }
});

majButton.addEventListener('touchstart', () => {
  event.preventDefault();
  clearTimeout(longClic);
  longClic = setTimeout(() => { needCheck = 0; manualUpdate(); }, 3000);

  majButton.addEventListener('touchend', () => { clearTimeout(longClic); if (needCheck) checkUpdate(true); });
  majButton.addEventListener('touchcancel', () => clearTimeout(longClic));
});



///////////////////////////////////////
// COMMUNICATION AVEC LE SERVICE WORKER
navigator.serviceWorker.addEventListener('message', async event => {
  // Réception d'une réponse à l'envoi d'une chasse au service worker
  if ('successfulDBUpdate' in event.data) {
    const huntid = event.data.huntid;
    const card = document.getElementById('hunt-' + huntid);

    if (event.data.successfulDBUpdate === true) {
      // On reçoit la confirmation du succès de l'ajout à la DB

      // La façon dont l'appli gère cette réponse dépend du moment où la confirmation est reçue.
      // 1️⃣ Si on reçoit la confirmation de suite après avoir contacté le sw (test = ❔)
      //// ✅ Visuellement, la chasse est en cours de "chargement" (data-loaded a été set par submitHunt)
      //// - ✅ On supprime la chasse de uploaded-hunts (liste des chasses à supprimer au prochain démarrage)
      //// - ✅ On supprime la chasse de huntStorage
      //// - ✅ On supprime la carte de la chasse
      //// - ✅ On met à jour le contenu de l'appli (et on notifie)
      // 2️⃣ Si on reçoit la confirmation pendant une prochaine visite (test = ❔)
      //// ✅ Visuellement, la chasse est en cours de chargement (car initialisée avec this.uploaded)
      //// ✅ On reproduit l'étape 1
      // 3️⃣ Si on reçoit la confirmation après avoir fermé l'application (test = ❔)
      //// - ✅ La chasse ne sera pas initialisée au prochain lancement (car elle est dans uploaded-hunts)
      //// - ✅ Les nouvelles données seront chargées au prochain lancement (car mises à jour dans la DB par le sw) - pas de notif

      // ✅ faire disparaître la carte de la chasse
      let uploadConfirmed = await dataStorage.getItem('uploaded-hunts');
      if (uploadConfirmed == null) uploadConfirmed = [];
      await dataStorage.setItem('uploaded-hunts', uploadConfirmed.filter(v => v != huntid));
      card.remove();
      const keys = await huntStorage.keys();
      if (keys.length == 0) document.querySelector('#chasses-en-cours').classList.add('vide');
      // ✅ animation de chargement
      notify('Mise à jour des données...', '', 'loading', () => {}, 999999999);
      // ✅ re-lancer appPopulate(start = false)
      await appPopulate(false);
      // ✅ re-lancer appDisplay(start = false)
      await appDisplay(false);
      // ✅ forcer l'affichage du nouveau sprite--versionBDD.php (appDisplay s'en charge)
      // ✅ fin de l'animation de chargement
      unNotify();
    }
    else {
      // On reçoit la confirmation de l'échec de l'ajout à la DB
      // ✅ animer l'échec
      notify('Échec d\'envoi des données.');
      // ✅ laisser la carte de la chasse et désactiver son animation de chargement
      card.removeAttribute('data-loading');
      let uploadConfirmed = await dataStorage.getItem('uploaded-hunts');
      if (uploadConfirmed == null) uploadConfirmed = [];
      await dataStorage.setItem('uploaded-hunts', uploadConfirmed.filter(v => v != huntid));
      const hunt = await huntStorage.getItem(String(huntid));
      hunt.uploaded = false;
      await huntStorage.setItem(String(huntid), hunt);
    }
  }
});



/////////////////////////////
// LANCEMENT DE L'APPLICATION

// Au rechargement de l'appli, indiquer qu'on est sur la section de départ
history.replaceState({section: 'mes-chromatiques'}, '');

// Lancement du service worker
window.addEventListener('load', appStart);

// Gère le redimensionnement de la fenêtre
window.addEventListener('resize', callResize);
window.addEventListener('orientationchange', callResize);