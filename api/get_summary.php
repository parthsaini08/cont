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

// ✅ Must be logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

// ✅ Get user
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

// ✅ Get date filters
$startDate = $_GET['startDate'] ?? null;
$endDate = $_GET['endDate'] ?? null;

$dateFilter = "";
$params = [];

// ✅ Date range
if ($startDate && $endDate) {
    $dateFilter = " AND start_time BETWEEN :start AND :end";
    $params['start'] = $startDate;
    $params['end'] = $endDate;
}

// ✅ Role-based WHERE clause
$whereClause = "WHERE direction = 'Inbound'";
$extraConditions = "";

if ($role === 'admin') {
    // No extra filter
} elseif ($role === 'VJ') {
    $extraConditions = " AND (queue_name LIKE :queuePrefix OR queue_name = 'PA102' OR queue_name LIKE 'BH%')";
    $params['queuePrefix'] = 'VJ%';
} elseif ($role === 'lead') {
    $extraConditions = "
        AND (
            agent_extension COLLATE utf8mb4_general_ci = :lead
            OR agent_extension IN (
                SELECT agent_extension COLLATE utf8mb4_general_ci
                FROM users 
                WHERE lead_extension COLLATE utf8mb4_general_ci = :lead
            )
        )
    ";
    $params['lead'] = $agent_extension;
} else {
    // Agent (don't return anything)
    echo json_encode(['status' => 'success', 'summary' => []]);
    exit;
}

// ✅ Final full WHERE clause
$fullWhere = "$whereClause $extraConditions $dateFilter";
// ✅ Summary per queue
$sqlSummaryPerQueue = "
    SELECT 
        IFNULL(queue_name, 'Unknown') AS queue_name,
        COUNT(*) AS total_calls,
        SUM(CASE WHEN call_log_status = 'Missed' THEN 1 ELSE 0 END) AS missed_calls,
        SUM(CASE WHEN call_log_status IN ('Accepted', 'Call Connected') THEN 1 ELSE 0 END) AS accepted_calls,
        SUM(mco) as MCO,
        ROUND(AVG(duration_ms) / 1000, 2) AS avg_call_duration_seconds,
        SUM(CASE WHEN productivity = 'Productive' THEN 1 ELSE 0 END) AS productive_calls,
        SUM(CASE WHEN productivity = 'Non-Productive' THEN 1 ELSE 0 END) AS non_productive_calls,
        SUM(CASE WHEN converted = 'Converted' THEN 1 ELSE 0 END) AS converted_calls,
        SUM(CASE WHEN converted = 'Not Converted' THEN 1 ELSE 0 END) AS not_converted_calls,
        SUM(CASE WHEN (duration_ms/1000) >=1200 THEN 1 ELSE 0 END) AS quality_calls
    FROM ringcentral_calls
    $fullWhere 
    AND queue_name is Not NULL
    GROUP BY queue_name
    ORDER BY queue_name ASC
";

$stmtSummaryPerQueue = $pdo->prepare($sqlSummaryPerQueue);
$stmtSummaryPerQueue->execute($params);
$summary = $stmtSummaryPerQueue->fetchAll(PDO::FETCH_ASSOC);

// ✅ Total row
$sqlTotal = "
    SELECT 
        'Total' AS queue_name,
        COUNT(*) AS total_calls,
        SUM(CASE WHEN call_log_status = 'Missed' THEN 1 ELSE 0 END) AS missed_calls,
        SUM(CASE WHEN call_log_status IN ('Accepted', 'Call Connected') THEN 1 ELSE 0 END) AS accepted_calls,
        SUM(mco) as MCO,
        ROUND(AVG(duration_ms) / 1000, 2) AS avg_call_duration_seconds,
        SUM(CASE WHEN productivity = 'Productive' THEN 1 ELSE 0 END) AS productive_calls,
        SUM(CASE WHEN productivity = 'Non-Productive' THEN 1 ELSE 0 END) AS non_productive_calls,
        SUM(CASE WHEN converted = 'Converted' THEN 1 ELSE 0 END) AS converted_calls,
        SUM(CASE WHEN converted = 'Not Converted' THEN 1 ELSE 0 END) AS not_converted_calls,
        SUM(CASE WHEN (duration_ms/1000) >=1200 THEN 1 ELSE 0 END) AS quality_calls
    FROM ringcentral_calls
    $fullWhere
    AND queue_name is Not NULL
";

$stmtTotal = $pdo->prepare($sqlTotal);
$stmtTotal->execute($params);
$totalRow = $stmtTotal->fetch(PDO::FETCH_ASSOC);

// ✅ Append total
$summary[] = $totalRow;

// ✅ Final JSON response
echo json_encode([
    'status' => 'success',
    'summary' => $summary
]);
