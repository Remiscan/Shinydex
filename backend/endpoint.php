<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



header('Content-Type: application/json');

function respond($data) {
  echo json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
}

function respondError($message) {
  echo json_encode(['error' => $message], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
  exit;
}



$request = $_GET['request'] ?? 'null';
switch ($request) {
  case 'get-file-versions':
  case 'get-all-sprites':
  case 'sign-in':
  case 'sign-out':
  case 'sync-backup':
  case 'delete-user-data':
  case 'update-user-profile':
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

    require $_SERVER['DOCUMENT_ROOT']."/shinydex/backend/actions/$request.php";
    break;

  default:
    respondError('No such action');
}