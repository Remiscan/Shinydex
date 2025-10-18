<?php
$db = new BDD();

if (!isset($_POST['direction'])) {
  respondError('Missing direction in POST body');
}

if (!in_array($_POST['direction'], ['newer', 'older', 'initial'])) {
  respondError('Invalid direction value');
}

switch ($_POST['direction']) {
	case 'initial':
		$catchTimeAndIdCondition = '(p.catchTime <= :newerDate)';
		break;
	case 'newer':
		$catchTimeAndIdCondition = "(p.catchTime > :olderDate OR (p.catchTime = :olderDate AND p.id > :olderId))";
		break;
	case 'older':
		$catchTimeAndIdCondition = "(p.catchTime < :newerDate OR (p.catchTime = :newerDate AND p.id < :newerId))";
		break;
}

// Get the list of Pokémon caught by each user during the last 30 days that have had catches

$direction = $_POST['direction'];
$newerDate = $_POST['newerDate'] ?? '0';
$olderDate = $_POST['olderDate'] ?? '0';
$newerId = $_POST['newerId'] ?? '0';
$olderId = $_POST['olderId'] ?? '0';
$timeZone = $_POST['timeZone'] ?? 'UTC';

$userID = !is_null($user) ? $user->userID : null;
$otherUsersCondition = $userID
	? "u.uuid != :userid"
	: 1;
$userCondition = $userID
	? "c.userid = :userid"
	: 1;

try {
	$beforeQueryTime = microtime(true);
	$query = <<<SQL
		SELECT
			p.*,
			u.username,
			CASE WHEN c.huntid IS NOT NULL THEN TRUE ELSE FALSE END AS congratulated
		FROM shinydex_pokemon AS p
		JOIN shinydex_users AS u
			ON u.uuid = p.userid
		LEFT JOIN shinydex_congratulations AS c
			ON p.huntid = c.huntid
			AND $userCondition
		WHERE
			$catchTimeAndIdCondition
			AND u.public = 1
			AND u.appearInFeed = 1
			AND $otherUsersCondition
		ORDER BY
			p.catchTime DESC,
			p.creationTime DESC,
			p.id DESC
		LIMIT 50
	SQL;

	$query = $db->prepare($query);

	if ($direction === 'initial') {
		$query->bindParam(':newerDate', $newerDate, PDO::PARAM_INT);
	} else if ($direction === 'newer') {
		$query->bindParam(':olderDate', $olderDate, PDO::PARAM_INT);
		$query->bindParam(':olderId', $olderId, PDO::PARAM_INT);
	} else if ($direction === 'older') {
		$query->bindParam(':newerDate', $newerDate, PDO::PARAM_INT);
		$query->bindParam(':newerId', $newerId, PDO::PARAM_INT);
	}
	if ($userID) $query->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
	$query->execute();
	$pokemon = $query->fetchAll(PDO::FETCH_ASSOC);
	$afterQueryTime = microtime(true);

	// Organize the results by day and by username
	$results = [];
	$newerCatchTime = $pokemon[0]['catchTime'] ?? 0;
	$olderCatchTime = 0;
	$newerId = $pokemon[0]['id'] ?? 0;
	$olderId = 0;
	foreach ($pokemon as $shiny) {
		$datetime = new DateTime();
		$datetime->setTimestamp((int) floor($shiny['catchTime'] / 1000));
		$datetime->setTimezone(new DateTimeZone($timeZone));
		$day = $datetime->format('Y-m-d');

		$userid = $shiny['userid'];
		$username = $shiny['username'];

		if (!isset($results[$day])) {
			$results[$day] = [];
		}

		if (!isset($results[$day][$userid])) {
			$results[$day][$userid] = [
				'username' => $username,
				'total' => 0,
				'entries' => []
			];
		}

		if ($results[$day][$userid]['total'] < 3) {
			// remove helper columns from the entry but preserve all pokemon columns
			unset($shiny['userid']);
			unset($shiny['username']);
			$results[$day][$userid]['entries'][] = $shiny;
		}

		$results[$day][$userid]['total']++;
		$olderCatchTime = $shiny['catchTime'];
		$olderId = $shiny['id'];
	}

	foreach ($results as $day => $users) {
		$results[$day] = array_values($users);
	}
	$afterSortTime = microtime(true);

	// Send data to the frontend
	respond([
		'entries' => $results,
		'timings' => [
			'beforeQuery' => $beforeQueryTime,
			'afterQuery' => $afterQueryTime,
			'afterSort' => $afterSortTime
		],
		'newerCatchTime' => $newerCatchTime,
		'olderCatchTime' => $olderCatchTime,
		'newerId' => $newerId,
		'olderId' => $olderId
	]);
} catch (\Throwable $error) {
	respondError($error);
}