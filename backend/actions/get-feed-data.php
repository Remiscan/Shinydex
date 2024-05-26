<?php

// Get requested maxDate from the frontend
if (!isset($_POST['maxDate'])) {
  respondError('Missing maxDate in POST body');
}

// Get the list of Pokémon caught by each user during the last 30 days that have had catches

$maxDate = $_POST['maxDate'];

$minDate = $_POST['minDate'] ?? null;
$minDateCondition = $minDate ? "DATE(FROM_UNIXTIME(catchTime / 1000)) >= :minDate" : 1;

$username = $_POST['username'] ?? null;
$usernameCondition = /*$username ? "u.username != \"$username\"" :*/ 1;

$db = new BDD();

$query = "SELECT u.username, u.public, u.appearInFeed, p.*, DATE(FROM_UNIXTIME(p.catchTime / 1000)) as day
			FROM shinydex_users AS u
			JOIN shinydex_pokemon AS p ON u.uuid = p.userid
			JOIN (
				SELECT MIN(day) as min_date, MAX(day) as max_date FROM (
					SELECT catchTime, DATE(FROM_UNIXTIME(catchTime / 1000)) as day
					FROM shinydex_pokemon
					WHERE DATE(FROM_UNIXTIME(catchTime / 1000)) <= :maxDate AND $minDateCondition
					GROUP BY DATE(FROM_UNIXTIME(catchTime / 1000))
					ORDER BY DATE(FROM_UNIXTIME(catchTime / 1000)) DESC
					LIMIT 10
				) AS dates
			) AS d ON DATE(FROM_UNIXTIME(p.catchTime / 1000)) BETWEEN d.min_date AND d.max_date
			WHERE $usernameCondition AND u.public = 1 AND u.appearInFeed = 1
			ORDER BY DATE(FROM_UNIXTIME(p.catchTime / 1000)) DESC, u.username ASC, p.catchTime DESC";

$query = $db->prepare($query);

$query->bindParam(':maxDate', $maxDate, PDO::PARAM_STR, 10);
if ($minDate) $query->bindParam(':minDate', $minDate, PDO::PARAM_STR, 10);
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