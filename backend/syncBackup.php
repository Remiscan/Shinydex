<?php
require_once './parametres.php';
require_once './class_BDD.php';

///////////////////////////////////////////////////
// ÉTAPES DU BACKUP DES DONNÉES LOCALES VERS LA BDD
// ✅ JavaScript envoie les données locales au serveur
// ✅ Le serveur récupère les données de la BDD
// ✅ Le serveur compare les données de la BDD et les données locales
//    et détermine quelles données doivent être insérées / éditées dans la BDD
// ✅ Le serveur ajoute / éditer ce qui doit l'être
// ✅ Le serveur envoie une notification de succès ou d'échec à l'application
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

      $insert = $link->prepare('INSERT INTO mes_shinies (
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
      $insert->bindParam(':userid', $data->{'userid'}, PDO::PARAM_STR, 36);
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

      $insert = $link->prepare('UPDATE mes_shinies SET 
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
      $insert->bindParam(':userid', $data->{'userid'}, PDO::PARAM_STR, 36);
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
      $insert = $link->prepare('DELETE FROM mes_shinies WHERE huntid = :huntid');
      $insert->bindParam(':huntid', $huntid, PDO::PARAM_STR, 13);
      $results[] = $insert->execute();
    }

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
  'results' => $results,
), JSON_PRETTY_PRINT);