<?php

$scope = $_POST['scope'] ?? 'partial'; // full or partial

// Get requested username from the frontend
if (!isset($_POST['username'])) {
  respondError('Missing username in POST body');
}

// Get the corresponding user's profile data if they exist
$requestedUser = User::getDBEntry('shinydex', $_POST['username']);
if (!$requestedUser || !isset($requestedUser['public']) || !$requestedUser['public']) {
  respond(['matches' => false]);
  exit;
}

// Get the corresponding user's Pokémon data
$requestedUserID = $requestedUser['uuid'];
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
    $response['pokemon'] = array_map(
      fn($pkmn) => [
        'dexid' => $pkmn['dexid'],
        'forme' => $pkmn['forme']
      ],
      array_slice($pokemon, 0, 10)
    );
}

respond($response);