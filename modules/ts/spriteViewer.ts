import { pokemonData } from './localforage.js';
import { notify } from './notification.js';
import { loadAllImages, pad, Params } from './Params.js';
import { Pokemon } from './Pokemon.js';


const spriteViewer = document.getElementById('sprite-viewer')!;
const spriteScroller = document.querySelector('.sprite-scroller')!;
const switchSR = document.getElementById('switch-shy-reg') as HTMLInputElement;

export function initSpriteViewer() {
  spriteScroller.addEventListener('click', switchShinyRegular);
  switchSR.addEventListener('click', switchShinyRegular);
}

export async function openSpriteViewer(dexid: number, event: { clientX: number, clientY: number }) {
  if (typeof document.body.dataset.viewerLoading != 'undefined') return;
  
  // Coordonnées du clic qui ouvre la visionneuse
  let originX: number, originY: number;
  if (event.clientX === 0 && event.clientY === 0) {
    const rect = document.querySelector('.pkspr.pokemon[data-dexid="' + dexid + '"]')!.getBoundingClientRect();
    originX = rect.x;
    originY = rect.y;
  } else {
    originX = event.clientX;
    originY = event.clientY;
  }
  spriteViewer.style.transformOrigin = originX + 'px ' + originY + 'px';

  document.body.dataset.viewerLoading = String(dexid);
  history.pushState({ section: 'sprite-viewer', dexid: dexid }, '');

  try {
    const images = await fillSpriteViewer(dexid);
    await loadAllImages(images.shiny);

    try {
      images.regular.forEach(e => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = function() { resolve(e) }
          img.onerror = function() { reject(e) }
          img.src = e;
        })
        .then(() => {
          const img = spriteViewer.querySelector(`img[data-src="${e}"]`) as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          img.parentElement!.classList.remove('loading');
        });
      });
    } catch(error) {}

    if (document.body.dataset.viewerLoading !== String(dexid)) return;
    document.body.dataset.viewerOpen = 'true';
    spriteViewer.classList.add('shiny');
    spriteViewer.animate([
      { opacity: 0, transform: 'scale(.7) translateZ(0)' },
      { opacity: 1, transform: 'scale(1) translateZ(0)' }
    ], {
      easing: Params.easingDecelerate,
      duration: 200,
      fill: 'backwards'
    });
    switchSR.checked = true;
    document.body.removeAttribute('data-viewer-loading');
  }
  catch (error) {
    console.log(error);
    if (!navigator.onLine)
      notify('Chargement impossible : pas de connexion internet');
    else
      notify('Erreur pendant le chargement des images');
    closeSpriteViewer();
  }
}

export async function closeSpriteViewer() {
  if (typeof document.body.dataset.viewerLoading === 'undefined') {
    const closure = spriteViewer.animate([
      { opacity: 1, transform: 'scale(1) translateZ(0)' },
      { opacity: 0, transform: 'scale(.7) translateZ(0)' }
    ], {
      easing: Params.easingAccelerate,
      duration: 150
    });
    await new Promise(resolve => closure.onfinish = resolve);
  }

  document.body.removeAttribute('data-viewer-loading');
  document.body.removeAttribute('data-viewer-open');
  spriteViewer.classList.remove('shiny', 'regular');
}

async function fillSpriteViewer(dexid: number) {
  const pokemon = new Pokemon(await pokemonData.getItem(String(dexid)));
  const imagesShiny: string[] = [];
  const imagesRegular: string[] = [];
  const nomFormeNormale = 'Normale';

  // On réordonne les formes (normale d'abord, les autres ensuite)
  const formes = pokemon.formes.slice().sort((a, b) => { if (a.nom == '') return -1; else return 0; });

  // Si moins de 2 sprites, on les affiche en plus gros
  if (formes.length == 1) {
    spriteScroller.classList.add('single-sprite');
    spriteScroller.classList.remove('two-sprites');
  } else if (formes.length == 2) {
    spriteScroller.classList.add('two-sprites');
    spriteScroller.classList.remove('single-sprite');
  } else
    spriteScroller.classList.remove('single-sprite', 'two-sprites');

  // On place les sprites shiny
  formes.forEach(forme => {
    const sprite = pokemon.getSprite(forme, { shiny: true, size: 512, format: Params.preferredImageFormat });
    imagesShiny.push(sprite);
  });

  const listeShiny = document.querySelector('.sprite-list.shiny')!;
  listeShiny.innerHTML = '';
  imagesShiny.forEach((sprite, k) => {
    const forme = formes[k];
    const afficherNomForme = (forme.nom != '' || formes.length > 1);

    const html = `
      <div class="dex-sprite">
        <picture ${(typeof forme.noShiny != 'undefined' && forme.noShiny) ? 'class="no-shiny"' : ''}>
          <img src="${sprite}" width="${Params.spriteSize}" height="${Params.spriteSize}">
          ${(typeof forme.noShiny != 'undefined' && forme.noShiny) ? '<span>N\'existe pas<br>en chromatique</span>' : ''}
        </picture>
        <span ${afficherNomForme ? 'class="on"' : ''}>
          ${afficherNomForme ? (forme.nom != '' ? forme.nom : nomFormeNormale) : '&nbsp;'}
        </span>
      </div>
    `;

    listeShiny.innerHTML += html;
  });

  // On place les sprites normaux
  formes.forEach(forme => {
    const sprite = pokemon.getSprite(forme, { shiny: false, size: 512, format: Params.preferredImageFormat });
    imagesRegular.push(sprite);
  });

  const listeRegular = document.querySelector('.sprite-list.regular')!;
  listeRegular.innerHTML = '';
  imagesRegular.forEach((sprite, k) => {
    const forme = formes[k];
    const afficherNomForme = (forme.nom != '' || formes.length > 1);

    const html = `
      <div class="dex-sprite">
        <picture class="loading" style="--mask: url('${imagesShiny[k]}')">
          <img data-src="${sprite}" width="${Params.spriteSize}" height="${Params.spriteSize}">
        </picture>
        <span ${afficherNomForme ? 'class="on"' : ''}>
          ${afficherNomForme ? (forme.nom != '' ? forme.nom : nomFormeNormale) : '&nbsp;'}
        </span>
      </div>
    `;

    listeRegular.innerHTML += html;
  });

  // On place le numéro et nom
  document.querySelector('.info-dexid')!.innerHTML = pad(String(pokemon.dexid), 3);
  document.querySelector('.info-nom')!.innerHTML = pokemon.namefr;

  //return Promise.resolve([...imagesShiny, ...imagesRegular]);
  return Promise.resolve({ shiny: imagesShiny, regular: imagesRegular });
}

///////////////////////////////////////////////////////////
// Inverse les sprites shiny / normaux dans le spriteViewer
function switchShinyRegular() {
  if (spriteViewer.classList.contains('shiny')) {
    spriteViewer.classList.replace('shiny', 'regular');
    switchSR.checked = false;
  } else {
    spriteViewer.classList.replace('regular', 'shiny');
    switchSR.checked = true;
  }
}