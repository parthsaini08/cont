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

// fetch logged-in user
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit;
}

$role = $user['role'];
$agent_extension = $user['agent_extension'];
$lead_extension = $user['lead_extension'];

// ✅ Get date filters from query params (ISO format from frontend)
$startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
$endDate = isset($_GET['endDate']) ? $_GET['endDate'] : null;

$dateFilter = "";
$params = [];

// ✅ If both start and end dates provided, filter by them
// Get calls if there are calls on the API's
if ($startDate && $endDate) {
    $dateFilter = " AND start_time BETWEEN :start AND :end ";
    $params['start'] = $startDate;
    $params['end'] = $endDate;
}

if ($role === 'admin') {
    $sql = "SELECT * FROM ringcentral_calls 
            WHERE direction = 'Inbound' 
            $dateFilter 
            ORDER BY start_time DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params); 

}
elseif ($role === 'VJ') {
     $sql = "SELECT * FROM ringcentral_calls 
            WHERE (queue_name LIKE :queuePrefix OR queue_name = 'PA102' OR queue_name LIKE :bhPrefix) AND direction = 'Inbound' 
            $dateFilter 
            ORDER BY start_time DESC";

    $params['queuePrefix']='VJ%';
    $params['bhPrefix']='BH%';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
}
elseif ($role === 'lead') {
    $sql = "SELECT * FROM ringcentral_calls 
            WHERE direction = 'Inbound'
              AND (agent_extension COLLATE utf8mb4_general_ci = :lead 
                   OR agent_extension IN (
                        SELECT agent_extension COLLATE utf8mb4_general_ci
                        FROM users 
                        WHERE lead_extension COLLATE utf8mb4_general_ci = :lead
                   ))
              $dateFilter
            ORDER BY start_time DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_merge(['lead' => $agent_extension], $params));

} else {
    $sql = "SELECT * FROM ringcentral_calls 
            WHERE direction = 'Inbound'
              AND agent_extension = :agent 
              $dateFilter
            ORDER BY start_time DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_merge(['agent' => $agent_extension], $params));
}

$calls = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['status' => 'success', 'calls' => $calls]);
