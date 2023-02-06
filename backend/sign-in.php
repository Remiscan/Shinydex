<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



header('Content-Type: application/json');

function respond($data) {
  echo json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
}

$response = [];



$body = json_decode(
  file_get_contents('php://input'),
  true
);

if (!isset($body['credential'])) {
  $response['error'] = 'No ID token in POST body';
  respond($response);
  exit;
}

try {
  $user = new User($body['provider'], $body['credential']);
  $user->signIn();
  $response['success'] = 'Connection successful';
} catch (\Throwable $error) {
  $response['error'] = $error->getMessage();
}

try {
  $dbEntry = $user->getDBEntry(new BDD());
  $response['username'] = $dbEntry['username'] ?? '';
  $response['public'] = $dbEntry['public'] ?? false;
} catch (\Throwable $error) {
  $response['error'] = $error->getMessage();
}

respond($response);