<?php
function getCacheFiles() {
  $cache = array();
  $cache['fichiers'] = [
      "./",
      "./images/app-icons/favicon.svg",
      "./images/app-icons/icon.svg",
      "./ext/pokesprite.css",
      "./ext/pokesprite.png",
      "./ext/localforage.min.js",
      "./ext/material_icons.css",
      "./ext/material_icons.woff2",
      "./images/iconsheet.css",
      "./images/iconsheet.png",
      "./styles.css.php",
      "../_common/polyfills/adoptedStyleSheets.min.js",
      "../_common/polyfills/es-module-shims.js",
      "../_common/components/input-switch/input-switch.js",
      "../_common/components/input-switch/styles.css",
      "../_common/components/input-switch/template.js"
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