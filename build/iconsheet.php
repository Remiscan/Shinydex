<?php
function buildIconSheet(int $columns = 24, int $iconSize = 32, string $format = 'webp', bool $logs = true) {
  $iconData = [
    'game' => [
      'path' => __DIR__.'/../images/game-icons',
    ],
    'ball' => [
      'path' => __DIR__.'/../images/item-icons/ball',
    ],
    'key' => [
      'path' => __DIR__.'/../images/item-icons/key',
    ],
    'gene' => [
      'path' => __DIR__.'/../images/misc-icons/gene',
    ],
    'origin-mark' => [
      'path' => __DIR__.'/../images/misc-icons/origin-mark',
    ],
    'other' => [
      'path' => __DIR__.'/../images/misc-icons/other',
    ]
  ];

  // Count icons
  $totalIcons = 0;
  foreach ($iconData as $group => $data) {
    $iconFiles = array_filter(scandir($data['path']), function($file) use ($data) {
      return !is_dir($data['path']."/$file");
    });
    $totalIcons += count($iconFiles);
  }

  $totalSize = [
    'width' => $columns * $iconSize,
    'height' => (intdiv($totalIcons, $columns) + 1) * $iconSize
  ];

  // Current position
  $x = $iconSize; // leave the first cell empty
  $y = 0;

  $imagePath = __DIR__.'/../images/iconsheet.'.$format;
  $cssPath = __DIR__.'/../images/iconsheet.css';
  $previewPath = __DIR__.'/../images/iconsheet.html';

  // If files already exist, remove them
  foreach ([$imagePath, $cssPath, $previewPath] as $path) {
    if (file_exists($path)) unlink($path);
  }

  // Initialize CSS file
  file_put_contents($cssPath, ".icon {background-image: var(--link-iconsheet);background-repeat: no-repeat;display: inline-block;width:32px;height:32px}.icon[data-icon^=\"ball/\"]{scale:.6}.icon[data-icon^=\"game/\"]{border-radius:calc(.5 * var(--border-radius))}");

  // Initialize preview file
  file_put_contents($previewPath, <<<preview
    <html class="light">
      <head>
        <meta charset="utf-8">
        <style>
          html {
            width:100%;
            height:100%;
            --link-iconsheet:url("iconsheet.$format");
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
            height:{$iconSize}px;
            grid-template-columns: {$iconSize}px 220px
          }
          
          .container > div:not(.icon) {
            padding:5px;
          }

          a {
            color:blue
          }
          
          html.dark a{
            color:lightblue
          }
        </style>
        <link rel="stylesheet"href="iconsheet.css">
      </head>

      <body>
        <main style="flex-basis:100%">
          <ul>
            <li>
              <a href="iconsheet.webp">Link to image (iconsheet.webp)</a>
            </li>
            <li>
              <a href="iconsheet.css">Link to style sheet (iconsheet.css)</a>
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
  foreach ($iconData as $group => $data) {
    $iconFiles = array_filter(scandir($data['path']), function($file) use ($data) {
      return !is_dir($data['path']."/$file");
    });

    foreach ($iconFiles as $file) {
      $fileUrl = $data['path']."/$file";
      $id = strtolower(str_replace('.png', '', "$group/$file"));

      $icon = imagecreatefrompng($fileUrl);

      // Copy (and resize) the sprite onto the sheet
      $startSize = getimagesize($fileUrl);
      if ($iconSize === $startSize[0] && $iconSize === $startSize[1]) imagecopy($sheet, $icon, $x, $y, 0, 0, $iconSize, $iconSize); // better quality
      else imagecopyresampled($sheet, $icon, $x, $y, 0, 0, $iconSize, $iconSize, $startSize[0], $startSize[1]);

      // Insert position into CSS file
      file_put_contents($cssPath, ".icon[data-icon=\"$id\"]{background-position: -{$x}px -{$y}px}", FILE_APPEND);

      // Insert sprite on preview page
      file_put_contents($previewPath, <<<preview
        <div class="container">
          <div class="icon" data-icon="$id"></div>
          <div>$id</div>
        </div>
      preview, FILE_APPEND);

      if ($logs) echo "icon $id added to sheet\n";

      // Increment current position
      $x += $iconSize;
      if ($x + $iconSize > $totalSize['width']) {
        $x = $x % $totalSize['width'];
        $y += $iconSize;
      }
    }
  }

  switch ($format) {
    case 'webp':
      imagewebp($sheet, $imagePath, 100);
      break;
    case 'avif':
      imageavif($sheet, $imagePath, 100);
      break;
    case 'png':
    default:
      imagepng($sheet, $imagePath, 9, PNG_NO_FILTER);
  }

  if ($logs) echo date('Y-m-d H:i:s') . " sheet created!\n";
}



buildIconSheet();