<?php
// On récupère l'URL du gros sprite
$sprite = 'sprites-home/big/poke_capture_' . preg_replace('/[^a-zA-Z0-9-_]/', '', $_GET['sprite']) . '.png';


//////////////////////////
// Redimensionne le sprite
function resizeSprite($image)
{
  // Taille de sprite désirée
  $width = 112;
  $height = 112;

  // Taille du sprite d'origine
  $bigWidth = 512;
  $bigHeight = 512;

  // On crée une image de la bonne taille
  $background = imagecreatetruecolor($width, $height); 

  // On rend le background de l'image transparent
  $transparentBackground = imagecolorallocatealpha($background, 0, 0, 0, 127);
  imagefill($background, 0, 0, $transparentBackground);
  imagesavealpha($background, true);
  $newSprite = $background; 

  // On place chaque sprite sur le tile à la bonne position
  $oldSprite = imagecreatefrompng($image);
  imagecopyresampled($newSprite, $oldSprite, 0, 0, 0, 0, $width, $height, $bigWidth, $bigHeight);

  // On affiche l'image générée
  header('Content-type: image/png');
  imagepng($newSprite, NULL, 9, PNG_NO_FILTER);

  // On sort l'image de la mémoire du serveur
  imagedestroy($newSprite);
}

resizeSprite($sprite);