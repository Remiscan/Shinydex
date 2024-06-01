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
					t.*,
					CASE WHEN c.huntid IS NOT NULL THEN TRUE ELSE FALSE END AS congratulated
				FROM (
					SELECT 
						DATE(FROM_UNIXTIME(s.catchTime/1000)) AS day,
						u.uuid,
						u.username,
						s.*,
						DENSE_RANK() OVER(ORDER BY DATE(FROM_UNIXTIME(s.catchTime/1000)) DESC) as dr_day
					FROM 
						shinydex_users u
					JOIN (
						SELECT 
							p.*
						FROM 
							shinydex_pokemon p
						WHERE 
							DATE(FROM_UNIXTIME(p.catchTime/1000)) BETWEEN :minDate AND :maxDate
					) s
					ON 
						u.uuid = s.userid
					WHERE 
						$otherUsersCondition
				) t
				LEFT JOIN 
					shinydex_congratulations c
				ON 
					t.huntid = c.huntid
					AND $userCondition
				WHERE 
					t.dr_day <= 10
				ORDER BY 
					day DESC, 
					uuid ASC, 
					CAST(catchTime AS int) DESC,
					CAST(creationTime AS int) DESC,
					id DESC";

	$query = $db->prepare($query);

	$query->bindParam(':maxDate', $maxDate, PDO::PARAM_STR, 10);
	$query->bindParam(':minDate', $minDate, PDO::PARAM_STR, 10);
	if ($userID) $query->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
	$query->execute();
	$pokemon = $query->fetchAll(PDO::FETCH_ASSOC);

	// Organize the results by day and by username
	$results = [];
	foreach ($pokemon as $shiny) {
		$userid = $shiny['uuid'];
		$username = $shiny['username'];
		$day = $shiny['day'];

		unset($shiny['userid']);
		unset($shiny['uuid']);
		unset($shiny['username']);
		unset($shiny['day']);

		if (!isset($results[$day])) $results[$day] = [];
		if (!isset($results[$day][$userid])) $results[$day][$userid] = [
			'username' => $username,
			'total' => 0,
			'entries' => []
		];

		if (count($results[$day][$userid]['entries']) < 3) {
			$results[$day][$userid]['entries'][] = $shiny;
		}

		$results[$day][$userid]['total']++;
	}

	foreach ($results as $day => $userList) {
		$results[$day] = array_values($userList);
	}

	// Send data to the frontend
	respond([
		'entries' => $results
	]);
} catch (\Throwable $error) {
	respondError($error);
}