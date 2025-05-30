<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = $user->db;
$userID = $user->userID;



if (!isset($_POST['subscription'])) {
	respondError('Subscription not received');
}

$subscription = json_decode($_POST['subscription'], true);

try {
	if (isset($_POST['reason'])) {
		error_log('[Push subscription deletion] ' . $_POST['reason']);
	}
	$user->unsubscribeFromPush($subscription);
	respond(['success' => true]);
} catch (\Throwable $error) {
	respondError($error);
}