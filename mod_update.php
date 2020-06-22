<?php
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// VÉRIFICATION DE LA DISPONIBILITÉ D'UNE MISE À JOUR //////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


clearstatcache();
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


//////////////////////////////////////////////////////////
// Vérifie les dates de dernière modification des fichiers
function check_file_times($check = false)
{
  $listeFichiers = json_decode(file_get_contents('cache.json'), true);
  $listeFichiers = $listeFichiers['fichiers'];
  $listeFichiers[0] = './index.php';
  foreach(glob('section_*.html') as $f) {
    $listeFichiers[] = $f;
  }
  $versionFichiers = 0;
  foreach($listeFichiers as $fichier)
  {
    if ($check === true)
    {
      $isDateValid = true;
      foreach(['sprites.png'] as $checkname)
      {
        if (strpos($fichier, $checkname) !== false)
        {
          if (!file_exists($fichier))
            $isDateValid = false;
        }
      }
      if ($isDateValid === true)
        $date_fichier = filemtime($fichier);
      else
        $date_fichier = time() + 1;
    }
    else
    {
      $date_fichier = filemtime($fichier);
    }

    if ($date_fichier > $versionFichiers)
      $versionFichiers = $date_fichier;
  }
  $versionFichiers = date('Y-m-d H:i:s', $versionFichiers);
  return $versionFichiers;
}


///////////////////////////////////////////////////////////////////////////////////
// Je récupère les infos sur mes chromatiques, équipes, etc dans la base de données
$link = new BDD();

$allsprites = array();

$recup_shinies = $link->prepare('SELECT * FROM mes_shinies ORDER BY id DESC');
  $recup_shinies->execute();
  $data_shinies = $recup_shinies->fetchAll(PDO::FETCH_ASSOC);

$dates_derniereUpdate = $link->prepare('SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA = ?');
  $dates_derniereUpdate->execute(['remiscanmk17']);
  $dates_derniereUpdate = array_column($dates_derniereUpdate->fetchAll(PDO::FETCH_ASSOC), 'UPDATE_TIME');
  $versionBDD = date('Y-m-d H:i:s', max(array_map('strtotime', $dates_derniereUpdate)));


/////////////////////////////////////////////////////////////
// Je récupère les infos sur tous les Pokémon et leurs formes
$dir = "./sprites-home/small";
$files = scandir($dir);
$pokemons = [];
forEach(Pokemon::ALL_POKEMON as $id => $name)
{
  $sprites = preg_grep('/poke_icon_([0]+)?' . intval($id) . '_.+_n\.png/', $files);
  $pokemons[] = new Pokemon($id, $name, $sprites);
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// APPLICATION DE LA MISE À JOUR ///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


if (isset($_GET['type']) && $_GET['type'] == 'check')
{

  // Pendant la vérification, je récupère la date des fichiers avant leur création potentielle
  $versionFichiers = check_file_times(true);

  ///////////////////////////////////////////
  // On passe tous ces résultats à javascript
  header('Content-Type: application/json');
  echo json_encode(array(
    'version-bdd' => $versionBDD,
    'version-fichiers' => $versionFichiers,
  ), JSON_PRETTY_PRINT);

}

else

{

  // Forcer la création des tiles de sprites mêmes si ils existent déjà ?
  if (isset($_GET['force']) && $_GET['force'] === 'true')
    $force = true;
  else
    $force = false;

  $methodesNonMiens = ['Distribution', 'Échangé', 'Échangé (GTS)', 'Échange miracle', 'Échangé (œuf)'];


  ///////////////////////////////////////////////////////////////////////////////////////
  // Je compte et identifie les chromatiques que j'ai, et ceux que j'ai attrapés moi-même
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
    $allsprites[] = $pokemon->getSprite($forme, (object) ['shiny' => true]);
  }


  //////////////////////////////////////////////////////////////////////////////
  // Fonction qui génère les tiles de mes Pokémon chromatiques et de mes équipes
  // Utile pour gagner beaucoup de temps de chargement de la page
  //    $array_d_images contient tous les sprites qui vont aller sur l'image finale
  //    $nombre_de_tiles contient le nombre de ces sprites, compté ci-dessus (variable inutile ?)
  //    $image_finale contient le nom de l'image finale
  function tile_image($array_d_images, $nombre_de_tiles, $image_finale, $type, $force)
  {
    $width = 112; // largeur d'un sprite
    $height = 112; // hauteur d'un sprite

    $fileArray = array($image_finale);
    list($totwidth, $totheight, $tottype, $totattr) = @getimagesize($image_finale); // Récupère la taille du sprite existant

    // Si le sprite existant contient trop ou trop peu de Pokémon, on le met à jour
    if (($totheight != $nombre_de_tiles * $width) OR ($force === true))
    {
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

      // On génère une image temporaire pour chaque sprite, on place le tout dans l'array $image_objects
      $image_objects = array();
      for($i = 0; $i < ($rows * $columns); $i++)
      {
        $image_temp = imagecreatefrompng($array_d_images[$i]);
        $image_objects[$i] = $image_temp;
      }

      // On fusionne chaque sprite à la bonne position sur l'image
      $step = 0;
      for($x = 0; $x < $columns; $x++)
      {
        for($y = 0; $y < $rows; $y++)
        {
          imagecopy($output_image, $image_objects[$step], ($width * $x), ($height * $y), 0, 0, $width, $height);
          $step++; // on incrémente les sprites dans $image_objects
        }
      }

      // Si le fichier existe déjà, je le supprime avant de le recréer
      foreach ($fileArray as $value)
      {
        if (file_exists($value))
        {
          unlink($value);
        }
      }

      // On enregistre l'image générée, puis on la sort de la mémoire
      if ($type == 'jpg')
        imagejpeg($output_image, $image_finale, 50);
      elseif ($type == 'webp')
        imagewebp($output_image, $image_finale, 100);
      else
      {
        imagepng($output_image, $image_finale, 9, PNG_NO_FILTER);
        // Compresse l'image en PNG8 de seulement 256 couleurs
        // (mauvaise idée : combiner tous les sprites donne une image avec bien + de couleurs)
        /*$pathToPngquant = parse_ini_file(paramsPath(), TRUE);
        $pathToPngquant = $pathToPngquant['public']['pngquant'];
        shell_exec($pathToPngquant . ' --force --nofs --ext .png 256 ' . $image_finale);*/
      }
      imagedestroy($output_image);
      
      // On dit au Rémidex que les tiles ont été mis à jour
      $msgornot = 1;
      $backup = 1;
    }
    else
    {
      // On dit au Rémidex que les tiles n'ont pas été màj
      $msgornot = 0;
      $backup = 0;
    }
    return array($msgornot, $backup);
  }


  ///////////////////////////////////////////////////////
  // Génération des tiles grâce aux fonctions précédentes
  tile_image($allsprites, $nbredeshinies, 'sprites.png', 'png', $force);


  // Pendant une mise à jour, je vérifie la date des fichiers après leur création potentielle
  $versionFichiers = check_file_times();
  $dates_derniereUpdate[] = $versionFichiers;
  $version = max(array_map('strtotime', $dates_derniereUpdate));
  $version = date('Y-m-d H:i:s', $version);


  ///////////////////////////////////////////
  // On passe tous ces résultats à javascript
  header('Content-Type: application/json');
  echo json_encode(array(
    'version' => $version,
    'version-bdd' => $versionBDD,
    'version-fichiers' => $versionFichiers,
    'data-shinies' => $data_shinies,
    'pokemon-data' => $pokemons,
  ), JSON_PRETTY_PRINT);

}