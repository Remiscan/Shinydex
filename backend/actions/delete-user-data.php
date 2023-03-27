<?php
$user->deleteAllData();
$user->signOut();

respond([
  'success' => 'Data successfully deleted'
]);