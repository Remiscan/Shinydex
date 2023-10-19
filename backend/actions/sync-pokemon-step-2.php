<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = $user->userID;
$jwt = User::jwt();



/** 
 * Step 1: Get local data from JavaScript
 */

if (!isset($_POST['inserts']) || !isset($_POST['updates']) || !isset($_POST['restores'])) {
  respondError('Local data not received');
}

$to_insert_online = json_decode($_POST['inserts'], true);
$to_update_online = json_decode($_POST['updates'], true);
$to_restore_online_ids = json_decode($_POST['restores'], true);



/**
 * Step 2: Verify the sync session code.
 */

$allIds = array_merge(
  array_map(fn($s) => $s['huntid'], $to_insert_online),
  array_map(fn($s) => $s['huntid'], $to_update_online),
  $to_restore_online_ids
);
asort($allIds);
$potential_sync_session_code = base64_encode(
  join(',', $allIds)
);

if ($jwt->sign($potential_sync_session_code) !== ($_COOKIE['sync-session-code'] ?? 'null')) {
  respondError('Invalid sync session');
}

$cookieOptions = [
  'expires' => time() - 3600, // in the past, so the browser immediately deletes the cookie
  'secure' => true,
  'samesite' => 'Strict',
  'path' => '/shinydex/',
  'httponly' => true
];

setcookie('sync-session-code', '', $cookieOptions);



/**
 * Step 3: Update online database with newer local data.
 */

$results = [];

foreach($to_insert_online as $key => $shiny) {
  $insert = $db->prepare("INSERT INTO `shinydex_pokemon` (
    `huntid`,
    `userid`,
    `creationTime`,
    `lastUpdate`,

    `dexid`,
    `forme`,
    `game`,
    `method`,
    `count`,
    `charm`,

    `catchTime`,
    `name`,
    `ball`,
    `gene`,

    `notes`
  ) VALUES (
    :huntid,
    :userid,
    :creationTime,
    :lastUpdate,

    :dexid,
    :forme,
    :game,
    :method,
    :count,
    :charm,

    :catchTime,
    :nickname,
    :ball,
    :gene,

    :notes
  )");

  $insert->bindParam(':huntid', $shiny['huntid'], PDO::PARAM_STR, 36);
  $insert->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
  $insert->bindParam(':creationTime', $shiny['lastUpdate'], PDO::PARAM_STR, 13);
  $insert->bindParam(':lastUpdate', $shiny['lastUpdate'], PDO::PARAM_STR, 13);

  $insert->bindParam(':dexid', $shiny['dexid'], PDO::PARAM_INT, 4);
  $insert->bindParam(':forme', $shiny['forme'], PDO::PARAM_STR, 50);
  $insert->bindParam(':game', $shiny['game'], PDO::PARAM_STR, 50);
  $insert->bindParam(':method', $shiny['method'], PDO::PARAM_STR, 50);
  $insert->bindParam(':count', $shiny['count']);
  $insert->bindParam(':charm', $shiny['charm'], PDO::PARAM_INT, 1);

  $insert->bindParam(':catchTime', $shiny['catchTime'], PDO::PARAM_STR, 13);
  $insert->bindParam(':nickname', $shiny['name'], PDO::PARAM_STR, 50);
  $insert->bindParam(':ball', $shiny['ball'], PDO::PARAM_STR, 50);
  $insert->bindParam(':gene', $shiny['gene'], PDO::PARAM_STR, 50);

  $insert->bindParam(':notes', $shiny['notes']);

  $results[] = $insert->execute();
}


foreach($to_update_online as $key => $shiny) {
  $update = $db->prepare('UPDATE `shinydex_pokemon` SET 
    `lastUpdate` = :lastUpdate,

    `dexid` = :dexid,
    `forme` = :forme,
    `game` = :game,
    `method` = :method,
    `count` = :count,
    `charm` = :charm,

    `catchTime` = :catchTime,
    `name` = :nickname,
    `ball` = :ball,
    `gene` = :gene,

    `notes` = :notes
  WHERE `huntid` = :huntid AND `userid` = :userid');

  $update->bindParam(':huntid', $shiny['huntid'], PDO::PARAM_STR, 36);
  $update->bindParam(':userid', $userID, PDO::PARAM_STR, 36);

  $update->bindParam(':lastUpdate', $shiny['lastUpdate'], PDO::PARAM_STR, 13);

  $update->bindParam(':dexid', $shiny['dexid'], PDO::PARAM_INT, 4);
  $update->bindParam(':forme', $shiny['forme'], PDO::PARAM_STR, 50);
  $update->bindParam(':game', $shiny['game'], PDO::PARAM_STR, 50);
  $update->bindParam(':method', $shiny['method'], PDO::PARAM_STR, 50);
  $update->bindParam(':count', $shiny['count']);
  $update->bindParam(':charm', $shiny['charm'], PDO::PARAM_INT, 1);

  $update->bindParam(':catchTime', $shiny['catchTime'], PDO::PARAM_STR, 13);
  $update->bindParam(':nickname', $shiny['name'], PDO::PARAM_STR, 50);
  $update->bindParam(':ball', $shiny['ball'], PDO::PARAM_STR, 50);
  $update->bindParam(':gene', $shiny['gene'], PDO::PARAM_STR, 50);

  $update->bindParam(':notes', $shiny['notes']);

  $results[] = $update->execute();
}


foreach($to_restore_online_ids as $key => $huntid) {
  $delete = $db->prepare('DELETE FROM shinydex_deleted_pokemon WHERE huntid = :huntid AND userid = :userid');

  $delete->bindParam(':huntid', $huntid, PDO::PARAM_STR, 36);
  $delete->bindParam(':userid', $userID, PDO::PARAM_STR, 36);

  $results[] = $delete->execute();
}



/**
 * Step 4: Send results to the frontend.
 */

echo json_encode(array(
  'results' => $results
), JSON_PRETTY_PRINT);