<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "db.php";
session_start();

$pdo = getDBConnection();

try {
    // ✅ Must be logged in
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        exit;
    }

    // ✅ Must be admin
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'Not authorized']);
        exit;
    }

    // ✅ Get POST data
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON', 'raw' => $raw]);
        exit;
    }

    $callId = $data['callId'] ?? null;
    $agentName = $data['agent_name'] ?? '';

    if (!$callId || !$agentName) {
        echo json_encode([
            'success' => false,
            'error' => 'Missing fields',
            'received' => $data
        ]);
        exit;
    }

    // ✅ Update agent_name in calls table
    $stmt = $pdo->prepare("UPDATE ringcentral_calls SET agent_name = ? WHERE session_id = ?");
    $ok = $stmt->execute([$agentName, $callId]);

    if ($ok) {
        echo json_encode([
            'success' => true,
            'updated' => [
                'callId' => $callId,
                'agent_name' => $agentName
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'DB update failed',
            'pdo_error' => $stmt->errorInfo()
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Exception',
        'message' => $e->getMessage()
    ]);
}
