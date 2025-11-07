<?php
include "config.php";
require_once "db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
$date = $input['date'] ?? null;
if (!$date) {
    echo json_encode(["success" => false, "error" => "Missing 'date' parameter"]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT queue_name, amount
        FROM marketing_costs
        WHERE cost_date = :date
    ");
    $stmt->execute([":date" => $date]);
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
