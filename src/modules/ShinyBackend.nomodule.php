<?php
header('Content-Type: application/javascript');

ob_start();
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/dist/modules/ShinyBackend.js';
$body = ob_get_clean();

echo preg_replace('/^export /m', '', $body);