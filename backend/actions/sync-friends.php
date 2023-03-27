<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = $user->userID;



/** 
 * Step 1: Get local data from JavaScript
 */

if (!isset($_POST['friends-list']) || !isset($_POST['profile-last-update'])) {
  respondError('Local data not received');
}

$local_friends = json_decode($_POST['friends-list'] ?? '[]');
$local_profile_lastUpdate = $_POST['profile-last-update'] ?? 0;





/**
 * Step 2: Compare local friends list with online friends list
 */

$friends_to_insert_online = [];
$friends_to_delete_online = [];

$friends_to_insert_local = [];
$friends_to_delete_local = [];

$user_profile = $db->prepare('SELECT * FROM `shinydex_users` WHERE `uuid` = :userid LIMIT 1');
$user_profile->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
$user_profile->execute();
$user_profile = $user_profile->fetchAll(PDO::FETCH_ASSOC);
$online_friends = json_decode($user_profile['friends'] ?? '[]');
$online_profile_lastUpdate = $user_profile['lastUpdate'] ?? 0;

foreach($local_friends as $username) {
  $is_online_key = array_search($username, $online_friends);

  if ($is_online_key === false) {
    if ($local_profile_lastUpdate > $online_profile_lastUpdate) {
      $friends_to_insert_online[] = $username;
    } else {
      $friends_to_remove_local[] = $username;
    }
  }
}

foreach($online_friends as $username) {
  $is_local_key = array_search($username, $local_friends);

  if ($is_local_key === false) {
    if ($local_profile_lastUpdate > $online_profile_lastUpdate) {
      $friends_to_remove_online[] = $username;
    } else {
      $friends_to_insert_local[] = $username;
    }
  }
}

$recent_friends_list = array_merge(
  array_diff($online_friends, $friends_to_delete_online),
  $friends_to_insert_online
);




/**
 * Step 3: Update online database with newer local data.
 */

// If the friends list sent by the frontend is more recent, push it to the DB
if ($local_profile_lastUpdate > $online_profile_lastUpdate) {
  $update_friends = $db->prepare('UPDATE `shinydex_users` SET 
    `friends` = :friends,
    `lastUpdate` = :lastupdate
  WHERE `uuid` = :userid');

  $friends_string = json_encode($recent_friends_list);
  $now = floor(1000 * microtime(true));

  $update_friends->bindParam(':friends', $friends_string);
  $update_friends->bindParam(':lastupdate', $now);
  $update_friends->bindParam(':userid', $userID, PDO::PARAM_STR, 36);

  $results[] = $update_friends->execute();
}



/**
 * Step 4: Get partial data about each friend's 10 most recent Pokémon
 */

$friends_pokemon = [];
$number_of_pokemon_to_get = 10;
if (isset($_POST['friends-list']) && count($recent_friends_list) > 0) {
  // Prepare query to get each friend's userid
  $friends_query_string = [];
  for ($i = 0; $i < count($recent_friends_list); $i++) {
    $friends_query_string[] = ":user$i";
  }
  $friends_query_string = join(',', $friends_query_string);

  // Get each friend's userid
  $get_friends_userid = $db->prepare("SELECT uuid, username FROM shinydex_users WHERE `username` IN ($friends_query_string)");

  for ($i = 0; $i < count($recent_friends_list); $i++) {
    $username = $recent_friends_list[$i];
    $get_friends_userid->bindParam(":user$i", $username, PDO::PARAM_STR, 36);
  }

  $results[] = $get_friends_userid->execute();
  $get_friends_userid = $get_friends_userid->fetchAll(PDO::FETCH_ASSOC);

  // Associate each username to a userid in an array
  $friends_userid = [];
  foreach ($get_friends_userid as $friend) {
    $friends_userid[$friend['username']] = $friend['uuid'];
  }
  $get_friends_userid = null;

  // Get each friend's partial Pokémon data
  $get_friends_pokemon = $db->prepare("WITH grouped_pokemon AS (
    SELECT
      dexid,
      forme, 
      ROW_NUMBER() OVER (PARTITION BY userid ORDER BY catchTime DESC) AS rownumber
    FROM shinydex_pokemon
    WHERE `userid` IN ($friends_query_string)
  ) SELECT * FROM grouped_pokemon WHERE rownumber <= $number_of_pokemon_to_get");

  for ($i = 0; $i < count($recent_friends_list); $i++) {
    $userid = $friends_userid[$recent_friends_list[$i]];
    $get_friends_pokemon->bindParam(":user$i", $userid, PDO::PARAM_STR, 36);
  }

  $results[] = $get_friends_pokemon->execute();
  $get_friends_pokemon = $get_friends_pokemon->fetchAll(PDO::FETCH_ASSOC);

  // Associate each username to an array of Pokémon with partial data
  foreach ($recent_friends_list as $username) {
    $pokemon_list = [];
    foreach ($get_friends_pokemon as $pokemon) {
      $pokemon_list[] = ['dexid' => $pokemon['dexid'], 'forme' => $pokemon['forme']];
    }
    $friends_pokemon[$username] = $pokemon_list;
  }
}



/**
 * Step 5: Send results to the frontend.
 */

echo json_encode(array(
  'results' => $results,
  'friends_to_delete_local' => $friends_to_delete_local,
  'friends_pokemon' => $friends_pokemon
), JSON_PRETTY_PRINT);