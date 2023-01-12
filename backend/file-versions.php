<?php
// Vide le cache des stats des fichiers
clearstatcache();


//////////////////////////////////////////////////////////
// Vérifie les dates de dernière modification des fichiers
// et renvoie [ version, liste des fichiers modifiés ].
function getFilesVersion(): array {
  $rootDir = $_SERVER['DOCUMENT_ROOT'].'/shinydex';
  $cacheFiles = json_decode(file_get_contents($rootDir.'/cache.json'), true)['files'];

  $fileVersions = [];
  $indexVersion = 0;
  foreach ($cacheFiles as $file) {
    $rootPath = $rootDir.'/'.$file;
    if ($file === './index.php' || str_starts_with($file, './pages')) {
      $indexVersion = max($indexVersion, version([$rootPath]));
      $fileVersions['./'] = $indexVersion;
    } else {
      $fileVersions[$file] = version([$rootPath]);
    }
  }

  return $fileVersions;
}


////////////////////////////////////////
// Transmission des données à JavaScript

$fileVersions = getFilesVersion();

header('Content-Type: application/json');
echo json_encode($fileVersions, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);