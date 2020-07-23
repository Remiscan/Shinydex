import { Shiny } from './mod_Pokemon.js';


//////////////////////////////////////////////////////
// Crée la carte d'un Pokémon, ou si elle existe déjà,
// met à jour uniquement les données qui ont changé.
export async function updateCard(pokemon, _card = null)
{
  let shiny;
  try {
    shiny = await Shiny.build(pokemon);
  } catch (e) {
    console.error('Failed creating Shiny object', e);
    return;
  }

  const conditionMien = shiny.mine;

  let filtres = [];
  if (conditionMien)
    filtres.push('do:moi');
  else
    filtres.push('do:autre');
  
  const card = _card || document.createElement('pokemon-card');
  if (_card == null) {
    card.id = `pokemon-card-${shiny.huntid}`;
    card.setAttribute('huntid', shiny.huntid);
  }

  card.setAttribute('dexid', shiny.dexid);
  card.setAttribute('espece', shiny.espece);
  card.setAttribute('notes', shiny.description);

  if (shiny.ball) card.setAttribute('ball', shiny.ball);
  else card.removeAttribute('ball');

  card.setAttribute('surnom', shiny.surnom);

  card.setAttribute('methode', shiny.methode);
  filtres.push('methode:' + shiny.methode);

  card.setAttribute('compteur', shiny.compteur);

  if (shiny.charm) card.setAttribute('charm', shiny.charm);
  else card.removeAttribute('charm');

  const jeu = shiny.jeu.replace(/[ \']/g, '');
  card.setAttribute('jeu', jeu);
  filtres.push('jeu:' + jeu);

  if (shiny.checkmark) card.setAttribute('checkmark', shiny.checkmark);
  else card.removeAttribute('checkmark');

  const monjeu = Number(shiny.monjeu) || null;
  if (monjeu) card.setAttribute('monjeu', 1);
  else card.removeAttribute('monjeu');

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
  if (shiny.hacked > 0) card.setAttribute('hacked', shiny.hacked);
  else card.removeAttribute('hacked');

  if (conditionMien)
  {
    const shinyRate = (shiny.shinyRate != '???' ? shiny.shinyRate : 0);
    card.setAttribute('shiny-rate', shinyRate);

    if (shiny.charm == false && [8192, 4096].includes(shinyRate))
      filtres.push('taux:full');
    else if (shiny.charm == true && [2731, 1365].includes(shinyRate))
      filtres.push('taux:charm');
    else if (shiny.shinyRate == 1 || shinyRate == 0)
      filtres.push('taux:boosted');
    else
      filtres.push('taux:boosted');
  }
  else
  {
    card.removeAttribute('shiny-rate');
    card.setAttribute('shiny-rate', 0);
    filtres.push('taux:inconnu');
  }

  card.setAttribute('date', shiny.date);
  card.setAttribute('filtres', JSON.stringify(filtres));
  card.setAttribute('last-update', shiny.lastupdate);

  return card;
}