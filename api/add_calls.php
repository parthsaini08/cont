<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once "db.php"; // defines getDBConnection()

$pdo = getDBConnection();

// Read JSON body
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (
    empty($data['from_number']) ||
    empty($data['from_name']) ||
    empty($data['to_number']) ||
    empty($data['date']) ||
    empty($data['agent_name']) ||
    empty($data['agent_extension'])
) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$from_number = trim($data['from_number']);
$from_name   = trim($data['from_name']);
$to_number   = trim($data['to_number']);
$date        = trim($data['date']);
$agent_name  = trim($data['agent_name']);
$agent_extension = trim($data['agent_extension']);

$queue_name  = "REPEAT";
$call_status = "Accepted";
$direction   = "Inbound";

// ✅ Combine user-selected date with current GMT time (24-hour)
$gmtTime = new DateTime("now", new DateTimeZone("GMT"));
$currentGMT = $gmtTime->format("H:i:s");
$start_time = $date . " " . $currentGMT;

try {
    $stmt = $pdo->prepare("
        INSERT INTO ringcentral_calls (
            from_number, from_name, to_number, queue_name, call_log_status, start_time, direction, agent_name, agent_extension
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $from_number,
        $from_name,
        $to_number,
        $queue_name,
        $call_status,
        $start_time,
        $direction,
        $agent_name,
        $agent_extension
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Call added successfully.",
        "id" => $pdo->lastInsertId()
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
