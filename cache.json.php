<?php
require_once './backend/cache.php';

$cache = getCacheFiles();
echo json_encode($cache, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);