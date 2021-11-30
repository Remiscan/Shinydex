<?php
$cache = array();
$cache['fichiers'] = [
    "./",
    "./images/app-icons/apple-touch-icon.png",
    "./images/app-icons/icon-192.png",
    "./ext/pokesprite.css",
    "./ext/pokesprite.png",
    "./ext/localforage.min.js",
    "./ext/material_icons.css",
    "./ext/material_icons.woff2",
    "./images/iconsheet.css",
    "./images/iconsheet.png",
    "./images/shinystars.svg",
    "./styles.css.php",
    "../_common/polyfills/adoptedStyleSheets.min.js",
    "../_common/polyfills/es-module-shims.js"
];

$modules = new RecursiveIteratorIterator(
new RecursiveDirectoryIterator(
    __DIR__.'/modules',
    RecursiveDirectoryIterator::SKIP_DOTS
),
RecursiveIteratorIterator::SELF_FIRST
);
foreach($modules as $mod => $obj) {
    if (is_dir($mod)) continue;
    $cache['fichiers'][] = str_replace(__DIR__, '.', $mod);
}

echo json_encode($cache, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);