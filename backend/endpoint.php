<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



header('Content-Type: application/json');

function respond(mixed $data) {
  echo json_encode($data, JSON_UNESCAPED_SLASHES);
}

function respondError(mixed $error) {
  if ($error instanceof \Throwable) {
    $returns = [
      'error' => $error->getMessage(),
      'details' => $error->__toString()
    ];
  } else {
    $returns = [
      'error' => $error
    ];
  }

  echo json_encode($returns, JSON_UNESCAPED_SLASHES);
  exit;
}



$request = $_GET['request'] ?? 'null';
$sessionNeeded = false;
$sessionOptional = false;
switch ($request) {
  // Do not need user to be signed in
  case 'get-file-versions':
  case 'get-all-sprites':
  case 'check-public-user-exists':
  case 'get-friend-data':
  case 'get-feed-data':
  case 'check-username-available':
  case 'sign-in':
    $sessionNeeded = false;
    break;

  // Do not need user to be signed in, but improve experience if they are
  case 'send-congratulation':
    $sessionNeeded = false;
    $sessionOptional = true;
    break;

  // Need user to be signed in
  case 'sign-out':
  case 'sync-pokemon':
  case 'sync-pokemon-step-1':
  case 'sync-pokemon-step-2':
  case 'sync-friends':
  case 'delete-user-data':
  case 'update-user-profile':
  case 'get-vapid-public-key':
  case 'save-push-subscription':
  case 'delete-push-subscription':
    $sessionNeeded = true;
    break;
  
  default:
    respondError('No such action');
}

if ($sessionNeeded || $sessionOptional) {
  try {
    // Get stored code challenge
    if (!isset($_COOKIE['code-challenge'])) {
      throw new \Exception('Missing code challenge');
    }
    $codeChallenge = $_COOKIE['code-challenge'];

    // Get code verifier sent by frontend
    if (!isset($_POST['session-code-verifier'])) {
      throw new \Exception('Missing code verifier in POST body');
    }
    $codeVerifier = $_POST['session-code-verifier'];

    // Validate code verifier
    $potentialCodeChallenge = hash('sha256', $codeVerifier);
    if ($potentialCodeChallenge !== $codeChallenge) {
      throw new \Exception('Code verifier does not correspond');
    }

    // Get user associated to current session or refresh token
    // (from current session, so that there is no need to sign in again for a time after signing in)
    // (from refresh token, so that if the session expires while the user is using the app, they will be signed in automatically again)
    $user = User::getFromAnyToken();
  } catch (\Throwable $error) {
    $user = null;
    if ($sessionNeeded) respondError($error->getMessage());
  }
}



function debounce(string $request) {
  // Check if last call was recent enough for this new call to be ignored
  $cookieName = "last-call-$request";
  $minDelay = 1; // minimum number of seconds allowed between calls to backend
  $lastCall = $_COOKIE[$cookieName] ?? 0;
  $now = time();
  
  if ($lastCall + $minDelay >= $now) {
    respondError('Too soon, try again later');
  } else {
    setcookie($cookieName, $now, [
      'expires' => $now + $minDelay,
      'secure' => true,
      'samesite' => 'Strict',
      'path' => '/shinydex/',
      'httponly' => true
    ]);
  }
}

debounce($request);
require $_SERVER['DOCUMENT_ROOT']."/shinydex/backend/actions/$request.php";