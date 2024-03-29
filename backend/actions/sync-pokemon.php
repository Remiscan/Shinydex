<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = $user->userID;



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

$to_insert_online = []; // Pokémon from local_data that don't exist in online_data or online_deleted_data
$to_update_online = []; // Pokémon from local_data that exist in online_data and are more recent in local_data
$to_delete_online = []; // Pokémon from local_deleted_data that exist in online_data and are more recent in local_deleted_data
$to_restore_online = []; // Pokémon from local_data that exist in online_deleted_data and are more recent in local_data

$to_insert_local = []; // Pokémon from online_data that don't exist in local_data or local_deleted_data
$to_update_local = []; // Pokémon from online_data that exist in local_data and are more recent in online_data
$to_delete_local = []; // Pokémon from online_deleted_data that exist in local_data and are more recent in online_deleted_data
$to_restore_local = []; // Pokémon from online_data that exist in local_deleted_data and are more recent in online_data


// 1:
foreach($local_data as $key => $local_shiny) {
  $is_online_key = array_search($local_shiny['huntid'], array_column($online_data, 'huntid'));
  $is_online_deleted_key = array_search($local_shiny['huntid'], array_column($online_deleted_data, 'huntid'));

  // 1-:
  if ($is_online_key === false && $is_online_deleted_key === false) {
    $to_insert_online[] = $local_shiny;
  }
  // 1A:
  else if ($is_online_key !== false) {
    $online_shiny = $online_data[$is_online_key];
    if ($local_shiny['lastUpdate'] > $online_shiny['lastUpdate']) {
      $to_update_online[] = $local_shiny;
    } else if ($local_shiny['lastUpdate'] < $online_shiny['lastUpdate']) {
      $to_update_local[] = $online_shiny;
    }
  }
  // 1B:
  else if ($is_online_deleted_key !== false) {
    $online_deleted_shiny = $online_deleted_data[$is_online_deleted_key];
    if ($local_shiny['lastUpdate'] > $online_deleted_shiny['lastUpdate']) {
      $to_insert_online[] = $local_shiny;
      $to_restore_online[] = $local_shiny;
    } else if ($local_shiny['lastUpdate' < $online_deleted_shiny['lastUpdate']]) {
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
      $to_restore_local[] = $online_shiny;
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


foreach($to_restore_online as $key => $shiny) {
  $delete = $db->prepare('DELETE FROM shinydex_deleted_pokemon WHERE huntid = :huntid AND userid = :userid');

  $delete->bindParam(':huntid', $shiny['huntid'], PDO::PARAM_STR, 36);
  $delete->bindParam(':userid', $userID, PDO::PARAM_STR, 36);

  $results[] = $delete->execute();
}



/**
 * Step 5: Send results to the frontend.
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
  'to_restore_local' => removeUserID($to_restore_local)
), JSON_PRETTY_PRINT);