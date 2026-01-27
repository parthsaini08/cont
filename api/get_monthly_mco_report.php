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

/* ================= INPUT ================= */
$month = $_GET['month'] ?? null; // format: YYYY-MM

if (!$month || !preg_match('/^\d{4}-\d{2}$/', $month)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid month format']);
    exit;
}

/* ================= DATE RANGE ================= */
$startDate = $month . '-01';
$endDate   = date('Y-m-t', strtotime($startDate)); // last day of month

$dateSql = " AND rc.start_time BETWEEN ? AND ?";
$dateParams = [$startDate . " 00:00:00", $endDate . " 23:59:59"];

/* ================= ROLE FILTER ================= */
$roleSql = "";
$roleParams = [];

if ($role === 'admin' || $role === 'vj') {
    // full access
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
        echo json_encode(['status' => 'success', 'rows' => []]);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($agents), '?'));
    $roleSql = " AND rc.agent_extension IN ($placeholders)";
    $roleParams = $agents;
}
else {
    echo json_encode(['status' => 'success', 'rows' => []]);
    exit;
}

/* ================= FINAL QUERY ================= */
$sql = "
    SELECT
        DATE(rc.start_time) AS report_date,
        SUM(rc.mco) AS total_mco
    FROM ringcentral_calls rc
    WHERE rc.direction = 'Inbound'
      $dateSql
      $roleSql
    GROUP BY DATE(rc.start_time)
    ORDER BY report_date
";

$params = array_merge($dateParams, $roleParams);

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* ================= RESPONSE ================= */
echo json_encode([
    'status' => 'success',
    'month'  => $month,
    'rows'   => $rows
]);
