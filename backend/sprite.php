<?php
if (isset($_GET['format'])) {
  $format = match($_GET['format']) {
    'webp' => 'webp',
    default => 'png'
  };
} else $format = 'png';

if (isset($_GET['params'])) {
  $params = $_GET['params'];
} else $params = '0000_000_uk_n_00000000_f_n';



///////////////////
// Génère le sprite
function generateSprite(string $sprite, string $type): void {
  // Taille de sprite désirée
  $width = 112;
  $height = 112;

  // Taille du sprite d'origine
  $bigWidth = 512;
  $bigHeight = 512;

  // On crée une image de la bonne taille
  $spritesheet = imagecreatetruecolor($width, $height);

  // On rend le background de l'image transparent
  $transparentBackground = imagecolorallocatealpha($spritesheet, 0, 0, 0, 127);
  imagefill($spritesheet, 0, 0, $transparentBackground);
  imagesavealpha($spritesheet, true);

  $tempSprite = imagecreatefrompng($sprite);
  imagecopyresampled($spritesheet, $tempSprite, 0, 0, 0, 0, $width, $height, $bigWidth, $bigHeight);

  // On affiche l'image générée
  header('Content-type: image/' . $type);
  switch ($type) {
    case 'webp':
      imagewebp($spritesheet, NULL, 100);
      break;
    case 'png':
    default:
      imagepng($spritesheet, NULL, 9, PNG_NO_FILTER);
  }

  // On sort l'image de la mémoire du serveur
  imagedestroy($spritesheet);
}



//////////////////////////////
// On génère le sprite demandé
$originalSprite = "../sprites-home/big/poke_capture_$params.png";
generateSprite($originalSprite, $format);