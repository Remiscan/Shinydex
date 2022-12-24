<?php
require_once __DIR__.'/../backend/class_Pokemon.php';



function buildPokemonSheet(int $columns = 32, int $spriteSize = 56, string $format = 'webp', bool $logs = true) {
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

  // Current position
  $x = 0;
  $y = 0;

  $imagePath = __DIR__.'/../images/pokemonsheet.webp';
  $cssPath = __DIR__.'/../images/pokemonsheet.css';
  $previewPath = __DIR__.'/../images/pokemonsheet.html';

  // If files already exist, remove them
  foreach ([$imagePath, $cssPath, $previewPath] as $path) {
    if (file_exists($path)) unlink($path);
  }

  // Initialize CSS file
  file_put_contents($cssPath, ".pkmnicon {background-image: var(--link-pokemonsheet);background-repeat: no-repeat;display: inline-block;width:56px;height:56px}");

  // Initialize preview file
  file_put_contents($previewPath, <<<preview
    <html class="light">
      <head>
        <meta charset="utf-8">
        <style>
          html {
            width:100%;
            height:100%;
            --link-pokemonsheet:url("pokemonsheet.$format");
            --color:black;
          }

          html.dark {
            --color:white
          }

          body {
            display:flex;
            flex-wrap:wrap;
            justify-content:space-between;
            margin:100px;
            background-color:#ccc;
            color:var(--color)
          }

          html.dark > body {
            background-color:#333
          }

          .container {
            border:1px solid var(--color);
            display:flex;
            justify-content:center;
            align-items:center;
            margin:5px;
            display:grid;
            overflow:hidden;
            height:{$spriteSize}px;
            grid-template-columns: {$spriteSize}px 100px
          }
          
          .container > div:not(.pkmnicon) {
            padding:5px;
          }

          a {
            color:blue
          }
          
          html.dark a{
            color:lightblue
          }
        </style>
        <link rel="stylesheet"href="pokemonsheet.css">
      </head>

      <body>
        <main style="flex-basis:100%">
          <ul>
            <li>
              <a href="pokemonsheet.webp">Link to image (pokemonsheet.webp)</a>
            </li>
            <li>
              <a href="pokemonsheet.css">Link to style sheet (pokemonsheet.css)</a>
            </li>
            <li>
              <input type="checkbox" onclick="document.documentElement.classList.toggle(`dark`);document.documentElement.classList.toggle(`light`)" id="theme"> <label for="theme">Dark</label>
            </li>
          </ul>
        </main>
  preview);

  // Initialize image
  $sheet = imagecreatetruecolor($totalSize['width'], $totalSize['height']);
  $transparentImg = imagecolorallocatealpha($sheet, 0, 0, 0, 127);
  imagefill($sheet, 0, 0, $transparentImg);
  imagesavealpha($sheet, true);

  // For each Pokémon, get its sprite and put it on the sheet
  foreach ($pokemons as $id => $pokemon) {
    $dexid = $pokemon->dexid;
    $basicForm = $pokemon->formes[0];
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

    $sprite = imagecreatefrompng($spriteUrl);

    // Copy (and resize) the sprite onto the sheet
    imagecopyresampled($sheet, $sprite, $x, $y, 0, 0, $spriteSize, $spriteSize, 512, 512);

    // Insert position into CSS file
    file_put_contents($cssPath, ".pkmnicon[data-dexid=\"$dexid\"]{background-position: -{$x}px -{$y}px}", FILE_APPEND);

    // Insert sprite on preview page
    file_put_contents($previewPath, <<<preview
      <div class="container pokemon">
        <div class="pkmnicon" data-dexid="$dexid"></div>
        <div>$dexid</div>
      </div>
    preview, FILE_APPEND);

    if ($logs) echo "\nPokémon $dexid added to sheet";

    // Increment current position
    $x += $spriteSize;
    if ($x + $spriteSize > $totalSize['width']) {
      $x = $x % $totalSize['width'];
      $y += $spriteSize;
    }
  }

  switch ($format) {
    case 'webp':
      imagewebp($sheet, $imagePath, 100);
      break;
    case 'png':
    default:
      imagepng($sheet, $imagePath, 9, PNG_NO_FILTER);
  }

  if ($logs) echo "\n" . date('Y-m-d H:i:s') . " sheet created!";
}



buildPokemonSheet();