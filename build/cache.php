<?php
$cache = array();
$cache['files'] = [
  "./index.php",
  "./images/app-icons/favicon.svg",
  "./images/app-icons/icon.svg",
  "./images/iconsheet.css",
  "./images/iconsheet.webp",
  "./images/pokemonsheet.css",
  "./images/pokemonsheet.webp",
  "../_common/polyfills/adoptedStyleSheets.min.js",
  "../_common/polyfills/es-module-shims.js",
  "../_common/polyfills/element-internals.js",
  "../_common/components/input-slider/input-slider.js",
  "../_common/components/input-switch/input-switch.js",
  "../_common/js/per-function-async-queue.js",
  "../colori/lib/dist/colori.min.js",
  "../colori/palette/palette.js",
];

$addDirToCache = function(string $dirPath, array $exclude = []) use (&$cache) {
  $filePaths = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator(
      $dirPath,
      RecursiveDirectoryIterator::SKIP_DOTS
    ),
    RecursiveIteratorIterator::SELF_FIRST
  );

  foreach($filePaths as $path => $obj) {
    if (is_dir($path)) continue;

    $pathRelativeToDir = str_replace($dirPath.'/', '', $path);
    if (in_array($pathRelativeToDir, $exclude)) continue;

    $pathRelativeToAppRoot = str_replace(dirname(__DIR__, 1), '.', $path);
    $cache['files'][] = $pathRelativeToAppRoot;
  }
};

$addDirToCache(dirname(__DIR__, 1).'/ext', exclude: ['README.md']);
$addDirToCache(dirname(__DIR__, 1).'/pages');
$addDirToCache(dirname(__DIR__, 1).'/styles');
$addDirToCache(dirname(__DIR__, 1).'/dist');

file_put_contents(__DIR__.'/../cache.json', json_encode($cache, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo date('Y-m-d H:i:s') . " cache.json built!\n";