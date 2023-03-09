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
  session_start();

  // Get code verifier sent by frontend
  if (!isset($_POST['session-code-verifier'])) {
    respondError('Missing code verifier in POST body');
  }

  $codeVerifier = $_POST['session-code-verifier'];
  if (strlen($codeVerifier) <= 32) {
    respondError('Invalid code verifier in POST body');
  }

  $secret = fn() => rtrim(file_get_contents('/run/secrets/shinydex_auth_secret'));

  // Get current session ID from cookie
  $currentSessionID = $_COOKIE['session'] ?? '';
  $hashedCurrentSessionID = hash('sha256', $currentSessionID . $secret());

  // Get user associated to current session ID from database
  if (isset($_SESSION['current_userID'])) {
    $userID = $_SESSION['current_userID'];
  } else {
    $db = new BDD();
    $userID = $db->prepare("SELECT * FROM shinydex_user_sessions WHERE `challenge` = :challenge LIMIT 1");
    $userID->bindParam(':challenge', $hashedCurrentSessionID, PDO::PARAM_STR, 128);
    $userID->execute();
    if (!$userID) {
      respondError('User session does not exist');
    }
    $userID = $userID->fetch(PDO::FETCH_ASSOC);
    $userID = $userID['userid'] ?? '';
    $_SESSION['current_userID'] = $userID;
    $db = NULL;
  }

  // Validate code verifier
  $potentialCodeChallenge = hash('sha256', $codeVerifier);
  $potentialSessionID = hash('sha256', $potentialCodeChallenge . $userID . $secret());
  $hashedPotentialSessionID = hash('sha256', $potentialSessionID . $secret());
  if ($potentialSessionID !== $currentSessionID || $hashedPotentialSessionID !== $hashedCurrentSessionID) {
    respondError('Invalid user session');
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
break;