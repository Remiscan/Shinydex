import { pokemonCard } from './components/pokemon-card/pokemonCard.js';
import { dataStorage, pokemonData, shinyStorage } from './localforage.js';
import { Pokemon, Shiny } from './Pokemon.js';



const menuFiltres = document.querySelector('.menu-filtres')!;
const obfuscator = document.querySelector('.obfuscator')!;



export type ListeFiltres = Map<string, string[]>;
const allFiltres: ListeFiltres = new Map([
  ['do', [ 'moi', 'autre' ]],
  ['legit', [ 'oui', 'maybe', 'hack', 'clone' ]],
  ['recherche', [ '*' ]]
]);
const emptyFiltres: ListeFiltres = new Map([
  ['do', []],
  ['legit', []],
  ['jeu', ['*']],
  ['espece', ['*']],
  ['surnom', ['*']]
]);
const defautFiltres = new Map(allFiltres);

export { allFiltres };

/*export function stringifyFiltres(filtres: ListeFiltres): string {
  return JSON.stringify(Array.from(filtres.entries()));
}

export function parseFiltres(string: string): ListeFiltres {
  return new Map(JSON.parse(string));
}*/

type FiltresPokemon = Map<string, string>;
const emptyFiltresCarte: FiltresPokemon = new Map([
  ['do', ''],
  ['legit', ''],
  ['jeu', ''],
  ['espece', ''],
  ['surnom', '']
]);



///////////////////////////////////////////////////////////
// Récupère la liste des filtres correspondant à un Pokémon
function getShinyFiltres(shiny: Shiny): FiltresPokemon {
  const filtres = new Map(emptyFiltresCarte);

  // DO
  const conditionMien = shiny.mine;
  if (conditionMien) filtres.set('do', 'moi');
  else               filtres.set('do', 'autre');

  // Legit
  switch (shiny.hacked) {
    case 3:
    case 2:
    case 1:
      filtres.set('legit', 'non');
    default:
      filtres.set('legit', 'oui');
  }

  // Jeu
  filtres.set('jeu', shiny.jeu);

  // Espèce
  filtres.set('espece', String(shiny.dexid));

  // Surnom
  filtres.set('surnom', shiny.surnom);

  return filtres;
}


////////////////////////////////////////////////////////
// Vérifie si un Pokémon correspond aux filtres demandés
async function filterPokemon(filtres: ListeFiltres, shiny: Shiny): Promise<boolean> {
  const filtresPokemon = getShinyFiltres(shiny);
  for (const [key, value] of filtresPokemon) {
    if (!(filtres.get(key)?.includes(value))) return false;
  }

  const recherche = filtres.get('recherche') || [];
  if (recherche.length > 0) {
    let contient: boolean = false;
    let exact: boolean = false;
    search: for (const mot of recherche) {
      for (const champ of [await shiny.getNamefr(), shiny.surnom, shiny.methode, shiny.jeu]) {
        if (champ.includes(mot)) contient = true;
        break search;
      }
      for (const champ of [String(shiny.dexid)]) {
        if (champ === mot) exact = true;
        break search;
      }
    }
    return contient || exact;
  }

  return true;
}


///////////////////////////////////////////////////////////
// Vérifie quels Pokémon correspondent aux filtres demandés
async function filterAllPokemon(section: string, filtres: ListeFiltres): Promise<Shiny[]> {
  const corresponding: Shiny[] = [];

  let pkmnList: Shiny[] = [];
  switch (section) {
    case 'mes-chromatiques':
      pkmnList = await Promise.all((await shinyStorage.keys()).map(async key => await shinyStorage.getItem(key)));
      break;
    case 'chromatiques-ami':
      // later
      break;
  }

  for (const pkmn of pkmnList) {
    const shiny = new Shiny(pkmn);
    if (await filterPokemon(filtres, shiny)) corresponding.push(shiny);
  }
  return corresponding;
}


/////////////////////////////////////////////////////////
// Filtre les cartes des Pokémon et les icônes du Pokédex
export async function filterCards(section: string, _filtres?: ListeFiltres, ids: string[] = []): Promise<number> {
  const filtres = _filtres ?? await dataStorage.getItem('filtres') ?? defautFiltres;

  const correspondingids = (await filterAllPokemon(section, filtres)).map(shiny => shiny.huntid);
  const keptCards: pokemonCard[] = [];
  const hiddenCards: pokemonCard[] = [];
  
  // Filtre les cartes des Pokémon
  const allids = ids.length > 0 ? ids : (await shinyStorage.keys());
  for (const id of allids) {
    const card = document.querySelector(`pokemon-card[huntid="${id}"]`) as pokemonCard;
    if (card == null) {
      console.error(`Aucune carte trouvée pour le shiny #${id}`);
      continue;
    }
    if (correspondingids.includes(id)) {
      card.classList.remove('filtered');
      keptCards.push(card);
    } else {
      card.classList.add('filtered');
      hiddenCards.push(card);
    }
  }

  // Filtre les icônes du Pokédex
  const dexIcons = Array.from(document.querySelectorAll('#pokedex .pkspr')) as HTMLElement[];
  for (const icon of dexIcons) {
    const id = icon.dataset.dexid || '';
    if (correspondingids.includes(id)) icon.classList.add('got');
    else                               icon.classList.remove('got');
  }

  // Compte le nombre d'espèces du Pokédex correspondant aux filtres
  const dexids = (await Promise.all(correspondingids.map(huntid => shinyStorage.getItem(huntid)))).map(shiny => shiny.dexid);
  const compteurDex = dexids.length;
  document.querySelector('#pokedex .compteur > .caught')!.innerHTML = String(compteurDex);
  document.querySelector('#pokedex .compteur > .total')!.innerHTML = String((await pokemonData.keys()).length - 1);

  // Compte le nombre de Pokémon encore affichés
  const compteur = correspondingids.length;
  document.querySelector('#mes-chromatiques .compteur')!.innerHTML = String(compteur);
  (document.querySelector('#mes-chromatiques .section-contenu') as HTMLElement).style.setProperty('--compteur', String(compteur));
  if (compteur == 0) document.querySelector('#mes-chromatiques')!.classList.add('vide');
  else               document.querySelector('#mes-chromatiques')!.classList.remove('vide');

  await dataStorage.setItem('filtres', filtres);
  return compteur;
}



const defautOrdre = 'date';
let currentOrdre = defautOrdre;



////////////////////////////////////////////////////////////////////
// Ordonner les cartes de Pokémon selon une certaine caractéristique
export async function orderCards(section: string, _ordre?: string, _reversed?: boolean, ids: string[] = []): Promise<void> {
  const ordre = _ordre ?? await dataStorage.getItem('ordre') ?? defautOrdre;
  const reversed = _reversed ?? await dataStorage.getItem('ordre-reverse') ?? false;
  
  let allShiny: Shiny[] = [];
  switch (section) {
    case 'mes-chromatiques':
      allShiny = await Promise.all((ids.length > 0 ? ids : (await shinyStorage.keys())).map(id => shinyStorage.getItem(id)));
      break;
  }

  const noms = await Pokemon.namesfr();

  let orderedShiny = allShiny.sort((s1, s2) => {
    switch (ordre) {
      case 'jeu': {
        return s2.jeu.localeCompare(s1.jeu, 'fr') || s2.timeCapture - s1.timeCapture || Number(s2.huntid) - Number(s1.huntid);
      }

      case 'surnom': {
        const nom1 = s1.surnom || noms[s1.dexid];
        const nom2 = s2.surnom || noms[s2.dexid];
        return nom2.localeCompare(nom1, 'fr') || s2.timeCapture - s1.timeCapture || Number(s2.huntid) - Number(s1.huntid);
      }

      case 'espece': {
        const nom1 = noms[s1.dexid];
        const nom2 = noms[s2.dexid];
        return nom2.localeCompare(nom1, 'fr') || s2.timeCapture - s1.timeCapture || Number(s2.huntid) - Number(s1.huntid);;
      }

      case 'taux': {
        return (s2.shinyRate || 0) - (s1.shinyRate || 0) || s2.timeCapture - s1.timeCapture || Number(s2.huntid) - Number(s1.huntid);
      }

      case 'dex': {
        return s2.dexid - s1.dexid || s2.timeCapture - s1.timeCapture || Number(s2.huntid) - Number(s1.huntid);
      }

      case 'date': {
        return s2.timeCapture - s1.timeCapture || Number(s2.huntid) - Number(s1.huntid);
      }

      default: return Number(s2.huntid) - Number(s1.huntid);
    }
  });

  if (reversed) {
    orderedShiny = orderedShiny.reverse();
    // inverser ordre avec aria-reversed (vérifier)
    document.body.dataset.reversed = 'true';
    await dataStorage.setItem('ordre-reverse', true);
  } else {
    document.body.removeAttribute('data-reversed');
    await dataStorage.setItem('ordre-reverse', false);
  }
  
  orderedShiny.map(shiny => document.getElementById(`#${section} pokemon-card#${shiny.huntid}`))
              .forEach((card, ordre) => (card as HTMLElement).style.setProperty('--order', String(ordre)));
  await dataStorage.setItem('ordre', ordre);
  currentOrdre = ordre;
  return;
  //console.log('Cartes ordonnées :', ordre, reverse);
}



//////////////////
// Inverse l'ordre
export async function reverseOrder(section: string) {
  const currentReversed = Boolean(await dataStorage.getItem('ordre-reverse'));
  return orderCards(section, currentOrdre, !currentReversed);
}


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
function filtresFromInput(): ListeFiltres {
  const filtres: ListeFiltres = new Map(emptyFiltres);
  const checkboxes = Array.from(document.querySelectorAll('input.filtre:checked')) as HTMLInputElement[];
  for (const box of checkboxes) {
    const [key, value] = box.value.split(':');
    filtres.get(key)?.push(value);
  }
  return filtres;
}


/////////////////////////
// Initialise les filtres
export async function initFiltres(section: string) {
  // Surveille les options d'ordre
  const reversed = document.body.dataset.reversed === 'true';
  for (const label of Array.from(document.querySelectorAll('label.ordre'))) {
    label.addEventListener('click', async () => {
      await orderCards(section, label.getAttribute('for')!.replace('ordre-', ''), reversed);
    });
  }

  // Active le bouton d'inversion de l'ordre
  document.querySelector('.reverse-order')!.addEventListener('click', async () => {
    await reverseOrder(section);
  });

  // Coche l'option d'ordre sauvegardée
  {
    const savedOrdre = (await dataStorage.getItem('ordre')) || defautOrdre;
    const input = document.querySelector(`input[name="ordre"][value="${savedOrdre}"]`) as HTMLInputElement;
    if (!!input) input.checked = true;
  }

  // Coche les options de filtre sauvegardées
  {
    const savedFiltres = (await dataStorage.getItem('filtres')) || defautFiltres;
    const allInputs = Array.from(document.querySelectorAll('input.filtre')) as HTMLInputElement[];
    for (const input of allInputs) {
      const [key, value] = input.value.split(':');
      if (savedFiltres.get(key)?.includes(value)) input.checked = true;
      else                                        input.checked = false;
    }
  }

  // Surveille les options de filtres
  /*for (const radio of Array.from(document.querySelectorAll('input.filtre'))) {
    radio.addEventListener('change', async () => {
      await filterCards(filtresFromInput());
    });
  }*/
}