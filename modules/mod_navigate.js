import { Params, loadAllImages, wait } from './mod_Params.js';
import { easterEgg } from './mod_easterEgg.js';
import { closeFiltres, openFiltres } from './mod_filtres.js';
import { closeSpriteViewer, openSpriteViewer } from './mod_spriteViewer.js';

let sectionActuelle = 'mes-chromatiques';
export const sections = ['mes-chromatiques', 'pokedex', 'mes-equipes', 'une-equipe', 'parametres', 'a-propos'];

export async function navigate(sectionCible, position = 0, historique = true)
{
  if (sectionActuelle == sectionCible) return Promise.resolve();

  const ancienneSection = document.getElementById(sectionActuelle);
  const nouvelleSection = document.getElementById(sectionCible);

  const listeImages = ['./pokesprite/pokesprite.png'];
  if (sectionCible == 'mes-chromatiques') {
    const versionDB = await dataStorage.getItem('version');
    listeImages.push(`./sprites--${versionDB}.php`, './all-icons.png');
  }

  await loadAllImages(listeImages);
  await new Promise((resolve, reject) => {
    closeFiltres();

    if (sectionCible == 'a-propos')
      document.getElementById('instinct').src = '#';

    if (historique)
      history.pushState({section: sectionCible}, '');

    sectionActuelle = sectionCible;

    document.querySelector('main').scroll(0, 0);
    document.body.dataset.sectionActuelle = sectionActuelle;

    if (Params.owidth >= Params.layoutPClarge) return resolve();

    const apparitionSection = nouvelleSection.animate([
      { transform: 'translate3D(0, 20px, 0)', opacity: '0' },
      { transform: 'translate3D(0, 0, 0)', opacity: '1' }
    ], {
        easing: Params.easingDecelerate,
        duration: 200,
        fill: 'both'
    });

    apparitionSection.addEventListener('finish', resolve);
  });

  if (sectionCible == 'a-propos' || (sectionCible == 'parametres' && Params.owidth >= Params.layoutPClarge))
    easterEgg();

  if (sectionCible != 'mes-chromatiques')
    nouvelleSection.classList.add('defered');
  ancienneSection.classList.remove('defered');
  Array.from(ancienneSection.querySelectorAll('.defered')).forEach(defered => defered.classList.replace('defered', 'defer'));
}



// Permet la navigation avec le bouton retour du navigateur
window.addEventListener('popstate', event => {
  if (typeof document.body.dataset.viewerOpen != 'undefined' || typeof document.body.dataset.viewerLoading != 'undefined')
  {
    closeSpriteViewer();
  }
  else if (event.state)
  {
    const section = event.state.section;
    if (document.querySelector('.menu-filtres').classList.contains('on'))
      closeFiltres();
    if (section != sectionActuelle)
    {
      switch(section)
      {
        case 'sprite-viewer':
          openSpriteViewer(event.state.dexid, { clientX: 0, clientY: 0 });
          break;
        case 'menu-filtres':
          openFiltres(false);
          break;
        default:
          navigate(section, 0, false);
      }
    }
  }
  else
    navigate('mes-chromatiques', 0, false);
}, false);