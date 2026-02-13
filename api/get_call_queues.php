<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

include "config.php";
require_once "db.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

$pdo = getDBConnection();

$stmt = $pdo->query("
    SELECT DISTINCT queue_name
    FROM marketing_costs
    ORDER BY queue_name ASC
");

$queues = $stmt->fetchAll(PDO::FETCH_COLUMN);

echo json_encode([
    "status" => "success",
    "queues" => $queues
]);
