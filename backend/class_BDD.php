<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/_common/php/DotEnv.php';

class BDD extends PDO {
  public function __construct() {
    $params = (new DotEnv('/home/remiscan/remiscanfr/config/database/mysql.env'))->getAll();
    $params['password'] = rtrim(file_get_contents('/run/secrets/database_user_password'));

    parent::__construct("mysql:host=mysql;dbname=".$params['MYSQL_DATABASE'], $params['MYSQL_USER'], $params['password']);
  }
}