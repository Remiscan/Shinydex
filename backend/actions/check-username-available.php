<?php

// Get requested username from the frontend
if (isset($_POST['username'])) {
  $username = trim($_POST['username']);
  // Get the corresponding user's data if they exist
  $checkedUser = User::getDBEntry('shinydex', $username);
  if (!$checkedUser) {
    respond(['available' => true]);
  } else if ($checkedUser && isset($checkedUser['username']) && $checkedUser['username'] === $username) {
    respond(['available' => false]);
  }
  exit;
}

respond(['error' => 'Error while checking username availability']);