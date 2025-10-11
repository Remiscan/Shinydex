<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = !is_null($user) ? $user->userID : null;



if (!isset($_POST['huntid'])) {
	respondError('Hunt ID not received');
}

$huntID = $_POST['huntid'];

try {
	if (is_null($userID)) {
		$query = "SELECT COUNT(*) FROM shinydex_congratulations
				  WHERE `userid` IS NULL AND `huntid` = :huntid";
		$select = $db->prepare($query);

		$select->bindParam(':huntid', $huntID, PDO::PARAM_STR, 36);
		$select->execute();

		$count = $select->fetchColumn();
		if ($count > 0) throw new \Exception('No');
	}

	$query = "INSERT INTO `shinydex_congratulations` (`userid`, `huntid`)
			  VALUES (:userid, :huntid)";
	$insert = $db->prepare($query);

	$insert->bindParam(':userid', $userID);
	$insert->bindParam(':huntid', $huntID, PDO::PARAM_STR, 36);
	$result = $insert->execute();

	if (!$result) {
		throw new \Exception("Error while sending the congratulation");
	}

	respond(['success' => true]);
} catch (\Throwable $error) {
	respondError($error);
}