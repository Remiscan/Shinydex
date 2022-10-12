<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/_common/php/DotEnv.php';

class BDD extends PDO {
  public function __construct() {
    $params = (new DotEnv('/home/remiscan/remiscanfr/config/database/mysql.env'))->getAll();
    $params['password'] = file_get_contents('/home/remiscan/remiscanfr/secrets/database/user_password.txt');

    parent::__construct("mysql:host=mysql;dbname=".$params['MYSQL_DATABASE'], $params['MYSQL_USER'], $params['password']);
  }
}