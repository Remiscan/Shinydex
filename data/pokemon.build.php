<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_Pokemon.php';


//////////////////////////////////////////////////////////
// Récupère les infos sur tous les Pokémon et leurs formes
$rootDir = dirname(__DIR__, 1);

$dir = "$rootDir/images/pokemon-sprites/home";
$files = scandir($dir);

$pokemons = [];
forEach(Pokemon::POKEMON_NAMES_EN as $id => $name) {
  $sprites = preg_grep('/poke_capture_([0]+)?' . intval($id) . '_.+_n\.png/', $files);
  $pokemons[] = new Pokemon($id, $sprites);
}


////////////////////////////////////////////////
// Sauvegarde des données dans pokemon-data.json
file_put_contents('out/pokemon.json', json_encode($pokemons, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo '<br>' . date('Y-m-d H:i:s') . ' - <a href="out/pokemon.json">Données créées</a> !';;