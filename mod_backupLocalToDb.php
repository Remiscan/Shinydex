<?php
require_once './parametres.php';
require_once './class_BDD.php';

///////////////////////////////////////////////////
// ÉTAPES DU BACKUP DES DONNÉES LOCALES VERS LA BDD
// ✅ JavaScript envoie les données locales au serveur
// ✅ Le serveur récupère les données de la BDD
// - Le serveur compare les données de la BDD et les données locales
// - Le serveur détermine quelles données doivent être insérées / éditées dans la BDD
// - Le serveur ajoute / éditer ce qui doit l'être
// - Le serveur envoie une notification de succès ou d'échec à l'application
// FINI

$error = false;

if (isset($_POST['local-data']) && isset($_POST['deleted-local-data']))
{
  $response = '[:)] Données locales bien reçues !';

  $localData = json_decode($_POST['local-data']);
  $deletedData = json_decode($_POST['deleted-local-data']);
  $mdp = $_POST['mdp'];

  // Le mot de passe envoyé est-il le bon ?
  $params = parse_ini_file(Params::path(), TRUE);
  $passcheck = password_verify($mdp, $params['hunts']['hash']);

  if ($passcheck != true)
  {
    $error = true;
    $response = '[:(] Mauvais mot de passe...';
  }
  else
  {
    $response = '[:)] Mot de passe correct !';

    // On récupère les données de la BDD
    $link = new BDD();

    $recup_shinies = $link->prepare('SELECT * FROM mes_shinies ORDER BY id DESC');
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
        if ($pkmn['last_update'] < $shiny->{'last_update'}) {
          $toUpdate[] = $key;
          $dataToCompare[] = $pkmn;
        }
        // Données en ligne plus récentes que celles de la BDD locale
        elseif ($pkmn['last_update'] > $shiny->{'last_update'}) {
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
        if ($pkmn['last_update'] < $shiny->{'last_update'}) {
          $toDelete[] = $shiny->huntid;
        }
        // Données locales supprimées avant leur état actuel dans la BDD
        elseif ($pkmn['last_update'] > $shiny->{'last_update'}) {
          $dataToUpdateLocal[] = $pkmn;
        }
      }
    }

    $results = [];
    // On insère et édite ce qu'il faut
    foreach($toInsert as $id) {
      $data = $localData[$id];
      $dataToInsert[] = $data;

      $insert = $link->prepare('INSERT INTO mes_shinies (
        numero_national, forme, surnom, methode, compteur, date, jeu, ball, description, origin, monjeu, charm, hacked, aupif, huntid, last_update
      ) VALUES (
        :dexid, :forme, :surnom, :methode, :compteur, :date, :jeu, :ball, :description, :origin, :monjeu, :charm, :hacked, :aupif, :huntid, :lastupdate
      )');
      $insert->bindParam(':dexid', $data->{'numero_national'}, PDO::PARAM_INT, 4);
      $insert->bindParam(':forme', $data->{'forme'}, PDO::PARAM_STR, 50);
      $insert->bindParam(':surnom', $data->{'surnom'}, PDO::PARAM_STR, 50);
      $insert->bindParam(':methode', $data->{'methode'});
      $insert->bindParam(':compteur', $data->{'compteur'}, PDO::PARAM_STR, 50);
      $insert->bindParam(':date', $data->{'date'});
      $insert->bindParam(':jeu', $data->{'jeu'}, PDO::PARAM_STR, 50);
      $insert->bindParam(':ball', $data->{'ball'});
      $insert->bindParam(':description', $data->{'description'});
      $insert->bindParam(':origin', $data->{'origin'}, PDO::PARAM_INT, 1);
      $insert->bindParam(':monjeu', $data->{'monjeu'}, PDO::PARAM_INT, 1);
      $insert->bindParam(':charm', $data->{'charm'}, PDO::PARAM_INT, 1);
      $insert->bindParam(':hacked', $data->{'hacked'}, PDO::PARAM_INT, 1);
      $insert->bindParam(':aupif', $data->{'aupif'}, PDO::PARAM_INT, 1);
      $insert->bindParam(':huntid', $data->{'huntid'}, PDO::PARAM_INT);
      $insert->bindParam(':lastupdate', $data->{'last_update'}, PDO::PARAM_INT);
      $results[] = $insert->execute();
    }

    foreach($toUpdate as $id) {
      $data = $localData[$id];
      $dataToUpdate[] = $data;

      $insert = $link->prepare('UPDATE mes_shinies SET 
        numero_national = :dexid, forme =:forme, surnom = :surnom, methode = :methode, compteur = :compteur, date = :date, jeu = :jeu, ball = :ball, description = :description, origin = :origin, monjeu = :monjeu, charm = :charm, hacked = :hacked, aupif = :aupif, last_update = :lastupdate
      WHERE huntid = :huntid');
      $insert->bindValue(':huntid', $data->{'huntid'}, PDO::PARAM_INT);
      $insert->bindParam(':dexid', $data->{'numero_national'}, PDO::PARAM_INT, 4);
      $insert->bindParam(':forme', $data->{'forme'}, PDO::PARAM_STR, 50);
      $insert->bindParam(':surnom', $data->{'surnom'}, PDO::PARAM_STR, 50);
      $insert->bindParam(':methode', $data->{'methode'});
      $insert->bindParam(':compteur', $data->{'compteur'}, PDO::PARAM_STR, 50);
      $insert->bindParam(':date', $data->{'date'});
      $insert->bindParam(':jeu', $data->{'jeu'}, PDO::PARAM_STR, 50);
      $insert->bindParam(':ball', $data->{'ball'});
      $insert->bindParam(':description', $data->{'description'});
      $insert->bindParam(':origin', $data->{'origin'}, PDO::PARAM_INT, 1);
      $insert->bindParam(':monjeu', $data->{'monjeu'}, PDO::PARAM_INT, 1);
      $insert->bindParam(':charm', $data->{'charm'}, PDO::PARAM_INT, 1);
      $insert->bindParam(':hacked', $data->{'hacked'}, PDO::PARAM_INT, 1);
      $insert->bindParam(':aupif', $data->{'aupif'}, PDO::PARAM_INT, 1);
      // On n'édite pas huntid
      $insert->bindParam(':lastupdate', $data->{'last_update'}, PDO::PARAM_INT);
      $results[] = $insert->execute();
    }

    // On supprime de la BDD ce qui doit l'être
    foreach($toDelete as $huntid) {
      $insert = $link->prepare('DELETE FROM mes_shinies WHERE huntid = :huntid');
      $insert->bindParam(':huntid', $huntid, PDO::PARAM_INT);
      $results[] = $insert->execute();
    }

    // On récupère la version de la BDD
    $versionBDD = $link->prepare('SELECT MAX(last_update) AS max FROM mes_shinies');
    $versionBDD->execute();
    $versionBDD = $versionBDD->fetch(PDO::FETCH_ASSOC);
    $versionBDD = $versionBDD['max'];

    if (array_sum($results) != count($results)) {
      $error = true;
      $response = '[:(] Une insertion / édition / suppression a échoué';
    } else {
      $response = '[:)] Toutes les insertions / éditions / suppressions ont réussi !';
    }

  }
}
else
{
  $error = true;
  $response = '[:(] Données locales non reçues...';
}

header('Content-Type: application/json');
echo json_encode(array(
  'error' => $error,
  'response' => $response,
  'mdp' => $passcheck,
  'inserts' => $dataToInsert,
  'updates' => $dataToUpdate,
  'inserts-local' => $dataToInsertLocal,
  'updates-local' => $dataToUpdateLocal,
  'deletions-local' => $toDelete,
  //'compare' => $dataToCompare,
  'results' => $results,
  'version-bdd' => $versionBDD,
), JSON_PRETTY_PRINT);