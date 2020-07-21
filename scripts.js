import './modules/comp_loadSpinner.js';
import './modules/comp_syncProgress.js';
import { Params, changeAutoMaj, callResize, saveDBpassword, export2json, wait, loadAllImages } from './modules/mod_Params.js';
import { navigate, sectionActuelle } from './modules/mod_navigate.js';
import { playEasterEgg } from './modules/mod_easterEgg.js';
import { appStart, checkUpdate, manualUpdate, setOnlineBackup, updateSprite, startBackup } from './modules/mod_appLifeCycle.js';
import { appPopulate, appDisplay, json2import } from './modules/mod_appContent.js';
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



///////////////////////////////////
// FAB (filtres et nouvelle chasse)

// Active le FAB
document.querySelector('.fab').addEventListener('click', () => {
  // Filtres
  if (['mes-chromatiques', 'pokedex'].includes(sectionActuelle)) openFiltres();
  // Nouvelle chasse
  else if (sectionActuelle == 'chasses-en-cours') Hunt.build();
});

// L'obfuscator ramène en arrière quand on clique dessus
document.querySelector('.obfuscator').addEventListener('click', () => history.back());



///////////////////
// CHASSES EN COURS

// Active le bouton de création de chasse
//document.querySelector('.bouton-new-hunt').addEventListener('click', () => Hunt.build());



/////////////
// PARAMÈTRES

// Active le switch du thème
dataStorage.getItem('theme').then(theme => {
  const storedTheme = (theme != null) ? theme : 'system';
  const input = document.getElementById(`theme-${storedTheme}`);
  input.checked = true;
});

Array.from(document.querySelectorAll('input[name=theme]')).forEach(input => {
  input.onclick = async event => { return await setTheme(input.value); };
});

// Active le switch des mises à jour auto
dataStorage.getItem('check-updates').then(value => {
  if (value == 1) document.getElementById('switch-auto-maj').checked = true;
  else            document.getElementById('switch-auto-maj').checked = false;
});

document.querySelector('[for=switch-auto-maj]').onclick = async event => { event.preventDefault(); return await changeAutoMaj(); };

// Active le switch de la sauvegarde en ligne
dataStorage.getItem('online-backup').then(value => {
  if (value == 1) {
    document.getElementById('switch-online-backup').checked = true;
    document.getElementById('parametres').dataset.onlineBackup = '1';
  }
  else document.getElementById('switch-online-backup').checked = false;
});

document.querySelector('[for=switch-online-backup]').onclick = async event => { event.preventDefault(); return await setOnlineBackup(); };

// Surveille l'input du mot de passe de la BDD
document.getElementById('mdp-bdd').addEventListener('input', async () => {
  return await saveDBpassword();
});

// Active le badge indiquant le succès / échec de la dernière synchronisation des BDD
dataStorage.getItem('last-sync').then(value => {
  if (value === 'success') document.querySelector('#parametres').dataset.lastSync = 'success';
  else document.querySelector('#parametres').dataset.lastSync = 'failure';
})

document.querySelector('.info-backup.failure').onclick = startBackup;
document.querySelector('.info-backup.success').onclick = startBackup;

// Prépare le bouton de recherche de mise à jour
let longClic;
let needCheck = 1;
const majButton = document.querySelector('.bouton-recherche-maj');

majButton.addEventListener('mousedown', event => {
  if (event.button != 0) return;
  event.preventDefault();
  clearTimeout(longClic);
  longClic = setTimeout(() => { needCheck = 0; manualUpdate(); }, 3000);

  majButton.addEventListener('mouseup', () => { clearTimeout(longClic); if (needCheck) checkUpdate(true); });
  majButton.addEventListener('mouseout', () => clearTimeout(longClic));
});

majButton.addEventListener('touchstart', () => {
  event.preventDefault();
  clearTimeout(longClic);
  longClic = setTimeout(() => { needCheck = 0; manualUpdate(); }, 3000);

  majButton.addEventListener('touchend', () => { clearTimeout(longClic); if (needCheck) checkUpdate(true); });
  majButton.addEventListener('touchcancel', () => clearTimeout(longClic));
});

// Prépare le bouton d'export des données
document.querySelector('.bouton-export').addEventListener('click', export2json);

// Prépare le bouton d'import des données
const importInput = document.getElementById('pick-import-file');
importInput.addEventListener('change', async event => {
  await json2import(importInput.files[0]);
});

// Prépare le bouton de suppression des données locales
const boutonSupprimer = document.querySelector('.bouton-supprimer-local');
boutonSupprimer.addEventListener('click', async event => {
  event.preventDefault();

  if (boutonSupprimer.innerHTML == 'Supprimer' || boutonSupprimer.innerHTML == 'Annuler')
  {
    boutonSupprimer.innerHTML = 'Vraiment ?';
    setTimeout(() => boutonSupprimer.innerHTML = 'Supprimer', 3000);
  }
  else if (boutonSupprimer.innerHTML == 'Vraiment ?')
  {
    boutonSupprimer.disabled = true;
    boutonSupprimer.innerHTML = 'Supprimer';
    notify('Suppression des données...', '', 'loading', () => {}, 999999999);
    await Promise.all([shinyStorage.clear(), huntStorage.clear()]);
    await appPopulate(false);
    await appDisplay(false);
    await wait(1000);
    unNotify();
    boutonSupprimer.disabled = false;
  }
});

// Active l'easter egg de la section a-propos
document.querySelector('.easter-egg').onclick = playEasterEgg;



///////////////////////////////////////
// COMMUNICATION AVEC LE SERVICE WORKER
navigator.serviceWorker.addEventListener('message', async event => {
  // --- Réponse à HUNT-ADD-id, HUNT-EDIT-id ou HUNT-REMOVE-id ---
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
      window.dispatchEvent(new Event('populate'));
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

  // --- Réponse à COMPARE-BACKUP ---
  else if ('successfulBackupComparison' in event.data) {
    if ('noresponse' in event.data) return;

    const loaders = Array.from(document.querySelectorAll('sync-progress, sync-line'));

    if (event.data.successfulBackupComparison === true) {
      // Toutes les chasses locales plus récentes que celles de la BDD ont été ajoutées / éditées
      loaders.forEach(loader => loader.setAttribute('state', 'success'));
      document.querySelector('#parametres').dataset.lastSync = 'success';

      if ('obsolete' in event.data) {
        const versionBDD = await dataStorage.getItem('version-bdd');
        window.dispatchEvent(new CustomEvent('populate', { detail: { version: versionBDD, obsolete: event.data.obsolete } }));
      }
    }
    else {
      // Au moins une chasse n'a pas pu être ajoutée / éditée
      if (event.data.error !== true) notify(event.data.error);
      else notify('Erreur. Réessayez plus tard.');
      loaders.forEach(loader => loader.setAttribute('state', 'failure'));
      document.querySelector('#parametres').dataset.lastSync = 'failure';
    }
  }
});



//////////////////////////////////////
// ÉCOUTE DE L'EVENT CUSTOM 'POPULATE'
window.addEventListener('populate', async event => {
  console.log('[populate]', event.detail);
  const isObsolete = ('obsolete' in event.detail && event.detail.obsolete === true);
  //notify('Mise à jour des données...', '', 'loading', () => {}, 999999999);
  await appPopulate(false, isObsolete);
  await appDisplay(false);
  //if (!isObsolete) await wait(1000);
  //unNotify();
  if (isObsolete) {
    const version = await updateSprite(event.detail.version);
    await loadAllImages([`./sprites--${version}.php`]);
    document.documentElement.style.setProperty('--link-sprites', `url('./sprites--${version}.php')`);
  }
})



/////////////////////////////
// LANCEMENT DE L'APPLICATION

// Au rechargement de l'appli, indiquer qu'on est sur la section de départ
history.replaceState({section: 'mes-chromatiques'}, '');

// Lancement du service worker
window.addEventListener('load', appStart);

// Gère le redimensionnement de la fenêtre
window.addEventListener('resize', callResize);
window.addEventListener('orientationchange', callResize);