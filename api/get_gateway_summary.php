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

if ($startDate && $endDate) {
    $where[] = "rc.start_time BETWEEN ? AND ?";
    $params[] = $startDate;
    $params[] = $endDate;
}

/* ===================== ROLE FILTER ===================== */
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
else {
    echo json_encode(['status' => 'success', 'summary' => []]);
    exit;
}

/* ===================== DEDUPE ===================== */
$dedupeSubQuery = "
    SELECT MAX(id)
    FROM ringcentral_calls
    WHERE direction = 'Inbound'
      AND queue_name IS NOT NULL
    GROUP BY from_number
";

/* ===================== WHERE ===================== */
$where[] = "rc.id IN ($dedupeSubQuery)";
$whereSql = 'WHERE ' . implode(' AND ', $where);

/* ===================== GATEWAY SUMMARY ===================== */
$sql = "
    SELECT
        COALESCE(rc.gateway, 'Unknown') AS gateway,
        SUM(rc.mco) AS MCO
    FROM ringcentral_calls rc
    $whereSql
    AND rc.gateway IS NOT NULL
    GROUP BY rc.gateway
    ORDER BY rc.gateway
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$summary = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* ===================== RESPONSE ===================== */
echo json_encode([
    'status' => 'success',
    'summary' => $summary
]);
