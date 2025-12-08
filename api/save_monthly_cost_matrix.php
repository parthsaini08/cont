<?php
include "config.php";
require_once "db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$pdo = getDBConnection();
$input = json_decode(file_get_contents("php://input"), true);
$data  = $input["data"] ?? [];

if (empty($data)) {
    echo json_encode(["success" => false, "error" => "No updated rows"]);
    exit();
}

// Table must have UNIQUE(queue_name, cost_date)
try {
    $stmt = $pdo->prepare("
        INSERT INTO marketing_costs (queue_name, cost_date, amount)
        VALUES (:queue_name, :cost_date, :amount)
        ON DUPLICATE KEY UPDATE amount = :amount
    ");

    foreach ($data as $row) {
        $queue  = $row["queue_name"];
        $day    = $row["day"];
        $month  = $row["month"];
        $year   = $row["year"];
        $amount = $row["amount"] === "" ? 0 : $row["amount"];

        $date = sprintf("%04d-%02d-%02d", $year, $month, $day);

        $stmt->execute([
            ":queue_name" => $queue,
            ":cost_date"  => $date,
            ":amount"     => $amount
        ]);
    }

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
