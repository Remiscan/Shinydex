// Anime le logo de la team Intuition quand on clique dessus, sur la section a-propos

export function playEasterEgg() {
  const video = document.getElementById('instinct') as HTMLVideoElement;
  video.play();
}

export function prepareEasterEgg() {
  const video = document.getElementById('instinct') as HTMLVideoElement;
  video.pause();
  video.currentTime = 0;
}