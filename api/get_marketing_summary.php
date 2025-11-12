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

// ✅ Auth check
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

// ✅ Get user & role
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit;
}

$role = $user['role'];
$agent_extension = $user['agent_extension'];

// ✅ Parse date filters
$startDate = $_GET['startDate'] ?? null;
$endDate = $_GET['endDate'] ?? null;

if (!$startDate || !$endDate) {
    echo json_encode(['status' => 'error', 'message' => 'Missing date range']);
    exit;
}

// convert ISO → MySQL date/time
$startDateTime = date('Y-m-d H:i:s', strtotime($startDate));
$endDateTime   = date('Y-m-d H:i:s', strtotime($endDate));
$startDateOnly = date('Y-m-d', strtotime($startDate));
$endDateOnly   = date('Y-m-d', strtotime($endDate));

// ✅ Params for PDO
$params = [
    ':start' => $startDateOnly,
    ':end' => $endDateOnly,
    ':startDate' => $startDateTime,
    ':endDate' => $endDateTime
];

// ✅ Role-based filtering for calls
$whereClause = "WHERE rc.direction = 'Inbound'";
$extraConditions = "";

if ($role === 'admin') {
    // full access
} elseif ($role === 'VJ') {
    $extraConditions = " AND (rc.queue_name LIKE :queuePrefix OR rc.queue_name = 'PA102' OR rc.queue_name LIKE 'BH%')";
    $params[':queuePrefix'] = 'VJ%';
} elseif ($role === 'lead') {
    $extraConditions = "
        AND (
            rc.agent_extension COLLATE utf8mb4_general_ci = :lead
            OR rc.agent_extension IN (
                SELECT agent_extension COLLATE utf8mb4_general_ci
                FROM users
                WHERE lead_extension COLLATE utf8mb4_general_ci = :lead
            )
        )";
    $params[':lead'] = $agent_extension;
} else {
    echo json_encode(['status' => 'success', 'summary' => []]);
    exit;
}

/* 
   ✅ Main idea:
   - Start from marketing_costs (guarantees queues like "Major Mix spanish" appear)
   - LEFT JOIN aggregated calls data per queue
*/

$sql = "
SELECT 
    queue_name,
    SUM(marketing_spent) AS marketing_spent,
    SUM(total_calls) AS total_calls,
    SUM(MCO) AS MCO,
    SUM(bookings) AS bookings
FROM (
    -- ✅ Marketing costs summary (queue-level)
    SELECT 
        queue_name COLLATE utf8mb4_unicode_ci AS queue_name,
        SUM(amount) AS marketing_spent,
        0 AS total_calls,
        0 AS MCO,
        0 AS bookings
    FROM marketing_costs
    WHERE cost_date BETWEEN :start AND :end
    GROUP BY queue_name

    UNION ALL

    -- ✅ Call summary (queue-level)
    SELECT 
        rc.queue_name COLLATE utf8mb4_unicode_ci AS queue_name,
        0 AS marketing_spent,
        COUNT(rc.id) AS total_calls,
        SUM(rc.mco) AS MCO,
        SUM(CASE WHEN rc.converted = 'Converted' THEN 1 ELSE 0 END) AS bookings
    FROM ringcentral_calls rc
    $whereClause
    $extraConditions
    AND rc.start_time BETWEEN :startDate AND :endDate
    AND rc.queue_name IS NOT NULL
    GROUP BY rc.queue_name
) AS combined
GROUP BY queue_name
ORDER BY marketing_spent DESC, total_calls DESC
";


$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// ✅ Compute totals
$total = [
    'queue_name' => 'Total',
    'marketing_spent' => 0.0,
    'total_calls' => 0,
    'MCO' => 0.0,
    'bookings' => 0
];

foreach ($rows as &$r) {
    $r['marketing_spent'] = (float)($r['marketing_spent'] ?? 0);
    $r['total_calls'] = (int)($r['total_calls'] ?? 0);
    $r['MCO'] = (float)($r['MCO'] ?? 0);
    $r['bookings'] = (int)($r['bookings'] ?? 0);

    $total['marketing_spent'] += $r['marketing_spent'];
    $total['total_calls'] += $r['total_calls'];
    $total['MCO'] += $r['MCO'];
    $total['bookings'] += $r['bookings'];
}

$rows[] = $total;

// ✅ Send final JSON
echo json_encode([
    'status' => 'success',
    'summary' => $rows
]);
