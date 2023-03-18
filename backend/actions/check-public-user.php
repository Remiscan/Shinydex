<?php

// Get requested username from the frontend
if (isset($_POST['username'])) {
  // Get the corresponding user's data if they exist
  $checkedUser = User::getDBEntry('shinydex', $_POST['username']);
  if ($checkedUser && isset($checkedUser['public']) && $checkedUser['public'] === true) {
    respond(['matches' => true]);
    exit;
  }
}

respond(['matches' => false]);