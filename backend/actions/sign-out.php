<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_User.php';



header('Content-Type: application/json');

$response = [];



User::signOut();
respond(
  ['success' => 'signed out']
);