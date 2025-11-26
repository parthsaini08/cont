<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

require_once "db.php";
session_start();

$pdo = getDBConnection();

/* =============================== AUTH =============================== */
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status'=>'error','message'=>'Not logged in']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE id=?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['status'=>'error','message'=>'User not found']);
    exit;
}

$role = $user['role'];
$agent_extension = $user['agent_extension'];

/* =============================== DATE RANGE =============================== */

$startDateRaw = $_GET['startDate'] ?? null;
$endDateRaw   = $_GET['endDate'] ?? null;

if (!$startDateRaw || !$endDateRaw) {
    echo json_encode(['status'=>'error','message'=>'Missing date range']);
    exit;
}

// Convert UTC → US
$tzUTC = new DateTimeZone("UTC");
$tzUS  = new DateTimeZone("America/New_York");

$startUTC = new DateTime($startDateRaw, $tzUTC);
$endUTC   = new DateTime($endDateRaw, $tzUTC);

$startUS = (clone $startUTC)->setTimezone($tzUS);
$endUS   = (clone $endUTC)->setTimezone($tzUS);

$startMonth = (clone $startUS)->modify("first day of this month");
$endMonth   = (clone $endUS)->modify("last day of this month");

$startDateTime = $startUTC->format("Y-m-d H:i:s");
$endDateTime   = $endUTC->format("Y-m-d H:i:s");

$startDate = $startUTC->format("Y-m-d");
$endDate   = $endUTC->format("Y-m-d");

/* =============================== MONTH LIST =============================== */

$monthKeys = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
$monthsInRange = [];

$cursor = clone $startMonth;
while ($cursor <= $endMonth) {
    $monthNum = (int)$cursor->format("n");
    $monthsInRange[] = $monthKeys[$monthNum - 1];
    $cursor->modify("+1 month");
}

/* =============================== ROLE FILTER =============================== */
$where = "WHERE rc.direction='Inbound'";
$extra = "";
$params = [];

if ($role === "admin") {
    // no filter
} elseif ($role === "lead") {
    $extra = " AND (
                rc.agent_extension = :lead
                OR rc.agent_extension IN (
                    SELECT agent_extension FROM users WHERE lead_extension = :lead
                )
              )";
    $params[':lead'] = $agent_extension;
} elseif ($role === "VJ") {
    $extra = " AND (rc.queue_name LIKE 'VJ%' OR rc.queue_name = 'PA102' OR rc.queue_name LIKE 'BH%')";
} else {
    echo json_encode(['status'=>'success','summary'=>[]]);
    exit;
}

/* =============================== GET TOTAL OPERATIONS EXPENSE =============================== */

$totalOpsExpense = 0.0;

// multi-year loop
$yearStart = (int)$startMonth->format("Y");
$yearEnd   = (int)$endMonth->format("Y");

for ($yr = $yearStart; $yr <= $yearEnd; $yr++) {
    $stmt = $pdo->prepare("SELECT months FROM expenses WHERE year=?");
    $stmt->execute([$yr]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as $r) {
        $arr = json_decode($r['months'], true);
        if (!is_array($arr)) continue;

        foreach ($monthsInRange as $m) {
            if (isset($arr[$m])) {
                $totalOpsExpense += floatval($arr[$m]);
            }
        }
    }
}

/* =============================== SALARY LOGIC =============================== */

// get sum(salary) of all revenue generating users
$stmt = $pdo->query("
    SELECT SUM(salary) AS total_salary, COUNT(*) AS cnt
    FROM users
    WHERE revenue_generating='yes'
");
$salaryRow = $stmt->fetch(PDO::FETCH_ASSOC);

$totalRevenueSalary = (float)$salaryRow['total_salary'];
$revenueAgents = (int)$salaryRow['cnt'];

if ($revenueAgents < 1) $revenueAgents = 1;

// cost per agent
$salaryPerAgent = $totalRevenueSalary / $revenueAgents;
$adminPerAgent  = ($totalOpsExpense - $totalRevenueSalary) / $revenueAgents;

/* =============================== MARKETING COST PER QUEUE =============================== */

$stmt = $pdo->prepare("
    SELECT LOWER(TRIM(queue_name)) AS queue_key,
           SUM(amount) AS marketing_spent
    FROM marketing_costs
    WHERE cost_date BETWEEN :s AND :e
    GROUP BY queue_key
");
$stmt->execute([':s'=>$startDate, ':e'=>$endDate]);
$marketingMap = [];

foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $marketingMap[$r['queue_key']] = floatval($r['marketing_spent']);
}

/* =============================== CALLS PER QUEUE =============================== */

$stmt = $pdo->prepare("
    SELECT LOWER(TRIM(queue_name)) AS queue_key,
           COUNT(id) AS total_calls
    FROM ringcentral_calls rc
    $where
    $extra
    AND rc.queue_name IS NOT NULL
    AND rc.start_time BETWEEN :s AND :e
    GROUP BY queue_key
");
$stmt->execute($params + [':s'=>$startDateTime, ':e'=>$endDateTime]);

$callsMap = [];
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $callsMap[$r['queue_key']] = intval($r['total_calls']);
}

/* =============================== COST PER CALL =============================== */

$queueCostMap = [];
$allQueues = array_unique(array_merge(array_keys($marketingMap), array_keys($callsMap)));

foreach ($allQueues as $q) {
    $spent = $marketingMap[$q] ?? 0;
    $calls = $callsMap[$q] ?? 0;
    $queueCostMap[$q] = ($calls > 0) ? $spent / $calls : 0;
}

/* =============================== AGENT AGGREGATION =============================== */

$stmt = $pdo->prepare("
    SELECT
        rc.agent_name,
        rc.agent_extension,
        LOWER(TRIM(rc.queue_name)) AS queue_key,
        COUNT(rc.id) AS agent_calls,
        SUM(rc.mco) AS MCO,
        SUM(CASE WHEN rc.converted='Converted' THEN 1 ELSE 0 END) AS bookings
    FROM ringcentral_calls rc
    $where
    $extra
    AND rc.queue_name IS NOT NULL
    AND rc.start_time BETWEEN :s AND :e
    GROUP BY rc.agent_extension, queue_key
");

$stmt->execute($params + [':s'=>$startDateTime, ':e'=>$endDateTime]);

$agentMap = [];

foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $ext = $r['agent_extension'];
    $queue = $r['queue_key'];

    if (!isset($agentMap[$ext])) {
        $agentMap[$ext] = [
            'agent_name'      => $r['agent_name'],
            'agent_extension' => $ext,
            'total_calls'     => 0,
            'MCO'             => 0,
            'bookings'        => 0,
            'marketing_spent' => 0,
            'gateway_cost'    => 0,
            'salary_share'    => $salaryPerAgent,
            'admin_share'     => $adminPerAgent
        ];
    }

    $calls = (int)$r['agent_calls'];
    $mco   = (float)$r['MCO'];
    $conv  = (int)$r['bookings'];

    $agentMap[$ext]['total_calls'] += $calls;
    $agentMap[$ext]['MCO']         += $mco;
    $agentMap[$ext]['bookings']    += $conv;

    $agentMap[$ext]['marketing_spent'] += $calls * ($queueCostMap[$queue] ?? 0);
}

/* =============================== FINAL COST ADDITIONS =============================== */

foreach ($agentMap as $ext => $row) {
    $agentMap[$ext]['gateway_cost'] = 0.16 * $row['MCO'];
}

/* =============================== TOTAL ROW =============================== */

$rows = array_values($agentMap);

$total = [
    'agent_name'      => 'Total',
    'agent_extension' => '',
    'total_calls'     => 0,
    'MCO'             => 0,
    'bookings'        => 0,
    'marketing_spent' => 0,
    'gateway_cost'    => 0,
    'salary_share'    => $totalRevenueSalary,
    'admin_share'     => $totalOpsExpense - $totalRevenueSalary
];

foreach ($rows as $r) {
    $total['total_calls']     += $r['total_calls'];
    $total['MCO']             += $r['MCO'];
    $total['bookings']        += $r['bookings'];
    $total['marketing_spent'] += $r['marketing_spent'];
}

$total['gateway_cost'] = 0.16 * $total['MCO'];

$rows[] = $total;

/* =============================== OUTPUT =============================== */

echo json_encode([
    'status' => 'success',
    'summary' => $rows,
    'meta' => [
        'months_in_range' => $monthsInRange,
        'total_expenses'  => $totalOpsExpense,
        'revenue_salaries'=> $totalRevenueSalary,
        'revenue_agents'  => $revenueAgents
    ]
]);
