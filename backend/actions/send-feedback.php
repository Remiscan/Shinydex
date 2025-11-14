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

$email = $_POST['email'] ?? '';
if (strlen($email) === 0) $email = null;

try {
	$query = "INSERT INTO `shinydex_feedback` (`userid`, `message`, `email`)
			  VALUES (:userid, :message, :email)";
	$insert = $db->prepare($query);

	$insert->bindParam(':userid', $userID);
	$insert->bindParam(':message', $message);
	$insert->bindParam(':email', $email);
	$result = $insert->execute();

	if (!$result) {
		throw new \Exception("Error while sending feedback");
	}

	respond(['success' => true]);
} catch (\Throwable $error) {
	respondError($error);
}

try {
	$webhookUrl = file_get_contents('/run/secrets/shinydex_feedback_webhook_url');
	if (strlen($message) > 2000) {
		$message = substr($message, 0, 1997) . "…";
	}
	$payload = [
		'content' => $message
	];
	$request = curl_init($webhookUrl);
	curl_setopt($request, CURLOPT_POST, 1);
	curl_setopt($request, CURLOPT_POSTFIELDS, json_encode($payload));
	curl_setopt($request, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
	curl_exec($request);
	curl_close($request);
} catch (\Throwable $error) {}