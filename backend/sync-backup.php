<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/_common/php/DotEnv.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';



header('Content-Type: application/json');

function respond($data) {
  echo json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
}

function respondError($message) {
  echo json_encode(['error' => $message], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
  exit;
}

$response = [];



///////////////////////////////////////////////////
// ÉTAPES DU BACKUP DES DONNÉES LOCALES VERS LA BDD
// ✅ JavaScript envoie les données locales au serveur
//    Le serveur récupère l'id de l'utilisateur
// ✅ Le serveur récupère les données de la BDD
// ✅ Le serveur compare les données de la BDD et les données locales
//    et détermine quelles données doivent être insérées / éditées dans la BDD
// ✅ Le serveur ajoute / éditer ce qui doit l'être
// ✅ Le serveur envoie une notification de succès ou d'échec à l'application
// FINI

/** 
 * Step 1: Get local data from JavaScript
 */

if (!isset($_POST['local-data']) || !isset($_POST['deleted-local-data'])) {
  respondError('Local data not received');
}

$localData = json_decode($_POST['local-data'], true);
$deletedData = json_decode($_POST['deleted-local-data'], true);



/**
 * Step 2: Get user data from cookies
 */

if (!isset($_COOKIE['user'])) {
  $response['error'] = 'User is not logged in';
  respond($response);
  exit;
}

$cookie = explode(':', $_COOKIE['user']);

if (count($cookie) !== 2) {
  respondError('User cookie '.$_COOKIE['user'].'is not valid');
}

$provider = $cookie[0];
$provideruserid = $cookie[1];

if ($provider !== 'google') {
  respondError("Sign-in provider $provider is not supported");
}



/**
 * Step 3: Check if user exists; create it if it does not
 */

$db = new BDD();

$get_user = $db->prepare("SELECT * FROM shinydex_users WHERE $provider = :provideruserid LIMIT 1");
$get_user->bindParam(':provideruserid', $provideruserid, PDO::PARAM_STR, 36);
$get_user->execute();
$user_data = $get_user->fetch(PDO::FETCH_ASSOC);

// If user does not exist, create it
if (!$user_data) {
  $create_user = $db->prepare("INSERT INTO shinydex_users (
    $provider
  ) VALUES (
    :provideruserid
  )");
  $create_user->bindParam(':provideruserid', $provideruserid, PDO::PARAM_STR, 36);
  $result = $create_user->execute();

  if (!$result) {
    respondError('Error while creating new user');
  }

  // Get the newly created user data back
  $get_user = $db->prepare("SELECT * FROM shinydex_users WHERE $provider = :provideruserid LIMIT 1");
  $get_user->bindParam(':provideruserid', $provideruserid, PDO::PARAM_STR, 36);
  $get_user->execute();
  $user_data = $get_user->fetch(PDO::FETCH_ASSOC);

  if (!$user_data) {
    respondError('Error while fetching newly created user');
  }
}

$userid = $user_data['userid'];

if (!is_string($userid) || strlen($userid) !== 36) {
  respondError('Invalid user id');
}



/**
 * Step 4: Get user's Pokémon from online database,
 * including his deleted Pokémon.
 */

/**
 * Step 5: Compare local data with online database data
 * - find which local entry is not in online db
 * - find which online entry is not in local db
 */

/**
 * Step 6: Update online database with newer local data,
 * and prepare to send newer online data back to the frontend.
 */




$recup_shinies = $link->prepare('SELECT * FROM shinydex_pokemon WHERE userid = :userid ORDER BY id DESC');
$recup_shinies->bindParam(':userid', $userUUID, PDO::PARAM_STR, 36);
$recup_shinies->execute();
$onlineData = $recup_shinies->fetchAll(PDO::FETCH_ASSOC);

// On compare localData et onlineData
$toInsert = [];
$toUpdate = [];
$toDelete = [];
$toDeleteLocal = [];

$dataToInsert = [];
$dataToInsertLocal = [];
$dataToUpdate = [];
$dataToUpdateLocal = [];
$dataToCompare = [];

foreach($localData as $key => $shiny) {
  $r = array_search($shiny->huntid, array_column($onlineData, 'huntid'));
  // Données locales non présentes dans la BDD en ligne
  if ($r === false) {
    $toInsert[] = $key;
  }
  else {
    $pkmn = $onlineData[$r];
    // Données locales plus récentes que celles de la BDD en ligne
    if ($pkmn['lastUpdate'] < $shiny->{'lastUpdate'}) {
      $toUpdate[] = $key;
      $dataToCompare[] = $pkmn;
    }
    // Données en ligne plus récentes que celles de la BDD locale
    elseif ($pkmn['lastUpdate'] > $shiny->{'lastUpdate'}) {
      $dataToUpdateLocal[] = $pkmn;
      $dataToCompare[] = $pkmn;
    }
  }
}

foreach($onlineData as $key => $pkmn) {
  $r = array_search($pkmn['huntid'], array_column($localData, 'huntid'));
  $d = array_search($pkmn['huntid'], array_column($deletedData, 'huntid'));
  // Données en ligne non présentes dans la BDD locale
  if ($r === false && $d === false) {
    $dataToInsertLocal[] = $pkmn;
  }
}

// On vérifie si les données locales supprimées sont dans la BDD
foreach($deletedData as $key => $shiny) {
  $r = array_search($shiny->huntid, array_column($onlineData, 'huntid'));
  // Données locales supprimées absentes de la BDD en ligne
  if ($r === false) {
    $toDelete[] = $shiny->huntid;
  }
  // Données locales supprimées plus récemment que leur état dans la BDD
  else {
    $pkmn = $onlineData[$r];
    // Données locales supprimées plus récemment que leur état dans la BDD
    if ($pkmn['lastUpdate'] < $shiny->{'lastUpdate'}) {
      $toDelete[] = $shiny->huntid;
    }
    // Données locales supprimées avant leur état actuel dans la BDD
    elseif ($pkmn['lastUpdate'] > $shiny->{'lastUpdate'}) {
      $dataToUpdateLocal[] = $pkmn;
    }
  }
}

$results = [];
// On insère et édite ce qu'il faut
foreach($toInsert as $id) {
  $data = $localData[$id];
  $dataToInsert[] = $data;

  $insert = $link->prepare('INSERT INTO shinydex_pokemon (
    huntid,
    userid,
    lastUpdate,
    dexid,
    forme,
    gene,
    surnom,
    methode,
    compteur,
    timeCapture,
    jeu,
    ball,
    notes,
    checkmark,
    DO,
    charm,
    hacked,
    horsChasse
  ) VALUES (
    :huntid,
    :userid,
    :lastUpdate,
    :dexid,
    :forme,
    :gene,
    :surnom,
    :methode,
    :compteur,
    :timeCapture,
    :jeu,
    :ball,
    :notes,
    :checkmark,
    :DO,
    :charm,
    :hacked,
    :horsChasse
  )');
  $insert->bindParam(':huntid', $data->{'huntid'}, PDO::PARAM_STR, 36);
  $insert->bindParam(':userid', $userUUID, PDO::PARAM_STR, 36);
  $insert->bindParam(':lastUpdate', $data->{'lastUpdate'}, PDO::PARAM_STR, 13);
  $insert->bindParam(':dexid', $data->{'dexid'}, PDO::PARAM_INT, 4);
  $insert->bindParam(':forme', $data->{'forme'}, PDO::PARAM_STR, 50);
  $insert->bindParam(':gene', $data->{'gene'});
  $insert->bindParam(':surnom', $data->{'surnom'}, PDO::PARAM_STR, 50);
  $insert->bindParam(':methode', $data->{'methode'});
  $insert->bindParam(':compteur', $data->{'compteur'}, PDO::PARAM_STR, 50);
  $insert->bindParam(':timeCapture', $data->{'timeCapture'}, PDO::PARAM_INT, 13);
  $insert->bindParam(':jeu', $data->{'jeu'}, PDO::PARAM_STR, 50);
  $insert->bindParam(':ball', $data->{'ball'});
  $insert->bindParam(':notes', $data->{'notes'});
  $insert->bindParam(':checkmark', $data->{'origin'}, PDO::PARAM_INT, 1);
  $insert->bindParam(':DO', $data->{'monjeu'}, PDO::PARAM_INT, 1);
  $insert->bindParam(':charm', $data->{'charm'}, PDO::PARAM_INT, 1);
  $insert->bindParam(':hacked', $data->{'hacked'}, PDO::PARAM_INT, 1);
  $insert->bindParam(':horsChasse', $data->{'aupif'}, PDO::PARAM_INT, 1);
  
  $results[] = $insert->execute();
}

foreach($toUpdate as $id) {
  $data = $localData[$id];
  $dataToUpdate[] = $data;

  $insert = $link->prepare('UPDATE shinydex_pokemon SET 
    lastUpdate = :lastUpdate,
    dexid = :dexid,
    forme = :forme,
    gene = :gene,
    surnom = :surnom,
    methode = :methode,
    compteur = :compteur,
    timeCapture = :timeCapture,
    jeu = :jeu,
    ball = :ball,
    notes = :notes,
    checkmark = :checkmark,
    DO = :DO,
    charm = :charm,
    hacked = :hacked,
    horsChasse = :horsChasse 
  WHERE huntid = :huntid AND userid = :userid');
  $insert->bindParam(':huntid', $data->{'huntid'}, PDO::PARAM_STR, 36);
  $insert->bindParam(':userid', $userUUID, PDO::PARAM_STR, 36);
  $insert->bindParam(':lastUpdate', $data->{'lastUpdate'}, PDO::PARAM_STR, 13);
  $insert->bindParam(':dexid', $data->{'dexid'}, PDO::PARAM_INT, 4);
  $insert->bindParam(':forme', $data->{'forme'}, PDO::PARAM_STR, 50);
  $insert->bindParam(':gene', $data->{'gene'});
  $insert->bindParam(':surnom', $data->{'surnom'}, PDO::PARAM_STR, 50);
  $insert->bindParam(':methode', $data->{'methode'});
  $insert->bindParam(':compteur', $data->{'compteur'}, PDO::PARAM_STR, 50);
  $insert->bindParam(':timeCapture', $data->{'timeCapture'}, PDO::PARAM_INT, 13);
  $insert->bindParam(':jeu', $data->{'jeu'}, PDO::PARAM_STR, 50);
  $insert->bindParam(':ball', $data->{'ball'});
  $insert->bindParam(':notes', $data->{'notes'});
  $insert->bindParam(':checkmark', $data->{'origin'}, PDO::PARAM_INT, 1);
  $insert->bindParam(':DO', $data->{'monjeu'}, PDO::PARAM_INT, 1);
  $insert->bindParam(':charm', $data->{'charm'}, PDO::PARAM_INT, 1);
  $insert->bindParam(':hacked', $data->{'hacked'}, PDO::PARAM_INT, 1);
  $insert->bindParam(':horsChasse', $data->{'aupif'}, PDO::PARAM_INT, 1);

  $results[] = $insert->execute();
}

// On supprime de la BDD ce qui doit l'être
foreach($toDelete as $huntid) {
  $insert = $link->prepare('DELETE FROM shinydex_pokemon WHERE huntid = :huntid');
  $insert->bindParam(':huntid', $huntid, PDO::PARAM_STR, 13);
  $results[] = $insert->execute();
}

if (array_sum($results) != count($results)) {
  $error = true;
  $response = '[:(] Une insertion / édition / suppression a échoué';
} else {
  $response = '[:)] Toutes les insertions / éditions / suppressions ont réussi !';
}

// On supprime les données sensibles qui seront envoyées à l'application
function dataWithoutUserID(array $arr): array {
  foreach ($arr as $k => $pkmn) {
    unset($pkmn['userid']);
    $arr[$k] = $pkmn;
  }
  return $arr;
}

header('Content-Type: application/json');
echo json_encode(array(
  'error' => $error,
  'response' => $response,
  'mdp' => $passcheck,
  'inserts' => $dataToInsert,
  'updates' => $dataToUpdate,
  'inserts-local' => dataWithoutUserID($dataToInsertLocal),
  'updates-local' => dataWithoutUserID($dataToUpdateLocal),
  'deletions-local' => $toDelete,
  'results' => $results,
), JSON_PRETTY_PRINT);