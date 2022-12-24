<?php
require_once __DIR__.'/../backend/class_Pokemon.php';


//////////////////////////////////////////////////////////
// Récupère les infos sur tous les Pokémon et leurs formes
$dir = __DIR__."/../images/pokemon-sprites/home";
$files = scandir($dir);

$pokemons = [];
forEach(Pokemon::POKEMON_NAMES_EN as $id => $name) {
  $sprites = preg_grep('/poke_capture_([0]+)?' . intval($id) . '_.+_n\.png/', $files);
  $pokemons[] = new Pokemon($id, $sprites);
}


////////////////////////////////////////////////
// Sauvegarde des données dans pokemon-data.json
file_put_contents(__DIR__.'/../data/pokemon.json', json_encode($pokemons, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo "\n" . date('Y-m-d H:i:s') . ' Pokémon data built!';