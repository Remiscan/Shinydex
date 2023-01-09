<?php
$sprites = array_values(
  array_diff(
    scandir(dirname(__DIR__, 1).'/images/pokemon-sprites/webp/112'),
    ['.', '..']
  )
);
echo json_encode($sprites, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);