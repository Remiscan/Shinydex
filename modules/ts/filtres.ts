import { Pokemon } from './Pokemon.js';
import { dataStorage } from './localforage.js';
import { pokemonCard } from './pokemonCard.component.js';



const menuFiltres = document.querySelector('.menu-filtres');
const obfuscator = document.querySelector('.obfuscator');
let cardsOrdered: pokemonCard[] = [];

//////////////////////////////////////////////////////////
// Filter les cartes de Pokémon selon une liste de filtres
//
// - si filtres = undefined, la fonction filtre cards selon defautFiltres
// - si filtres = null, la fonction ne filtre pas les cartes mais calcule
//   le nombre de cartes affichées à partir des cartes déjà filtrées
//
// - si cards = null, la fonction récupère toutes les cartes présentes dans l'appli
// - si cards = [...](length == 1), la fonction filtre cette carte mais ne calcule
//   pas le nombre de cartes affichées (puisqu'elle ne connaît pas la liste complète)
// - si cards = [...](length > 1), la fonction filtre ces cartes et calcule le nombre
//   d'entre elles qui seront affichées
//
const defautFiltres = ['do:moi', 'legit:oui'];
let currentFiltres = defautFiltres;

export async function filterCards(filtres: string[] = defautFiltres, cards: pokemonCard[] = []): Promise<pokemonCard[]> {
  const allCards: pokemonCard[] = cards.length > 0 ? cards : Array.from(document.querySelectorAll('#mes-chromatiques pokemon-card'));
  const filteredCards: pokemonCard[] = (filtres.length > 0) ? [] : allCards.filter(card => card.classList.contains('filtered'));
  const unfilteredCards: pokemonCard[] = (filtres.length > 0) ? [] : allCards.filter(card => !card.classList.contains('filtered'));

  filtrage: {
    if (filtres.length === 0) break filtrage;
    for (const card of allCards) {
      card.classList.remove('filtered');

      // On récupère les filtres de chaque carte
      const cardFiltres = JSON.parse(card.getAttribute('filtres'));
      
      for (const filtre of filtres) {
        // Un filtre peut proposer plusieurs choix (a ou b : a|b), on récupère ces choix
        const alterFiltres = filtre.split('|');
        let alterCorrespondances = 0; // on compte combien de choix sont vérifiés

        for (const af of alterFiltres) {
          if (cardFiltres.includes(af)) alterCorrespondances++;
        }

        // Si aucun choix n'est vérifié, on élimine la carte
        if (alterCorrespondances === 0) {
          filteredCards.push(card);
          break;
        } else {
          unfilteredCards.push(card);
        }
      }
    }
    //console.log('Cartes filtrées :', filtres);
  }

  const compteur = allCards.length - filteredCards.length;
  document.querySelector('.compteur').innerHTML = String(compteur);
  (document.querySelector('#mes-chromatiques .section-contenu') as HTMLElement).style.setProperty('--compteur', String(compteur));
  if (compteur == 0) document.querySelector('#mes-chromatiques').classList.add('vide');
  else               document.querySelector('#mes-chromatiques').classList.remove('vide');

  if (filtres != null) filteredCards.forEach(card => card.classList.add('filtered'));
  if (cards == null) filterDex();
  if (allCards.length > 1) await dataStorage.setItem('filtres', filtres);
  currentFiltres = filtres;
  
  return unfilteredCards;
}



////////////////////////////////////////////////////////////////////
// Ordonner les cartes de Pokémon selon une certaine caractéristique
const defautOrdre = 'date';
let currentOrdre = defautOrdre;

export async function orderCards(ordre: string = defautOrdre, reversed: boolean = false, cards: pokemonCard[] = []): Promise<pokemonCard[]> {
  const allCards = cards.length > 0 ? cards : Array.from(document.querySelectorAll('#mes-chromatiques pokemon-card'));

  let sortedCards = allCards.sort((carte1, carte2) => {
    const date1 = Number(new Date(carte1.getAttribute('date') || '1000-01-01'));
    const date2 = Number(new Date(carte2.getAttribute('date') || '1000-01-01'));

    const id1 = parseInt(carte1.getAttribute('huntid'));
    const id2 = parseInt(carte2.getAttribute('huntid'));

    switch (ordre) {
      case 'jeu': {
        const jeu1 = Pokemon.jeux.findIndex(jeu => jeu.nom == carte1.getAttribute('jeu'));
        const jeu2 = Pokemon.jeux.findIndex(jeu => jeu.nom == carte2.getAttribute('jeu'));

        return jeu2 - jeu1 || date2 - date1 || id2 - id1;
      }

      case 'taux': {
        const taux1 = parseInt(carte1.getAttribute('shiny-rate'));
        const taux2 = parseInt(carte2.getAttribute('shiny-rate'));

        return taux2 - taux1 || date2 - date1 || id2 - id1;
      }

      case 'dex': {
        const dexid1 = parseInt(carte1.getAttribute('dexid'));
        const dexid2 = parseInt(carte2.getAttribute('dexid'));

        return dexid1 - dexid2 || date2 - date1 || id2 - id1;
      }

      case 'date': {
        return date2 - date1 || id2 - id1;
      }
    }
  });

  if (reversed) {
    sortedCards = sortedCards.reverse();
    document.body.dataset.reversed = 'true';
    await dataStorage.setItem('ordre-reverse', true);
  } else {
    document.body.removeAttribute('data-reversed');
    await dataStorage.setItem('ordre-reverse', false);
  }
  
  sortedCards.forEach((card, ordre) => (card as HTMLElement).style.setProperty('--order', String(ordre)));
  await dataStorage.setItem('ordre', ordre);
  currentOrdre = ordre;
  return sortedCards as pokemonCard[];
  //console.log('Cartes ordonnées :', ordre, reverse);
}



//////////////////
// Inverse l'ordre
export async function reverseOrder() {
  let currentReversed = Boolean(await dataStorage.getItem('ordre-reverse'));
  return orderCards(currentOrdre, !currentReversed);
}



///////////////////////////////
// Filtre les icônes du Pokédex
export function filterDex(cards: pokemonCard[] = []) {
  const displayedCards = cards || Array.from(document.querySelectorAll('#mes-chromatiques pokemon-card:not(.filtered)'));
  const dexids = new Set();

  displayedCards.forEach(card => {
    dexids.add(parseInt(card.getAttribute('dexid')));
  });

  const dexIcons = Array.from(document.querySelectorAll('#pokedex .pkspr')) as HTMLElement[];

  dexIcons.forEach(icon => {
    if (dexids.has(parseInt(icon.dataset.dexid)))
      icon.classList.add('got');
    else
      icon.classList.remove('got');
  });
}


////////////////////////////////////////////////////////////////////////////
// Affiche seulement un certain nombre de cartes à l'ouverture d'une section
/*export function deferCards(section?: string) {
  const sectionActuelle = section || document.body.dataset.sectionActuelle;
  if (sectionActuelle == 'mes-chromatiques') {
    document.getElementById('mes-chromatiques').classList.remove('defered');
    const scroll = (document.body.dataset.sectionActuelle == sectionActuelle);
    if (scroll) document.querySelector('main').scroll(0, 0);
  }
  let cardList = [];

  switch (sectionActuelle) {
    case 'mes-chromatiques':
      cardsOrdered = Array.from(document.querySelectorAll('#mes-chromatiques pokemon-card:not(.filtered)'))
                          .sort((a, b) => parseInt((a as HTMLElement).style.getPropertyValue('--order')) - parseInt((b as HTMLElement).style.getPropertyValue('--order')));
      cardList = cardsOrdered;
      break;
    case 'pokedex':
      cardList = Array.from(document.querySelectorAll('.pokedex-gen'));
      break;
    case 'chasses-en-cours':
      cardList = Array.from(document.querySelectorAll('.hunt-card')).reverse();
      break;
  }

  let nombreADefer = Params.nombreADefer[sectionActuelle]();
  //if (CSS.supports("(content-visibility: auto)")) nombreADefer = 1000;

  if (cardList.length <= nombreADefer)
    return document.getElementById(sectionActuelle).classList.add('defered');

  cardList.forEach((card, i) => {
    card.classList.remove('defered');
    if (i < nombreADefer) card.classList.remove('defer');
    else                                            card.classList.add('defer');
  });
}*/


/////////////////////////////////////////////////////////////////
// Charge un certain nombre de cartes au défilement d'une section
/*let defering = false;
export function deferMonitor(entries)
{
  if (defering) return;
  defering = true;
  const sectionActuelle = document.body.dataset.sectionActuelle;

  entries.forEach(async entry => {
    if (entry.target.parentElement.parentElement.id != sectionActuelle) return;
    if (!entry.isIntersecting) return;

    let cardsToDefer = [];
    let stopAfter = Params.nombreADefer[sectionActuelle]();
    switch (sectionActuelle) {
      case 'mes-chromatiques':
        cardsToDefer = Array.from(document.querySelectorAll(`#${sectionActuelle} .defer:not(.filtered)`))
                            .sort((a, b) => parseInt(a.style.getPropertyValue('--order')) - parseInt(b.style.getPropertyValue('--order')));
        break;
      case 'pokedex':
        cardsToDefer = Array.from(document.querySelectorAll(`#${sectionActuelle} .defer`));
        //stopAfter = 4 * Params.nombreADefer[sectionActuelle]();
        break;
      case 'chasses-en-cours':
        cardsToDefer = Array.from(document.querySelectorAll(`#${sectionActuelle} .defer`)).reverse();
        break;
      default:
        cardsToDefer = Array.from(document.querySelectorAll(`#${sectionActuelle} .defer`));
    }
    
    if (cardsToDefer.length <= stopAfter)
      document.getElementById(sectionActuelle).classList.add('defered');

    for (const [i, card] of cardsToDefer.entries()) {
      if (i >= stopAfter) break;
      card.classList.replace('defer', 'defered');
    }
  });

  setTimeout(() => { defering = false; }, 50);
}*/


////////////////////////////
// Ouvre le menu des filtres
export function openFiltres(historique = true) {
  if (historique) history.pushState({section: 'menu-filtres'}, '');

  obfuscator.classList.remove('off');
  menuFiltres.classList.add('on');
}


////////////////////////////
// Ferme le menu des filtres
export function closeFiltres() {
  menuFiltres.classList.remove('on');
  obfuscator.classList.add('off');
}


//////////////////////////////////////////////////////
// Récupère les filtres entrés dans le menu de filtres
function buildFiltres(): string[] {
  const filtres = [];

  // do = Dresseur d'origine
  // legit = hacké ou non
  // taux = shiny rate
  const categories = ['do', 'legit'];
  for (const cat of categories) {
    const checkboxes = Array.from(document.querySelectorAll('input.filtre-' + cat)) as HTMLInputElement[];
    const tempAlterFiltres =  [];
    for (const box of checkboxes) {
      if (box.checked) tempAlterFiltres.push(box.value);
    }
    filtres.push(tempAlterFiltres.join('|'));
  }

  return filtres;
}


///////////////////////////////////////
// Renvoie l'array des cartes ordonnées
export function cardsInOrder() { return cardsOrdered; }


/////////////////////////
// Initialise les filtres
export function initFiltres() {
  // Surveille les options d'ordre
  const reversed = document.body.dataset.reversed === 'true';
  for (const label of Array.from(document.querySelectorAll('label.ordre'))) {
    label.addEventListener('click', async () => {
      await orderCards(label.getAttribute('for').replace('ordre-', ''), reversed);
      //deferCards();
    });
  }

  // Active le bouton d'inversion de l'ordre
  document.querySelector('.reverse-order').addEventListener('click', async () => {
    await reverseOrder();
    //deferCards();
  });

  // Surveille les options de filtres
  for (const radio of Array.from(document.querySelectorAll('input.filtre'))) {
    radio.addEventListener('change', async () => {
      await filterCards(buildFiltres());
      //deferCards('mes-chromatiques');
    });
  }

  // Crée les checkboxes des jeux
  /*Pokemon.jeux.forEach(jeu => {
    const nomJeu = jeu.nom.replace(/[ \']/g, '');
    const template = document.getElementById('template-checkbox-jeu');
    const checkbox = template.content.cloneNode(true);
    const input = checkbox.querySelector('input');
    const label = checkbox.querySelector('label');

    input.id = 'filtre-jeu-' + nomJeu;
    input.value = "jeu:" + nomJeu;
    label.setAttribute('for', 'filtre-jeu-' + nomJeu);
    label.querySelector('span').classList.add(nomJeu);

    document.getElementById('liste-options-jeux').appendChild(checkbox);
  });*/
}