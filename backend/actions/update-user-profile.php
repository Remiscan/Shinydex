<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



header('Content-Type: application/json');

$response = [];



/** 
 * Step 1: Get profile data from JavaScript
 */

 if (!isset($_POST['username']) || !isset($_POST['public'])) {
  respondError('Profile data not received');
}

$username = $_POST['username'];
$public = $_POST['public'];



/**
 * Step 2: Get user
 */

if (!User::isLoggedIn()) {
  respondError('User is not logged in');
}

try {
  $user = User::getFromCookies();
} catch (\Throwable $error) {
  respondError($error->getMessage());
}



/**
 * Step 3: Update user profile
 */

$db = new BDD();

// Get database user id
try {
  $user->updateDBprofile($db, $username, $public);
} catch (\Throwable $error) {
  respondError($error->getMessage());
}

respond(
  ['success' => 'Profile successfully updated']
);