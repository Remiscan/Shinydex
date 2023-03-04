<?php

class User {
  private string|null $idToken = null;
  private string|null $idProvider = null;
  private array|null $idData = null;

  public function __construct(string $idProvider, string|null $token = null) {
    $payload = self::verifyIdToken($idProvider, $token);
    if ($payload) {
      $this->idToken = $token;
      $this->idProvider = $idProvider;
      $this->idData = $payload;
    }
  }


  public function isValid(): bool {
    return $this->idToken != null;
  }


  public function getProviderUserId(): string {
    if (!$this->isValid()) throw new \Exception('User token is not valid');
    return $this->idData['sub'];
  }


  public function getDBUserId(PDO $db): string {
    if (!$this->isValid()) throw new \Exception('User token is not valid');
    $dbEntry = $this->getDBEntry($db);
    $userid = $dbEntry['uuid'] ?? '';
    if (!self::verifyDBUserId($userid)) throw new \Exception('Invalid user id in database');
    return $userid;
  }


  public function getProvider(): string {
    return $this->idProvider;
  }


  public function signIn() {
    if ($this->isValid()) {
      $cookieOptions = [
        'expires' => time() + 60 * 55, // 55 minutes
        'secure' => true,
        'samesite' => 'Strict',
        'path' => '/shinydex/'
      ];
    
      setcookie('id-jwt', $this->idToken, [
        ...$cookieOptions,
        'httponly' => true
      ]);
    
      setcookie('id-provider', $this->idProvider, [
        ...$cookieOptions,
        'httponly' => true
      ]);
    
      setcookie('loggedin', 'true', $cookieOptions);
    } else {
      $this->signOut();
      throw new \Exception('User token is not valid');
    }
  }


  public function createDBEntry(PDO $db) {
    $provider = $this->getProvider();
    $provideruserid = $this->getProviderUserId();
    $create_user = $db->prepare("INSERT INTO shinydex_users (
      $provider
    ) VALUES (
      :provideruserid
    )");
    $create_user->bindParam(':provideruserid', $provideruserid, PDO::PARAM_STR, 36);
    $result = $create_user->execute();

    if (!$result) throw new \Exception('Error while creating user DB entry');
  }


  public function getDBEntry(PDO $db): array {
    $provider = $this->getProvider();
    $provideruserid = $this->getProviderUserId();
    $user_data = $db->prepare("SELECT * FROM shinydex_users WHERE $provider = :provideruserid LIMIT 1");
    $user_data->bindParam(':provideruserid', $provideruserid, PDO::PARAM_STR, 36);
    $user_data->execute();
    $user_data = $user_data->fetch(PDO::FETCH_ASSOC);

    if (!$user_data) throw new \Exception('User does not exist in database');
    return $user_data;
  }


  public function deleteDBEntry(PDO $db): bool {
    $provider = $this->getProvider();
    $provideruserid = $this->getProviderUserId();
    $delete_user = $db->prepare("DELETE FROM shinydex_users WHERE $provider = :provideruserid");
    $delete_user->bindParam(':provideruserid', $provideruserid, PDO::PARAM_STR, 36);
    return $delete_user->execute();
  }


  public function updateDBprofile(PDO $db, string $username, bool $public) {
    $provider = $this->getProvider();
    $provideruserid = $this->getProviderUserId();
    $update = $db->prepare("UPDATE `shinydex_users` SET
      `username` = :username,
      `public` = :public
    WHERE $provider = :provideruserid");
    $update->bindParam(':provideruserid', $provideruserid, PDO::PARAM_STR, 36);
    $update->bindParam(':username', $username, PDO::PARAM_STR, 30);
    $update->bindParam(':public', $public, PDO::PARAM_BOOL);
    $result = $update->execute();

    if (!$result) throw new \Exception('Error while updating user DB profile');
  }


  public static function verifyIdToken(string $provider, string|null $token = null): array {
    switch ($provider) {
      case 'google':
        require_once __DIR__.'/composer/vendor/autoload.php';
        $CLIENT_ID = '255145207710-8jq1qg3o43venoa7l0un3mr5s3ep8j2n.apps.googleusercontent.com';
        $client = new Google_Client(['client_id' => $CLIENT_ID]);
        return $client->verifyIdToken($token);
        break;
  
      default:
        throw new \Exception('ID provider not supported');
    }
  }


  public static function verifyDBUserId(mixed $userid): bool {
    return is_string($userid) && strlen($userid) === 36;
  }


  public static function isLoggedIn() {
    return isset($_COOKIE['id-jwt']) && isset($_COOKIE['id-provider']);
  }


  public static function getFromCookies() {
    $user = new User($_COOKIE['id-provider'], $_COOKIE['id-jwt']);
    if (!$user->isValid()) throw new \Exception('User token is not valid');
    return $user;
  }


  public static function signOut() {
    $cookieOptions = [
      'expires' => time() - 3600, // in the past, so the browser immediately deletes the cookie
      'secure' => true,
      'samesite' => 'Strict',
      'path' => '/shinydex/'
    ];
    
    setcookie('id-jwt', '', [
      ...$cookieOptions,
      'httponly' => true
    ]);
    
    setcookie('id-provider', '', [
      ...$cookieOptions,
      'httponly' => true
    ]);
    
    setcookie('loggedin', '', $cookieOptions);
  }
}