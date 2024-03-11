<?php
require $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/composer/vendor/autoload.php';
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\MessageSentReport;

$auth = [
	'VAPID' => [
		'subject' => 'https://remiscan.fr/shinydex/',
		'publicKey' => file_get_contents('/run/secrets/shinydex_push_public_key'),
		'privateKey' => file_get_contents('/run/secrets/shinydex_push_private_key'),
	],
];

$webPush = new WebPush($auth);

function sendPushNotification(array $subscription, array $content): MessageSentReport {
	global $webPush;
	$subscription = Subscription::create($subscription);
	return $webPush->sendOneNotification(
		$subscription,
		json_encode($content)
	);
}