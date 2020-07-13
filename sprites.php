<?php
require_once('parametres.php');


//////////////////////////////////////////////////////////////////////////////////////////
// Chargement automatique de classes PHP, chaque classe est dans son fichier class_nom.php
// et sera appelée automatiquement quand on utilisera la classe pour la première fois.
function charge_classe($className)
{
  $classPath = 'class_'.$className.'.php';
  if (file_exists($classPath))
  {
    require_once $classPath;
    return true;
  }
  return false;
}
// Indique que la fonction précédente est une fonction d'autoload
spl_autoload_register('charge_classe');


/////////////////////////////////////////////////////////////////////
// Je récupère les infos sur mes chromatiques dans la base de données
$link = new BDD();

$allsprites = array();

$recup_shinies = $link->prepare('SELECT * FROM mes_shinies ORDER BY id DESC');
  $recup_shinies->execute();
  $data_shinies = $recup_shinies->fetchAll(PDO::FETCH_ASSOC);

/////////////////////////////////////////////////////////////
// Je récupère les infos sur tous les Pokémon et leurs formes
$dir = "./sprites-home/big";
$files = scandir($dir);
$pokemons = [];
forEach(Pokemon::ALL_POKEMON as $id => $name)
{
  $sprites = preg_grep('/poke_capture_([0]+)?' . intval($id) . '_.+_n\.png/', $files);
  $pokemons[] = new Pokemon($id, $name, $sprites);
}

////////////////////////////////////
// Je récupère les sprites des shiny
foreach ($data_shinies as $un_shiny)
{ 
  // J'ajoute le sprite du Pokémon à $allsprites pour pouvoir générer les tiles
  $pokemon = $pokemons[intval($un_shiny['numero_national'])];
  $forme = $pokemon->formes[0];
  foreach($pokemon->formes as $f)
  {
    if ($f->dbid == $un_shiny['forme'])
    {
      $forme = $f;
      break;
    }
  }
  $allsprites[] = $pokemon->getSprite($forme, (object) ['shiny' => true, 'big' => true]);
}


////////////////////////
// Génère le spritesheet
function tile_image($array_d_images, $type)
{
  $width = 112; // largeur d'un sprite
  $height = 112; // hauteur d'un sprite
  $bigWidth = 512;
  $bigHeight = 512;

  $fileArray = array($image_finale);

  $nombre_d_images = count($array_d_images); // utiliser plus haut pour remplacer $nombe_de_tiles ?

  $columns = 1;
  $rows = $nombre_d_images; // une ligne par sprite, c'est plus simple comme ça

  // On crée une image de la bonne taille
  $background = imagecreatetruecolor(($width * $columns), ($height * $rows)); 

  // On rend le background de l'image transparent
  $transparentBackground = imagecolorallocatealpha($background, 0, 0, 0, 127);
  imagefill($background, 0, 0, $transparentBackground);
  imagesavealpha($background, true);
  $output_image = $background; 

  // On place chaque sprite sur le tile à la bonne position
  $image_objects = array();
  for($i = 0; $i < ($rows * $columns); $i++)
  {
    $row = floor($i / $columns);
    $col = $i % $columns;
    $image_temp = imagecreatefrompng($array_d_images[$i]);
    //imagecopy($output_image, $image_temp, ($width * $col), ($height * $row), 0, 0, $width, $height);
    imagecopyresampled($output_image, $image_temp, ($width * $col), ($height * $row), 0, 0, $width, $height, $bigWidth, $bigHeight);
  }

  header('Content-type: image/' . $type);
  // On affiche l'image générée
  switch ($type) {
    case 'webp':
      imagewebp($output_image, NULL, 100);
      break;
    case 'png':
    default:
      imagepng($output_image, NULL, 9, PNG_NO_FILTER);
  }

  // On sort l'image de la mémoire du serveur
  imagedestroy($output_image);
}


///////////////////////////////////////////////////////////
// On génère le spritesheet à partir des données récupérées
tile_image($allsprites, 'png');