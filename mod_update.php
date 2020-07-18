<?php
require_once './parametres.php';
require_once './class_BDD.php';
require_once './class_Pokemon.php';

// Vide le cache des stats des fichiers
clearstatcache();


//////////////////////////////////////////////////////////
// Vérifie les dates de dernière modification des fichiers
function getFilesVersion()
{
  $listeFichiers = json_decode(file_get_contents('cache.json'), true);
  $listeFichiers = $listeFichiers['fichiers'];
  $listeFichiers[0] = './index.php';
  foreach(glob('pages/*.html') as $f) {
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


/////////////////////////////////////////////////////////////////
// Récupère la date de dernière mise à jour de la base de données
function getDBVersion()
{
  $link = new BDD();
  $dates_derniereUpdate = $link->prepare('SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA = ?');
  $dates_derniereUpdate->execute(['remiscanmk17']);
  $dates_derniereUpdate = array_column($dates_derniereUpdate->fetchAll(PDO::FETCH_ASSOC), 'UPDATE_TIME');
  $versionBDD = max(array_map('strtotime', $dates_derniereUpdate));
  return $versionBDD;
}


//////////////////////////////////////////////////////////////////
// Récupère les infos sur mes chromatiques dans la base de données
function getShinyData()
{
  $link = new BDD();
  $recup_shinies = $link->prepare('SELECT * FROM mes_shinies ORDER BY id DESC');
  $recup_shinies->execute();
  $data_shinies = $recup_shinies->fetchAll(PDO::FETCH_ASSOC);
  return $data_shinies;
}


//////////////////////////////////////////////////////////
// Récupère les infos sur tous les Pokémon et leurs formes
function getPokemonData()
{
  $dir = "./sprites-home/big";
  $files = scandir($dir);

  $pokemons = [];
  forEach(Pokemon::ALL_POKEMON as $id => $name)
  {
    $sprites = preg_grep('/poke_capture_([0]+)?' . intval($id) . '_.+_n\.png/', $files);
    $pokemons[] = new Pokemon($id, $name, $sprites);
  }
  return $pokemons;
}


////////////////////////////////////////
// Transmission des données à JavaScript

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
  $results['pokemon-names'] = Pokemon::ALL_POKEMON;
  $results['pokemon-names-fr'] = Pokemon::ALL_POKEMON_FR;
}

header('Content-Type: application/json');
echo json_encode($results, JSON_PRETTY_PRINT);