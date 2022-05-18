import { lazyLoad } from './lazyLoading.js';
import { dataStorage, huntStorage } from './localforage.js';
import { Params } from './Params.js';
import { frontendShiny, Pokemon, Shiny } from './Pokemon.js';



// Structure d'un Pokémon en cours de chasse tel que stocké dans la BDD locale
export interface huntedPokemon extends Omit<frontendShiny, 'id' | 'destroy'> {
  caught: boolean,
  uploaded: boolean,
}

const defaultHunt: huntedPokemon = {
  huntid: '',
  lastUpdate: 0,
  dexid: 0,
  forme: '',
  gene: '',
  surnom: '',
  methode: '',
  compteur: '',
  timeCapture: 0,
  jeu: '',
  ball: 'poke',
  notes: '',
  checkmark: 0,
  DO: false,
  charm: false,
  hacked: 0,
  horsChasse: false,
  deleted: false,
  caught: false,
  uploaded: false,
};

export class Hunt extends Shiny implements huntedPokemon {
  caught: boolean = false;
  uploaded: boolean = false;
  
  constructor(pokemon: huntedPokemon = defaultHunt) {
    pokemon.huntid = pokemon.huntid || crypto.randomUUID();
    super(pokemon);
    Object.assign(this, {
      caught: pokemon.caught ?? false,
      uploaded: pokemon.uploaded ?? false
    });
  }

  static build(pokemon?: huntedPokemon) {
    const card = document.createElement('hunt-card');
    card.dispatchEvent(new CustomEvent('huntupdate', { detail: { pkmn: pokemon } }));

    document.querySelector('#chasses-en-cours>.section-contenu')!.appendChild(card);
    lazyLoad(card);
    document.querySelector('#chasses-en-cours')!.classList.remove('vide');

    // Animation de la carte
    if (!(pokemon?.dexid)) {
      card.animate([
        { opacity: '0' },
        { opacity: '1' }
      ], {
        easing: Params.easingStandard,
        fill: 'backwards',
        duration: 200
      });

      const height = card.getBoundingClientRect().height;
      document.querySelector('#chasses-en-cours>.section-contenu')!.animate([
        { transform: 'translate3D(0, -' + height + 'px, 0)' },
        { transform: 'translate3D(0, 0, 0)' }
      ], {
        easing: Params.easingStandard,
        fill: 'backwards',
        duration: 200
      });
    }

    return card;
  }


  // Construit la carte qui affiche la chasse en HTML
  async buildHunt(start: boolean = false) {
    /*const template = document.getElementById('template-hunt') as HTMLTemplateElement;
    const card = (template.content.cloneNode(true) as Element).querySelector('.hunt-card') as HTMLElement;
    card.id = 'hunt-' + this.huntid;

    // Détecte les modifications du formulaire
    card.addEventListener('input', async () => await this.updateHunt());

    // On met à jour la carte avec les valeurs de this
    this.updateSprite();
    this.updateJeu();
    this.updateBall();
    let pkmn = await pokemonData.getItem(String(this.dexid));
    (document.getElementById(`hunt-${this.huntid}-espece`) as HTMLInputElement).value = (pkmn.dexid > 0) ? pkmn.namefr : '';
    await this.genereFormes();
    (document.getElementById(`hunt-${this.huntid}-forme`) as HTMLInputElement).value = this.forme;
    (document.getElementById(`hunt-${this.huntid}-surnom`) as HTMLInputElement).value = this.surnom;
    
    if (this.methode == 'Ultra-Brèche') {
      (document.getElementById(`hunt-${this.huntid}-compteur-distance`) as HTMLInputElement).value = JSON.parse(this.compteur).distance;
      (document.getElementById(`hunt-${this.huntid}-compteur-anneaux`) as HTMLInputElement).value = JSON.parse(this.compteur).rings;
      (document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value = '0';
    } else if (this.methode == 'Chaîne de captures') {
      (document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value = JSON.parse(this.compteur).chain;
      switch (JSON.parse(this.compteur).lure) {
        case true:
          (document.querySelector(`input[id="hunt-${this.huntid}-compteur-leurre-oui"]`) as HTMLInputElement).checked = true;
          break;
        default:
          (document.querySelector(`input[id="hunt-${this.huntid}-compteur-leurre-non"]`) as HTMLInputElement).checked = true;
      }
      (document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value = '0';
    } else
    (document.getElementById(`hunt-${this.huntid}-compteur`) as HTMLInputElement).value = this.compteur;

    (document.getElementById(`hunt-${this.huntid}-date`) as HTMLInputElement).value = (new Date(this.timeCapture)).toISOString().split('T')[0];
    (document.getElementById(`hunt-${this.huntid}-jeu`) as HTMLInputElement).value = this.jeu;
    this.genereMethodes();
    (document.getElementById(`hunt-${this.huntid}-methode`) as HTMLInputElement).value = this.methode;
    (document.getElementById(`hunt-${this.huntid}-ball`) as HTMLInputElement).value = this.ball;
    (document.getElementById(`hunt-${this.huntid}-notes`) as HTMLInputElement).value = this.notes;
    (document.querySelector(`input[name="hunt-${this.huntid}-origin-icon"][value="${this.checkmark}"]`) as HTMLInputElement).checked = true;
    (document.querySelector(`input[name="hunt-${this.huntid}-monjeu"][value="${this.DO}"]`) as HTMLInputElement).checked = true;
    (document.querySelector(`input[name="hunt-${this.huntid}-charm"][value="${this.charm}"]`) as HTMLInputElement).checked = true;
    (document.querySelector(`input[name="hunt-${this.huntid}-hacked"][value="${this.hacked}"]`) as HTMLInputElement).checked = true;
    (document.querySelector(`input[name="hunt-${this.huntid}-aupif"][value="${this.horsChasse}"]`) as HTMLInputElement).checked = true;
    card.dataset.methode = this.methode;
    card.dataset.jeu = this.jeu;

    if (this.uploaded !== false) card.dataset.loading = String(this.uploaded);

    if (this.caught) card.classList.add('caught');

    if (start) return;*/
  }
}



////////////////////////////////////////////////////////////
// Créer une chasse pour mettre à jour une carte dans la BDD
export async function editHunt(id: string, nav = true) {
  /*let k = await huntStorage.getItem(id);
  if (k != null) {
    const message = 'Cette chasse est déjà en cours d\'édition.';
    new Notif(message).prompt();
    return false;
  }

  const pkmn = await shinyStorage.getItem(id);
  const parseTheseInts = ['id', 'origin', 'monjeu', 'charm', 'hacked', 'aupif'];
  parseTheseInts.forEach(int => pkmn[int] = parseInt(pkmn[int]));
  pkmn.dexid = parseInt(pkmn['numero_national']);
  pkmn.id = id;
  const hunt = await Hunt.build(pkmn);
  if (nav) navigate('chasses-en-cours');
  return hunt;*/
}



//////////////////////////////////////
// Initialise les chasses sauvegardées
export async function initHunts() {
  // On initialise la datalist des jeux
  initGamesDatalist();

  await Promise.all([huntStorage.ready(), dataStorage.ready()]);

  // On vérifie quelles chasses ont été uploadées par le service worker depuis la dernière visite
  let uploadConfirmed = await dataStorage.getItem('uploaded-hunts');
  if (uploadConfirmed == null) {
    uploadConfirmed = [];
    await dataStorage.setItem('uploaded-hunts', []);
  }

  // On supprime ces chasses
  for (const huntid of uploadConfirmed) {
    await huntStorage.removeItem(huntid);
  }

  // On génère les chasses restantes
  const keys = await huntStorage.keys();
  if (keys.length == 0) {
    document.querySelector('#chasses-en-cours')!.classList.add('vide');
  } else {
    for (const key of keys) {

    }
    keys.forEach(async k => Hunt.build(await huntStorage.getItem(k)));
  }
}


// Crée la datalist Jeux
function initGamesDatalist() {
  const datalistJeux = document.getElementById('datalist-jeux')!;
  Pokemon.jeux.forEach(jeu => {
    datalistJeux.innerHTML += `<option value="${jeu.nom}">`;
  });
}