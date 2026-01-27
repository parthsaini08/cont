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

$stmt = $pdo->prepare("SELECT role, agent_extension FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit;
}

$role = strtolower($user['role']);
$agentExtension = trim($user['agent_extension']);

/* ================= DATE FILTER ================= */
$startDate = $_GET['startDate'] ?? null;
$endDate   = $_GET['endDate'] ?? null;

$dateSql = "";
$dateParams = [];

if ($startDate && $endDate) {
    $dateSql = " AND start_time BETWEEN ? AND ?";
    $dateParams = [$startDate, $endDate];
}

/* ================= ROLE FILTER ================= */
$roleSql = "";
$roleParams = [];

if ($role === 'admin' || $role === 'vj') {
    // FULL ACCESS
}
elseif ($role === 'lead') {

    $stmtAgents = $pdo->prepare("
        SELECT TRIM(agent_extension)
        FROM users
        WHERE lead_extension = ?
           OR agent_extension = ?
    ");
    $stmtAgents->execute([$agentExtension, $agentExtension]);
    $agents = $stmtAgents->fetchAll(PDO::FETCH_COLUMN);

    if (empty($agents)) {
        echo json_encode(['status' => 'success', 'summary' => []]);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($agents), '?'));
    $roleSql = " AND agent_extension IN ($placeholders)";
    $roleParams = $agents;
}
else {
    echo json_encode(['status' => 'success', 'summary' => []]);
    exit;
}

/* ======================================================
   DEDUPED CALLS (FOR COUNTS)
====================================================== */
$dedupeSql = "
    SELECT MAX(id)
    FROM ringcentral_calls
    WHERE direction = 'Inbound'
      AND queue_name IS NOT NULL
      $dateSql
      $roleSql
    GROUP BY from_number
";

$dedupeParams = array_merge($dateParams, $roleParams);

/* ======================================================
   MCO — ALL CALLS (NO DEDUPE, INCLUDE REPEAT)
====================================================== */
$mcoSql = "
    SELECT
        agent_name,
        SUM(mco) AS total_mco
    FROM ringcentral_calls
    WHERE direction = 'Inbound'
      $dateSql
      $roleSql
    GROUP BY agent_name
";

$mcoParams = array_merge($dateParams, $roleParams);

/* ======================================================
   AGENT SUMMARY
====================================================== */
$finalSql = "
    SELECT
        rc.agent_name,
        COUNT(*) AS total_calls,
        SUM(rc.call_log_status = 'Missed') AS missed_calls,
        SUM(rc.call_log_status IN ('Accepted','Call Connected')) AS accepted_calls,
        COALESCE(m.total_mco, 0) AS MCO,
        ROUND(AVG(rc.duration_ms) / 1000, 2) AS avg_call_duration_seconds,
        SUM(rc.productivity = 'Productive') AS productive_calls,
        SUM(rc.productivity = 'Non-Productive') AS non_productive_calls,
        SUM(rc.converted = 'Converted') AS converted_calls,
        SUM(rc.converted = 'Not Converted') AS not_converted_calls,
        SUM((rc.duration_ms / 1000) >= 1200) AS quality_calls
    FROM ringcentral_calls rc
    LEFT JOIN ($mcoSql) m
      ON m.agent_name = rc.agent_name
    WHERE rc.id IN ($dedupeSql)
    GROUP BY rc.agent_name
    ORDER BY rc.agent_name
";

$finalParams = array_merge($mcoParams, $dedupeParams);

$stmt = $pdo->prepare($finalSql);
$stmt->execute($finalParams);
$summary = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* ======================================================
   TOTALS (DEDUPED COUNTS)
====================================================== */
$totalsSql = "
    SELECT
        COUNT(*) AS total_calls,
        SUM(call_log_status = 'Missed') AS missed_calls,
        SUM(call_log_status IN ('Accepted','Call Connected')) AS accepted_calls,
        SUM(productivity = 'Productive') AS productive_calls,
        SUM(converted = 'Converted') AS converted_calls
    FROM ringcentral_calls
    WHERE id IN ($dedupeSql)
";

$stmtTotals = $pdo->prepare($totalsSql);
$stmtTotals->execute($dedupeParams);
$totals = $stmtTotals->fetch(PDO::FETCH_ASSOC);

/* ================= TOTAL MCO ================= */
$totalMcoSql = "
    SELECT SUM(mco)
    FROM ringcentral_calls
    WHERE direction = 'Inbound'
      $dateSql
      $roleSql
";

$stmtMco = $pdo->prepare($totalMcoSql);
$stmtMco->execute($mcoParams);
$totalMco = (float)$stmtMco->fetchColumn();

/* ================= TOTAL ROW ================= */
$summary[] = [
    'agent_name' => 'Total',
    'total_calls' => (int)$totals['total_calls'],
    'missed_calls' => (int)$totals['missed_calls'],
    'accepted_calls' => (int)$totals['accepted_calls'],
    'MCO' => $totalMco,
    'avg_call_duration_seconds' => null,
    'productive_calls' => (int)$totals['productive_calls'],
    'non_productive_calls' => null,
    'converted_calls' => (int)$totals['converted_calls'],
    'not_converted_calls' => null,
    'quality_calls' => null,
];

echo json_encode([
    'status' => 'success',
    'summary' => $summary
]);
