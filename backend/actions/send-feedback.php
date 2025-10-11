<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = !is_null($user) ? $user->userID : null;



if (!isset($_POST['message'])) {
	respondError('Message not received');
}

$message = $_POST['message'];
if (is_null($message) || strlen($message) === 0) {
	respondError('Message empty');
}

try {
	$query = "INSERT INTO `shinydex_feedback` (`userid`, `message`)
			  VALUES (:userid, :message)";
	$insert = $db->prepare($query);

	$insert->bindParam(':userid', $userID);
	$insert->bindParam(':message', $message);
	$result = $insert->execute();

	if (!$result) {
		throw new \Exception("Error while sending feedback");
	}

	respond(['success' => true]);
} catch (\Throwable $error) {
	respondError($error);
}