<?php
// Show errors for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Start session
session_start();

// CORS headers
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ Check if user is logged in


// ✅ Path to JSON file
$jsonFilePath = __DIR__ . "/tfn.json";

if (!file_exists($jsonFilePath)) {
    echo json_encode(['status' => 'error', 'message' => 'tfn.json not found on server']);
    exit();
}

// ✅ Read and decode JSON
$jsonData = json_decode(file_get_contents($jsonFilePath), true);

if (!is_array($jsonData)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON file format']);
    exit();
}

// ✅ Extract unique call queue names
$uniqueQueues = [];

foreach ($jsonData as $record) {
    if (!empty($record['callQueueName'])) {
        $uniqueQueues[] = $record['callQueueName'];
    }
}

$uniqueQueues = array_values(array_unique($uniqueQueues));

// ✅ Output Response
echo json_encode([
    'status' => 'success',
    'queues' => $uniqueQueues
]);
