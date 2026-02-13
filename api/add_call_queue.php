<?php
include "config.php";
require_once "db.php";
/* ===== CORS HEADERS ===== */
header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

/* ===== HANDLE PREFLIGHT ===== */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pdo = getDBConnection();

$input = json_decode(file_get_contents("php://input"), true);
$queueName = trim($input['queue_name'] ?? '');

if ($queueName === '') {
    echo json_encode(["success" => false, "error" => "Queue name required"]);
    exit;
}

// Check if queue already exists
$stmt = $pdo->prepare("
    SELECT 1 FROM marketing_costs
    WHERE queue_name = ?
    LIMIT 1
");
$stmt->execute([$queueName]);

if ($stmt->fetch()) {
    echo json_encode(["success" => false, "error" => "Queue already exists"]);
    exit;
}

// Insert a dummy row (amount = 0)
$stmt = $pdo->prepare("
    INSERT INTO marketing_costs (cost_date, queue_name, amount)
    VALUES (CURDATE(), ?, 0)
");

$stmt->execute([$queueName]);

echo json_encode([
    "success" => true,
    "queue_name" => $queueName
]);
