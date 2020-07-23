<?php
function buildIconSheet($logs = false)
{
  // Step 0: choose parameters for icon sheet

  $columns = 15;

  // Step 1: get the list of files

    // Step 1.1: jeux

  $games = array_diff(
    scandir('game-icons'),
    array('.', '..')
  );
  $gameSize = (object) [
    'width' => 32,
    'height' => 32
  ];

    // Step 1.2: explain

  $explain = json_decode(file_get_contents('icons.json', true));
  $explain = $explain->icones->explain->liste;
  $sheetWidth = $columns * $gameSize->width;
  $maxHeight = 0;
  $lines = [];
  $cumulatedWidth = 0;

  foreach($explain as $icon) {
    $cumulatedWidth += $icon->taille[0];
    if ($cumulatedWidth >= $sheetWidth) {
      $lines[] = $maxHeight;
      $maxHeight = 0;
    }
    if ($icon->taille[1] > $maxHeight) $maxHeight = $icon->taille[1];

    if ($icon->dark == 'true') {
      $cumulatedWidth += $icon->taille[0];
      if ($cumulatedWidth >= $sheetWidth) {
        $lines[] = $maxHeight;
        $maxHeight = 0;
      }
      if ($icon->taille[1] > $maxHeight) $maxHeight = $icon->taille[1];
    }
  }
  $lines[] = $maxHeight;



  // Step 2: generate the big tile and the CSS file in parallel

    // Step 2.1: compute final image size
  
  $width = 0; $height = 0;

  $gameColumns = 15;
  $width += $gameColumns * $gameSize->width;
  $height += (intdiv(count($games), $gameColumns) + 1) * $gameSize->height;

  foreach($lines as $h) { $height += $h; }
  $height += $maxHeight;

  $currentPosition = (object) [
    'x' => 0,
    'y' => 0
  ];

    // Step 2.2: let's generate, baby

  $cssPath = 'out/iconsheet.css';
  $imagePath = 'out/iconsheet.png';
  $previewPath = 'out/index.html';

  // If files already exist, remove
  if (file_exists($cssPath)) unlink($cssPath);
  if (file_exists($imagePath)) unlink($imagePath);
  if (file_exists($previewPath)) unlink($previewPath);

  // Init CSS file
  file_put_contents($cssPath, ".icones{background-image:var(--link-iconsheet)}.icones.jeu{display:block;width:32px;height:32px;background-position:32px 32px}.icones.explain{display:inline-block;width:12px;height:12px;margin:3px 0;image-rendering:pixelated;background-position:32px 32px}");

  // Init HTML file
  file_put_contents($previewPath, '<head><style>html{width:100%;height:100%;--link-iconsheet:url("iconsheet.png");--color:black;}html.dark{--color:white}body{display:flex;flex-wrap:wrap;justify-content:space-between;margin:100px;background-color:#ccc;color:var(--color)}html.dark>body{background-color:#333}.container{border:1px solid var(--color);display:flex;justify-content:center;align-items:center;margin:5px;display:grid;grid-template-columns:68px 220px;overflow:hidden}.container{height:32px;grid-template-columns: 32px 256px}.container>div:not(.icones){padding:5px;font-size:.85em}a{color:blue}html.dark a{color:lightblue}</style><link rel="stylesheet"href="iconsheet.css"></head><body><main style="flex-basis:100%"><ul><li><a href="iconsheet.png">Link to image (iconsheet.png)</a></li><li><a href="iconsheet.css">Link to style sheet (iconsheet.css)</a></li><li><input type="checkbox" onclick="document.documentElement.classList.toggle(`dark`)" id="theme"> <label for="theme">Dark</label></li></ul></main>');

  // Create a blank image the right size
  $background = imagecreatetruecolor($width, $height);

  // Make that image transparent
  $transparentBackground = imagecolorallocatealpha($background, 0, 0, 0, 127);
  imagefill($background, 0, 0, $transparentBackground);
  imagesavealpha($background, true);
  
  $outputImage = $background;

  foreach($games as $i => $file)
  {
    // Create image from the icon file
    $icon = imagecreatefrompng('game-icons/' . $file);
    $name = str_replace('.png', '', $file);

    // Copy that icon to the output image
    imagecopy($outputImage, $icon, $currentPosition->x, $currentPosition->y, 0, 0, $gameSize->width, $gameSize->height);

    // Insert position into CSS file
    $css = '.icones.jeu.' . $name . '{background-position:-' . $currentPosition->x . 'px -' . $currentPosition->y . 'px}';
    file_put_contents($cssPath, $css, FILE_APPEND);

    // Create preview for preview page
    $html = '<div class="container pokemon"><div class="icones jeu ' . $name . '"></div><div>jeu ' . $name . '</div></div>';
    file_put_contents($previewPath, $html, FILE_APPEND);

    // Increment current position
    $currentPosition->x += $gameSize->width;
    if ($currentPosition->x + $gameSize->width > $width)
    {
      $currentPosition->x = $currentPosition->x % $width;
      $currentPosition->y += $gameSize->height;
    }
  }

  if ($currentPosition->x != 0) {
    $currentPosition->x = 0;
    $currentPosition->y += $gameSize->height;
  }

  $currentLine = 0;

  foreach($explain as $i => $file)
  {
    // Create image from the icon file
    $icon = imagecreatefrompng('explain-icons/' . $file->nom . '.png');

    // Copy that icon to the output image
    imagecopy($outputImage, $icon, $currentPosition->x, $currentPosition->y, 0, 0, $file->taille[0], $file->taille[1]);

    // Insert position into CSS file
    $css = '.icones.explain.' . $file->nom . '{background-position:-' . $currentPosition->x . 'px -' . $currentPosition->y . 'px}';
    if ($file->taille[0] != 12 || $file->taille[1] != 12)
      $css .= '.icones.explain.' . $file->nom . '{width:' . $file->taille[0] . 'px;height:' . $file->taille[1] .'px}';
    file_put_contents($cssPath, $css, FILE_APPEND);

    // Create preview for preview page
    $html = '<div class="container item"><div class="icones explain ' . $file->nom . '"></div><div>explain ' . $file->nom . '</div></div>';
    file_put_contents($previewPath, $html, FILE_APPEND);

    // Increment current position
    $currentPosition->x += $file->taille[0];
    if ($currentPosition->x + $file->taille[0] > $width)
    {
      $currentPosition->x = $currentPosition->x % $width;
      $currentPosition->y += $lines[$currentLine];
      $currentLine++;
    }

    if ($file->dark == 'true') {
      // Create image from the icon file
      $icon = imagecreatefrompng('explain-icons/' . $file->nom . '-dark.png');

      // Copy that icon to the output image
      imagecopy($outputImage, $icon, $currentPosition->x, $currentPosition->y, 0, 0, $file->taille[0], $file->taille[1]);

      // Insert position into CSS file
      $css = 'html.dark .icones.explain.' . $file->nom . ',:host-context(html.dark) .icones.explain.' . $file->nom . '{background-position:-' . $currentPosition->x . 'px -' . $currentPosition->y . 'px}';
      if ($file->taille[0] != 12 || $file->taille[1] != 12)
        $css .= '.icones.explain.' . $file->nom . '{width:' . $file->taille[0] . 'px;height:' . $file->taille[1] .'px}';
      file_put_contents($cssPath, $css, FILE_APPEND);

      // Increment current position
      $currentPosition->x += $file->taille[0];
      if ($currentPosition->x + $file->taille[0] > $width)
      {
        $currentPosition->x = $currentPosition->x % $width;
        $currentPosition->y += $lines[$currentLine];
        $currentLine++;
      }
    }
  }

  imagepng($outputImage, $imagePath, 9, PNG_NO_FILTER);

  if ($logs) echo '<br>' . date('Y-m-d H:i:s') . ' - Image créée !';
}

buildIconSheet(true);