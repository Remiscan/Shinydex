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
function getFilesVersion()
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
    $dateFichier = filemtime($fichier);

    if ($dateFichier > $versionFichiers)
      $versionFichiers = $dateFichier;
  }
  return $versionFichiers;
}


////////////////////////////////////////////////////////////////////
// Je récupère la date de dernière mise à jour de la base de données
function getDBVersion()
{
  $link = new BDD();
  $dates_derniereUpdate = $link->prepare('SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA = ?');
  $dates_derniereUpdate->execute(['remiscanmk17']);
  $dates_derniereUpdate = array_column($dates_derniereUpdate->fetchAll(PDO::FETCH_ASSOC), 'UPDATE_TIME');
  $versionBDD = max(array_map('strtotime', $dates_derniereUpdate));
  return $versionBDD;
}


/////////////////////////////////////////////////////////////////////
// Je récupère les infos sur mes chromatiques dans la base de données
function getShinyData()
{
  $link = new BDD();
  $recup_shinies = $link->prepare('SELECT * FROM mes_shinies ORDER BY id DESC');
  $recup_shinies->execute();
  $data_shinies = $recup_shinies->fetchAll(PDO::FETCH_ASSOC);
  return $data_shinies;
}


/////////////////////////////////////////////////////////////
// Je récupère les infos sur tous les Pokémon et leurs formes
function getPokemonData()
{
  $dir = "./sprites-home/small";
  $files = scandir($dir);

  $pokemons = [];
  forEach(Pokemon::ALL_POKEMON as $id => $name)
  {
    $sprites = preg_grep('/poke_icon_([0]+)?' . intval($id) . '_.+_n\.png/', $files);
    $pokemons[] = new Pokemon($id, $name, $sprites);
  }
  return $pokemons;
}





//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// APPLICATION DE LA MISE À JOUR ///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


$results = array();


// Si on vérifie juste la disponibilité d'une mise à jour de l'application
if (isset($_GET['type']) && $_GET['type'] == 'check')
{

  $results['version-bdd'] = getDBVersion();
  $results['version-fichiers'] = getFilesVersion();

}

// Si on veut juste mettre à jour la base de données des shiny
elseif (isset($_GET['type']) && $_GET['type'] == 'updateDB')
{

  $results['version-bdd'] = getDBVersion();
  $results['version-fichiers'] = getFilesVersion();
  $results['data-shinies'] = getShinyData();

}

// Si on veut installer tous les fichiers et données
else
{

  $results['version-bdd'] = getDBVersion();
  $results['version-fichiers'] = getFilesVersion();
  $results['data-shinies'] = getShinyData();
  $results['pokemon-data'] = getPokemonData();

}

///////////////////////////////////////////
// On passe tous ces résultats à javascript
header('Content-Type: application/json');
echo json_encode($results, JSON_PRETTY_PRINT);