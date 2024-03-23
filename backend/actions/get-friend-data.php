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
    $query = "SELECT shinydex_users.username, shinydex_pokemon.*
              FROM shinydex_users
              LEFT JOIN shinydex_pokemon ON shinydex_users.uuid = shinydex_pokemon.userid
              WHERE shinydex_users.username = :username AND shinydex_users.public = 1
              ORDER BY CAST(shinydex_pokemon.catchTime as INTEGER) DESC";
    break;

  case 'partial':
  default:
    $query = "SELECT shinydex_users.username, shinydex_pokemon.dexid, shinydex_pokemon.forme
              FROM shinydex_users
              LEFT JOIN shinydex_pokemon ON shinydex_users.uuid = shinydex_pokemon.userid
              WHERE shinydex_users.username = :username AND shinydex_users.public = 1
              ORDER BY CAST(shinydex_pokemon.catchTime as INTEGER) DESC LIMIT 10";
}

$query = $db->prepare($query);

$query->bindParam(':username', $username, PDO::PARAM_STR, 36);
$query->execute();
$pokemon = $query->fetchAll(PDO::FETCH_ASSOC);



// Send data to the frontend

if (!$pokemon) {
  respond(['matches' => false]);
  exit;
}

/** Removes the user id from each Pokémon in an array of Pokémon. */
function removeUserID(array $arr): array {
  foreach ($arr as $k => $shiny) {
    unset($shiny['userid']);
    unset($shiny['username']);
    $arr[$k] = $shiny;
  }
  return $arr;
}

respond([
  'matches' => true,
  'pokemon' => removeUserID(
    array_filter(
      $pokemon,
      fn($p) => !is_null($p['dexid'])
    )
    ),
]);