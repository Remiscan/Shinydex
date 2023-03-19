<?php

/** 
 * Step 1: Get profile data from JavaScript
 */

if (!isset($_POST['username']) && !isset($_POST['public'])) {
  respondError('Profile data not received');
}

$username = $_POST['username'] ?? null;
$public = $_POST['public'] ?? null;



/**
 * Step 2: Update user profile
 */

try {
  $user->updateDBEntry($username, $public);
} catch (\Throwable $error) {
  respondError($error->getMessage());
}

respond(
  ['success' => 'Profile successfully updated']
);