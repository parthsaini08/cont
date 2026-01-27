<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once "db.php";
session_start();

$pdo = getDBConnection();

/* ================= AUTH ================= */
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit;
}

$role            = $user['role'];
$agent_extension = $user['agent_extension'];
$lead_extension  = $user['lead_extension'];

/* ================= INPUTS ================= */
$startDate = $_GET['startDate'] ?? null;
$endDate   = $_GET['endDate'] ?? null;
$search    = trim($_GET['search'] ?? '');

$where  = [];
$params = [];

/* ================= GLOBAL SEARCH ================= */
/*
  🔥 RULE:
  - If search is present → IGNORE date filters
  - If search is empty → apply date filters
*/
if ($search !== '') {
    $where[] = "(
        from_name LIKE :search
        OR from_number LIKE :search
        OR to_number LIKE :search
        OR agent_name LIKE :search
        OR queue_name LIKE :search
        OR booking_number LIKE :search
        OR notes LIKE :search
        OR call_log_status LIKE :search
    )";
    $params['search'] = "%$search%";
} else {
    if ($startDate && $endDate) {
        $where[] = "start_time BETWEEN :start AND :end";
        $params['start'] = $startDate;
        $params['end']   = $endDate;
    }
}

/* ================= BASE CONDITION ================= */
$where[] = "direction = 'Inbound'";

/* ================= ROLE FILTERS ================= */
if ($role === 'admin') {
    // no extra filter
}
elseif ($role === 'VJ') {
    $where[] = "(queue_name LIKE :queueVJ OR queue_name = 'PA102' OR queue_name LIKE :queueBH')";
    $params['queueVJ'] = '%VJ%';
    $params['queueBH'] = '%BH%';
}
elseif ($role === 'lead') {
    $where[] = "(
        agent_extension COLLATE utf8mb4_general_ci = :lead
        OR agent_extension IN (
            SELECT agent_extension COLLATE utf8mb4_general_ci
            FROM users
            WHERE lead_extension COLLATE utf8mb4_general_ci = :lead
        )
    )";
    $params['lead'] = $agent_extension;
}
else {
    $where[] = "agent_extension = :agent";
    $params['agent'] = $agent_extension;
}

/* ================= FINAL QUERY ================= */
$sql = "
    SELECT *
    FROM ringcentral_calls
    WHERE " . implode(" AND ", $where) . "
    ORDER BY start_time DESC
    LIMIT 2000
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$calls = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'status' => 'success',
    'calls'  => $calls
]);
