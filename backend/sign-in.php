<?php

header('Content-Type: application/json');

function respond($data) {
  echo json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
}

$response = [];



// Verify ID token

require_once __DIR__.'/composer/vendor/autoload.php';

$body = json_decode(
  file_get_contents('php://input'),
  true
);

if (!isset($body['credential'])) {
  $response['error'] = 'No ID token in POST body';
  respond($response);
  exit;
}
$id_token = $body['credential'];

$CLIENT_ID = '255145207710-8jq1qg3o43venoa7l0un3mr5s3ep8j2n.apps.googleusercontent.com';
$client = new Google_Client(['client_id' => $CLIENT_ID]);
$payload = $client->verifyIdToken($id_token);
if ($payload) {
  $cookieOptions = [
    'expires' => time() + 365*60*3600,
    'secure' => true,
    'samesite' => 'Strict',
    'path' => '/shinydex/'
  ];

  setcookie('jwt', $id_token, [
    ...$cookieOptions,
    'httponly' => true
  ]);

  setcookie('user', json_encode([
    'provider' => 'google',
    'id' => $payload['sub']
  ]), [
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

  setcookie('jwt', '', $cookieOptions);
  setcookie('user', '', $cookieOptions);
  setcookie('loggedin', '', $cookieOptions);

  $response['error'] = 'Invalid ID token';
  respond($response);
}