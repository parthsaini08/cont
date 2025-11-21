<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

require_once "db.php";
session_start();

$pdo = getDBConnection();

/* --------------------------------------------------------
   AUTH + USER FETCH
-------------------------------------------------------- */
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status'=>'error', 'message'=>'Not logged in']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$role = $user['role'];
$agentExt = $user['agent_extension'];
$agentName = $user['name'];

/* --------------------------------------------------------
   DATE INPUTS
-------------------------------------------------------- */
$startRaw = $_GET['startDate'] ?? null;
$endRaw   = $_GET['endDate'] ?? null;

if (!$startRaw || !$endRaw) {
    echo json_encode(['status'=>'error','message'=>'Missing date range']);
    exit;
}

$startDate = date("Y-m-d", strtotime($startRaw));
$endDate   = date("Y-m-d", strtotime($endRaw));
$startDT   = date("Y-m-d H:i:s", strtotime($startRaw));
$endDT     = date("Y-m-d H:i:s", strtotime($endRaw));

/* --------------------------------------------------------
   IF ADMIN → RETURN TOTALS OF EVERYTHING
-------------------------------------------------------- */

if ($role === "admin") {

    // Total Marketing Spend
    $sqlMkt = "
        SELECT SUM(amount) 
        FROM marketing_costs 
        WHERE cost_date BETWEEN :s AND :e
    ";
    $stmtMkt = $pdo->prepare($sqlMkt);
    $stmtMkt->execute([':s'=>$startDate, ':e'=>$endDate]);
    $totalMarketing = (float)$stmtMkt->fetchColumn();


    // Total Calls
    $sqlCalls = "
        SELECT COUNT(id)
        FROM ringcentral_calls
        WHERE direction='Inbound'
        AND queue_name IS NOT NULL
          AND start_time BETWEEN :s AND :e
    ";
    $stmtCalls = $pdo->prepare($sqlCalls);
    $stmtCalls->execute([':s'=>$startDT, ':e'=>$endDT]);
    $totalCalls = (int)$stmtCalls->fetchColumn();


    // Total MCO
    $sqlMCO = "
        SELECT SUM(CAST(mco AS DECIMAL(10,2)))
        FROM ringcentral_calls
        WHERE direction='Inbound'
          AND start_time BETWEEN :s AND :e
    ";
    $stmtMCO = $pdo->prepare($sqlMCO);
    $stmtMCO->execute([':s'=>$startDT, ':e'=>$endDT]);
    $totalMCO = (float)$stmtMCO->fetchColumn();


    // Total Bookings
    $sqlBooks = "
        SELECT COUNT(id)
        FROM ringcentral_calls
        WHERE LOWER(TRIM(converted))='converted'
          AND direction='Inbound'
          AND start_time BETWEEN :s AND :e
    ";
    $stmtBooks = $pdo->prepare($sqlBooks);
    $stmtBooks->execute([':s'=>$startDT, ':e'=>$endDT]);
    $totalBookings = (int)$stmtBooks->fetchColumn();


    // Conversion
    $conversion = $totalCalls > 0 ? round(($totalBookings / $totalCalls) * 100, 2) : 0;

    // Revenue Ratio
    $revenueRatio = $totalMarketing > 0 ? round($totalMCO / $totalMarketing, 2) : 0;


    echo json_encode([
        'status' => 'success',
        'role' => 'admin',
        'data' => [
            'agent_name' => "Admin (Overall Totals)",
            'marketing_spent' => round($totalMarketing, 2),
            'total_calls' => $totalCalls,
            'MCO' => round($totalMCO, 2),
            'bookings' => $totalBookings,
            'conversion' => $conversion,
            'revenue_ratio' => $revenueRatio,
            'daily_calls' => [],      // no daily trend for admin
            'rank' => null,
            'total_agents' => null
        ]
    ]);
    exit;
}

/* --------------------------------------------------------
   AGENT MODE → INDIVIDUAL STATS
-------------------------------------------------------- */

/* Step 1 — Marketing Spent per Queue */
$sqlM = "
    SELECT LOWER(TRIM(queue_name)) AS queue_key,
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

/* Step 2 — Total Calls per Queue */
$sqlC = "
    SELECT LOWER(TRIM(queue_name)) AS queue_key,
           COUNT(id) AS total_calls
    FROM ringcentral_calls
    WHERE direction='Inbound'
      AND start_time BETWEEN :start AND :end
      AND queue_name IS NOT NULL
    GROUP BY queue_key
";
$stmtC = $pdo->prepare($sqlC);
$stmtC->execute([':start'=>$startDT, ':end'=>$endDT]);
$callsRows = $stmtC->fetchAll(PDO::FETCH_ASSOC);

$callsMap = [];
foreach ($callsRows as $c) {
    $callsMap[$c['queue_key']] = (int)$c['total_calls'];
}

/* Step 3 — Per-call cost per Queue */
$queueCost = [];
$allQueues = array_unique(array_merge(array_keys($marketingMap), array_keys($callsMap)));

foreach ($allQueues as $q) {
    $m = $marketingMap[$q] ?? 0;
    $c = $callsMap[$q] ?? 0;
    $queueCost[$q] = $c > 0 ? ($m / $c) : 0;
}

/* Step 4 — Agent Totals */
$sqlA = "
    SELECT 
        LOWER(TRIM(queue_name)) AS queue_key,
        COUNT(id) AS agent_calls,
        SUM(CAST(mco AS DECIMAL(10,2))) AS MCO,
        SUM(CASE WHEN LOWER(TRIM(converted))='converted' THEN 1 ELSE 0 END) AS bookings
    FROM ringcentral_calls
    WHERE agent_extension = :ext
      AND direction='Inbound'
      AND start_time BETWEEN :start AND :end
      AND queue_name IS NOT NULL
    GROUP BY queue_key
";
$stmtA = $pdo->prepare($sqlA);
$stmtA->execute([':ext'=>$agentExt, ':start'=>$startDT, ':end'=>$endDT]);
$rows = $stmtA->fetchAll(PDO::FETCH_ASSOC);

$totalMarketing = 0;
$totalCalls = 0;
$totalMCO = 0;
$totalBookings = 0;

foreach ($rows as $r) {
    $q = $r['queue_key'];
    $calls = (int)$r['agent_calls'];

    $totalCalls += $calls;
    $totalMCO += (float)$r['MCO'];
    $totalBookings += (int)$r['bookings'];

    $cost = $queueCost[$q] ?? 0;
    $totalMarketing += $calls * $cost;
}

/* Step 5 — Daily Calls Trend */
$sqlDaily = "
    SELECT DATE(start_time) AS d, COUNT(id) AS c
    FROM ringcentral_calls
    WHERE agent_extension = :ext
      AND direction = 'Inbound'
      AND start_time BETWEEN :s AND :e
    GROUP BY d
    ORDER BY d ASC
";

$stmtD = $pdo->prepare($sqlDaily);
$stmtD->execute([':ext'=>$agentExt, ':s'=>$startDT, ':e'=>$endDT]);
$dailyCalls = array_map(fn($r) => (int)$r['c'], $stmtD->fetchAll(PDO::FETCH_ASSOC));

/* Step 6 — Ranking */
$sqlRank = "
    SELECT agent_extension, SUM(CAST(mco AS DECIMAL(10,2))) AS totalMCO
    FROM ringcentral_calls
    WHERE direction='Inbound'
      AND agent_extension IS NOT NULL
      AND start_time BETWEEN :s AND :e
      AND queue_name IS NOT NULL
    GROUP BY agent_extension
    ORDER BY totalMCO DESC
";

$stmtRank = $pdo->prepare($sqlRank);
$stmtRank->execute([':s'=>$startDT, ':e'=>$endDT]);
$rankRows = $stmtRank->fetchAll(PDO::FETCH_ASSOC);

$rank = 1;
$totalAgents = count($rankRows);

foreach ($rankRows as $i => $rr) {
    if ($rr['agent_extension'] == $agentExt) {
        $rank = $i + 1;
        break;
    }
}

/* --------------------------------------------------------
   FINAL RETURN FOR AGENT
-------------------------------------------------------- */
echo json_encode([
    'status' => 'success',
    'role' => 'agent',
    'data' => [
        'agent_name' => $agentName,
        'marketing_spent' => round($totalMarketing, 2),
        'total_calls' => $totalCalls,
        'MCO' => round($totalMCO, 2),
        'bookings' => $totalBookings,
        'conversion' => $totalCalls > 0 ? round(($totalBookings / $totalCalls) * 100, 2) : 0,
        'revenue_ratio' => $totalMarketing > 0 ? round($totalMCO / $totalMarketing, 2) : 0,
        'daily_calls' => $dailyCalls,
        'rank' => $rank,
        'total_agents' => $totalAgents
    ]
]);
