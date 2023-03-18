<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



header('Content-Type: application/json');

function respond(mixed $data) {
  echo json_encode($data, JSON_UNESCAPED_SLASHES);
}

function respondError(string $message) {
  echo json_encode(['error' => $message], JSON_UNESCAPED_SLASHES);
  exit;
}



$request = $_GET['request'] ?? 'null';
$sessionNeeded = false;
switch ($request) {
  // Do not need user to be signed in
  case 'get-file-versions':
  case 'get-all-sprites':
  case 'check-public-user':
  case 'sign-in':
    $sessionNeeded = false;
    break;

  // Need user to be signed in
  case 'sign-out':
  case 'sync-backup':
  case 'delete-user-data':
  case 'update-user-profile':
    $sessionNeeded = true;
    break;
  
  default:
    respondError('No such action');
}

if ($sessionNeeded) {
  // Get stored code challenge
  if (!isset($_COOKIE['code-challenge'])) {
    respondError('Missing code challenge');
  }
  $codeChallenge = $_COOKIE['code-challenge'];

  // Get code verifier sent by frontend
  if (!isset($_POST['session-code-verifier'])) {
    respondError('Missing code verifier in POST body');
  }
  $codeVerifier = $_POST['session-code-verifier'];

  // Validate code verifier
  $potentialCodeChallenge = hash('sha256', $codeVerifier);
  if ($potentialCodeChallenge !== $codeChallenge) {
    respondError('Code verifier does not correspond');
  }

  // Get user associated to current session or refresh token
  // (from current session, so that there is no need to sign in again for a time after signing in)
  // (from refresh token, so that if the session expires while the user is using the app, they will be signed in automatically again)
  $user = User::getFromAnyToken();
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