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

/* --------------------------------------------------------
   AUTH CHECK
-------------------------------------------------------- */
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
  exit;
}

/* --------------------------------------------------------
   DATE INPUTS
-------------------------------------------------------- */
$startRaw = $_GET['startDate'] ?? null;
$endRaw   = $_GET['endDate'] ?? null;

if (!$startRaw || !$endRaw) {
  echo json_encode(['status'=>'error','message'=>'Missing date range']);
  exit;
}

$startDT = date("Y-m-d H:i:s", strtotime($startRaw));
$endDT   = date("Y-m-d H:i:s", strtotime($endRaw));
$startDate = substr($startDT, 0, 10);
$endDate   = substr($endDT, 0, 10);

$params = [':s'=>$startDT, ':e'=>$endDT];

/* --------------------------------------------------------
   KPI DATA
-------------------------------------------------------- */

$stmt = $pdo->prepare("SELECT SUM(mco) FROM ringcentral_calls WHERE start_time BETWEEN :s AND :e");
$stmt->execute($params);
$totalMco = (float)$stmt->fetchColumn();

$stmt = $pdo->prepare("
  SELECT COUNT(*) 
  FROM ringcentral_calls
  WHERE start_time BETWEEN :s AND :e
  AND queue_name IS NOT NULL
");
$stmt->execute($params);
$totalCalls = (int)$stmt->fetchColumn();

$stmt = $pdo->prepare("
  SELECT COUNT(*) 
  FROM ringcentral_calls
  WHERE start_time BETWEEN :s AND :e
    AND LOWER(converted) = 'converted'
    AND queue_name IS NOT NULL
");
$stmt->execute($params);
$totalBookings = (int)$stmt->fetchColumn();

$conversionRatio = $totalCalls > 0 ? round(($totalBookings / $totalCalls) * 100, 2) : 0;

$stmt = $pdo->prepare("SELECT SUM(amount) FROM marketing_costs WHERE cost_date BETWEEN :s AND :e");
$stmt->execute([':s'=>$startDate, ':e'=>$endDate]);
$totalMarketing = (float)$stmt->fetchColumn();

$revenueRatio = $totalMarketing > 0 ? round(($totalMco / $totalMarketing), 2) : 0;

/* --------------------------------------------------------
   EXPENSES
-------------------------------------------------------- */

$expenses = ['tool' => 0, 'rev' => 0, 'admin' => 0];

// TOOLS COST
$stmtTools = $pdo->prepare("
  SELECT eg.name, e.months, e.year
  FROM expenses e
  JOIN expense_groups eg ON eg.id = e.group_id
  WHERE LOWER(eg.name) LIKE '%tools cost%'
");
$stmtTools->execute();

while ($row = $stmtTools->fetch(PDO::FETCH_ASSOC)) {
  $months = json_decode($row['months'], true);
  $year = $row['year'];

  foreach ($months as $m => $amt) {
    $monthNum = date("n", strtotime($m));
    $monthDate = "$year-$monthNum-01";

    if ($monthDate >= $startDate && $monthDate <= $endDate) {
      $expenses['tool'] += floatval($amt);
    }
  }
}

// SALARY OF REVENUE AGENTS
$stmt = $pdo->query("SELECT SUM(salary), COUNT(*) FROM users WHERE revenue_generating='yes'");
$salaryRow = $stmt->fetch(PDO::FETCH_NUM);

$totalSalary = (float)$salaryRow[0];
$revAgents = max(1, (int)$salaryRow[1]);

$salaryPerAgent = $totalSalary / $revAgents;

// ADMIN COST
$totalOps = 0;
$stmtOps = $pdo->query("SELECT months,year FROM expenses");
while ($row = $stmtOps->fetch(PDO::FETCH_ASSOC)) {
  $months = json_decode($row['months'], true);
  $year = $row['year'];

  foreach ($months as $m => $amt) {
    $monthNum = date("n", strtotime($m));
    $monthDate = "$year-$monthNum-01";

    if ($monthDate >= $startDate && $monthDate <= $endDate) {
      $totalOps += floatval($amt);
    }
  }
}

$adminTotal = $totalOps - $totalSalary;
$adminPerAgent = $adminTotal / $revAgents;

$expenses['rev'] = $totalSalary;
$expenses['admin'] = max(0, $adminTotal);

/* --------------------------------------------------------
   QUEUE MARKETING COST (TOTAL)
-------------------------------------------------------- */

$stmt = $pdo->prepare("
  SELECT LOWER(TRIM(queue_name)) AS q, SUM(amount) AS spent
  FROM marketing_costs
  WHERE cost_date BETWEEN :s AND :e
  GROUP BY q
");
$stmt->execute([':s'=>$startDate, ':e'=>$endDate]);

$queueMarketing = [];
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
  $queueMarketing[$r['q']] = (float)$r['spent'];
}

/* --------------------------------------------------------
   CALLS PER QUEUE
-------------------------------------------------------- */
$stmt = $pdo->prepare("
  SELECT LOWER(TRIM(queue_name)) AS q, COUNT(*) AS calls
  FROM ringcentral_calls
  WHERE start_time BETWEEN :s AND :e
    AND queue_name IS NOT NULL
    AND queue_name != 'REPEAT'
  GROUP BY q
");
$stmt->execute($params);

$queueCalls = [];
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
  $queueCalls[$r['q']] = (int)$r['calls'];
}

/* --------------------------------------------------------
   COST PER CALL
-------------------------------------------------------- */

$costPerCall = [];
foreach ($queueCalls as $q => $c) {
  $spent = $queueMarketing[$q] ?? 0;
  $costPerCall[$q] = $c > 0 ? $spent / $c : 0;
}

/* --------------------------------------------------------
   TOP AGENTS — MCO, CONVERSION
-------------------------------------------------------- */

$stmt = $pdo->prepare("
  SELECT agent_name AS agent, SUM(mco) AS mco
  FROM ringcentral_calls
  WHERE start_time BETWEEN :s AND :e
  GROUP BY agent_name
  ORDER BY mco DESC
  LIMIT 3
");
$stmt->execute($params);
$topAgentsMco = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $pdo->prepare("
  SELECT agent_name AS agent,
         ROUND(
           SUM(CASE WHEN LOWER(converted)='converted' THEN 1 ELSE 0 END)
           / NULLIF(SUM(CASE WHEN queue_name IS NOT NULL THEN 1 ELSE 0 END),0) *100, 2
         ) AS conversion
  FROM ringcentral_calls
  WHERE start_time BETWEEN :s AND :e
  GROUP BY agent_name
  ORDER BY conversion DESC
  LIMIT 3
");
$stmt->execute($params);
$topAgentsConv = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* --------------------------------------------------------
   TOP AGENTS — REVENUE RATIO (CORRECT QUEUE-BASED ALLOCATION)
   agent_revenue_ratio = agent_mco / agent_marketing_spent
-------------------------------------------------------- */

// get agent calls per queue and mco per queue
$stmt = $pdo->prepare("
    SELECT 
        agent_name,
        LOWER(TRIM(queue_name)) AS q,
        COUNT(*) AS agent_calls,
        SUM(mco) AS mco
    FROM ringcentral_calls
    WHERE start_time BETWEEN :s AND :e
      AND queue_name IS NOT NULL
      AND queue_name != 'REPEAT'
    GROUP BY agent_name, q
");
$stmt->execute($params);
$agentQueueRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// build agent aggregates
$agentData = [];
foreach ($agentQueueRows as $r) {
    $agent = $r['agent_name'];
    $q = $r['q'];
    $agent_calls = (int)$r['agent_calls'];
    $mco = (float)$r['mco'];

    if (!isset($agentData[$agent])) {
        $agentData[$agent] = [
            'agent' => $agent,
            'mco' => 0.0,
            'marketing_spent' => 0.0
        ];
    }

    $agentData[$agent]['mco'] += $mco;
    $agentData[$agent]['marketing_spent'] += $agent_calls * ($costPerCall[$q] ?? 0);
}

// compute revenue ratio and get top 3
$agentRevList = [];
foreach ($agentData as $agent => $vals) {
    $spent = $vals['marketing_spent'];
    $mco = $vals['mco'];
    $rev_ratio = ($spent > 0) ? round($mco / $spent, 3) : 0;
    $agentRevList[] = [
        'agent' => $agent,
        'mco' => round($mco, 2),
        'marketing_spent' => round($spent, 2),
        'rev_ratio' => $rev_ratio
    ];
}
usort($agentRevList, fn($a,$b) => $b['rev_ratio'] <=> $a['rev_ratio']);
$topAgentsRevRatio = array_slice($agentRevList, 0, 3);

/* --------------------------------------------------------
   GROSS MARGIN PER AGENT (CORRECTED)
-------------------------------------------------------- */

$stmt = $pdo->prepare("
  SELECT 
    LOWER(TRIM(queue_name)) AS q,
    agent_name,
    agent_extension,
    COUNT(*) AS calls,
    SUM(mco) AS mco
  FROM ringcentral_calls
  WHERE start_time BETWEEN :s AND :e
    AND queue_name != 'REPEAT'
    AND queue_name IS NOT NULL
  GROUP BY agent_extension, q
");
$stmt->execute($params);

$agentMap = [];

foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {

  $agent = $r['agent_name'];
  $q = $r['q'];
  $calls = (int)$r['calls'];
  $mco = (float)$r['mco'];

  if (!isset($agentMap[$agent])) {
    $agentMap[$agent] = [
      'mco' => 0,
      'mk_spent' => 0,
    ];
  }

  $agentMap[$agent]['mco'] += $mco;
  $agentMap[$agent]['mk_spent'] += $calls * ($costPerCall[$q] ?? 0);
}

$topGM = [];
foreach ($agentMap as $agent => $r) {
  $mco = $r['mco'];
  $mk = $r['mk_spent'];

  $gross = $mco - $mk - ($mco * 0.16) - $salaryPerAgent - $adminPerAgent;

  $topGM[] = [
    'agent' => $agent,
    'gross_margin' => round($gross, 2)
  ];
}

usort($topGM, fn($a,$b)=>$b['gross_margin'] <=> $a['gross_margin']);
$topAgentsGM = array_slice($topGM, 0, 3);

/* --------------------------------------------------------
   CAMPAIGNS — MCO, CONVERSION, REV RATIO
-------------------------------------------------------- */

$stmt = $pdo->prepare("
  SELECT queue_name AS campaign, SUM(mco) AS mco
  FROM ringcentral_calls
  WHERE start_time BETWEEN :s AND :e
  AND queue_name IS NOT NULL
  AND queue_name != 'REPEAT'
  GROUP BY queue_name
  ORDER BY mco DESC
  LIMIT 3
");
$stmt->execute($params);
$topCampMco = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $pdo->prepare("
  SELECT 
    queue_name AS campaign,
    ROUND(
      SUM(CASE WHEN LOWER(converted)='converted' THEN 1 ELSE 0 END)
      / NULLIF(COUNT(*),0) * 100, 2
    ) AS conversion
  FROM ringcentral_calls
  WHERE start_time BETWEEN :s AND :e
    AND queue_name != 'REPEAT'
    AND queue_name IS NOT NULL
  GROUP BY queue_name
  ORDER BY conversion DESC
  LIMIT 3
");
$stmt->execute($params);
$topCampConv = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* ░░ Campaign Revenue Ratio (Correct) ░░ */
$stmt = $pdo->prepare("
    SELECT 
        rc.queue_name AS campaign,


        ROUND(
            SUM(rc.mco) /
            NULLIF(
                (
                    SELECT SUM(mc.amount)
                    FROM marketing_costs mc
                    WHERE LOWER(TRIM(mc.queue_name)) COLLATE utf8mb4_unicode_ci =
                          LOWER(TRIM(rc.queue_name)) COLLATE utf8mb4_unicode_ci
                      AND mc.cost_date BETWEEN :s_date AND :e_date
                ), 0
            ),
        3) AS revenue_ratio

    FROM ringcentral_calls rc
    WHERE rc.start_time BETWEEN :s AND :e
      AND rc.queue_name IS NOT NULL
      AND rc.queue_name != 'REPEAT'
    GROUP BY rc.queue_name
    ORDER BY revenue_ratio DESC
    LIMIT 3
");

$startDateOnly = substr($startDT, 0, 10);
$endDateOnly   = substr($endDT, 0, 10);

$stmt->execute([
    ':s' => $startDT,
    ':e' => $endDT,
    ':s_date' => $startDateOnly,
    ':e_date' => $endDateOnly
]);

$top_campaigns_revenue_ratio = $stmt->fetchAll(PDO::FETCH_ASSOC);


/* --------------------------------------------------------
   FINAL OUTPUT
-------------------------------------------------------- */

echo json_encode([
  'status' => 'success',

  'kpis' => [
    'totalMarketing' => $totalMarketing,
    'totalMco' => $totalMco,
    'totalCalls' => $totalCalls,
    'totalBookings' => $totalBookings,
    'conversionRatio' => $conversionRatio,
    'revenueRatio' => $revenueRatio
  ],

  'expenses' => $expenses,

  'top_agents_mco' => $topAgentsMco,
  'top_agents_conversion' => $topAgentsConv,
  'top_agents_revenue_ratio' => $topAgentsRevRatio,
  'top_agents_gross_margin' => $topAgentsGM,

  'top_campaigns_mco' => $topCampMco,
  'top_campaigns_conversion' => $topCampConv,
  'top_campaigns_revenue_ratio' => $top_campaigns_revenue_ratio
]);
