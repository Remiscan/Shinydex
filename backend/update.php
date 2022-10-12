<?php
require_once './class_Pokemon.php';
require_once './cache.php';

// Vide le cache des stats des fichiers
clearstatcache();


//////////////////////////////////////////////////////////
// Vérifie les dates de dernière modification des fichiers
// et renvoie [ version, liste des fichiers modifiés ].
function getFilesVersion(int $versionFrom = 0): array {
  $rootDir = dirname(__DIR__, 1);

  $listeFichiers = getCacheFiles()['fichiers'];
  $listeFichiers[0] = './index.php';

  // Ajoute les pages HTML des sections à la liste de fichiers
  $pages = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator(
      dirname(__DIR__, 1).'/pages',
      RecursiveDirectoryIterator::SKIP_DOTS
    ),
    RecursiveIteratorIterator::SELF_FIRST
  );
  foreach($pages as $path => $filename) {
    $listeFichiers[] = str_replace(dirname(__DIR__, 1), '.', $path);
  }

  // Calcule la version de fichier la plus récente
  // et la liste des fichiers modifiés.
  $versionFichiers = 0;
  $listeFichiersModifies = [];
  $index = false;
  foreach($listeFichiers as $fichier) {
    $path = $fichier;
    if (str_starts_with($path, '../'))
      $path = str_replace('../', dirname(__DIR__, 2).'/', $path);
    else if (str_starts_with($path, './'))
      $path = str_replace('./', dirname(__DIR__, 1).'/', $path);
    $dateFichier = filemtime($path);

    if ($dateFichier > $versionFrom / 1000) {
      if (str_ends_with($path, '.html') || str_ends_with($path, 'index.php'))
        $index = true;
      else
        $listeFichiersModifies[] = $fichier;
    }
    if ($dateFichier > $versionFichiers)
      $versionFichiers = $dateFichier;
  }
  if ($index) $listeFichiersModifies[] = './';
  // timestamp à 10 digits, généré par PHP
  return [
    $versionFichiers * 1000,
    $listeFichiersModifies
  ];
}


//////////////////////////////////////////////////////////
// Récupère les infos sur tous les Pokémon et leurs formes
function getPokemonData() {
  $rootDir = dirname(__DIR__, 1);

  $dir = "$rootDir/images/pokemon-sprites/home";
  $files = scandir($dir);

  $pokemons = [];
  forEach(Pokemon::ALL_POKEMON as $id => $name) {
    $sprites = preg_grep('/poke_capture_([0]+)?' . intval($id) . '_.+_n\.png/', $files);
    $pokemons[] = new Pokemon($id, $name, $sprites);
  }
  return $pokemons;
}


////////////////////////////////////////
// Transmission des données à JavaScript

$results = array();

$from = $_GET['from'] ?? 0;
[ $results['version-fichiers'], $results['liste-fichiers-modifies'] ] = getFilesVersion($from);

// Si on vérifie juste la disponibilité d'une mise à jour de l'application
if (isset($_GET['type']) && $_GET['type'] == 'check') {
  //$results['version-fichiers'] = getFilesVersion();
}

// Si on veut installer tous les fichiers et données
else {
  //$results['version-fichiers'] = getFilesVersion();
  $results['pokemon-data'] = getPokemonData();
  $results['pokemon-names'] = Pokemon::ALL_POKEMON;
  $results['pokemon-names-fr'] = Pokemon::ALL_POKEMON_FR;
}

header('Content-Type: application/json');
echo json_encode($results, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);