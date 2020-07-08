// Anime le logo de la team Intuition quand on clique dessus, sur la section a-propos

export function playEasterEgg()
{
  const video = document.getElementById('instinct');
  video.play();
}

export function prepareEasterEgg()
{
  const video = document.getElementById('instinct');
  video.pause();
  video.currentTime = 0;
}