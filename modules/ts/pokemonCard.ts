import { Shiny } from './Pokemon.js';
import { frontendShiny } from './Pokemon.js';
import { pokemonCard } from './pokemonCard.component.js';



//////////////////////////////////////////////////////
// Crée la carte d'un Pokémon, ou si elle existe déjà,
// met à jour uniquement les données qui ont changé.
export async function updateCard(pokemon: frontendShiny, _card?: pokemonCard): Promise<pokemonCard> {
  let shiny: Shiny;
  try {
    shiny = new Shiny(pokemon);
  } catch (e) {
    console.error('Failed creating Shiny object', e);
    throw e;
  }

  const conditionMien = shiny.mine;

  let filtres = [];
  if (conditionMien)
    filtres.push('do:moi');
  else
    filtres.push('do:autre');
  
  const card = _card as pokemonCard || document.createElement('pokemon-card');
  if (_card == null) {
    card.id = `pokemon-card-${shiny.huntid}`;
    card.setAttribute('huntid', String(shiny.huntid));
  }

  card.setAttribute('dexid', String(shiny.dexid));
  card.setAttribute('espece', await shiny.getNamefr());
  card.setAttribute('notes', shiny.description);

  if (shiny.ball) card.setAttribute('ball', shiny.ball);
  else card.removeAttribute('ball');

  card.setAttribute('surnom', shiny.surnom);

  card.setAttribute('methode', shiny.methode);
  filtres.push('methode:' + shiny.methode);

  card.setAttribute('compteur', shiny.compteur);

  if (shiny.charm) card.setAttribute('charm', String(shiny.charm));
  else card.removeAttribute('charm');

  const jeu = shiny.jeu.replace(/[ \']/g, '');
  card.setAttribute('jeu', jeu);
  filtres.push('jeu:' + jeu);

  if (shiny.checkmark) card.setAttribute('checkmark', String(shiny.checkmark));
  else card.removeAttribute('checkmark');

  if (shiny.horsChasse === true) card.setAttribute('random', String(shiny.horsChasse));
  else card.removeAttribute('random');

  const monjeu = Number(shiny.DO) || null;
  if (monjeu) card.setAttribute('monjeu', '1');
  else card.removeAttribute('monjeu');

  switch (shiny.hacked) {
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
  if (shiny.hacked > 0) card.setAttribute('hacked', String(shiny.hacked));
  else card.removeAttribute('hacked');

  if (conditionMien) {
    const shinyRate = shiny.shinyRate != null ? shiny.shinyRate : 0;
    card.setAttribute('shiny-rate', String(shinyRate));

    if (shiny.charm === false && [8192, 4096].includes(shinyRate))
      filtres.push('taux:full');
    else if (shiny.charm === true && [2731, 1365].includes(shinyRate))
      filtres.push('taux:charm');
    else if (shiny.shinyRate === 1 || shinyRate === 0)
      filtres.push('taux:boosted');
    else
      filtres.push('taux:boosted');
  } else {
    card.removeAttribute('shiny-rate');
    card.setAttribute('shiny-rate', '0');
    filtres.push('taux:inconnu');
  }

  card.setAttribute('date', (new Date(shiny.timeCapture)).toLocaleDateString());
  card.setAttribute('filtres', JSON.stringify(filtres));
  card.setAttribute('last-update', String(shiny.lastUpdate));

  return card;
}