<?php
$sprites = [
  'files' => [],
  'size' => 0
];

$dir = dirname(__DIR__, 1).'/images/pokemon-sprites/webp/112';
$fsIterator = new FilesystemIterator($dir, FilesystemIterator::SKIP_DOTS);
foreach($fsIterator as $path => $obj) {
  if ($obj->isFile()) {
    $sprites['files'][] = str_replace($dir.'/', '', $path);
    $sprites['size'] += $obj->getSize();
  }
}

echo json_encode($sprites, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);