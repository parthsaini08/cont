<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

// CORS headers
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- DB CONNECTION ---
$host = "srv1878.hstgr.io"; 
$dbname = "u485711916_call_logs_data"; 
$username = "u485711916_devs"; 
$password = "Websites@123*";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (Exception $e) {
    die(json_encode(["status" => "error", "message" => "DB connection failed"]));
}

// --- GET DATA ---
$data = json_decode(file_get_contents("php://input"), true);
$token = trim($data['token'] ?? '');
$newPassword = trim($data['password'] ?? '');

if (!$token || !$newPassword) {
    echo json_encode(['status' => 'error', 'message' => 'Token and new password required']);
    exit();
}

// --- VALIDATE TOKEN ---
$stmt = $pdo->prepare("SELECT id, reset_expires FROM users WHERE reset_token = ?");
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid token']);
    exit();
}

if (strtotime($user['reset_expires']) < time()) {
    echo json_encode(['status' => 'error', 'message' => 'Token expired']);
    exit();
}

// --- UPDATE PASSWORD ---
$hashed = password_hash($newPassword, PASSWORD_BCRYPT);

$stmt = $pdo->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?");
$stmt->execute([$hashed, $user['id']]);

echo json_encode(['status' => 'success', 'message' => 'Password has been reset successfully']);
