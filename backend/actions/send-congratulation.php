<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = !is_null($user) ? $user->userID : null;



if (!isset($_POST['username']) || strlen($_POST['username']) < 1) {
	respondError('Username not received');
}

$username = $_POST['username'];
$day = date('Y-m-d');

try {
	if (is_null($userID)) {
		$select = $db->prepare("SELECT COUNT(*) FROM shinydex_congratulations
								LEFT JOIN shinydex_users AS u ON u.username = :username
								WHERE `userid_source` IS NULL AND `userid_destination` = u.uuid AND day = :day");
		$select->bindParam(':username', $username, PDO::PARAM_STR, 20);
		$select->bindParam(':day', $day);
		$select->execute();

		$count = $select->fetchColumn();
		if ($count > 0) throw new \Exception('No');
	}

	$insert = $db->prepare("INSERT INTO `shinydex_congratulations` (
		`userid_source`,
		`userid_destination`,
		`day`
	) SELECT :userid, u.uuid, :day
	  FROM shinydex_users AS u WHERE u.username = :username");

	$insert->bindParam(':userid', $userID);
	$insert->bindParam(':username', $username, PDO::PARAM_STR, 20);
	$insert->bindParam(':day', $day);
	$result = $insert->execute();

	if (!$result) {
		throw new \Exception("Error while sending the congratulation");
	}

	respond(['success' => true]);
} catch (\Throwable $error) {
	respondError($error);
}