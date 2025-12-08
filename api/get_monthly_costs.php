<?php
include "config.php";
require_once "db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$pdo = getDBConnection();
$input = json_decode(file_get_contents("php://input"), true);

$month = $input['month'] ?? null;
$year  = $input['year'] ?? null;

if (!$month || !$year) {
    echo json_encode([
        "success" => false,
        "error" => "Missing 'month' or 'year'"
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            queue_name,
            DAY(cost_date) AS day,
            amount
        FROM marketing_costs
        WHERE MONTH(cost_date) = :month
        AND YEAR(cost_date) = :year
        ORDER BY queue_name, day
    ");
    $stmt->execute([
        ":month" => $month,
        ":year"  => $year
    ]);

    $costs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "costs" => $costs
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>
