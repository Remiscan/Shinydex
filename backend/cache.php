<?php
function getCacheFiles() {
  $cache = array();
  $cache['fichiers'] = [
    "./",
    "./images/app-icons/favicon.svg",
    "./images/app-icons/icon.svg",
    "./ext/localforage.min.js",
    "./ext/material_icons.css",
    "./ext/material_icons.woff2",
    "./images/iconsheet.css",
    "./images/iconsheet.webp",
    "./images/pokemonsheet.css",
    "./images/pokemonsheet.webp",
    "./data/pokemon.json",
    "./strings/games.json",
    "./strings/methods.json",
    "./styles/themes.css.php",
    "./styles/common.css",
    "./styles/app.css",
    "../_common/polyfills/adoptedStyleSheets.min.js",
    "../_common/polyfills/es-module-shims.js",
    "../_common/polyfills/inert.min.js",
    "../_common/components/input-switch/input-switch.js"
  ];

  $modules = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator(
      dirname(__DIR__, 1).'/modules',
      RecursiveDirectoryIterator::SKIP_DOTS
    ),
    RecursiveIteratorIterator::SELF_FIRST
  );
  foreach($modules as $mod => $obj) {
    if (is_dir($mod)) continue;
    $cache['fichiers'][] = str_replace(dirname(__DIR__, 1), '.', $mod);
  }

  return $cache;
}