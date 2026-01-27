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

/* ===================== AUTH ===================== */
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

$role = $user['role'];
$agentExtension = trim($user['agent_extension']);

/* ===================== DATE FILTER ===================== */
$startDate = $_GET['startDate'] ?? null;
$endDate   = $_GET['endDate'] ?? null;

$where = [];
$params = [];

/* ===================== ROLE FILTER ===================== */
$agentExtensions = null;

if ($role === 'admin') {
    // no filter
}
elseif ($role === 'VJ') {
    $where[] = "rc.queue_name LIKE ?";
    $params[] = 'VJ%';
}
elseif ($role === 'lead') {

    $stmtAgents = $pdo->prepare("
        SELECT TRIM(agent_extension)
        FROM users
        WHERE lead_extension = ?
           OR agent_extension = ?
    ");
    $stmtAgents->execute([$agentExtension, $agentExtension]);
    $agentExtensions = $stmtAgents->fetchAll(PDO::FETCH_COLUMN);

    if (empty($agentExtensions)) {
        echo json_encode(['status' => 'success', 'summary' => []]);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($agentExtensions), '?'));
    $where[] = "rc.agent_extension IN ($placeholders)";
    $params = array_merge($params, $agentExtensions);
}

/* ===================== DATE FILTER ===================== */
if ($startDate && $endDate) {
    $where[] = "rc.start_time BETWEEN ? AND ?";
    $params[] = $startDate;
    $params[] = $endDate;
}

$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

/* ======================================================
   DEDUPE SUBQUERY
====================================================== */
$dedupeSubQuery = "
    SELECT MAX(id)
    FROM ringcentral_calls
    WHERE direction = 'Inbound'
      AND queue_name IS NOT NULL
    GROUP BY from_number
";

/* ======================================================
   AGENT SUMMARY WITH MARKETING SPEND
====================================================== */
$sqlAgentSummary = "
    SELECT 
        rc.agent_name,
        COUNT(*) AS total_calls,
        SUM(rc.call_log_status = 'Missed') AS missed_calls,
        SUM(rc.call_log_status IN ('Accepted','Call Connected')) AS accepted_calls,
        SUM(rc.mco) AS MCO,
        ROUND(AVG(rc.duration_ms) / 1000, 2) AS avg_call_duration_seconds,
        SUM(rc.productivity = 'Productive') AS productive_calls,
        SUM(rc.productivity = 'Non-Productive') AS non_productive_calls,
        SUM(rc.converted = 'Converted') AS converted_calls,
        SUM(rc.converted = 'Not Converted') AS not_converted_calls,
        SUM((rc.duration_ms / 1000) >= 1200) AS quality_calls,
        COALESCE(ms.marketing_spent, 0) AS marketing_spent
    FROM ringcentral_calls rc

    /* 🔥 JOIN aggregated marketing spend */
    LEFT JOIN (
        SELECT 
            agent_extension,
            SUM(amount) AS marketing_spent
        FROM marketing_costs
        " . ($startDate && $endDate ? "WHERE spend_date BETWEEN ? AND ?" : "") . "
        GROUP BY agent_extension
    ) ms ON ms.agent_extension = rc.agent_extension

    $whereSql
      AND rc.id IN ($dedupeSubQuery)

    GROUP BY rc.agent_name, ms.marketing_spent
    ORDER BY rc.agent_name
";

/* ===================== PARAMS FOR MARKETING JOIN ===================== */
$execParams = $params;

if ($startDate && $endDate) {
    // marketing_costs date params go FIRST (subquery)
    $execParams = array_merge(
        [$startDate, $endDate],
        $params
    );
}

$stmt = $pdo->prepare($sqlAgentSummary);
$stmt->execute($execParams);
$summary = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* ===================== TOTAL ROW ===================== */
$sqlTotal = "
    SELECT 
        'Total' AS agent_name,
        COUNT(*) AS total_calls,
        SUM(rc.call_log_status = 'Missed') AS missed_calls,
        SUM(rc.call_log_status IN ('Accepted','Call Connected')) AS accepted_calls,
        SUM(rc.mco) AS MCO,
        ROUND(AVG(rc.duration_ms) / 1000, 2) AS avg_call_duration_seconds,
        SUM(rc.productivity = 'Productive') AS productive_calls,
        SUM(rc.productivity = 'Non-Productive') AS non_productive_calls,
        SUM(rc.converted = 'Converted') AS converted_calls,
        SUM(rc.converted = 'Not Converted') AS not_converted_calls,
        SUM((rc.duration_ms / 1000) >= 1200) AS quality_calls,
        COALESCE(SUM(ms.amount), 0) AS marketing_spent
    FROM ringcentral_calls rc
    LEFT JOIN marketing_costs ms
        ON ms.agent_extension = rc.agent_extension
        " . ($startDate && $endDate ? "AND ms.spend_date BETWEEN ? AND ?" : "") . "
    $whereSql
      AND rc.id IN ($dedupeSubQuery)
";

$stmtTotal = $pdo->prepare($sqlTotal);
$stmtTotal->execute($execParams);
$summary[] = $stmtTotal->fetch(PDO::FETCH_ASSOC);

/* ===================== RESPONSE ===================== */
echo json_encode([
    'status' => 'success',
    'summary' => $summary
]);
