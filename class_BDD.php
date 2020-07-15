<?php
require_once './parametres.php';

class BDD extends PDO
{
  public function __construct()
  {
    $file = Params::path();
    $params = parse_ini_file($file, TRUE);
    $dsn = $params['bdd']['driver'] .
           ':host=' . $params['bdd']['host'] .
           ';dbname=' . $params['bdd']['dbname'] .
           ';charset=' . $params['bdd']['charset'];
    parent::__construct($dsn, $params['bdd']['username'], $params['bdd']['password']);
  }
}