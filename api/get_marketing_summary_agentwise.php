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

// Auth
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

$role = $user['role'];
$agent_extension = $user['agent_extension'];

// parse incoming ISO params
$startDateRaw = $_GET['startDate'] ?? null;
$endDateRaw   = $_GET['endDate'] ?? null;

if (!$startDateRaw || !$endDateRaw) {
    echo json_encode(['status' => 'error', 'message' => 'Missing date range']);
    exit;
}

// For marketing_costs (dates only)
$startDate = date('Y-m-d', strtotime($startDateRaw));
$endDate   = date('Y-m-d', strtotime($endDateRaw));

// For call logs (full datetime)
$startDateTime = date('Y-m-d H:i:s', strtotime($startDateRaw));
$endDateTime   = date('Y-m-d H:i:s', strtotime($endDateRaw));

// build role-based filters (placeholders only if needed)
$whereClause = "WHERE rc.direction = 'Inbound'";
$extraConditions = "";
$roleParams = [];

if ($role === 'admin') {
    // no extra
} elseif ($role === 'VJ') {
    $extraConditions = " AND (rc.queue_name LIKE :queuePrefix OR rc.queue_name = 'PA102' OR rc.queue_name LIKE 'BH%')";
    $roleParams[':queuePrefix'] = 'VJ%';
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
    $roleParams[':lead'] = $agent_extension;
} else {
    echo json_encode(['status' => 'success', 'summary' => []]);
    exit;
}

/* -------------------------------------------------------------
 STEP 1A: Marketing totals per queue (date-only)
------------------------------------------------------------- */
$sqlMarketing = "
    SELECT 
        LOWER(TRIM(queue_name)) AS queue_key,
        SUM(amount) AS marketing_spent
    FROM marketing_costs
    WHERE cost_date BETWEEN :mStart AND :mEnd
    GROUP BY queue_key
";
$paramsMarketing = [
    ':mStart' => $startDate,
    ':mEnd'   => $endDate
];

$stmtM = $pdo->prepare($sqlMarketing);
$stmtM->execute($paramsMarketing);
$marketingRows = $stmtM->fetchAll(PDO::FETCH_ASSOC);

// build marketing map
$marketingMap = [];
foreach ($marketingRows as $r) {
    $key = $r['queue_key'];
    $marketingMap[$key] = (float)$r['marketing_spent'];
}

/* -------------------------------------------------------------
 STEP 1B: Call counts per queue (apply role filters and datetime)
------------------------------------------------------------- */
$sqlCallsPerQueue = "
    SELECT
        LOWER(TRIM(rc.queue_name)) AS queue_key,
        COUNT(rc.id) AS total_calls
    FROM ringcentral_calls rc
    $whereClause
    $extraConditions
    AND rc.queue_name IS NOT NULL
    AND rc.start_time BETWEEN :cStart AND :cEnd
    GROUP BY queue_key
";

$paramsCalls = $roleParams + [
    ':cStart' => $startDateTime,
    ':cEnd'   => $endDateTime
];

$stmtC = $pdo->prepare($sqlCallsPerQueue);
$stmtC->execute($paramsCalls);
$callsRows = $stmtC->fetchAll(PDO::FETCH_ASSOC);

// build calls map
$callsMap = [];
foreach ($callsRows as $r) {
    $key = $r['queue_key'];
    $callsMap[$key] = (int)$r['total_calls'];
}

/* -------------------------------------------------------------
 STEP 1C: Compute call-cost-per-call per queue
 call_cost = marketing_total / total_calls (if total_calls>0)
------------------------------------------------------------- */
$queueCostMap = []; // queue_key => call_cost_per_call
$allQueueKeys = array_unique(array_merge(array_keys($marketingMap), array_keys($callsMap)));

foreach ($allQueueKeys as $qk) {
    $mSpent = $marketingMap[$qk] ?? 0.0;
    $calls = $callsMap[$qk] ?? 0;
    if ($calls > 0) {
        $queueCostMap[$qk] = $mSpent / $calls;
    } else {
        // No calls in this queue — cost per call = 0 (or we could distribute differently)
        $queueCostMap[$qk] = 0.0;
    }
}

/* -------------------------------------------------------------
 STEP 2: Agent + queue aggregation (calls, mco, bookings)
 We aggregate agent x queue first (using role filters) to minimize data volume
------------------------------------------------------------- */
$sqlAgentQueue = "
    SELECT
        rc.agent_name,
        rc.agent_extension,
        LOWER(TRIM(rc.queue_name)) AS queue_key,
        COUNT(rc.id) AS agent_calls_in_queue,
        COALESCE(SUM(rc.mco),0) AS MCO,
        COALESCE(SUM(CASE WHEN rc.converted = 'Converted' THEN 1 ELSE 0 END),0) AS bookings
    FROM ringcentral_calls rc
    $whereClause
    $extraConditions
    AND rc.queue_name IS NOT NULL
    AND rc.start_time BETWEEN :cStart AND :cEnd
    GROUP BY rc.agent_extension, queue_key
";

$paramsAgentQueue = $roleParams + [
    ':cStart' => $startDateTime,
    ':cEnd'   => $endDateTime
];

$stmtAQ = $pdo->prepare($sqlAgentQueue);
$stmtAQ->execute($paramsAgentQueue);
$agentQueueRows = $stmtAQ->fetchAll(PDO::FETCH_ASSOC);

if (!$agentQueueRows) {
    // still return success with empty summary to the client (or debug if you prefer)
    echo json_encode([
        'status' => 'success',
        'summary' => [],
        'queueCostMap' => $queueCostMap
    ]);
    exit;
}

/* -------------------------------------------------------------
 STEP 3: Compute agent-level totals using queueCostMap
 agent_marketing_spent += call_cost_per_call(queue) * agent_calls_in_queue
------------------------------------------------------------- */
$agentMap = []; // agent_extension => aggregated data

foreach ($agentQueueRows as $r) {
    $ext = $r['agent_extension'] ?? 'Unknown';
    $name = $r['agent_name'] ?? 'Unknown';
    $queue = $r['queue_key'];
    $agentCalls = (int)$r['agent_calls_in_queue'];
    $mco = (float)$r['MCO'];
    $bookings = (int)$r['bookings'];

    if (!isset($agentMap[$ext])) {
        $agentMap[$ext] = [
            'agent_name' => $name,
            'agent_extension' => $ext,
            'total_calls' => 0,
            'MCO' => 0.0,
            'bookings' => 0,
            'marketing_spent' => 0.0
        ];
    }

    $callCostPerCall = $queueCostMap[$queue] ?? 0.0;
    $agentMap[$ext]['total_calls'] += $agentCalls;
    $agentMap[$ext]['MCO'] += $mco;
    $agentMap[$ext]['bookings'] += $bookings;
    $agentMap[$ext]['marketing_spent'] += ($callCostPerCall * $agentCalls);
}

/* -------------------------------------------------------------
 STEP 4: Build result rows + totals
------------------------------------------------------------- */
$rows = array_values($agentMap);

$total = [
    'agent_name' => 'Total',
    'agent_extension' => '',
    'total_calls' => 0,
    'MCO' => 0.0,
    'bookings' => 0,
    'marketing_spent' => 0.0
];

foreach ($rows as $r) {
    $total['total_calls'] += $r['total_calls'];
    $total['MCO'] += $r['MCO'];
    $total['bookings'] += $r['bookings'];
    $total['marketing_spent'] += $r['marketing_spent'];
}

$rows[] = $total;

/* -------------------------------------------------------------
 STEP 5: Return JSON
------------------------------------------------------------- */
echo json_encode([
    'status' => 'success',
    'summary' => $rows,
    'queueCostMap' => $queueCostMap // optional debug info
]);
