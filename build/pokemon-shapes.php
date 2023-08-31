<?php
require_once __DIR__.'/../backend/class_Pokemon.php';



function buildSvgPokemonShapes(int $columns = 32, int $spriteSize = 44, string $format = 'webp', bool $logs = true) {
  // Get Pokémon data
  $spriteFiles = scandir(__DIR__.'/../images/pokemon-sprites/home');
  $pokemons = [];
  forEach(Pokemon::POKEMON_NAMES_EN as $id => $name) {
    $sprites = preg_grep('/poke_capture_([0]+)?' . intval($id) . '_.+_n\.png/', $spriteFiles);
    $pokemons[] = new Pokemon($id, $sprites);
  }

  $totalSize = [
    'width' => $columns * $spriteSize,
    'height' => (intdiv(count($pokemons), $columns) + 1) * $spriteSize
  ];

  // For each Pokémon, get its sprite and put it on the sheet
  foreach ($pokemons as $id => $pokemon) {
    $dexid = $pokemon->dexid;
    $basicForm = $pokemon->formes[0];
    if ($basicForm->gigamax) $basicForm = $pokemon->formes[1];
    foreach ($pokemon->formes as $forme) {
      if ($forme->dbid === '') {
        $basicForm = $forme;
        break;
      }
    }

    $spriteUrl = __DIR__ . '/../..' . $pokemon->getSprite($basicForm, (object) [
      'shiny' => true,
      'size' => $spriteSize
    ]);

    $outPath = str_replace('.png', '.svg', str_replace('pokemon-sprites/home', 'pokemon-sprites/svg', $spriteUrl));

    shell_exec(<<<COMMAND
      convert "$spriteUrl" -resize 44x44 png:- | convert - -alpha extract -negate -threshold 50% pgm:- | potrace - --svg -o "$outPath"
    COMMAND);

    if ($logs) echo "Pokémon $dexid svg path created\n";
  }

  if ($logs) echo date('Y-m-d H:i:s') . " sheet created!\n";
}



buildSvgPokemonShapes();