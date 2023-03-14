<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_BDD.php';
$db = new BDD();



$jwtDir = $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/composer/vendor/adhocore/src';
require_once "$jwtDir/JWTException.php";
require_once "$jwtDir/ValidatesJWT.php";
require_once "$jwtDir/JWT.php";
use Ahc\Jwt\JWT;
use Ahc\Jwt\JWTException;
$jwt = new JWT('/run/secrets/shinydex_private_key', 'RS256', 3600);



/** Decodes and verifies a JSON web token. */
function verifyJWT(string $provider, string $token = ''): array {
  switch ($provider) {
    case 'google':
      require_once __DIR__.'/composer/vendor/autoload.php';
      $CLIENT_ID = '255145207710-8jq1qg3o43venoa7l0un3mr5s3ep8j2n.apps.googleusercontent.com';
      $client = new Google_Client(['client_id' => $CLIENT_ID]);
      return $client->verifyIdToken($token);
      break;

    case 'shinydex':
      return $jwt->decode($token, true);
      break;

    default:
      throw new \Exception('ID provider not supported');
  }
}



class User {
  public static $supportedProviders = [
    'google'
  ];

  public readonly string $userID;
  private string|null $token = null;


  public function __construct(string $provider, string $providerUserID, bool $checkIfUserExists = true) {
    if ($checkIfUserExists) {
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
    }

    $this->userID = $user['uuid'];
    $this->token = $_COOKIE['user'] ?? null;
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
    $accessToken = $jwt->encode([
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
    $signedRefreshToken = $jwt->sign($refreshToken);

    // Send refresh token to app
    setcookie('refresh', $refreshToken, [
      'expires' => $refreshTokenExpires,
      ...$cookieOptions
    ]);

    // Store refresh token in database
    $store_token = $db->prepare("INSERT INTO shinydex_user_sessions (
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
    $store_token->bindParam(':expires', $refreshTokenExpiration, PDO::PARAM_STR, 10);
    $result = $store_token->execute();
  }


  /** Signs the user out. */
  public function signOut() {
    $cookieOptions = [
      'expires' => time() - 3600, // in the past, so the browser immediately deletes the cookie
      'secure' => true,
      'samesite' => 'Strict',
      'path' => '/shinydex/',
      'httponly' => true
    ];

    $this->token = null;

    // Delete access token from app
    setcookie('user', '', $cookieOptions);

    // Delete refresh token from database
    $refreshToken = $_COOKIE['refresh'] ?? 'null';
    $signedRefreshToken = $jwt->sign($refreshToken);
    $store_token = $db->prepare("DELETE FROM shinydex_user_sessions WHERE `userid` = :userid AND `token` = :token");
    $store_token->bindParam(':userid', $this->userID, PDO::PARAM_STR, 36);
    $store_token->bindParam(':token', $signedRefreshToken, PDO::PARAM_STR, 512);
    $result = $store_token->execute();

    // Delete refresh token from app
    setcookie('refresh', '', $cookieOptions);
  }


  public function isSignedIn(): bool {
    return isset($_COOKIE['user']);
  }


  public function validateToken() {
    try {
      $payload = $jwt->decode($this->token);
      $userID = $payload['sub'];
      if ($userID !== $this->userID) {
        throw new \Exception('User ID does not correspond');
      }
      return true;
    } catch (\Throwable $err) {
      throw new \Exception('Invalid user session');
    }
  }


  /** Deletes the user from the database. */
  public function deleteDBEntry(): bool {
    $this->validateToken();

    $delete_user = $db->prepare("DELETE FROM shinydex_users WHERE `uuid` = :userid");
    $delete_user->bindParam(':userid', $this->userID, PDO::PARAM_STR, 36);
    return $delete_user->execute();
  }


  /** Updates the user's profile in the database. */
  public function updateDBEntry(string $username, bool $public) {
    $this->validateToken();

    $update = $db->prepare("UPDATE `shinydex_users` SET
      `username` = :username,
      `public` = :public
    WHERE `uuid` = :userid");
    $update->bindParam(':userid', $this->userID, PDO::PARAM_STR, 36);
    $update->bindParam(':username', $username, PDO::PARAM_STR, 30);
    $update->bindParam(':public', $public, PDO::PARAM_BOOL);
    $result = $update->execute();

    if (!$result) throw new \Exception('Error while updating user account in database');
  }


  /** Gets the user from the current session. */
  public static function getFromAccessToken(): self {
    if (!isset($_COOKIE['user'])) {
      throw new \Exception('No current session');
    }

    $accessToken = $_COOKIE['user'];
    $payload = $jwt->decode($accessToken);
    $userID = $payload['sub'];

    $user = new User('shinydex', $userID, false);
    return $user;
  }


  /** Gets the user from the refresh token. */
  public static function getFromRefreshToken(): self {
    if (!isset($_COOKIE['refresh'])) {
      throw new \Exception('No refresh token');
    }

    $refreshToken = $_COOKIE['refresh'];
    $signedRefreshToken = $jwt->sign($refreshToken);

    $session_data = $db->prepare("SELECT * FROM shinydex_user_sessions WHERE `token` = :token LIMIT 1");
    $session_data->bindParam(':token', $signedRefreshToken, PDO::PARAM_STR, 512);
    $session_data->execute();

    if (!$session_data) {
      throw new \Exception('Invalid refresh token');
    }
    
    $session_data = $session_data->fetch(PDO::FETCH_ASSOC);
    $expired = ((int) $session_data['expires']) <= time();

    if ($expired) {
      throw new \Exception('Expired refresh token');
    }

    $userID = $session_data['uuid'];

    // Consume the refresh token
    $consume_token = $db->prepare("DELETE FROM shinydex_user_sessions WHERE `userid` = :userid AND `token` = :token");
    $consume_token->bindParam(':userid', $userID, PDO::PARAM_STR, 36);
    $consume_token->bindParam(':token', $signedRefreshToken, PDO::PARAM_STR, 512);
    $consume_token->execute();

    if (!$consume_token) {
      throw new \Exception('Failed to consume refresh token');
    }

    return new User('shinydex', $userID, true);
  }


  /** Gets the user from the current session OR a refresh token. */
  public static function getFromAnyToken(): self {
    if (isset($_COOKIE['user'])) {
      return self::getFromAccessToken();
    } else if (isset($_COOKIE['refresh'])) {
      return self::getFromRefreshToken();
    }
  }


  /** Creates a user's entry in the database. */
  public static function createDBEntry(string $provider, string $providerUserID) {
    if (!in_array($provider, $supportedProviders)) throw new \Exception('ID provider not supported');

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
    $DBcolumn = $provider === 'shinydex' ? 'uuid' : $provider;
    $user_data = $db->prepare("SELECT * FROM shinydex_users WHERE $DBcolumn = :provideruserid LIMIT 1");
    $user_data->bindParam(':provideruserid', $providerUserID, PDO::PARAM_STR, 36);
    $user_data->execute();

    if (!$user_data) return null;
    return $user_data->fetch(PDO::FETCH_ASSOC);
  }
}