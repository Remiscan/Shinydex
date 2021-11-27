import { appDisplay, appPopulate, json2import, populateAttemptsModified, populateAttemptsObsolete, populateAttemptsVersions } from './appContent.js';
import { appStart, checkUpdate, manualUpdate, setOnlineBackup, startBackup } from './appLifeCycle.js';
import { DexDatalist } from './DexDatalist.js';
import { playEasterEgg } from './easterEgg.js';
import { initFiltres, openFiltres } from './filtres.js';
import { Hunt } from './Hunt.js';
import './loadSpinner.component.js';
import { dataStorage, huntStorage, shinyStorage } from './localforage.js';
import { navigate, sectionActuelle } from './navigate.js';
import { notify, unNotify } from './notification.js';
import { callResize, changeAutoMaj, export2json, wait } from './Params.js';
import './pokemonCard.component.js';
import { initSpriteViewer } from './spriteViewer.js';
import './syncProgress.component.js';



declare global {
  interface Window {
    setTheme: (askedTheme: string | false) => Promise<void>
  }
}



//////////////
// NAVIGATION

// Active les liens de navigation
for (const link of Array.from(document.querySelectorAll('[data-section]')) as HTMLElement[]) {
  link.addEventListener('click', () => navigate(link.dataset.section || ''));
}

// Active le bouton retour / fermer
for (const bouton of Array.from(document.querySelectorAll('.bouton-retour')) as HTMLButtonElement[]) {
  bouton.addEventListener('click', () => history.back());
}



///////////////////////////////////
// FAB (filtres et nouvelle chasse)

// Active le FAB
document.querySelector('.fab')!.addEventListener('click', () => {
  // Filtres
  if (['mes-chromatiques', 'pokedex'].includes(sectionActuelle)) openFiltres();
  // Nouvelle chasse
  else if (sectionActuelle == 'chasses-en-cours') Hunt.build();
});

// L'obfuscator ramène en arrière quand on clique dessus
document.querySelector('.obfuscator')!.addEventListener('click', () => history.back());

// Surveille le champ de filtrage par espèce de Pokémon
{
  const input = document.querySelector('.menu-filtres')!.querySelector('[list="datalist-pokedex"]') as HTMLInputElement;
  input.addEventListener('input', async () => {
    DexDatalist.build(input.value);
  });
}



///////////////////
// CHASSES EN COURS

// Active le bouton de création de chasse
//document.querySelector('.bouton-new-hunt').addEventListener('click', () => Hunt.build());



/////////////
// PARAMÈTRES

// Active le switch du thème
dataStorage.getItem('theme').then((theme?: string) => {
  const storedTheme = (theme != null) ? theme : 'system';
  const input = document.getElementById(`theme-${storedTheme}`) as HTMLInputElement;
  input.checked = true;
});

for (const input of Array.from(document.querySelectorAll('input[name=theme]')) as HTMLInputElement[]) {
  input.onclick = async event => { return await window.setTheme(input.value); };
}

// Active le switch des mises à jour auto
dataStorage.getItem('check-updates').then((value: boolean) => {
  const box = document.getElementById('switch-auto-maj') as HTMLInputElement;
  if (value === true) box.checked = true;
  else                box.checked = false;
});

(document.querySelector('[for=switch-auto-maj]') as HTMLLabelElement).onclick = async event => { event.preventDefault(); return await changeAutoMaj(); };

// Active le switch de la sauvegarde en ligne
dataStorage.getItem('online-backup').then((value: boolean) => {
  const box = document.getElementById('switch-online-backup') as HTMLInputElement;
  if (value === true) {
    box.checked = true;
    document.getElementById('parametres')!.dataset.onlineBackup = '1';
  }
  else box.checked = false;
});

(document.querySelector('[for=switch-online-backup]') as HTMLLabelElement).onclick = async event => { event.preventDefault(); return await setOnlineBackup(); };

// Active le badge indiquant le succès / échec de la dernière synchronisation des BDD
dataStorage.getItem('last-sync').then((value?: string) => {
  const params = document.querySelector('#parametres') as HTMLElement;
  if (value === 'success') params.dataset.lastSync = 'success';
  else params.dataset.lastSync = 'failure';
});

(document.querySelector('.info-backup.failure') as HTMLButtonElement).onclick = startBackup;
(document.querySelector('.info-backup.success') as HTMLButtonElement).onclick = startBackup;

// Prépare le bouton de recherche de mise à jour
let longClic: number | undefined;
let needCheck = 1;
const majButton = document.querySelector('.bouton-recherche-maj')!;

majButton.addEventListener('mousedown', (event: Event) => {
  if ((event as MouseEvent).button != 0) return;
  event.preventDefault();
  clearTimeout(longClic);
  longClic = setTimeout(() => { needCheck = 0; manualUpdate(); }, 3000);

  majButton.addEventListener('mouseup', () => { clearTimeout(longClic); if (needCheck) checkUpdate(true); });
  majButton.addEventListener('mouseout', () => clearTimeout(longClic));
});

majButton.addEventListener('touchstart', (event: Event) => {
  event.preventDefault();
  clearTimeout(longClic);
  longClic = setTimeout(() => { needCheck = 0; manualUpdate(); }, 3000);

  majButton.addEventListener('touchend', () => { clearTimeout(longClic); if (needCheck) checkUpdate(true); });
  majButton.addEventListener('touchcancel', () => clearTimeout(longClic));
});

// Prépare le bouton d'export des données
document.querySelector('.bouton-export')!.addEventListener('click', export2json);

// Prépare le bouton d'import des données
const importInput = document.getElementById('pick-import-file') as HTMLInputElement;
importInput.addEventListener('change', async event => {
  await json2import(importInput.files?.[0]);
});

// Prépare le bouton de suppression des données locales
const boutonSupprimer = document.querySelector('.bouton-supprimer-local') as HTMLButtonElement;
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
(document.querySelector('.easter-egg') as HTMLElement).onclick = playEasterEgg;

// Initialise les filtres
initFiltres();

// Initialise le sprite-viewer
initSpriteViewer();



///////////////////////////////////////
// COMMUNICATION AVEC LE SERVICE WORKER
navigator.serviceWorker.addEventListener('message', async event => {
  // --- Réponse à HUNT-ADD-id, HUNT-EDIT-id ou HUNT-REMOVE-id ---
  if ('successfulDBUpdate' in event.data) {
    const huntid = event.data.huntid;
    const card = document.getElementById('hunt-' + huntid)!;

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
      await dataStorage.setItem('uploaded-hunts', uploadConfirmed.filter((v: number) => v != huntid));
      card.remove();
      const keys = await huntStorage.keys();
      if (keys.length == 0) document.querySelector('#chasses-en-cours')!.classList.add('vide');
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
      await dataStorage.setItem('uploaded-hunts', uploadConfirmed.filter((v: number) => v != huntid));
      const hunt = await huntStorage.getItem(String(huntid));
      hunt.uploaded = false;
      await huntStorage.setItem(String(huntid), hunt);
    }
  }

  // --- Réponse à COMPARE-BACKUP ---
  else if ('successfulBackupComparison' in event.data) {
    if ('noresponse' in event.data) return;

    const loaders = Array.from(document.querySelectorAll('sync-progress, sync-line'));
    const params = document.querySelector('#parametres') as HTMLElement;

    if (event.data.successfulBackupComparison === true) {
      // Toutes les chasses locales plus récentes que celles de la BDD ont été ajoutées / éditées
      loaders.forEach(loader => loader.setAttribute('state', 'success'));
      params.dataset.lastSync = 'success';

      if ('obsolete' in event.data) {
        const versionBDD = await dataStorage.getItem('version-bdd');
        window.dispatchEvent(new CustomEvent('populate', { detail: {
          version: versionBDD,
          obsolete: event.data.obsolete,
          modified: event.data.modified
        } }));
      }
    }
    else {
      // Au moins une chasse n'a pas pu être ajoutée / éditée
      if (event.data.error !== true) notify(event.data.error);
      else notify('Erreur. Réessayez plus tard.');
      loaders.forEach(loader => loader.setAttribute('state', 'failure'));
      params.dataset.lastSync = 'failure';
    }
  }
});



//////////////////////////////////////
// ÉCOUTE DE L'EVENT CUSTOM 'POPULATE'
window.addEventListener('populate', async (_event: Event) => {
  const event = _event as CustomEvent;
  const isObsolete = ('obsolete' in event.detail && event.detail.obsolete.length > 0);
  // Si le spritesheet devra être régénéré, on place cette tentative en file d'attente
  if (isObsolete) {
    populateAttemptsVersions.push(event.detail.version);
    populateAttemptsObsolete.push(...event.detail.obsolete);
  }

  // On liste les Pokémon modifiés
  populateAttemptsModified.push(...event.detail.modified);

  // On peuple l'application avec les nouvelles données
  notify('Mise à jour des données...', '', 'loading', () => {}, 999999999);
  await appPopulate(false, event.detail.obsolete, event.detail.modified, event.detail.version);
  await appDisplay(false);
  unNotify();

  // Si le spritesheet doit être régénéré
  if (isObsolete) {
    // Si une tentative plus récente est déjà en file d'attente, on ne fait rien
    if (Math.max(...populateAttemptsVersions) > event.detail.version) return;

    // Si une version plus récente du spritesheet est déjà utilisée, on ne fait rien
    /*const previousSpriteVersion = document.documentElement.style.getPropertyValue('--link-sprites')
                                  .match(Params.spriteRegex)?.[1];
    if (previousSpriteVersion >= event.detail.version) return;*/

    // On génère le nouveau spritesheet et on le place dans le cache
    /*const version = await updateSprite(event.detail.version);
    if (isNaN(version)) { console.log('Problème de version du sprite ?'); return; }
  
    // On pré-charge le nouveau spritesheet et ensuite on l'utilise dans la section 'mes chromatiques'
    await loadAllImages([`./sprites--${version}.php`]);
    document.documentElement.style.setProperty('--link-sprites', `url('/remidex/sprites--${version}.php')`);
    
    // On met à jour l'ordre des sprites
    Array.from(document.querySelectorAll('[data-futur-ordre-sprite]')).forEach(card => {
      const ordre = card.dataset.futurOrdreSprite;
      card.setAttribute('ordre-sprite', ordre);
      card.removeAttribute('data-futur-ordre-sprite');
    });*/
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