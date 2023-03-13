<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



$response = [];



$body = json_decode(
  file_get_contents('php://input'),
  true
);

if (!isset($body['challenge'])) {
  respondError('Missing data in POST body');
}

try {
  // Save code challenge
  $challenge = $body['challenge'];
  setcookie('code-challenge', $challenge, [
    'expires' => time() + 60 * 60 * 24 * 30 * 6, // 6 months
    'secure' => true,
    'samesite' => 'Strict',
    'path' => '/shinydex/',
    'httponly' => true
  ]);

  // If the user has a refresh token
  // (it does not matter if they are already signed in, the session will be refreshed anyway)
  if (isset($_COOKIE['refresh'])) {
    $user = User::getFromRefreshToken();
  }
  
  // If the user is not already signed in, they're signing in with an ID provider
  else {
    // Verify the ID token
    $token = $body['token'] ?? '';
    $payload = $jwt->decode($token, false);
    $providerID = $payload['iss'] ?? '';
    $provider = match ($providerID) {
      'https://accounts.google.com' => 'google',
      default => $providerID
    };
    $providerUserID = verifyJWT($provider, $token)['sub'];

    $user = new User($provider, $providerUserID, true);
  }

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