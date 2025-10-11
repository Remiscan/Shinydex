<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = !is_null($user) ? $user->userID : null;



if (!isset($_POST['id']) || !isset($_POST['done'])) {
	respondError('Feedback data missing');
}

try {
	$query = "UPDATE `shinydex_feedback`
			  SET done = :done
			  WHERE id = :id";
	$insert = $db->prepare($query);

	$done = $_POST['done'] == '1';
	$insert->bindParam(':done', $done, PDO::PARAM_BOOL);
	$insert->bindParam(':id', $_POST['id'], PDO::PARAM_INT);
	$result = $insert->execute();

	if (!$result) {
		throw new \Exception("Error while marking feedback as done");
	}

	respond(['success' => true]);
} catch (\Throwable $error) {
	respondError($error);
}