<?php
require_once('./class_BDD.php');
require_once('./parametres.php');

$error = false;
$storedData = false;

if (isset($_POST['hunt']) && $_POST['hunt'] != '')
{
  $response = '[:)] Données de la chasse bien reçues !';

  $data = json_decode($_POST['hunt']);
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

    // On insère les données transmises dans la BDD

    $link = new BDD();

    // Si l'id est petite, c'est une édition
    if ($data->{'id'} < 825379200) { // 825379200 = timestamp du jour de la sortie de Pokémon au Japon
      $insert = $link->prepare('UPDATE mes_shinies SET 
        numero_national = :dexid, forme =:forme, surnom = :surnom, methode = :methode, compteur = :compteur, date = :date, jeu = :jeu, ball = :ball, description = :description, origin = :origin, monjeu = :monjeu, charm = :charm, hacked = :hacked, aupif = :aupif
      WHERE id = :id');
      $insert->bindValue(':id', $data->{'id'}, PDO::PARAM_INT);

    // Si l'id est grande (un timestamp), c'est une création
    } else {
      $insert = $link->prepare('INSERT INTO mes_shinies (
        numero_national, forme, surnom, methode, compteur, date, jeu, ball, description, origin, monjeu, charm, hacked, aupif
      ) VALUES (
        :dexid, :forme, :surnom, :methode, :compteur, :date, :jeu, :ball, :description, :origin, :monjeu, :charm, :hacked, :aupif
      )');
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

    try {
      $result = $insert->execute();
    } catch(PDOException $error) {
      var_dump($error);
      throw $error;
    }

    if (!$result) {
      $result = $insert->errorInfo();
    }

    $response = '[:)] Données supposément stockées dans la BDD !';

    // On renvoie les données insérées à JavaScript pour comparer

    $check = $link->prepare('SELECT * FROM mes_shinies WHERE 
      numero_national = :dexid
      AND forme = :forme
      AND surnom = :surnom
      AND methode = :methode
      AND compteur = :compteur
      AND date = :date
      AND jeu = :jeu
      AND ball = :ball
      AND description = :description
      AND origin = :origin
      AND monjeu = :monjeu
      AND charm = :charm
      AND hacked = :hacked
      AND aupif = :aupif
    ');

    $check->bindParam(':dexid', $data->{'dexid'}, PDO::PARAM_INT, 4);
    $check->bindParam(':forme', $data->{'forme'}, PDO::PARAM_STR, 50);
    $check->bindParam(':surnom', $data->{'surnom'}, PDO::PARAM_STR, 50);
    $check->bindParam(':methode', $data->{'methode'});
    $check->bindParam(':compteur', $data->{'compteur'}, PDO::PARAM_STR, 50);
    $check->bindParam(':date', $data->{'date'});
    $check->bindParam(':jeu', $data->{'jeu'}, PDO::PARAM_STR, 50);
    $check->bindParam(':ball', $data->{'ball'});
    $check->bindParam(':description', $data->{'description'});
    $check->bindParam(':origin', $data->{'origin'}, PDO::PARAM_INT, 1);
    $check->bindParam(':monjeu', $data->{'monjeu'}, PDO::PARAM_INT, 1);
    $check->bindParam(':charm', $data->{'charm'}, PDO::PARAM_INT, 1);
    $check->bindParam(':hacked', $data->{'hacked'}, PDO::PARAM_INT, 1);
    $check->bindParam(':aupif', $data->{'aupif'}, PDO::PARAM_INT, 1);

    $check->execute();

    $storedData = $check->fetch(PDO::FETCH_ASSOC);
  }
}
else
{
  $error = true;
  $response = '[:(] Données de la chasse non reçues...';
}

header('Content-Type: application/json');
echo json_encode(array(
  'error' => $error,
  'response' => $response,
  'insert' => $result,
  'stored-data' => $storedData,
  'mdp' => $passcheck,
), JSON_PRETTY_PRINT);