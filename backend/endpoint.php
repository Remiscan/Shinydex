<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



header('Content-Type: application/json');

function respond(mixed $data) {
  echo json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
}

function respondError(string $message) {
  echo json_encode(['error' => $message], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
  exit;
}



$request = $_GET['request'] ?? 'null';
$sessionNeeded = false;
switch ($request) {
  // Do not need user to be signed in
  case 'get-file-versions':
  case 'get-all-sprites':
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
  $codeChallenge = $_COOKIE['code-challenge'];

  // Get code verifier sent by frontend
  if (!isset($_POST['session-code-verifier'])) {
    respondError('Missing code verifier in POST body');
  }
  $codeVerifier = $_POST['session-code-verifier'];
  if (strlen($codeVerifier) <= 32) {
    respondError('Invalid code verifier in POST body');
  }

  // Validate code verifier
  $potentialCodeChallenge = hash('sha256', $codeVerifier);
  if ($potentialSessionID !== $currentSessionID || $hashedPotentialSessionID !== $hashedCurrentSessionID) {
    respondError('Invalid user session');
  }

  // Get user associated to current session ID from database
  $user = User::getFromAccessToken();
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
break;