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

// --- Check login ---
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Not logged in"]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["status" => "error", "message" => "User not found"]);
    exit;
}

$role = $user['role'];
$agent_extension = $user['agent_extension'];

// --- Filters ---
$filter = $_GET['filter'] ?? 'week';   // today, week, month
$interval = $_GET['interval'] ?? 'day'; // hour, minute, day

$where = [];
$params = [];

// --- Role filters ---
// Agent Productivity metrics for agent's productivity analysis
if ($role === 'user') {
    $where[] = "agent_extension = ?";
    $params[] = $agent_extension;

} elseif ($role === 'lead') {
    $sqlAgents = $pdo->prepare("SELECT agent_extension FROM users WHERE lead_extension = ?");
    $sqlAgents->execute([$agent_extension]);
    $teamExtensions = $sqlAgents->fetchAll(PDO::FETCH_COLUMN);
    //Extensions of the whole team...
    $teamExtensions[] = $agent_extension; // include self

    if (!empty($teamExtensions)) {
        $placeholders = implode(',', array_fill(0, count($teamExtensions), '?'));
        $where[] = "agent_extension IN ($placeholders)";
        $params = array_merge($params, $teamExtensions);
    }
}

// --- Date filters ---
if ($interval === 'minute' || $interval === 'hour') {
    // Last 24 hours
    $where[] = "start_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
} elseif ($interval === 'day') {
    // Last 10 days
    $where[] = "start_time >= DATE_SUB(NOW(), INTERVAL 14 DAY)";
} else {
    // Respect filter if not overriding
    if ($filter === 'today') {
        $where[] = "DATE(start_time) = CURDATE()";
    } elseif ($filter === 'week') {
        $where[] = "start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } elseif ($filter === 'month') {
        $where[] = "start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }
}


$whereSQL = $where ? "WHERE " . implode(" AND ", $where) : "";

// --- Interval grouping ---
if ($interval === 'minute') {
    $groupBy = "DATE_FORMAT(start_time, '%Y-%m-%d %H:%i')";
    $label = "minute";
} elseif ($interval === 'day') {
    $groupBy = "DATE(start_time)";
    $label = "day";
} else {
    $groupBy = "DATE_FORMAT(start_time, '%Y-%m-%d %H:00')";
    $label = "hour";
}

// --- Chart data ---
$sql = "
    SELECT 
        $groupBy AS $label,
        COUNT(*) AS calls
    FROM ringcentral_calls
    $whereSQL AND direction='Inbound' 
    AND queue_name is NOT NULL
    GROUP BY $groupBy
    ORDER BY $groupBy ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$chartData = $stmt->fetchAll(PDO::FETCH_ASSOC);

// --- Stats ---
$sqlStats = "
    SELECT 
        COUNT(*) AS total_calls,
        SUM(CASE WHEN DATE(start_time) = CURDATE() THEN 1 ELSE 0 END) AS calls_today
    FROM ringcentral_calls
    $whereSQL
";

$stmtStats = $pdo->prepare($sqlStats);
$stmtStats->execute($params);
$stats = $stmtStats->fetch(PDO::FETCH_ASSOC);

// --- Response ---
echo json_encode([
    "status" => "success",
    "stats" => $stats,
    "chartData" => $chartData
]);
