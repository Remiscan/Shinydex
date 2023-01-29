<?php
function verifyIdToken(string $provider, string|null $token = null) {
  switch ($provider) {
    case 'google':
      require_once __DIR__.'/composer/vendor/autoload.php';
      $CLIENT_ID = '255145207710-8jq1qg3o43venoa7l0un3mr5s3ep8j2n.apps.googleusercontent.com';
      $client = new Google_Client(['client_id' => $CLIENT_ID]);
      return $client->verifyIdToken($token);
      break;

    default:
      throw new \Exception('ID provider not supported');
  }
}