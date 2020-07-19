import { Shiny } from './mod_Pokemon.js';
import { Params } from './mod_Params.js';

let currentCard;
let charmlessMethods;

/////////////////////////////////////////////////////////
// Afficher la description d'une carte en cliquant dessus
export function toggleNotes(idCard)
{
  // On ferme la carte déjà ouverte
  if (currentCard != null)
    document.getElementById(currentCard).classList.remove('on');

  // Si la carte demandée n'est pas celle qu'on vient de fermer, on l'ouvre
  if (idCard != currentCard)
  {
    document.getElementById(idCard).classList.add('on');
    currentCard = idCard;
  }
  else
    currentCard = null;
}


//////////////////////////////
// Créer la carte d'un Pokémon
export async function createCard(pokemon, ordre)
{
  let shiny;
  try {
    shiny = await Shiny.build(pokemon);
  } catch (e) {
    console.error('Failed creating Shiny object', e);
    return;
  }

  const template = document.getElementById('template-pokemon-card');

  const imagePosition = ordre * Params.spriteSize;
  const conditionMien = shiny.mine;

  let filtres = [];
  if (conditionMien)
    filtres.push('do:moi');
  else
    filtres.push('do:autre');
  
  const card = template.content.cloneNode(true).querySelector('.pokemon-card');
  card.id = 'pokemon-card-' + shiny.huntid;
  card.classList.add('pkmn-card-' + shiny.dexid);
  card.dataset.dexid = shiny.dexid;

  card.style.setProperty('--ordre-sprite', ordre);
  //card.style.setProperty('--image-position', '-' + imagePosition + 'px');
  card.querySelector('.pokemon-notes__texte').innerHTML = shiny.description;

  if (!shiny.ball)
    card.querySelector('.pokemon-ball').remove();
  else
    card.querySelector('.pokemon-ball').classList.add('pokeball-' + shiny.ball);

  let nom1, nom2 = '';
  if (shiny.surnom != '' && shiny.surnom.toLowerCase() != shiny.espece)
  {
    nom1 = shiny.surnom;
    nom2 = shiny.espece;
  }
  else
    nom1 = shiny.espece;

  card.querySelector('.pokemon-surnom').innerHTML = shiny.surnom;
  card.querySelector('.pokemon-espece').innerHTML = shiny.espece;
  if (shiny.surnom == '' || shiny.surnom.toLowerCase() == shiny.espece)
    card.querySelector('.pokemon-infos__nom').classList.add('no-surnom');

  card.querySelector('.pokemon-ball').classList.add('item', 'ball-' + shiny.ball);

  const shinyRateBox = card.querySelector('.shiny-rate');
  const shinyRate = shiny.shinyRate;
  if (charmlessMethods == null) charmlessMethods = Shiny.methodes('charmless');

  if (shiny.random == false)
    card.querySelector('.icones.lucky').remove();
  if (shiny.monjeu == false)
    card.querySelector('.icones.mine').remove();
  if (shiny.checkmark != 1)
    card.querySelector('.icones.kalosborn').remove();
  if (shiny.checkmark != 2)
    card.querySelector('.icones.alolaborn').remove();
  if (shiny.checkmark != 3)
    card.querySelector('.icones.vcborn').remove();
  if (shiny.checkmark != 4)
    card.querySelector('.icones.letsgoborn').remove();
  if (shiny.checkmark != 5)
    card.querySelector('.icones.goborn').remove();
  if (shiny.checkmark != 6)
    card.querySelector('.icones.galarborn').remove();
  if (shiny.hacked != 1)
    card.querySelector('.icones.ptethack').remove();
  if (shiny.hacked != 2)
    card.querySelector('.icones.hack').remove();
  if (shiny.hacked != 3)
    card.querySelector('.icones.clone').remove();
  if (shiny.charm == true && !charmlessMethods.includes(shiny.methode))
    shinyRateBox.classList.add('with-charm');

  switch(parseInt(shiny.hacked))
  {
    case 3:
      filtres.push('legit:clone');
      break;
    case 2:
      filtres.push('legit:hack');
      break;
    case 1:
      filtres.push('legit:maybe');
      break;
    default:
      filtres.push('legit:oui');
  }

  if (conditionMien)
  {
    card.querySelector('.shiny-rate-text.denominator').innerHTML = shinyRate;
    card.dataset.taux = (shinyRate != '???') ? shinyRate : 0;
    if (shiny.charm == false && [8192, 4096].includes(shinyRate)) {
      shinyRateBox.classList.add('full-odds');
      filtres.push('taux:full');
    } else if (shiny.charm == true && [2731, 1365].includes(shinyRate)) {
      shinyRateBox.classList.add('charm-odds');
      filtres.push('taux:charm');
    } else if (shinyRate == 1 || shinyRate == '???') {
      shinyRateBox.classList.add('one-odds');
      filtres.push('taux:boosted');
    } else {
      filtres.push('taux:boosted');
    }
  }
  else
  {
    shinyRateBox.remove();
    card.dataset.taux = 0;
    filtres.push('taux:inconnu');
  }

  const shinyRateCoeff = 1 - Math.min(1, Math.max(0, shinyRate / 1360));
  shinyRateBox.style.setProperty('--coeff', shinyRateCoeff);

  if (!shiny.description.includes('Gigamax'))
    card.querySelector('.gigamax').remove();

  const jeu = shiny.jeu.replace(/[ \']/g, '');
  card.querySelector('.icones.jeu').classList.add(jeu);
  filtres.push('jeu:' + jeu);
  card.dataset.jeu = shiny.jeu;

  card.querySelector('.capture-methode').innerHTML = shiny.methode;
  if (shiny.methode == 'Masuda' && shiny.compteur > 0)
    card.querySelector('.methode-compteur').innerHTML += shiny.compteur;
  else
    card.querySelector('.methode-compteur').remove();
  filtres.push('methode:' + shiny.methode);

  if (shiny.date != '1000-01-01')
    card.querySelector('.capture-date').innerHTML = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'}).format(new Date(shiny.date));
  else
    card.querySelector('.pokemon-infos__capture').classList.add('no-date');
  card.dataset.date = shiny.date;

  card.dataset.filtres = filtres;

  return card;
}