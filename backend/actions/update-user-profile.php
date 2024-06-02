<?php

/** 
 * Step 1: Get profile data from JavaScript
 */

if (!isset($_POST['username']) && !isset($_POST['public']) && !isset($_POST['appearInFeed'])) {
  respondError('Profile data not received');
}

$username = $_POST['username'] ?? null;
$public = $_POST['public'] ?? null;
$appearInFeed = $_POST['appearInFeed'] ?? null;



/**
 * Step 2: Update user profile
 */

try {
  $user->updateDBEntry(
    username: trim($username),
    public: $public,
    appearInFeed: $appearInFeed
  );
} catch (\Throwable $error) {
  respondError($error);
}

respond(
  ['success' => 'Profile successfully updated']
);