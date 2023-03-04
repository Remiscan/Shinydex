<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



if (!User::isLoggedIn()) {
  respondError('User is not logged in');
}

try {
  $user = User::getFromCookies();
} catch (\Throwable $error) {
  respondError($error->getMessage());
}


$provider = $user->getProvider();
$provideruserid = $user->getProviderUserId();

$db = new BDD();

// Get database user id
try {
  $userid = $user->getDBUserId($db);
} catch (\Throwable $error) {
  respondError($error->getMessage());
}

// Remove all user data from all database tables
foreach(['shinydex_pokemon', 'shinydex_deleted_pokemon'] as $table) {
  $delete = $db->prepare("DELETE FROM $table WHERE userid = :userid");
  $delete->bindParam(':userid', $userid, PDO::PARAM_STR, 36);
  $delete->execute();
}
$user->deleteDBEntry($db);

User::signOut();

respond([
  'success' => 'Data successfully deleted'
]);