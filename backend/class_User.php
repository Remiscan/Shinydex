<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';



$db = new BDD();



class User {
  private array $data = [];

  public function __construct(array $credentials = []) {
    $provider = $credentials['provider'] ?? '';
    if (strlen($provider) === 0) throw new \Exception('Empty ID provider');

    $token = $data['credential'] ?? '';
    if (strlen($token) === 0) throw new \Exception('Empty ID token');

    // If the user is signing in from another provider, let that provider verify their token
    // then get or create a Shinydex user account
    if ($provider !== 'shinydex') {
      $payload = self::verifyIdToken($provider, $token);
      $providerUserID = $payload['sub'] ?? null;
      if (!$providerUserID) throw new \Exception('Invalid ID token');

      // Check if a user exists with that provider user ID
      $user = self::getUserEntry($provider, $providerUserID);
      if (!$user) {
        self::createUserEntry($provider, $providerUserID);
        $user = self::getUserEntry($provider, $providerUserID);
      }
      $this->data = $user;
    }
    
    // If the user is signing in with a previous session ID, get their Shinydex user account
    else {
      $secret = fn() => rtrim(file_get_contents('/run/secrets/shinydex_auth_secret'));
      $sessionID = $token;
      $hashedSessionID = hash('sha256', $sessionID . $secret());

      // Check if that session ID is associated to a user
      $user = self::getUserEntryFromSession($hashedSessionID);
      if (!$user) {
        throw new \Exception('No user associated to the session ID');
      }
      $this->data = $user;
    }
  }


  public function getUserID(): string {
    $userid = $this->data['uuid'] ?? '';
    if (!self::verifyUserID($userid)) throw new \Exception('Invalid user id in database');
    return $userid;
  }


  public function signIn(string $newChallenge) {
    $userID = $this->data['uuid'];
    $secret = fn() => rtrim(file_get_contents('/run/secrets/shinydex_auth_secret'));

    $sessionID = hash('sha256', $newChallenge . $userID . $secret());
    $hashedSessionID = hash('sha256', $sessionID . $secret());
    $now = time();

    // Create session in database
    $create_session = $db->prepare("INSERT INTO shinydex_user_sessions (
      userid,
      challenge,
      firstSignIn,
      lastSignIn
    ) VALUES (
      :userid,
      :challenge,
      :firstSignIn
      :lastSignIn
    )");
    $create_session->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $result = $create_session->execute();

    if (!$result) {
      self::signOut();
      throw new \Exception('Error while creating user session');
    }

    // Create session in cookie
    $cookieOptions = [
      'expires' => time() + 60 * 60 * 24 * 7, // 1 week
      'secure' => true,
      'samesite' => 'Strict',
      'path' => '/shinydex/'
    ];
  
    setcookie('session', $sessionID, [
      ...$cookieOptions,
      'httponly' => true
    ]);
  }


  public function deleteUserEntry(): bool {
    $userID = $this->getUserID();
    $delete_user = $db->prepare("DELETE FROM shinydex_users WHERE `uuid` = :userid");
    $delete_user->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    return $delete_user->execute();
  }


  public function updateUserProfile(string $username, bool $public) {
    $userID = $this->getUserID();
    $update = $db->prepare("UPDATE `shinydex_users` SET
      `username` = :username,
      `public` = :public
    WHERE `uuid` = :userid");
    $update->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $update->bindParam(':username', $username, PDO::PARAM_STR, 30);
    $update->bindParam(':public', $public, PDO::PARAM_BOOL);
    $result = $update->execute();

    if (!$result) throw new \Exception('Error while updating user DB profile');
  }


  public static function createUserEntry(string $provider, string $providerUserID) {
    $create_user = $db->prepare("INSERT INTO shinydex_users (
      $provider
    ) VALUES (
      :provideruserid
    )");
    $create_user->bindParam(':provideruserid', $providerUserID, PDO::PARAM_STR, 36);
    $result = $create_user->execute();

    if (!$result) throw new \Exception('Error while creating user DB entry');
  }


  public static function getUserEntry(string $provider, string $providerUserID): array|null {
    $user_data = $db->prepare("SELECT * FROM shinydex_users WHERE $provider = :provideruserid LIMIT 1");
    $user_data->bindParam(':provideruserid', $providerUserID, PDO::PARAM_STR, 36);
    $user_data->execute();

    if (!$user_data) return null;
    return $user_data->fetch(PDO::FETCH_ASSOC);
  }


  public static function getUserEntryFromSession(string $hashedSessionID): array|null {
    $user = $db->prepare("SELECT * FROM shinydex_user_sessions WHERE `challenge` = :challenge LIMIT 1");
    $user->bindParam(':challenge', $hashedSessionID, PDO::PARAM_STR, 128);
    $user->execute();

    if (!$user) return null;
    return $user->fetch(PDO::FETCH_ASSOC);
  }


  public static function verifyIdToken(string $provider, string|null $token = null): array {
    switch ($provider) {
      case 'google':
        require_once __DIR__.'/composer/vendor/autoload.php';
        $CLIENT_ID = '255145207710-8jq1qg3o43venoa7l0un3mr5s3ep8j2n.apps.googleusercontent.com';
        $client = new Google_Client(['client_id' => $CLIENT_ID]);
        return $client->verifyIdToken($token);
        break;

      case 'shinydex':
        return true;
        break;
  
      default:
        throw new \Exception('ID provider not supported');
    }
  }


  public static function verifyUserID(mixed $userid): bool {
    return is_string($userid) && strlen($userid) === 36;
  }


  public static function isLoggedIn() {
    return isset($_COOKIE['session']);
  }


  public static function getFromCookies() {
    return new User(['provider' => 'shinydex', 'credential' => $_COOKIE['session']]);
  }


  public static function signOut() {
    $cookieOptions = [
      'expires' => time() - 3600, // in the past, so the browser immediately deletes the cookie
      'secure' => true,
      'samesite' => 'Strict',
      'path' => '/shinydex/'
    ];
    
    setcookie('session', '', [
      ...$cookieOptions,
      'httponly' => true
    ]);
  }
}