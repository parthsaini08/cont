<?php
session_start();
header("Content-Type: application/json");
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Credentials: true");

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit();
}

echo json_encode([
    'status' => 'success',
    'user' => [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['name'],    
        'role' => $_SESSION['role'] ?? 'agent',
        'agent_extension' => $_SESSION['agent_extension'] ?? null,
        'lead_extension' => $_SESSION['lead_extension'] ?? null
    ]
]);
