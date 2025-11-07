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

if (empty($input['date']) || empty($input['costs'])) {
    echo json_encode(["success" => false, "error" => "Missing required fields"]);
    exit();
}

$date = $input['date'];
$costs = $input['costs'];

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO marketing_costs (cost_date, queue_name, amount)
        VALUES (:date, :queue_name, :amount)
        ON DUPLICATE KEY UPDATE amount = :amount
    ");

    foreach ($costs as $item) {
        if($item['amount']!=null){
        $stmt->execute([
            ":date" => $date,
            ":queue_name" => $item['queue_name'],
            ":amount" => $item['amount'] 
        ]);
          }
    }

    $pdo->commit();

    echo json_encode(["success" => true, "message" => "Marketing cost saved successfully"]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
