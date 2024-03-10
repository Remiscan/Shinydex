<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = $user->userID;



if (!isset($_POST['subscription'])) {
	respondError('Subscription not received');
}

$subscription = json_decode($_POST['subscription'], true);

try {
	$user->subscribeToPush($subscription);
	respond(['success' => true]);
} catch (\Throwable $error) {
	respondError($error->getMessage());
}