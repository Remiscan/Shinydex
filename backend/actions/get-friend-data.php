<?php

$scope = $_POST['scope'] ?? 'partial'; // full or partial

// Get requested username from the frontend
if (!isset($_POST['username'])) {
  respondError('Missing username in POST body');
}

// Get the corresponding user's Pokémon data
$username = trim($_POST['username']);
$db = new BDD();

switch ($scope) {
  case 'full':
    $query = "SELECT u.username, p.*
              FROM shinydex_users AS u
              LEFT JOIN shinydex_pokemon AS p
              ON u.uuid = p.userid
              WHERE u.username = :username AND u.public = 1
              ORDER BY p.id DESC";
    break;

  case 'partial':
  default:
    $query = "SELECT u.username, p.dexid, p.forme, p.catchTime, pc.total
              FROM shinydex_users AS u
              LEFT JOIN shinydex_pokemon AS p
                ON u.uuid = p.userid
              LEFT JOIN (
                SELECT userid, COUNT(id) AS total
                FROM shinydex_pokemon
                GROUP BY userid
              ) AS pc
                ON u.uuid = pc.userid
              WHERE u.username = :username AND u.public = 1
              ORDER BY
                CAST(p.catchTime AS int) DESC,
                CAST(p.creationTime AS int) DESC,
                p.id DESC
              LIMIT 10";
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
  'username' => $username,
  'pokemon' => removeUserID(
    array_filter(
      $pokemon,
      fn($p) => !is_null($p['dexid'])
    )
    ),
]);