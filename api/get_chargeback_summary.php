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
    echo json_encode([
        'status' => 'error',
        'message' => 'Not logged in'
    ]);
    exit;
}

/* ================= INPUT ================= */
$startDate = $_GET['startDate'] ?? null;
$endDate   = $_GET['endDate'] ?? null;

$where  = [];
$params = [];

/* ================= DATE FILTER ================= */
if (!empty($startDate) && !empty($endDate)) {
    $where[] = "cb.created_at BETWEEN :startDate AND :endDate";
    $params['startDate'] = $startDate;
    $params['endDate']   = $endDate;
}

/* ================= FINAL QUERY ================= */
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$sql = "
    SELECT
        cb.id,
        cb.session_id,
        cb.agent_extension,
        cb.type,
        cb.amount,
        cb.penalty,
        cb.platform_fee,
        cb.total_deducted,
        cb.note,
        cb.created_at
    FROM chargebacks cb
    $whereSql
";

/* ================= EXECUTE ================= */
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* ================= RESPONSE ================= */
echo json_encode([
    'status' => 'success',
    'rows'   => $rows
]);
