<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = $user->userID;



$lastCongratulationDate = $_POST['lastCongratulationDate'] ?? null;

try {
	$congratulations = $user->getCongratulations($lastCongratulationDate);
	respond([
		'success' => true,
		'congratulations' => $congratulations
	]);
} catch (\Throwable $error) {
	respondError($error);
}