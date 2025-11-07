<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

// Fetch user info from database
require_once "db.php";
$pdo = getDBConnection();

$stmt = $pdo->prepare("SELECT id, name, email, role, agent_extension, lead_extension FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit;
}

echo json_encode([
    'status' => 'success',
    'user' => $user
]);
