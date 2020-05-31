// Anime le logo de la team Intuition quand on clique dessus, sur la section a-propos

let gifEnCours = 0;
export function easterEgg()
{
  if (!gifEnCours)
  {
    gifEnCours = 1;
    document.getElementById('instinct').src = './instinct.gif';
    setTimeout(() => { gifEnCours = 0; }, 2560);
  }
}