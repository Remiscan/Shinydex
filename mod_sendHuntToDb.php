<?php
require_once('./parametres.php');
require_once('./class_BDD.php');

////////////////////////////////////////////////
// ÉTAPES D'UN ENVOI DE CHASSE À LA BDD EN LIGNE
// ✅ JavaScript envoie une requête au service worker avec le tag HUNT-ADD-id ou HUNT-EDIT-id
// ✅ le service worker contacte ce module mod_sendHuntToDb.php avec $_POST['type'] == 'ADD' ou 'EDIT
// -> ✅ ajouter un champ huntid à la BDD qui sera rempli avec la huntid d'une chasse quand on l'ajoute
// -> ✅ par défaut, huntid = 0
// ✅ si ADD, vérifier que aucune chasse n'existe déjà avec la même huntid dans la BDD
// ✅ exécuter la requête d'ajout / d'édition
// ✅ récupérer la chasse qui a la même huntid
// ✅ envoyer ses données à JavaScript
// ✅ JavaScript compare avec les données locales avant de les supprimer
// - JavaScript gère la notification de succès/échec
// FINI

$error = false;
$storedData = false;
$type = false;

if (isset($_POST['hunt']) && $_POST['hunt'] != '')
{
  $response = '[:)] Données de la chasse bien reçues !';

  $data = json_decode($_POST['hunt']);
  $mdp = $_POST['mdp'];
  switch($_POST['type']) {
    case 'EDIT':
      $type = 'EDIT';
      break;
    case 'REMOVE':
      $type = 'REMOVE';
      break;
    default:
      $type = 'ADD';
  }

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

    // On insère les données transmises dans la BDD

    $link = new BDD();

    // Si c'est une suppression
    if ($type == 'REMOVE') {
      $insert = $link->prepare('DELETE FROM mes_shinies WHERE id = :huntid');
      $insert->bindParam(':huntid', $data->{'id'}, PDO::PARAM_INT);
    }

    // Si c'est une édition ou création
    else {

      // Si c'est une édition
      if ($type == 'EDIT') {
        $insert = $link->prepare('UPDATE mes_shinies SET 
          numero_national = :dexid, forme =:forme, surnom = :surnom, methode = :methode, compteur = :compteur, date = :date, jeu = :jeu, ball = :ball, description = :description, origin = :origin, monjeu = :monjeu, charm = :charm, hacked = :hacked, aupif = :aupif
        WHERE id = :id');
        $insert->bindValue(':id', $data->{'id'}, PDO::PARAM_INT);
      }
      
      // Si c'est une création
      else {
        // On vérifie d'abord qu'aucun shiny n'est déjà présent avec la même huntid
        $check = $link->prepare('SELECT * FROM mes_shinies WHERE huntid = :huntid');
        $check->bindParam(':huntid', $data->{'id'}, PDO::PARAM_INT);

        // Si ce n'est pas le cas, on prépare l'ajout
        $insert = $link->prepare('INSERT INTO mes_shinies (
          numero_national, forme, surnom, methode, compteur, date, jeu, ball, description, origin, monjeu, charm, hacked, aupif, huntid
        ) VALUES (
          :dexid, :forme, :surnom, :methode, :compteur, :date, :jeu, :ball, :description, :origin, :monjeu, :charm, :hacked, :aupif, :huntid
        )');
        $insert->bindParam(':huntid', $data->{'id'}, PDO::PARAM_INT);
      }

      $insert->bindParam(':dexid', $data->{'dexid'}, PDO::PARAM_INT, 4);
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

    }

    try {
      if ($type == 'ADD') {
        $check->execute();
        $already = $check->fetchAll();
        if (count($already) > 0) throw new Exception('Cette chasse existe déjà');
      }
      $result = $insert->execute();

      if (!$result) {
        $result = $insert->errorInfo();
        $error = true;
      }
  
      $response = '[:)] Données supposément stockées dans la BDD !';
  
      // On renvoie les données insérées à JavaScript pour comparer
  
      if ($type != 'REMOVE') {
        $check = $link->prepare('SELECT * FROM mes_shinies WHERE huntid = :huntid');
        $check->bindParam(':huntid', $data->{'id'}, PDO::PARAM_INT);
        $check->execute();
    
        $storedData = $check->fetch(PDO::FETCH_ASSOC);
      }
    }
    catch(PDOException $error) {
      var_dump($error);
      throw $error;
    }
    catch(Exception $error) {
      $error = true;
      $response = '[:(] Cette chasse existe déjà';
    }

  }
}
else
{
  $error = true;
  $response = '[:(] Données de la chasse non reçues...';
}

header('Content-Type: application/json');
echo json_encode(array(
  'type' => $type,
  'error' => $error,
  'response' => $response,
  'insert' => $result,
  'stored-data' => $storedData,
  'mdp' => $passcheck,
), JSON_PRETTY_PRINT);