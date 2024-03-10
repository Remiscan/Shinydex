<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = $user->userID;



try {
  //$db->beginTransaction();




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

  $user_profile = $user->getDBEntry('shinydex', $userID);
  $online_friends = array_map(
    fn($f) => $f['username'],
    $user->getFriends()
  );
  $online_profile_lastUpdate = $user_profile['lastUpdate'] ?? 0;

  foreach($local_friends as $username) {
    $is_online_key = array_search($username, $online_friends);

    if ($is_online_key === false) {
      if ($local_profile_lastUpdate > $online_profile_lastUpdate) {
        $friends_to_insert_online[] = $username;
      } else {
        $friends_to_delete_local[] = $username;
      }
    }
  }

  foreach($online_friends as $username) {
    $is_local_key = array_search($username, $local_friends);

    if ($is_local_key === false) {
      if ($local_profile_lastUpdate > $online_profile_lastUpdate) {
        $friends_to_delete_online[] = $username;
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

  $results = [];

  foreach ($friends_to_insert_online as $username) {
    $user->addFriend($username);
  }

  foreach ($friends_to_delete_online as $username) {
    $user->removeFriend($username);
  }



  /**
   * Step 4: Get partial data about each friend's 10 most recent Pokémon
   */

  $friends_pokemon = [];
  $number_of_pokemon_to_get = 10;

  // Get each friend's partial Pokémon data
  $get_friends_pokemon = $db->prepare("WITH grouped_pokemon AS (
    SELECT
      p.dexid,
      p.forme,
      p.userid,
      u.username,
      ROW_NUMBER() OVER (
        PARTITION BY p.userid
        ORDER BY CAST(p.catchTime AS int) DESC, CAST(p.creationTime AS int) DESC
      ) AS rownumber
    FROM shinydex_pokemon AS p
    JOIN shinydex_users AS u ON p.userid = u.uuid
    WHERE p.userid IN (
      SELECT f.friend_userid FROM shinydex_friends AS f
      WHERE f.userid = :userid
    )
  ) SELECT * FROM grouped_pokemon WHERE rownumber <= $number_of_pokemon_to_get");

  $get_friends_pokemon->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
  $get_friends_pokemon->execute();
  $get_friends_pokemon = $get_friends_pokemon->fetchAll(PDO::FETCH_ASSOC);

  // Associate each username to an array of Pokémon with partial data
  foreach ($get_friends_pokemon as $pokemon) {
    if (!isset($friends_pokemon[$pokemon['username']])) $friends_pokemon[$pokemon['username']] = [];
    $friends_pokemon[$pokemon['username']][] = ['dexid' => $pokemon['dexid'], 'forme' => $pokemon['forme']];
  }



  //$db->commit();



  /**
   * Step 5: Send results to the frontend.
   */

  echo json_encode(array(
    'results' => $results,
    'friends_to_delete_local' => $friends_to_delete_local,
    'friends_pokemon' => $friends_pokemon,
    'local_friends' => $local_friends,
    'online_friends' => $user->getFriends(),
    'userid' => $userID
  ), JSON_PRETTY_PRINT);



} catch (\Throwable $e) {
  //$db->rollback();
  respondError($e->getMessage());
}