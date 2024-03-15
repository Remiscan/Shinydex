<?php

$scope = $_POST['scope'] ?? 'partial'; // full or partial

// Get requested username from the frontend
if (!isset($_POST['username'])) {
  respondError('Missing username in POST body');
}

// Get the corresponding user's Pokémon data
$username = $_POST['username'];
$db = new BDD();

switch ($scope) {
  case 'full':
    $query = $db->prepare("SELECT shinydex_pokemon.* FROM shinydex_users
      INNER JOIN shinydex_pokemon ON shinydex_users.uuid = shinydex_pokemon.userid
      WHERE shinydex_users.username = :username AND shinydex_users.public = 1
      ORDER BY CAST(shinydex_pokemon.catchTime as INTEGER) DESC
    ");
    break;

  case 'partial':
  default:
    $query = $db->prepare("SELECT shinydex_pokemon.dexid, shinydex_pokemon.forme FROM shinydex_users
      INNER JOIN shinydex_pokemon ON shinydex_users.uuid = shinydex_pokemon.userid
      WHERE shinydex_users.username = :username AND shinydex_users.public = 1
      ORDER BY CAST(shinydex_pokemon.catchTime as INTEGER) DESC LIMIT 10
    ");
}

$query->bindParam(':username', $username, PDO::PARAM_STR, 36);
$query->execute();
$pokemon = $query->fetchAll(PDO::FETCH_ASSOC);

if (!$pokemon) {
  respond(['matches' => false]);
  exit;
}



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