<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "db.php";
session_start();

// CORS preflight exit
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$pdo = getDBConnection();

/* ======================================================
   AUTH CHECK
====================================================== */
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status'=>'error','message'=>'Not logged in']);
    exit;
}

$stmt = $pdo->prepare("SELECT role FROM users WHERE id=?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] !== 'admin') {
    echo json_encode(['status'=>'error','message'=>'Not authorized']);
    exit;
}

/* ======================================================
   READ REQUEST BODY
====================================================== */
$data = json_decode(file_get_contents("php://input"), true);

$callSessionId = $data['session_id'] ?? null;
$type          = $data['type'] ?? 'Chargeback';
$amount        = floatval($data['amount'] ?? 0);
$note          = $data['note'] ?? '';

if (!$callSessionId || $amount <= 0) {
    echo json_encode(['status'=>'error','message'=>'Missing call session_id or invalid amount']);
    exit;
}

/* ======================================================
   FETCH CALL RECORD USING session_id
====================================================== */
$stmt = $pdo->prepare("SELECT * FROM ringcentral_calls WHERE session_id = ?");
$stmt->execute([$callSessionId]);
$call = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$call) {
    echo json_encode(['status'=>'error','message'=>'Call not found']);
    exit;
}

$existingMCO = floatval($call['mco']);
$agentExt    = $call['agent_extension'];

/* ======================================================
   FEES & DEDUCTIONS
====================================================== */

// Extra penalties
$penalty = ($type === "Chargeback") ? 50 : 25;

// 6% fee on original MCO
$sixPercentFee = round($existingMCO * 0.06, 2);

// Final deduction = amount + penalty + 6% of original MCO
$totalDeduction = $amount + $penalty + $sixPercentFee;

// New MCO (allowed to go negative)
$newMCO = $existingMCO - $totalDeduction;

/* ======================================================
   UPDATE CALL RECORD
====================================================== */
$stmt = $pdo->prepare("
    UPDATE ringcentral_calls 
    SET mco = ?, converted = 'Not Converted'
    WHERE session_id = ?
");
$stmt->execute([$newMCO, $callSessionId]);

/* ======================================================
   INSERT INTO chargebacks TABLE
====================================================== */
$stmt = $pdo->prepare("
    INSERT INTO chargebacks 
        (session_id, agent_extension, type, amount, penalty, platform_fee, total_deducted, note, created_at)
    VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
");

$stmt->execute([
    $callSessionId,
    $agentExt,
    $type,
    $amount,
    $penalty,
    $sixPercentFee,
    $totalDeduction,
    $note
]);

echo json_encode([
    'status'        => 'success',
    'message'       => 'Chargeback/Refund applied successfully',
    'old_mco'       => $existingMCO,
    'new_mco'       => $newMCO,
    'deductions'    => [
        'chargeback_or_refund_amount' => $amount,
        'penalty'                     => $penalty,
        'six_percent_fee'             => $sixPercentFee,
        'total_deducted'              => $totalDeduction
    ]
]);
?>
