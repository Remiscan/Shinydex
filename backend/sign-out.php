<?php

header('Content-Type: application/json');

function respond($data) {
  echo json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
}

$response = [];

$cookieOptions = [
  'expires' => time() - 3600,
  'secure' => true,
  'samesite' => 'Strict',
  'path' => '/shinydex/'
];

setcookie('jwt', '', [
  ...$cookieOptions,
  'httponly' => true
]);

setcookie('user', '', [
  ...$cookieOptions,
  'httponly' => true
]);

setcookie('loggedin', '', $cookieOptions);

$response['success'] = 'signed out';
respond($response);