import { Pokemon } from './mod_Pokemon.js';
import { Params } from './mod_Params.js';

const menuFiltres = document.querySelector('.menu-filtres');
const obfuscator = document.querySelector('.obfuscator');
let cardsOrdered = [];

//////////////////////////////////////////////////////////
// Filter les cartes de Pokémon selon une liste de filtres
const defautFiltres = ['do:moi', 'legit:oui'];
let currentFiltres = defautFiltres;

export async function filterCards(filtres = defautFiltres)
{
  const allCards = Array.from(document.querySelectorAll('#mes-chromatiques .pokemon-card'));
  const filteredCards = [];

  allCards.forEach(card => {
    card.classList.remove('filtered');
    // On récupère les filtres de chaque carte
    const cardFiltres = card.dataset.filtres.split(',');
    for (const filtre of filtres) {
      // Un filtre peut proposer plusieurs choix (a ou b : a|b), on récupère ces choix
      const alterFiltres = filtre.split('|');
      let alterCorrespondances = 0; // on compte combien de choix sont vérifiés
      alterFiltres.forEach(af => {
        if (cardFiltres.includes(af))
          alterCorrespondances++;
      });
      // Si aucun choix n'est vérifié, on élimine la carte
      if (alterCorrespondances == 0) {
        card.classList.add('filtered');
        filteredCards.push(card);
        break;
      }
    }
  });
  //console.log('Cartes filtrées :', filtres);
  filterDex();
  await dataStorage.setItem('filtres', JSON.stringify(filtres));
  currentFiltres = filtres;

  const compteur = allCards.length - filteredCards.length;
  document.querySelector('.compteur').innerHTML = compteur;
  document.querySelector('#mes-chromatiques .section-contenu').style.setProperty('--compteur', compteur);
  if (compteur == 0) document.querySelector('#mes-chromatiques').classList.add('vide');
  else document.querySelector('#mes-chromatiques').classList.remove('vide');
  return compteur;
}



////////////////////////////////////////////////////////////////////
// Ordonner les cartes de Pokémon selon une certaine caractéristique
const defautOrdre = 'date';
let currentOrdre = defautOrdre;

export async function orderCards(ordre = defautOrdre, reversed = false)
{
  const allCards = Array.from(document.querySelectorAll('#mes-chromatiques .pokemon-card'));
  let ordrement;

  if (ordre == 'jeu')
  {
    ordrement = (carte1, carte2) => {
      const jeu1 = Pokemon.jeux.findIndex(jeu => jeu.nom == carte1.dataset.jeu);
      const jeu2 = Pokemon.jeux.findIndex(jeu => jeu.nom == carte2.dataset.jeu);
      const date1 = new Date(carte1.dataset.date || '1000-01-01');
      const date2 = new Date(carte2.dataset.date || '1000-01-01');
      const id1 = parseInt(carte1.id.replace('pokemon-card-', ''));
      const id2 = parseInt(carte2.id.replace('pokemon-card-', ''));

      return jeu2 - jeu1 || date2 - date1 || id2 - id1;
    }
  }
  else if (ordre == 'taux')
  {
    ordrement = (carte1, carte2) => {
      const taux1 = parseInt(carte1.dataset.taux);
      const taux2 = parseInt(carte2.dataset.taux);
      const date1 = new Date(carte1.dataset.date || '1000-01-01');
      const date2 = new Date(carte2.dataset.date || '1000-01-01');
      const id1 = parseInt(carte1.id.replace('pokemon-card-', ''));
      const id2 = parseInt(carte2.id.replace('pokemon-card-', ''));

      return taux2 - taux1 || date2 - date1 || id2 - id1;
    }
  }
  else if (ordre == 'dex')
  {
    ordrement = (carte1, carte2) => {
      const dexid1 = parseInt(carte1.dataset.dexid);
      const dexid2 = parseInt(carte2.dataset.dexid);
      const date1 = new Date(carte1.dataset.date || '1000-01-01');
      const date2 = new Date(carte2.dataset.date || '1000-01-01');
      const id1 = parseInt(carte1.id.replace('pokemon-card-', ''));
      const id2 = parseInt(carte2.id.replace('pokemon-card-', ''));

      return dexid1 - dexid2 || date2 - date1 || id2 - id1;
    }
  }
  else if (ordre == 'date')
  {
    ordrement = (carte1, carte2) => {
      const date1 = new Date(carte1.dataset.date || '1000-01-01');
      const date2 = new Date(carte2.dataset.date || '1000-01-01');
      const id1 = parseInt(carte1.id.replace('pokemon-card-', ''));
      const id2 = parseInt(carte2.id.replace('pokemon-card-', ''));

      return date2 - date1 || id2 - id1;
    }
  }

  let sortedCards = allCards.sort(ordrement);
  if (reversed)
    sortedCards = sortedCards.reverse();
  
  sortedCards.forEach((card, ordre) => card.style.setProperty('--order', ordre));
  await dataStorage.setItem('ordre', JSON.stringify(ordre));
  currentOrdre = ordre;
  //console.log('Cartes ordonnées :', ordre, reverse);
}



//////////////////
// Inverse l'ordre
let currentReversed = false;
export async function reverseOrder()
{
  if (currentReversed) {
    document.body.removeAttribute('data-reversed');
    currentReversed = false;
    await dataStorage.setItem('remidex/ordre-reverse', JSON.stringify(false));
  } else {
    document.body.dataset.reversed = true;
    currentReversed = true;
    await dataStorage.setItem('remidex/ordre-reverse', JSON.stringify(true));
  }
  return orderCards(currentOrdre, currentReversed);
}



///////////////////////////////
// Filtre les icônes du Pokédex
function filterDex()
{
  const displayedCards = Array.from(document.querySelectorAll('#mes-chromatiques :not(.filtered).pokemon-card'));
  const dexids = new Set();

  displayedCards.forEach(card => {
    dexids.add(parseInt(card.dataset.dexid));
  });

  const dexIcons = Array.from(document.querySelectorAll('#pokedex .pkspr'));

  dexIcons.forEach(icon => {
    if (dexids.has(parseInt(icon.dataset.dexid)))
      icon.classList.add('got');
    else
      icon.classList.remove('got');
  });
}


///////////////////////////////
// Choisit quelles cartes defer
export function deferCards()
{
  document.querySelector('main').scroll(0, 0);
  cardsOrdered = Array.from(document.querySelectorAll('#mes-chromatiques .pokemon-card:not(.filtered)'))
                      .sort((a, b) => parseInt(a.style.getPropertyValue('--order')) - parseInt(b.style.getPropertyValue('--order')));
  if (document.body.classList.contains('reverse'))
    cardsOrdered.reverse();

  cardsOrdered.forEach((card, i) => {
    card.classList.remove('defered');
    card.classList.add('defer');
    if (i <= Params.nombreADefer()) card.classList.remove('defer');
  });
}


////////////////////////////
// Ouvre le menu des filtres
export function openFiltres(historique = true)
{
  if (historique)
    history.pushState({section: 'menu-filtres'}, '');

  obfuscator.classList.remove('off');
  menuFiltres.classList.add('on');
}


////////////////////////////
// Ferme le menu des filtres
export function closeFiltres()
{
  menuFiltres.classList.remove('on');
  obfuscator.classList.add('off');
}


//////////////////////////////////////////////////////
// Récupère les filtres entrés dans le menu de filtres
function buildFiltres()
{
  const filtres = [];

  let checkboxes;
  let tempAlterFiltres;

  // do = Dresseur d'origine
  // legit = hacké ou non
  // taux = shiny rate
  const categories = ['do', 'legit'];
  categories.forEach(cat => {
    checkboxes = Array.from(document.querySelectorAll('input.filtre-' + cat));
    tempAlterFiltres = [];
    checkboxes.forEach(check => {
      if (check.checked)
        tempAlterFiltres.push(check.value);
    });
    filtres.push(tempAlterFiltres.join('|'));
  });

  return filtres;
}


///////////////////////////////////////
// Renvoie l'array des cartes ordonnées
export function cardsInOrder() { return cardsOrdered; }


////////////////////////////////
// Surveille les options d'ordre
Array.from(document.querySelectorAll('label.ordre')).forEach(label => {
  label.addEventListener('click', async () => {
    await orderCards(label.getAttribute('for').replace('ordre-', ''));
    deferCards();
  });
});

///////////////////////////////////
// Surveille les options de filtres
Array.from(document.querySelectorAll('input.filtre')).forEach(radio => {
  radio.addEventListener('change', async () => {
    await filterCards(buildFiltres());
    deferCards();
  });
});

// Active le bouton d'inversion de l'ordre
document.querySelector('.reverse-order').addEventListener('click', async () => {
  await reverseOrder();
  deferCards();
});

///////////////////////////////
// Crée les checkboxes des jeux
Pokemon.jeux.forEach(jeu => {
  const nomJeu = jeu.nom.replace(/ /g, '');
  const template = document.getElementById('template-checkbox-jeu');
  const checkbox = template.content.cloneNode(true);
  const input = checkbox.querySelector('input');
  const label = checkbox.querySelector('label');

  input.id = 'filtre-jeu-' + nomJeu;
  input.value = "jeu:" + nomJeu;
  label.setAttribute('for', 'filtre-jeu-' + nomJeu);
  label.querySelector('span').classList.add(nomJeu);

  document.getElementById('liste-options-jeux').appendChild(checkbox);
});