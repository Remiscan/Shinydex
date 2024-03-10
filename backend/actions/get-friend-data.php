<?php

$scope = $_POST['scope'] ?? 'partial'; // full or partial

// Get requested username from the frontend
if (!isset($_POST['username'])) {
  respondError('Missing username in POST body');
}

// Get the corresponding user's profile data if they exist
$username = $_POST['username'];
$db = new BDD();

$user_data = $db->prepare("SELECT * FROM shinydex_users WHERE `username` = :username LIMIT 1");
$user_data->bindParam(':username', $username, PDO::PARAM_STR, 36);
$user_data->execute();
$user_data = $user_data->fetch(PDO::FETCH_ASSOC);
if (!$user_data || !isset($user_data['public']) || !$user_data['public']) {
  respond(['matches' => false]);
  exit;
}

// Get the corresponding user's Pokémon data
$requestedUserID = $user_data['uuid'];
$pokemon = $db->prepare('SELECT * FROM `shinydex_pokemon` WHERE `userid` = :userid ORDER BY CAST(`catchTime` as INTEGER) DESC');
$pokemon->bindParam(':userid', $requestedUserID, PDO::PARAM_STR, 36);
$pokemon->execute();
$pokemon = $pokemon->fetchAll(PDO::FETCH_ASSOC);



// Send data to the frontend

/** Removes the user id from each Pokémon in an array of Pokémon. */
function removeUserID(array $arr): array {
  foreach ($arr as $k => $shiny) {
    unset($shiny['userid']);
    $arr[$k] = $shiny;
  }
  return $arr;
}

$response = ['matches' => true];

switch ($scope) {
  case 'full':
    $response['pokemon'] = removeUserID($pokemon);
    break;

  case 'partial':
  default:
    $number_of_pokemon_to_get = 10;
    $response['pokemon'] = array_map(
      fn($pkmn) => [
        'dexid' => $pkmn['dexid'],
        'forme' => $pkmn['forme']
      ],
      array_slice($pokemon, 0, $number_of_pokemon_to_get)
    );
}

respond($response);