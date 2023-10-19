<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = $user->userID;
$jwt = User::jwt();



/** 
 * Step 1: Get local data from JavaScript
 */

if (!isset($_POST['local-data']) || !isset($_POST['deleted-local-data'])) {
  respondError('Local data not received');
}

$local_data = json_decode($_POST['local-data'], true);
$local_deleted_data = json_decode($_POST['deleted-local-data'], true);



/**
 * Step 2: Get user's Pokémon from online database,
 * including his deleted Pokémon.
 */

$online_data = $db->prepare('SELECT * FROM `shinydex_pokemon` WHERE `userid` = :userid ORDER BY id DESC');
$online_data->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
$online_data->execute();
$online_data = $online_data->fetchAll(PDO::FETCH_ASSOC);

$online_deleted_data = $db->prepare('SELECT * FROM `shinydex_deleted_pokemon` WHERE `userid` = :userid ORDER BY id DESC');
$online_deleted_data->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
$online_deleted_data->execute();
$online_deleted_data = $online_deleted_data->fetchAll(PDO::FETCH_ASSOC);



/**
 * Step 3: Compare local data with online database data
 * 
 * 1: local_data       2: local_deleted_data
 * A: online_data      B: online_deleted_data
 * 
 * 1-: insert into online db => to_insert_online
 * 1A: compare lastUpdate
 *     - if more recent in local_data, update into online db => to_update_online
 *     - if more recent in online_data, update into local db => to_update_local
 * 1B: compare lastUpdate
 *     - if more recent in local_data, insert into online db and delete from online deleted db => to_insert_online && to_restore_online
 *     - if more recent in online_deleted_data, delete and mark as to destroy in local db => to_delete_local
 * 2-: do nothing
 * 2A: compare lastUpdate
 *     - if more recent in local_deleted_data, insert into online deleted db and delete from online db => to_delete_online
 *     - if more recent in online_data, insert into local db and delete from local deleted db => to_insert_local && to_restore_local
 * 2B: mark as to destroy in local deleted db => to_delete_local
 * A-: insert into local db => to_insert_local
 * B-: do nothing
 */

$to_insert_online_ids = []; // Pokémon from local_data that don't exist in online_data or online_deleted_data
$to_update_online_ids = []; // Pokémon from local_data that exist in online_data and are more recent in local_data
$to_delete_online = []; // Pokémon from local_deleted_data that exist in online_data and are more recent in local_deleted_data
$to_restore_online_ids = []; // Pokémon from local_data that exist in online_deleted_data and are more recent in local_data

$to_insert_local = []; // Pokémon from online_data that don't exist in local_data or local_deleted_data
$to_update_local = []; // Pokémon from online_data that exist in local_data and are more recent in online_data
$to_delete_local = []; // Pokémon from online_deleted_data that exist in local_data and are more recent in online_deleted_data


// 1:
foreach($local_data as $key => $local_shiny) {
  $is_online_key = array_search($local_shiny['huntid'], array_column($online_data, 'huntid'));
  $is_online_deleted_key = array_search($local_shiny['huntid'], array_column($online_deleted_data, 'huntid'));

  // 1-:
  if ($is_online_key === false && $is_online_deleted_key === false) {
    $to_insert_online_ids[] = $local_shiny['huntid'];
  }
  // 1A:
  else if ($is_online_key !== false) {
    $online_shiny = $online_data[$is_online_key];
    if ($local_shiny['lastUpdate'] > $online_shiny['lastUpdate']) {
      $to_update_online_ids[] = $local_shiny['huntid'];
    } else if ($local_shiny['lastUpdate'] < $online_shiny['lastUpdate']) {
      $to_update_local[] = $online_shiny;
    }
  }
  // 1B:
  else if ($is_online_deleted_key !== false) {
    $online_deleted_shiny = $online_deleted_data[$is_online_deleted_key];
    if ($local_shiny['lastUpdate'] > $online_deleted_shiny['lastUpdate']) {
      $to_insert_online_ids[] = $local_shiny['huntid'];
      $to_restore_online_ids[] = $local_shiny['huntid'];
    } else if ($local_shiny['lastUpdate'] < $online_deleted_shiny['lastUpdate']) {
      $to_delete_local[] = $local_shiny;
    }
  }
}


// 2:
foreach($local_deleted_data as $key => $local_deleted_shiny) {
  $is_online_key = array_search($local_deleted_shiny['huntid'], array_column($online_data, 'huntid'));
  $is_online_deleted_key = array_search($local_deleted_shiny['huntid'], array_column($online_deleted_data, 'huntid'));

  // 2-:
  if ($is_online_key === false && $is_online_deleted_key === false) {}
  // 2A:
  else if ($is_online_key !== false) {
    $online_shiny = $online_data[$is_online_key];
    if ($local_deleted_shiny['lastUpdate'] > $online_shiny['lastUpdate']) {
      $to_delete_online[] = $local_deleted_shiny;
    } else if ($local_deleted_shiny['lastUpdate'] < $online_shiny['lastUpdate']) {
      $to_insert_local[] = $online_shiny;
    }
  }
  // 2B:
  else if ($is_online_deleted_key !== false) {
    $online_deleted_shiny = $online_deleted_data[$is_online_deleted_key];
    $to_delete_local[] = $online_deleted_shiny;
  }
}


// A:
foreach($online_data as $key => $online_shiny) {
  $is_local_key = array_search($online_shiny['huntid'], array_column($local_data, 'huntid'));
  $is_local_deleted_key = array_search($online_shiny['huntid'], array_column($local_deleted_data, 'huntid'));

  // A-:
  if ($is_local_key === false && $is_local_deleted_key === false) {
    $to_insert_local[] = $online_shiny;
  }
}


$online_data = null;
$online_deleted_data = null;
$local_data = null;
$local_deleted_data = null;



/**
 * Step 4: Update online database with newer local data.
 */

$results = [];


foreach($to_delete_online as $key => $shiny) {
  $insert = $db->prepare("INSERT INTO `shinydex_deleted_pokemon` (
    `huntid`,
    `userid`,
    `lastUpdate`
  ) VALUES (
    :huntid,
    :userid,
    :lastUpdate
  )");

  $insert->bindParam(':huntid', $shiny['huntid'], PDO::PARAM_STR, 36);
  $insert->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
  $insert->bindParam(':lastUpdate', $shiny['lastUpdate'], PDO::PARAM_STR, 13);

  $results[] = $insert->execute();

  $delete = $db->prepare('DELETE FROM shinydex_pokemon WHERE huntid = :huntid AND userid = :userid');

  $delete->bindParam(':huntid', $shiny['huntid'], PDO::PARAM_STR, 36);
  $delete->bindParam(':userid', $userID, PDO::PARAM_STR, 36);

  $results[] = $delete->execute();
}



/**
 * Step 5: Create sync-session-code to ensure data isn't modified between sync-pokemon-step-1.php and sync-pokemon-step-2.php.
 */

$allIds = array_merge(
  $to_insert_online_ids,
  $to_update_online_ids,
  $to_restore_online_ids
);
asort($allIds);
$sync_session_code = base64_encode(
  join(',', $allIds)
);

$cookieOptions = [
  'secure' => true,
  'samesite' => 'Strict',
  'path' => '/shinydex/',
  'httponly' => true
];

setcookie('sync-session-code', $jwt->sign($sync_session_code), [
  'expires' => time() + 60 * 2, // 2 minutes
  ...$cookieOptions
]);





/**
 * Step 6: Send results to the frontend.
 */

/** Removes the user id from each Pokémon in an array of Pokémon. */
function removeUserID(array $arr): array {
  foreach ($arr as $k => $shiny) {
    unset($shiny['userid']);
    $arr[$k] = $shiny;
  }
  return $arr;
}

echo json_encode(array(
  'results' => $results,
  'to_insert_local' => removeUserID($to_insert_local),
  'to_update_local' => removeUserID($to_update_local),
  'to_delete_local' => removeUserID($to_delete_local),
  'to_insert_online_ids' => $to_insert_online_ids,
  'to_update_online_ids' => $to_update_online_ids,
  'to_restore_online_ids' => $to_restore_online_ids,
), JSON_PRETTY_PRINT);