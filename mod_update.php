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
function check_file_times()
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
    $date_fichier = filemtime($fichier);

    if ($date_fichier > $versionFichiers)
      $versionFichiers = $date_fichier;
  }
  return $versionFichiers;
}
$versionFichiers = check_file_times();


////////////////////////////////////////////////////////////////////
// Je récupère la date de dernière mise à jour de la base de données
$link = new BDD();

$recup_shinies = $link->prepare('SELECT * FROM mes_shinies ORDER BY id DESC');
  $recup_shinies->execute();
  $data_shinies = $recup_shinies->fetchAll(PDO::FETCH_ASSOC);

$dates_derniereUpdate = $link->prepare('SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA = ?');
  $dates_derniereUpdate->execute(['remiscanmk17']);
  $dates_derniereUpdate = array_column($dates_derniereUpdate->fetchAll(PDO::FETCH_ASSOC), 'UPDATE_TIME');
  $versionBDD = max(array_map('strtotime', $dates_derniereUpdate));



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// APPLICATION DE LA MISE À JOUR ///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


if (isset($_GET['type']) && $_GET['type'] == 'check')
{

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

  /////////////////////////////////////////////////////////////////////
  // Je récupère les infos sur mes chromatiques dans la base de données
  $recup_shinies = $link->prepare('SELECT * FROM mes_shinies ORDER BY id DESC');
  $recup_shinies->execute();
  $data_shinies = $recup_shinies->fetchAll(PDO::FETCH_ASSOC);

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

  ///////////////////////////////////////////
  // On passe tous ces résultats à javascript
  header('Content-Type: application/json');
  echo json_encode(array(
    'version-bdd' => $versionBDD,
    'version-fichiers' => $versionFichiers,
    'data-shinies' => $data_shinies,
    'pokemon-data' => $pokemons,
  ), JSON_PRETTY_PRINT);

}