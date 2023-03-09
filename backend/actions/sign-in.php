<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



$response = [];



$body = json_decode(
  file_get_contents('php://input'),
  true
);

if (!isset($body['codeChallenge'])) {
  respondError('Missing data in POST body');
}

try {
  if (isset($_COOKIE['session'])) {
    $user = User::getFromCookies();
  } else {
    $user = new User($body);
  }

  $challenge = $body['codeChallenge'];
  $user->signIn($challenge);
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