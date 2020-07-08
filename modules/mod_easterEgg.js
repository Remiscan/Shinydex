// Anime le logo de la team Intuition quand on clique dessus, sur la section a-propos

let gifEnCours = 0;

export function playEasterEgg()
{
  if (!gifEnCours)
  {
    gifEnCours = 1;
    const video = document.getElementById('instinct');
    video.play();
    setTimeout(() => { gifEnCours = 0; }, 2560);
  }
}

export function prepareEasterEgg()
{
  const video = document.getElementById('instinct');
  video.pause();
  video.currentTime = 0;
}