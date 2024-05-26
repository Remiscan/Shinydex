<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';



$jwtDir = $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/composer/vendor/adhocore/jwt/src';
require_once "$jwtDir/JWTException.php";
require_once "$jwtDir/ValidatesJWT.php";
require_once "$jwtDir/JWT.php";
use Ahc\Jwt\JWT;
use Ahc\Jwt\JWTException;

class cJWT extends JWT {
  public function sign(string $input): string {
    return parent::sign($input);
  }
}



class User {
  public static $supportedProviders = [
    'google'
  ];

  public readonly string $userID;
  public readonly bool $public;
  public readonly string|null $username;
  private string|null $token = null;
  public readonly BDD $db;
  public readonly JWT $jwt;

  private static function db() { return new BDD(); }
  public static function jwt() { return new cJWT('/run/secrets/shinydex_private_key', 'RS256', 3600); }


  public function __construct(string $provider, string $providerUserID) {
    // Check if the user already exists in the database
    $user = User::getDBEntry($provider, $providerUserID);

    // If they don't, create an entry for them in the dabatase
    if (!$user) {
      User::createDBEntry($provider, $providerUserID);
      $user = User::getDBEntry($provider, $providerUserID);
    }

    if (!$user) {
      throw new Exception('Failed to sign in with a third-party ID provider');
    }

    $this->userID = $user['uuid'];
    $this->public = (bool) $user['public'];
    $this->username = $user['username'];
    $this->token = $_COOKIE['user'] ?? null;
    $this->db = self::db();
    $this->jwt = self::jwt();
  }


  // ----- USER CREATION & SESSIONS ----- //


  /** Signs the user in by creating an access token and a refresh token. */
  public function signIn() {
    $userID = $this->userID;
    $now = time();

    $cookieOptions = [
      'secure' => true,
      'samesite' => 'Strict',
      'path' => '/shinydex/',
      'httponly' => true
    ];
    
    // Create access token
    $accessTokenExpires = $now + 60 * 60; // 1 hour
    $accessToken = $this->jwt->encode([
      'iss' => 'shinydex',
      'sub' => $userID,
      'iat' => $now,
      'exp' => $accessTokenExpires // 1 hour
    ]);
    $this->token = $accessToken;

    // Send access token to app
    setcookie('user', $accessToken, [
      'expires' => $accessTokenExpires,
      ...$cookieOptions
    ]);

    // Create refresh token
    $refreshTokenExpires = $now + 60 * 60 * 24 * 30 * 6; // 6 months
    $refreshToken = bin2hex(random_bytes(64));
    $signedRefreshToken = bin2hex($this->jwt->sign($refreshToken));

    // Send refresh token to app
    setcookie('refresh', $refreshToken, [
      'expires' => $refreshTokenExpires,
      ...$cookieOptions
    ]);

    // Store refresh token in database
    $query = "INSERT INTO shinydex_user_sessions (`userid`, `token`, `expires`)
              VALUES (:userid, :token, :expires)";
    $store_token = $this->db->prepare($query);

    $store_token->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $store_token->bindParam(':token', $signedRefreshToken, PDO::PARAM_STR, 512);
    $store_token->bindParam(':expires', $refreshTokenExpires, PDO::PARAM_STR, 10);

    $result = $store_token->execute();
  }


  public function isSignedIn(): bool {
    return isset($_COOKIE['user']);
  }


  public function validateToken() {
    try {
      // Verifies that this user is the one who is signed in
      if (!isset($_COOKIE['user']) || $_COOKIE['user'] !== $this->token) {
        throw new \Exception('User token does not correspond');
      }
      $payload = $this->jwt->decode($this->token);
      $userID = $payload['sub'];
      if ($userID !== $this->userID) {
        throw new \Exception('User ID does not correspond');
      }
      return true;
    } catch (\Throwable $err) {
      throw new \Exception('Invalid user session');
    }
  }


  /** Signs the user out. */
  public function signOut() {
    $this->validateToken();
    $this->token = null;

    // Delete refresh token from database
    $refreshToken = $_COOKIE['refresh'] ?? 'null';
    $signedRefreshToken = bin2hex($this->jwt->sign($refreshToken));

    $query = "DELETE FROM shinydex_user_sessions
              WHERE `userid` = :userid AND `token` = :token";
    $terminate_session = $this->db->prepare($query);

    $userID = $this->userID;
    $terminate_session->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $terminate_session->bindParam(':token', $signedRefreshToken, PDO::PARAM_STR, 512);

    $result = $terminate_session->execute();
    self::forceSignOut();
  }


  /** Deletes the user from the database. */
  public function deleteDBEntry(): bool {
    $this->validateToken();

    $query = "DELETE FROM shinydex_users
              WHERE `uuid` = :userid";
    $delete_user = $this->db->prepare($query);

    $userID = $this->userID;
    $delete_user->bindParam(':userid', $userID, PDO::PARAM_STR, 36);

    return $delete_user->execute();
  }


  /** Updates the user's profile in the database. */
  public function updateDBEntry(string|null $username, string|null $public, string|null $appearInFeed) {
    $this->validateToken();

    $userID = $this->userID;
    $fieldsToUpdate = [];
    if ($username != null)
      $fieldsToUpdate[] = 'username';
    if ($public != null)
      $fieldsToUpdate[] = 'public';
    if ($appearInFeed != null)
      $fieldsToUpdate[] = 'appearInFeed';
    if (count($fieldsToUpdate) === 0) return;
    $now = floor(1000 * microtime(true));

    $updateString = implode(', ', array_map(fn($e) => "`$e` = :$e", $fieldsToUpdate));

    $query = "UPDATE `shinydex_users`
              SET $updateString, `lastUpdate` = :lastupdate
              WHERE `uuid` = :userid";
    $update = $this->db->prepare($query);

    $update->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $update->bindParam(':lastupdate', $now, PDO::PARAM_STR, 13);
    if ($username != null)
      $update->bindParam(':username', $username, PDO::PARAM_STR, 30);
    if ($public != null) {
      $public = ($public === 'true');
      $update->bindParam(':public', $public, PDO::PARAM_BOOL);
    }
    if ($appearInFeed != null) {
      $appearInFeed = ($appearInFeed === 'true');
      $update->bindParam(':appearInFeed', $appearInFeed, PDO::PARAM_BOOL);
    }

    $result = $update->execute();
    if (!$result) throw new \Exception('Error while updating user account in database');
  }


  /** Deletes the user and their data. */
  public function deleteAllData() {
    $this->validateToken();
    $userID = $this->userID;

    $db = $this->db;
    try {
      $db->beginTransaction();

      // Remove all user data from all database tables
      foreach(['shinydex_pokemon', 'shinydex_deleted_pokemon', 'shinydex_user_sessions', 'shinydex_push_subscriptions', 'shinydex_friends'] as $table) {
        $query = "DELETE FROM $table
                  WHERE `userid` = :userid";
        $delete = $db->prepare($query);
        $delete->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
        $delete->execute();
      }

      // Remove all friendship relations where the current user is the friend
      $query = "DELETE FROM shinydex_friends
                WHERE `friend_userid` = :userid";
      $delete = $db->prepare($query);
      $delete->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
      $delete->execute();

      // Remove user account
      $this->deleteDBEntry();

      $db->commit();
    } catch (\Throwable $error) {
      $db->rollback();
      throw $error;
    }

    self::forceSignOut();
  }


  /** Gets the user from the current session. */
  public static function getFromAccessToken(): self {
    if (!isset($_COOKIE['user'])) {
      throw new \Exception('No current session');
    }

    try {
      $jwt = self::jwt();
      $accessToken = $_COOKIE['user'];

      $payload = $jwt->decode($accessToken);
      $userID = $payload['sub'];

      $user = new User('shinydex', $userID);
      return $user;
    } catch (\Throwable $error) {
      self::forceSignOut();
      throw $error;
    }
  }


  /** Gets the user from the refresh token. */
  public static function getFromRefreshToken(): self {
    if (!isset($_COOKIE['refresh'])) {
      throw new \Exception('No refresh token');
    }

    try {
      $db = self::db();
      $jwt = self::jwt();
      $refreshToken = $_COOKIE['refresh'];
      $signedRefreshToken = bin2hex($jwt->sign($refreshToken));

      $db->beginTransaction();

      $query = "SELECT * FROM shinydex_user_sessions
                WHERE `token` = :token LIMIT 1";
      $session_data = $db->prepare($query);
      $session_data->bindParam(':token', $signedRefreshToken, PDO::PARAM_STR, 512);
      $session_data->execute();
      $session_data = $session_data->fetch(PDO::FETCH_ASSOC);

      if (!$session_data) {
        throw new \Exception('Invalid refresh token');
      }

      $expired = ((int) $session_data['expires']) <= time();

      if ($expired) {
        throw new \Exception('Expired refresh token');
      }

      $userID = $session_data['userid'];

      // Consume the refresh token
      $query = "DELETE FROM shinydex_user_sessions
                WHERE `userid` = :userid AND `token` = :token";
      $consume_token = $db->prepare($query);
      $consume_token->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
      $consume_token->bindParam(':token', $signedRefreshToken, PDO::PARAM_STR, 512);
      $consume_token->execute();

      $db->commit();

      if (!$consume_token) {
        throw new \Exception('Failed to consume refresh token');
      }

      return new User('shinydex', $userID);
    } catch (\Throwable $error) {
      $db->rollback();
      self::forceSignOut();
      throw $error;
    }
  }


  /** Gets the user from the current session OR a refresh token. */
  public static function getFromAnyToken(): self {
    if (isset($_COOKIE['user'])) {
      $user = self::getFromAccessToken();
    } else if (isset($_COOKIE['refresh'])) {
      $user = self::getFromRefreshToken();
      $user->signIn();
    }
    return $user;
  }


  /** Creates a user's entry in the database. */
  public static function createDBEntry(string $provider, string $providerUserID) {
    if (!in_array($provider, self::$supportedProviders)) throw new \Exception('ID provider not supported');
    $db = self::db();

    $query = "INSERT INTO shinydex_users ($provider)
              VALUES (:provideruserid)";
    $create_user = $db->prepare($query);
    $create_user->bindParam(':provideruserid', $providerUserID, PDO::PARAM_STR, 36);
    $result = $create_user->execute();

    if (!$result) throw new \Exception('Error while creating user DB entry');
  }


  /** Gets a user's data from the database. */
  public static function getDBEntry(string $provider, string $providerUserID): array|null {
    $db = self::db();
    $DBcolumn = $provider === 'shinydex' ? 'uuid' : $provider;

    $query = "SELECT * FROM shinydex_users
              WHERE $DBcolumn = :provideruserid LIMIT 1";
    $user_data = $db->prepare($query);
    $user_data->bindParam(':provideruserid', $providerUserID, PDO::PARAM_STR, 36);
    $user_data->execute();
    $user_data = $user_data->fetch(PDO::FETCH_ASSOC);

    if (!$user_data) return null;
    return $user_data;
  }


  public static function forceSignOut() {
    $cookieOptions = [
      'expires' => time() - 3600, // in the past, so the browser immediately deletes the cookie
      'secure' => true,
      'samesite' => 'Strict',
      'path' => '/shinydex/',
      'httponly' => true
    ];

    // Delete access token from app
    setcookie('user', '', $cookieOptions);

    // Delete refresh token from app
    setcookie('refresh', '', $cookieOptions);
  }


  // ----- POKÉMON ----- //


  /** Gets the list of all of the current user's Pokémon. */
  public function getPokemon(): array {
    $query = "SELECT * FROM `shinydex_pokemon`
              WHERE `userid` = :userid ORDER BY id DESC";
    $online_data = $this->db->prepare($query);

    $userID = $this->userID;
    $online_data->bindParam(':userid', $userID, PDO::PARAM_STR, 36);

    $online_data->execute();
    return $online_data->fetchAll(PDO::FETCH_ASSOC);
  }


  /** Gets the list of all of the current user's previously deleted Pokémon. */
  public function getDeletedPokemon(): array {
    $query = "SELECT * FROM `shinydex_deleted_pokemon`
              WHERE `userid` = :userid ORDER BY id DESC";
    $online_deleted_data = $this->db->prepare($query);

    $userID = $this->userID;
    $online_deleted_data->bindParam(':userid', $userID, PDO::PARAM_STR, 36);

    $online_deleted_data->execute();
    return $online_deleted_data->fetchAll(PDO::FETCH_ASSOC);
  }


  /** Adds many Pokémon to the current user's collection. */
  public function addManyPokemon(array $pokemon): bool {
    if (count($pokemon) === 0) return true;

    $placeholders = [];
  
    foreach($pokemon as $key => $shiny) {
      $placeholders[] = "(:huntid$key, :userid$key, :creationTime$key, :lastUpdate$key, :dexid$key, :forme$key, :game$key, :method$key, :count$key, :charm$key, :catchTime$key, :nickname$key, :ball$key, :gene$key, :originalTrainer$key, :notes$key)";
  
      $values[":huntid$key"] = $shiny['huntid'];
      $values[":userid$key"] = $this->userID;
      $values[":creationTime$key"] = $shiny['lastUpdate'];
      $values[":lastUpdate$key"] = $shiny['lastUpdate'];
  
      $values[":dexid$key"] = $shiny['dexid'];
      $values[":forme$key"] = $shiny['forme'];
      $values[":game$key"] = $shiny['game'];
      $values[":method$key"] = $shiny['method'];
      $values[":count$key"] = $shiny['count'];
      $values[":charm$key"] = $shiny['charm'];
  
      $values[":catchTime$key"] = $shiny['catchTime'];
      $values[":nickname$key"] = $shiny['name'];
      $values[":ball$key"] = $shiny['ball'];
      $values[":gene$key"] = $shiny['gene'];
      $values[":originalTrainer$key"] = $shiny['originalTrainer'];
  
      $values[":notes$key"] = $shiny['notes'];
    }
  
    $placeholders = implode(',', $placeholders);
  
    $query = "INSERT INTO `shinydex_pokemon` (
                `huntid`,
                `userid`,
                `creationTime`,
                `lastUpdate`,
  
                `dexid`,
                `forme`,
                `game`,
                `method`,
                `count`,
                `charm`,
  
                `catchTime`,
                `name`,
                `ball`,
                `gene`,
                `originalTrainer`,
  
                `notes`
              ) VALUES $placeholders";
    $insert = $this->db->prepare($query);

    $result = $insert->execute($values);
    if (!$result) throw new \Exception('Error while adding a Pokémon');
    return $result;
  }


  /** Updates many of the current user's Pokémon. */
  public function updateManyPokemon(array $pokemon): array {
    if (count($pokemon) === 0) return [];

    $results = [];

    $query = "UPDATE `shinydex_pokemon` SET 
                `lastUpdate` = :lastUpdate,

                `dexid` = :dexid,
                `forme` = :forme,
                `game` = :game,
                `method` = :method,
                `count` = :count,
                `charm` = :charm,

                `catchTime` = :catchTime,
                `name` = :nickname,
                `ball` = :ball,
                `gene` = :gene,
                `originalTrainer` = :originalTrainer,

                `notes` = :notes
              WHERE `huntid` = :huntid AND `userid` = :userid";
    $update = $this->db->prepare($query);

    $userID = $this->userID;
    $update->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    foreach($pokemon as $key => $shiny) {
      $update->bindParam(':huntid', $shiny['huntid'], PDO::PARAM_STR, 36);

      $update->bindParam(':lastUpdate', $shiny['lastUpdate'], PDO::PARAM_STR, 13);

      $update->bindParam(':dexid', $shiny['dexid'], PDO::PARAM_INT, 4);
      $update->bindParam(':forme', $shiny['forme'], PDO::PARAM_STR, 50);
      $update->bindParam(':game', $shiny['game'], PDO::PARAM_STR, 50);
      $update->bindParam(':method', $shiny['method'], PDO::PARAM_STR, 50);
      $update->bindParam(':count', $shiny['count']);
      $update->bindParam(':charm', $shiny['charm'], PDO::PARAM_INT, 1);

      $update->bindParam(':catchTime', $shiny['catchTime'], PDO::PARAM_STR, 13);
      $update->bindParam(':nickname', $shiny['name'], PDO::PARAM_STR, 50);
      $update->bindParam(':ball', $shiny['ball'], PDO::PARAM_STR, 50);
      $update->bindParam(':gene', $shiny['gene'], PDO::PARAM_STR, 50);
      $update->bindParam(':originalTrainer', $shiny['originalTrainer'], PDO::PARAM_INT, 1);

      $update->bindParam(':notes', $shiny['notes']);

      $results[] = $update->execute();
    }

    return $results;
  }


  /**
   * Deleted many of the current user's Pokémon by :
   * - storing partial data about them in the `shinydex_deleted_pokemon` table,
   * - deleting their full data from the `shinydex_pokemon` table.
   */
  public function deleteManyPokemon(array $pokemon): array {
    if (count($pokemon) === 0) return [];

    $results = [];


    // - Store partial data in about deleted Pokémon

    $placeholders = [];
    $values = [];
    foreach ($pokemon as $key => $shiny) {
      $placeholders[] = "(?, ?, ?)";
      array_push($values, $this->userID, $shiny['huntid'], $shiny['lastUpdate']);
    }
  
    $placeholders = implode(',', $placeholders);
  
    $query = "INSERT INTO `shinydex_deleted_pokemon` (`userid`, `huntid`, `lastUpdate`)
              VALUES $placeholders";
    $insert = $this->db->prepare($query);
  
    $results[] = $insert->execute($values);
    

    // - Delete full data of deleted Pokémon

    $placeholders = implode(',', array_map(fn($e) => '?', $pokemon));

    $query = "DELETE FROM shinydex_pokemon
              WHERE userid = ? AND huntid IN ($placeholders)";
    $delete = $this->db->prepare($query);

    $userID = $this->userID;
    $delete->bindValue(1, $userID, PDO::PARAM_STR);
    foreach ($pokemon as $key => $shiny) {
      $delete->bindValue($key + 2, $shiny['huntid'], PDO::PARAM_STR);
    }

    $results[] = $delete->execute();


    return $results;
  }


  /**
   * Deletes partial data from the `shinydex_deleted_pokemon` table
   * for Pokémon who have been restored to the `shinydex_pokemon` table.
   */
  public function cleanUpRestoredPokemon(array $huntids): bool {
    if (count($huntids) === 0) return true;

    $placeholders = implode(',', array_map(fn($e) => '?', $huntids));

    $query = "DELETE FROM shinydex_deleted_pokemon
              WHERE userid = ? AND huntid IN ($placeholders)";
    $delete = $this->db->prepare($query);
  
    $userID = $this->userID;
    $delete->bindValue(1, $userID, PDO::PARAM_STR);
    foreach($huntids as $key => $huntid) {
      $delete->bindValue($key + 2, $huntid, PDO::PARAM_STR);
    }
  
    return $delete->execute();
  }


  // ----- FRIENDS ----- //


  /** Gets the list of the current user's friends. */
  public function getFriends(): array {
    $db = self::db();

    $query = "SELECT * FROM shinydex_users
              WHERE uuid IN (
                SELECT f.friend_userid
                FROM shinydex_friends AS f
                WHERE f.userid = :userid
              )";
    $select = $db->prepare($query);

    $userID = $this->userID;
    $select->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $select->execute();
    return $select->fetchAll(PDO::FETCH_ASSOC) ?? [];
  }


  /** Adds a friend to the current user. */
  public function addFriends(array $usernames): bool {
    if (count($usernames) === 0) return true;

    $placeholders = implode(',', array_map(fn($u) => '?', $usernames));

    $query = "INSERT INTO shinydex_friends (userid, friend_userid)
              SELECT ?, shinydex_users.uuid
              FROM shinydex_users
              WHERE shinydex_users.username IN ($placeholders)";
    $insert = $this->db->prepare($query);

    $userID = $this->userID;
    $insert->bindValue(1, $userID, PDO::PARAM_STR);
    foreach ($usernames as $key => $username) {
      $insert->bindValue($key + 2, $username, PDO::PARAM_STR);
    }

    $result = $insert->execute();
    if (!$result) throw new \Exception("Error while adding a friend");
    return $result;
  }


  /** Remove a friend from the current user. */
  public function removeFriends(array $usernames): bool {
    if (count($usernames) === 0) return true;

    $placeholders = implode(',', array_map(fn($u) => '?', $usernames));

    $query = "DELETE FROM shinydex_friends
              WHERE userid = ? AND friend_userid = (
                SELECT uuid
                FROM shinydex_users
                WHERE username IN ($placeholders)
              )";
    $delete = $this->db->prepare($query);

    $userID = $this->userID;
    $delete->bindValue(1, $userID, PDO::PARAM_STR);
    foreach ($usernames as $key => $username) {
      $delete->bindValue($key + 2, $username, PDO::PARAM_STR);
    }

    $result = $delete->execute();
    if (!$result) throw new \Exception("Error while removing a friend");
    return $result;
  }


  // ----- PUSH SUBSCRIPTIONS ----- //


  /**
   * Gets all of the user's Push subscriptions.
   * Optionally only those that match a given $endpoint.
   */
  public function getPushSubscriptions(?string $endpoint = null): array {
    $condition = "`userid` = :userid";
    if (!is_null($endpoint)) $condition .= " AND `subscription_endpoint` = :subscription_endpoint";

    $push_subscription = $this->db->prepare("SELECT * FROM `shinydex_push_subscriptions` WHERE
      $condition
    ORDER BY id DESC");

    $userID = $this->userID;
    $push_subscription->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    if (!is_null($endpoint)) {
      $push_subscription->bindParam(':subscription_endpoint', $endpoint);
    }

    $push_subscription->execute();
    return $push_subscription->fetchAll(PDO::FETCH_ASSOC) ?? [];
  }


  /** Saves a Push subscription in the database. */
  public function subscribeToPush(array $subscription) {
    if (!isset($subscription['endpoint'])) throw new \Exception('Incorrectly formatted subscription');
    $endpoint = $subscription['endpoint'];
    unset($subscription['endpoint']); // to avoid storing the endpoint twice in the DB

    // Get the existing subscription with the same endpoint if it exists,
    // to determine whether to update or insert the subscription into the DB
    $existing_subscriptions = $this->getPushSubscriptions($endpoint);
    $should_update = count($existing_subscriptions) > 0;

    if ($should_update) {
      $upsert = $this->db->prepare('UPDATE `shinydex_push_subscriptions` SET 
        `subscription_params` = :subscription_params
      WHERE
        `userid` = :userid AND
        `subscription_endpoint` = :subscription_endpoint'
      );
    } else {
      $upsert = $this->db->prepare("INSERT INTO `shinydex_push_subscriptions` (
        `userid`,
        `subscription_endpoint`,
        `subscription_params`
      ) VALUES (
        :userid,
        :subscription_endpoint,
        :subscription_params
      )");
    }
    
    $userID = $this->userID;
    $upsert->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $upsert->bindParam(':subscription_endpoint', $endpoint);
    $subscription_params = json_encode($subscription);
    $upsert->bindParam(':subscription_params', $subscription_params);
  
    $result = $upsert->execute();
    if (!$result) {
      $error_message = $should_update
        ? 'Error while updating Push subscription'
        : 'Error while creating Push subscription';
      throw new \Exception($error_message);
    }
  }


  /** Deletes a Push subscription from the database. */
  public function unsubscribeFromPush(array $subscription) {
    if (!isset($subscription['endpoint'])) throw new \Exception('Incorrectly formatted subscription');
    $endpoint = $subscription['endpoint'];

    $delete = $this->db->prepare("DELETE FROM `shinydex_push_subscriptions` WHERE
      `userid` = :userid AND `subscription_endpoint` = :subscription_endpoint
    ");

    $userID = $this->userID;
    $delete->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $delete->bindParam(':subscription_endpoint', $endpoint);

    $result = $delete->execute();
    if (!$result) throw new \Exception("Error while deleting Push subscription");
  }


  /** Deletes a bunch of Push subscriptions from the database (called when their endpoints are somehow invalid). */
  static public function deleteSubscriptions(array $endpoints) {
    if (count($endpoints) === 0) return;
    $endpoints_query_string = [];
    for ($i = 0; $i < count($endpoints); $i++) {
      $endpoints_query_string[] = "?";
    }
    $endpoints_query_string = join(',', $endpoints_query_string);

    $db = self::db();
    $delete = $db->prepare("DELETE FROM `shinydex_push_subscriptions` WHERE
      `subscription_endpoint` IN ($endpoints_query_string)
    ");

    $result = $delete->execute($endpoints);
    if (!$result) throw new \Exception("Error while deleting Push subscriptions");
  }


  /** Gets all the Push subscriptions of the users that have added the current user as a friend. */
  public function getAllFriendsPushSuscriptions() {
    $select = $this->db->prepare("SELECT s.* FROM `shinydex_push_subscriptions` AS s
      WHERE s.userid IN (
        SELECT f.friend_userid FROM shinydex_friends AS f
        WHERE f.userid = :userid
      )
    ");

    $userID = $this->userID;
    $select->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $select->execute();
    $select = $select->fetchAll(PDO::FETCH_ASSOC);

    return array_map(function($sub) {
      return [
        'endpoint' => $sub['subscription_endpoint'],
        ...json_decode($sub['subscription_params'], true)
      ];
    }, $select);
  }
}