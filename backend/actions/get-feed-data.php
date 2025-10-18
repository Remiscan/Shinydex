<?php
$db = new BDD();

// Get requested maxDate from the frontend
if (!isset($_POST['maxDate'])) {
  respondError('Missing maxDate in POST body');
}

// Get the list of Pokémon caught by each user during the last 30 days that have had catches

$maxDate = $_POST['maxDate'];
$minDate = $_POST['minDate'] ?? '0000-00-00';

$userID = !is_null($user) ? $user->userID : null;
$otherUsersCondition = $userID
	? "u.uuid != :userid"
	: 1;
$userCondition = $userID
	? "c.userid = :userid"
	: 1;

try {
	$query = "SELECT
				final.*,
				CASE WHEN c.huntid IS NOT NULL THEN TRUE ELSE FALSE END AS congratulated
			FROM (
				SELECT
					s.*,
					u.username,
					u.public,
					u.appearInFeed,
					COUNT(*) OVER (PARTITION BY s.day, s.userid) AS total,
					ROW_NUMBER() OVER (PARTITION BY s.day, s.userid ORDER BY CAST(s.catchTime AS UNSIGNED) DESC, CAST(s.creationTime AS UNSIGNED) DESC, s.id DESC) AS rn,
					DENSE_RANK() OVER (ORDER BY s.day DESC) as dr_day
				FROM (
					SELECT
						DATE(FROM_UNIXTIME(p.catchTime/1000)) AS day,
						p.*,
						MAX(CAST(p.catchTime AS UNSIGNED)) OVER (PARTITION BY DATE(FROM_UNIXTIME(p.catchTime/1000)), p.userid) AS user_last_catch,
						MAX(CAST(p.creationTime AS UNSIGNED)) OVER (PARTITION BY DATE(FROM_UNIXTIME(p.catchTime/1000)), p.userid) AS user_last_creation,
						MAX(p.id) OVER (PARTITION BY DATE(FROM_UNIXTIME(p.catchTime/1000)), p.userid) AS user_last_id
					FROM shinydex_pokemon p
					WHERE DATE(FROM_UNIXTIME(p.catchTime/1000)) BETWEEN :minDate AND :maxDate
				) s
				JOIN shinydex_users u ON u.uuid = s.userid
				WHERE u.public = 1
					AND u.appearInFeed = 1
					AND $otherUsersCondition
			) final
			LEFT JOIN shinydex_congratulations c ON final.huntid = c.huntid AND $userCondition
			WHERE final.dr_day <= 10
				AND final.rn <= 3
			ORDER BY
				final.day DESC,
				final.user_last_catch DESC,
				final.user_last_creation DESC,
				final.user_last_id DESC,
				CAST(final.creationTime AS UNSIGNED) DESC,
				CAST(final.catchTime AS UNSIGNED) DESC,
				final.id DESC,
				final.userid ASC";

	$query = $db->prepare($query);

	$query->bindParam(':maxDate', $maxDate, PDO::PARAM_STR, 10);
	$query->bindParam(':minDate', $minDate, PDO::PARAM_STR, 10);
	if ($userID) $query->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
	$query->execute();
	$pokemon = $query->fetchAll(PDO::FETCH_ASSOC);

	// Organize the results by day and by username
	$results = [];
	$dayOrder = []; // keep track of first-seen user order per day (follows SQL ORDER BY)
	foreach ($pokemon as $shiny) {
		$userid = $shiny['userid'];
		$username = $shiny['username'];
		$day = $shiny['day'];

		if (!isset($results[$day])) {
			$results[$day] = [];
			$dayOrder[$day] = [];
		}

		if (!isset($results[$day][$userid])) {
			// first time we see this user for that day: record their insertion order
			$results[$day][$userid] = [
				'username' => $username,
				'total' => isset($shiny['total']) ? (int)$shiny['total'] : 0,
				'entries' => []
			];
			$dayOrder[$day][] = $userid;
		}

		// remove helper columns from the entry but preserve all pokemon columns
		unset($shiny['userid']);
		unset($shiny['username']);
		unset($shiny['day']);
		unset($shiny['total']);
		unset($shiny['user_last_catch']);
		unset($shiny['user_last_creation']);
		unset($shiny['user_last_id']);
		unset($shiny['rn']);
		unset($shiny['dr_day']);

		$results[$day][$userid]['entries'][] = $shiny;
	}

	// Emit user groups in the same order they were first-seen by SQL for each day
	foreach ($results as $dayKey => $userMap) {
		$ordered = [];
		foreach ($dayOrder[$dayKey] as $uid) {
			if (isset($userMap[$uid])) $ordered[] = $userMap[$uid];
		}
		$results[$dayKey] = $ordered;
	}

	// Send data to the frontend
	respond([
		'entries' => $results
	]);
} catch (\Throwable $error) {
	respondError($error);
}