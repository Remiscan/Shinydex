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
    $store_token = $this->db->prepare("INSERT INTO shinydex_user_sessions (
      `userid`,
      `token`,
      `expires`
    ) VALUES (
      :userid,
      :token,
      :expires
    )");
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
    $userID = $this->userID;
    $refreshToken = $_COOKIE['refresh'] ?? 'null';
    $signedRefreshToken = bin2hex($this->jwt->sign($refreshToken));
    $store_token = $this->db->prepare("DELETE FROM shinydex_user_sessions WHERE `userid` = :userid AND `token` = :token");
    $store_token->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $store_token->bindParam(':token', $signedRefreshToken, PDO::PARAM_STR, 512);
    $result = $store_token->execute();

    self::forceSignOut();
  }


  /** Deletes the user from the database. */
  public function deleteDBEntry(): bool {
    $this->validateToken();

    $userID = $this->userID;
    $delete_user = $this->db->prepare("DELETE FROM shinydex_users WHERE `uuid` = :userid");
    $delete_user->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    return $delete_user->execute();
  }


  /** Updates the user's profile in the database. */
  public function updateDBEntry(string|null $username, string|null $public) {
    $this->validateToken();

    $userID = $this->userID;
    $fieldsToUpdate = [];
    if ($username != null)
      $fieldsToUpdate[] = 'username';
    if ($public != null)
      $fieldsToUpdate[] = 'public';
    if (count($fieldsToUpdate) === 0) return;
    $now = floor(1000 * microtime(true));

    $updateString = implode(', ', array_map(fn($e) => "`$e` = :$e", $fieldsToUpdate));
    $update = $this->db->prepare("UPDATE `shinydex_users` SET
      $updateString,
      `lastUpdate` = :lastupdate
    WHERE `uuid` = :userid");
    $update->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $update->bindParam(':lastupdate', $now, PDO::PARAM_STR, 13);
    if ($username != null)
      $update->bindParam(':username', $username, PDO::PARAM_STR, 30);
    if ($public != null) {
      $public = ($public === 'true');
      $update->bindParam(':public', $public, PDO::PARAM_BOOL);
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
        $delete = $db->prepare("DELETE FROM $table WHERE `userid` = :userid");
        $delete->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
        $delete->execute();
      }

      // Remove all friendship relations where the current user is the friend
      $delete = $db->prepare("DELETE FROM shinydex_friends WHERE `friend_userid` = :userid");
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

      $session_data = $db->prepare("SELECT * FROM shinydex_user_sessions WHERE `token` = :token LIMIT 1");
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
      $consume_token = $db->prepare("DELETE FROM shinydex_user_sessions WHERE `userid` = :userid AND `token` = :token");
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
    $create_user = $db->prepare("INSERT INTO shinydex_users (
      $provider
    ) VALUES (
      :provideruserid
    )");
    $create_user->bindParam(':provideruserid', $providerUserID, PDO::PARAM_STR, 36);
    $result = $create_user->execute();

    if (!$result) throw new \Exception('Error while creating user DB entry');
  }


  /** Gets a user's data from the database. */
  public static function getDBEntry(string $provider, string $providerUserID): array|null {
    $db = self::db();
    $DBcolumn = $provider === 'shinydex' ? 'uuid' : $provider;
    $user_data = $db->prepare("SELECT * FROM shinydex_users WHERE $DBcolumn = :provideruserid LIMIT 1");
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


  // ----- FRIENDS ----- //


  /** Gets the list of the current user's friends. */
  public function getFriends(): array {
    $db = self::db();

    $select = $db->prepare("SELECT * FROM shinydex_users WHERE uuid IN (
      SELECT f.friend_userid FROM shinydex_friends AS f WHERE f.userid = :userid
    )");

    $userID = $this->userID;
    $select->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $select->execute();
    return $select->fetchAll(PDO::FETCH_ASSOC) ?? [];
  }


  /** Adds a friend to the current user. */
  public function addFriend(string $username) {
    $insert = $this->db->prepare("INSERT INTO shinydex_friends (userid, friend_userid)
      SELECT :userid, shinydex_users.uuid FROM shinydex_users WHERE shinydex_users.username = :friend_username
    ");

    $userID = $this->userID;
    $insert->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $insert->bindParam(':friend_username', $username, PDO::PARAM_STR, 20);
    $result = $insert->execute();
    if (!$result) throw new \Exception("Error while adding a friend");
  }


  /** Remove a friend from the current user. */
  public function removeFriend(string $username) {
    $delete = $this->db->prepare("DELETE FROM shinydex_friends
      WHERE userid = :userid AND friend_userid = (
        SELECT uuid FROM shinydex_users WHERE username = :friend_username
      )
    ");

    $userID = $this->userID;
    $delete->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $delete->bindParam(':friend_username', $username, PDO::PARAM_STR, 20);
    $result = $delete->execute();
    if (!$result) throw new \Exception("Error while removing a friend");
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