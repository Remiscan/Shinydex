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
					ROW_NUMBER() OVER(PARTITION BY DATE(FROM_UNIXTIME(s.catchTime/1000)) ORDER BY s.catchTime DESC) as rn_day,
					DENSE_RANK() OVER(ORDER BY DATE(FROM_UNIXTIME(s.catchTime/1000)) DESC) as dr_day
				FROM 
					shinydex_users u
				JOIN (
					SELECT 
						p.*,
						ROW_NUMBER() OVER(PARTITION BY p.userid, DATE(FROM_UNIXTIME(p.catchTime/1000)) ORDER BY p.catchTime DESC) as rn
					FROM 
						shinydex_pokemon p
					WHERE 
						DATE(FROM_UNIXTIME(p.catchTime/1000)) BETWEEN :minDate AND :maxDate
				) s
				ON 
					u.uuid = s.userid
				WHERE 
					s.rn <= 4
					AND $otherUsersCondition
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
				username ASC, 
				catchTime DESC";

	$query = $db->prepare($query);

	$query->bindParam(':maxDate', $maxDate, PDO::PARAM_STR, 10);
	$query->bindParam(':minDate', $minDate, PDO::PARAM_STR, 10);
	if ($userID) $query->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
	$query->execute();
	$pokemon = $query->fetchAll(PDO::FETCH_ASSOC);

	// Organize the results by day and by username
	$results = [];
	foreach ($pokemon as $shiny) {
		$username = $shiny['username'];
		$date = $shiny['day'];

		unset($shiny['username']);
		unset($shiny['day']);
		unset($shiny['userid']);

		if (!isset($results[$date])) $results[$date] = [];
		if (!isset($results[$date][$username])) $results[$date][$username] = [];

		if (count($results[$date][$username]) < 4) {
			$results[$date][$username][] = $shiny;
		}
	}

	// Send data to the frontend
	respond([
		'entries' => $results
	]);
} catch (\Throwable $error) {
	respondError($error);
}