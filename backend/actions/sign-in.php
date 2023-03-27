<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



/** Decodes and verifies a JSON web token. */
$jwt = User::jwt();
function verifyJWT(string $provider, string $token = ''): array {
  switch ($provider) {
    case 'google':
      require_once __DIR__.'/../composer/vendor/autoload.php';
      $CLIENT_ID = '255145207710-8jq1qg3o43venoa7l0un3mr5s3ep8j2n.apps.googleusercontent.com';
      $client = new Google_Client(['client_id' => $CLIENT_ID]);
      return $client->verifyIdToken($token);
      break;

    case 'shinydex':
      return $jwt->decode($token, true);
      break;

    default:
      throw new \Exception('ID provider not supported');
  }
}



$response = [];



if (!isset($_POST['challenge'])) {
  respondError('Missing data in POST body');
}

try {
  // Save code challenge
  $challenge = $_POST['challenge'];
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
    $accountID = null;
    $dbEntry = User::getDBEntry('shinydex', $user->userID);
  }
  
  // If the user is not already signed in, they're signing in with an ID provider
  else {
    // Verify the ID token
    $token = $_POST['token'] ?? '';
    $payload = $jwt->decode($token, false);
    $providerID = $payload['iss'] ?? '';
    $provider = match ($providerID) {
      'https://accounts.google.com' => 'google',
      default => $providerID
    };
    $providerUserID = verifyJWT($provider, $token)['sub'];
    $accountID = match ($providerID) {
      'https://accounts.google.com' => $payload['email'] ?? null,
      default => null
    };

    $user = new User($provider, $providerUserID);
    $dbEntry = User::getDBEntry($provider, $providerUserID);
  }

  $user->signIn();

  if ($accountID) $response['account'] = $accountID;
  $response['username'] = $dbEntry['username'] ?? null;
  $response['public'] = $dbEntry['public'] ?? false;
  $response['lastUpdate'] = $dbEntry['lastUpdate'] ?? '0';

  $response['success'] = 'Connection successful';
} catch (\Throwable $error) {
  $response['error'] = $error->getMessage();
}

respond($response);