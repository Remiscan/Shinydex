<?php

header('Content-Type: application/json');

function respond($data) {
  echo json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
}

$response = [];



require_once __DIR__.'/verify-id-token.php';

$body = json_decode(
  file_get_contents('php://input'),
  true
);

if (!isset($body['credential'])) {
  $response['error'] = 'No ID token in POST body';
  respond($response);
  exit;
}

$payload = verifyIdToken($body['provider'], $body['credential']);



if ($payload) {
  $cookieOptions = [
    'expires' => time() + 60 * 55, // 55 minutes
    'secure' => true,
    'samesite' => 'Strict',
    'path' => '/shinydex/'
  ];

  setcookie('id-jwt', $body['credential'], [
    ...$cookieOptions,
    'httponly' => true
  ]);

  setcookie('id-provider', $body['provider'], [
    ...$cookieOptions,
    'httponly' => true
  ]);

  setcookie('user', $payload['sub'], [
    ...$cookieOptions,
    'httponly' => true
  ]);

  setcookie('loggedin', 'true', $cookieOptions);

  $response['success'] = 'Connection successful';
  respond($response);
} else {
  $cookieOptions = [
    'expires' => time() - 3600,
    'secure' => true,
    'samesite' => 'Strict',
    'path' => '/shinydex/'
  ];

  setcookie('id-jwt', '', [
    ...$cookieOptions,
    'httponly' => true
  ]);

  setcookie('id-provider', '', [
    ...$cookieOptions,
    'httponly' => true
  ]);

  setcookie('user', '', [
    ...$cookieOptions,
    'httponly' => true
  ]);

  setcookie('loggedin', '', $cookieOptions);

  $response['error'] = 'Invalid ID token';
  respond($response);
}