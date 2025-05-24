<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/func_sendPushNotification.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();
$userID = $user->userID;
$jwt = User::jwt();



try {
  $db->beginTransaction();



  /** 
   * Step 1: Get local data from JavaScript
   */

  if (!isset($_POST['inserts']) || !isset($_POST['updates']) || !isset($_POST['restores'])) {
    respondError('Local data not received');
  }

  $to_insert_online = json_decode($_POST['inserts'], true);
  $to_update_online = json_decode($_POST['updates'], true);
  $to_restore_online_ids = json_decode($_POST['restores'], true);



  /**
   * Step 2: Verify the sync session code.
   */

  $allIds = array_merge(
    array_map(fn($s) => $s['huntid'], $to_insert_online),
    array_map(fn($s) => $s['huntid'], $to_update_online),
    $to_restore_online_ids
  );
  asort($allIds);
  $potential_sync_session_code = base64_encode(
    join(',', $allIds)
  );

  if ($jwt->sign($potential_sync_session_code) !== ($_COOKIE['sync-session-code'] ?? 'null')) {
    respondError('Invalid sync session');
  }

  $cookieOptions = [
    'expires' => time() - 3600, // in the past, so the browser immediately deletes the cookie
    'secure' => true,
    'samesite' => 'Strict',
    'path' => '/shinydex/',
    'httponly' => true
  ];

  setcookie('sync-session-code', '', $cookieOptions);



  /**
   * Step 3: Update online database with newer local data.
   */

  $results = [];

  $user->addManyPokemon($to_insert_online);
  $user->updateManyPokemon($to_update_online);
  $user->cleanUpRestoredPokemon($to_restore_online_ids);



  /**
   * Step 4: Send push notifications to every user that has the current user as a friend
   *         telling them which shiny Pokémon the current user added.
   */
  $push_reports_reasons = [];
  $notifications = [];
  if (count($to_insert_online) > 0) {
    $friends_push_subscriptions = $user->getAllFriendsPushSuscriptions();
    foreach ($friends_push_subscriptions as $subscription) {
      $notifications[] = [
        'subscription' => $subscription,
        'payload' => [
          'new_shiny_pokemon' => array_map(fn($shiny) => [
            'huntid' => $shiny['huntid'],
            'dexid' => $shiny['dexid'],
            'forme' => $shiny['forme'],
            'game' => $shiny['game'],
            'method' => $shiny['method'],
          ], $to_insert_online),
          'username' => $user->username,
        ]
      ];
    }
  }

  $reports = sendManyNotifications($notifications);
  $expired_subscription_endpoints = [];
  foreach ($reports as $report) {
    if ($report->isSubscriptionExpired()) {
      try { error_log('[Push subscription expired] ' . json_encode($reports)); } catch (\Throwable $e) {}
      $endpoint = $report->getRequest()->getUri()->__toString();
      $expired_subscription_endpoints[] = $endpoint;
    }
  }
  User::deleteSubscriptions($expired_subscription_endpoints);



  $db->commit();



  /**
   * Step 5: Send results to the frontend.
   */

  echo json_encode(array(
    'results' => $results,
  ), JSON_PRETTY_PRINT);



} catch (\Throwable $error) {
  $db->rollback();
  respondError($error);
}