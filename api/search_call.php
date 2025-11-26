<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once "db.php";

session_start();

$pdo = getDBConnection();

// ✅ must be logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

$datasearch = isset($_GET['datasearch']) ? $_GET['datasearch'] : '';
$params=[];
$params['datasearch'] = '%'.$datasearch.'%';


$sql="SELECT * from ringcentral_calls WHERE booking_number LIKE :datasearch OR from_number LIKE :datasearch";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$calls = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['status' => 'success', 'calls' => $calls]);
