import { pokemonCard } from './components/pokemon-card/pokemonCard.js';
import { dataStorage, shinyStorage } from './localforage.js';
import { Shiny } from './Pokemon.js';



const menuFiltres = document.querySelector('.menu-filtres')!;
const obfuscator = document.querySelector('.obfuscator')!;



type ListeFiltres = Map<string, string[]>;
const allFiltres: ListeFiltres = new Map([
  ['do', [ 'moi', 'autre' ]],
  ['legit', [ 'oui', 'maybe', 'hack', 'clone' ]],
  ['jeu', [ '*' ]],
  ['espece', [ '*' ]],
  ['surnom', [ '*' ]]
]);
const defautFiltres: ListeFiltres = new Map([
  ['do', [ 'moi' ]],
  ['legit', [ 'oui' ]],
  ['jeu', [ '*' ]],
  ['espece', [ '*' ]],
  ['surnom', [ '*' ]]
]);
const emptyFiltres: ListeFiltres = new Map([
  ['do', []],
  ['legit', []],
  ['jeu', []],
  ['espece', []],
  ['surnom', []]
]);

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
      /*filtres.set('legit', 'clone');
      break;*/
    case 2:
      /*filtres.set('legit', 'hack');
      break;*/
    case 1:
      /*filtres.set('legit', 'maybe');
      break;*/
      filtres.set('legit', 'non');
    default:
      filtres.set('legit', 'oui');
  }

  // Taux
  if (conditionMien) {
    const shinyRate = shiny.shinyRate != null ? shiny.shinyRate : 0;

    if (shiny.charm === false && [8192, 4096].includes(shinyRate))
      filtres.set('taux', 'full');
    else if (shiny.charm === true && [2731, 1365].includes(shinyRate))
      filtres.set('taux', 'charm');
    else
      filtres.set('taux', 'boosted');
  } else filtres.set('taux', 'inconnu');

  // Jeu
  const jeu = shiny.jeu.replace(/[ \']/g, '');
  filtres.set('jeu', jeu);

  // Espèce
  filtres.set('espece', String(shiny.dexid));

  // Surnom
  filtres.set('surnom', shiny.surnom);

  return filtres;
}


////////////////////////////////////////////////////////
// Vérifie si un Pokémon correspond aux filtres demandés
function filterPokemon(filtres: ListeFiltres, shiny: Shiny): boolean {
  const filtresPokemon = getShinyFiltres(shiny);
  for (const [key, value] of filtresPokemon) {
    if (!(filtres.get(key)?.includes(value))) return false;
  }
  return true;
}


///////////////////////////////////////////////////////////
// Vérifie quels Pokémon correspondent aux filtres demandés
async function filterAllPokemon(filtres: ListeFiltres): Promise<Shiny[]> {
  const corresponding: Shiny[] = [];
  const keys = await shinyStorage.keys();
  for (const key of keys) {
    const shiny = new Shiny(await shinyStorage.getItem(key));
    if (filterPokemon(filtres, shiny)) corresponding.push(shiny);
  }
  return corresponding;
}


/////////////////////////////////////////////////////////
// Filtre les cartes des Pokémon et les icônes du Pokédex
export async function filterCards(_filtres?: ListeFiltres, ids: string[] = []): Promise<number> {
  const filtres = _filtres ?? await dataStorage.getItem('filtres') ?? defautFiltres;

  const correspondingids = (await filterAllPokemon(filtres)).map(shiny => String(shiny.huntid));
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

  // Compte le nombre de Pokémon encore affichés
  const compteur = correspondingids.length;
  document.querySelector('.compteur')!.innerHTML = String(compteur);
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
export async function orderCards(_ordre?: string, _reversed?: boolean, ids: number[] = []): Promise<void> {
  const ordre = _ordre ?? await dataStorage.getItem('ordre') ?? defautOrdre;
  const reversed = _reversed ?? await dataStorage.getItem('ordre-reverse') ?? false;
  
  const allids = ids.length > 0 ? ids : (await shinyStorage.keys()).map(n => Number(n));
  const allShiny = await Promise.all(allids.map(id => shinyStorage.getItem(String(id))));

  let orderedShiny = allShiny.sort((s1, s2) => {
    switch (ordre) {
      case 'jeu': {
        return s2.jeu - s1.jeu || s2.timeCapture - s1.timeCapture || s2.huntid - s1.huntid;
      }

      case 'taux': {
        return (s2.shinyRate || 0) - (s1.shinyRate || 0) || s2.timeCapture - s1.timeCapture || s2.huntid - s1.huntid;
      }

      case 'dex': {
        return s2.dexid - s1.dexid || s2.timeCapture - s1.timeCapture || s2.huntid - s1.huntid;
      }

      case 'date': {
        return s2.timeCapture - s1.timeCapture || s2.huntid - s1.huntid;
      }

      default: return s2.huntid - s1.huntid;
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
  
  orderedShiny.forEach((card, ordre) => (card as HTMLElement).style.setProperty('--order', String(ordre)));
  await dataStorage.setItem('ordre', ordre);
  currentOrdre = ordre;
  return;
  //console.log('Cartes ordonnées :', ordre, reverse);
}



//////////////////
// Inverse l'ordre
export async function reverseOrder() {
  const currentReversed = Boolean(await dataStorage.getItem('ordre-reverse'));
  return orderCards(currentOrdre, !currentReversed);
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
export async function initFiltres() {
  // Surveille les options d'ordre
  const reversed = document.body.dataset.reversed === 'true';
  for (const label of Array.from(document.querySelectorAll('label.ordre'))) {
    label.addEventListener('click', async () => {
      await orderCards(label.getAttribute('for')!.replace('ordre-', ''), reversed);
    });
  }

  // Active le bouton d'inversion de l'ordre
  document.querySelector('.reverse-order')!.addEventListener('click', async () => {
    await reverseOrder();
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
  for (const radio of Array.from(document.querySelectorAll('input.filtre'))) {
    radio.addEventListener('change', async () => {
      await filterCards(filtresFromInput());
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