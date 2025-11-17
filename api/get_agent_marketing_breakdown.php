<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

require_once "db.php";
session_start();

$pdo = getDBConnection();

// Auth check
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status'=>'error', 'message'=>'Not logged in']);
    exit;
}

// Role check
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$role = $user['role'];
if ($role === 'user') {
    echo json_encode(['status'=>'success','breakdown'=>[]]);
    exit;
}

// inputs
$agentExt = $_GET['agent_extension'] ?? null;
$startRaw = $_GET['startDate'] ?? null;
$endRaw   = $_GET['endDate'] ?? null;

if (!$agentExt || !$startRaw || !$endRaw) {
    echo json_encode(['status'=>'error','message'=>'Missing parameters']);
    exit;
}

// date formats
$startDate = date("Y-m-d", strtotime($startRaw));
$endDate   = date("Y-m-d", strtotime($endRaw));
$startDT   = date("Y-m-d H:i:s", strtotime($startRaw));
$endDT     = date("Y-m-d H:i:s", strtotime($endRaw));

/* --------------------------------------------------------
    STEP 1 → Get marketing spent queue-wise
-------------------------------------------------------- */
$sqlM = "
    SELECT 
        LOWER(TRIM(queue_name)) AS queue_key,
        SUM(amount) AS marketing_spent
    FROM marketing_costs
    WHERE cost_date BETWEEN :s AND :e
    GROUP BY queue_key
";
$stmtM = $pdo->prepare($sqlM);
$stmtM->execute([':s'=>$startDate, ':e'=>$endDate]);
$marketing = $stmtM->fetchAll(PDO::FETCH_ASSOC);

$marketingMap = [];
foreach ($marketing as $m) {
    $marketingMap[$m['queue_key']] = (float)$m['marketing_spent'];
}

/* --------------------------------------------------------
    STEP 2 → Get total calls per queue (all agents)
-------------------------------------------------------- */
$sqlC = "
    SELECT 
        LOWER(TRIM(queue_name)) AS queue_key,
        COUNT(id) AS total_calls
    FROM ringcentral_calls
    WHERE direction='Inbound'
      AND start_time BETWEEN :start AND :end
      AND queue_name IS NOT NULL
    GROUP BY queue_key
";

$stmtC = $pdo->prepare($sqlC);
$stmtC->execute([':start'=>$startDT, ':end'=>$endDT]);
$calls = $stmtC->fetchAll(PDO::FETCH_ASSOC);

$callsMap = [];
foreach ($calls as $c) {
    $callsMap[$c['queue_key']] = (int)$c['total_calls'];
}

/* --------------------------------------------------------
    STEP 3 → Compute per-call cost for every queue
-------------------------------------------------------- */
$queueCost = [];

$allQueues = array_unique(array_merge(
    array_keys($marketingMap),
    array_keys($callsMap)
));

foreach ($allQueues as $q) {
    $m = $marketingMap[$q] ?? 0;
    $c = $callsMap[$q] ?? 0;
    $queueCost[$q] = $c > 0 ? ($m / $c) : 0;
}

/* --------------------------------------------------------
    STEP 4 → Get breakdown for the selected agent
-------------------------------------------------------- */
$sqlA = "
    SELECT 
        LOWER(TRIM(queue_name)) AS queue_key,
        COUNT(id) AS agent_calls,
        COALESCE(SUM(mco),0) AS MCO,
        SUM(CASE WHEN converted='Converted' THEN 1 ELSE 0 END) AS bookings
    FROM ringcentral_calls
    WHERE agent_extension = :ext
      AND direction='Inbound'
      AND queue_name IS NOT NULL
      AND start_time BETWEEN :start AND :end
    GROUP BY queue_key
";

$stmtA = $pdo->prepare($sqlA);
$stmtA->execute([
    ':ext'=>$agentExt,
    ':start'=>$startDT,
    ':end'=>$endDT
]);

$data = $stmtA->fetchAll(PDO::FETCH_ASSOC);

/* --------------------------------------------------------
    STEP 5 → Compute final breakdown rows
-------------------------------------------------------- */
$breakdown = [];

foreach ($data as $row) {
    $q = $row['queue_key'];
    $agentCalls = (int)$row['agent_calls'];
    $callCost = $queueCost[$q] ?? 0;

    $breakdown[] = [
        'queue_name' => $q,
        'agent_calls' => $agentCalls,
        'bookings' => (int)$row['bookings'],
        'MCO' => (float)$row['MCO'],
        'call_cost' => round($callCost, 2),
        'marketing_spent' => round($agentCalls * $callCost, 2)
    ];
}

// return
echo json_encode([
    'status' => 'success',
    'breakdown' => $breakdown
]);
