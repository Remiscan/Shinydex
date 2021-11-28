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
  // timestamp à 10 digits, généré par PHP
  return $versionFichiers * 1000;
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
  $results['version-fichiers'] = getFilesVersion();
}

// Si on veut installer tous les fichiers et données
else
{
  $results['version-fichiers'] = getFilesVersion();
  $results['pokemon-data'] = getPokemonData();
  $results['pokemon-names'] = Pokemon::ALL_POKEMON;
  $results['pokemon-names-fr'] = Pokemon::ALL_POKEMON_FR;
}

header('Content-Type: application/json');
echo json_encode($results, JSON_PRETTY_PRINT);