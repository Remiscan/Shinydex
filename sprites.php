<?php
require_once 'parametres.php';
require_once './class_BDD.php';
require_once './class_Pokemon.php';

if (isset($_POST['data']) && $_POST['data'] != '') $data = $_POST['data'];
else $data = false;

$allsprites = array();

if ($data === false) {
  // Je récupère les infos sur mes chromatiques dans la base de données
  $link = new BDD();
  $recup_shinies = $link->prepare('SELECT * FROM mes_shinies ORDER BY id DESC');
    $recup_shinies->execute();
    $data_shinies = $recup_shinies->fetchAll(PDO::FETCH_ASSOC);
}

else {
  $data_shinies = [];
  $data = json_decode($data);
  foreach($data as $d) {
    $data_shinies[] = ['numero_national' => $d[0], 'forme' => $d[1]];
  }
}

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
function generateSheet($spritesArray, $type)
{
  // Taille de sprite désirée
  $width = 112;
  $height = 112;

  // Taille du sprite d'origine
  $bigWidth = 512;
  $bigHeight = 512;

  // Nombre de lignes et colonnes du spritesheet
  // (une ligne par sprite, c'est plus simple comme ça)
  $columns = 1;
  $rows = count($spritesArray);

  // On crée une image de la bonne taille
  $spritesheet = imagecreatetruecolor(($width * $columns), ($height * $rows)); 

  // On rend le background de l'image transparent
  $transparentBackground = imagecolorallocatealpha($spritesheet, 0, 0, 0, 127);
  imagefill($spritesheet, 0, 0, $transparentBackground);
  imagesavealpha($spritesheet, true);

  // On place chaque sprite sur le sheet à la bonne position
  for($i = 0; $i < ($rows * $columns); $i++) {
    $row = floor($i / $columns);
    $col = $i % $columns;
    $tempSprite = imagecreatefrompng($spritesArray[$i]);
    imagecopyresampled($spritesheet, $tempSprite, ($width * $col), ($height * $row), 0, 0, $width, $height, $bigWidth, $bigHeight);
  }

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


///////////////////////////////////////////////////////////
// On génère le spritesheet à partir des données récupérées
generateSheet($allsprites, 'png');