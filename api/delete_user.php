<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

require_once "db.php";
session_start();

// rest of your code...


$pdo = getDBConnection();

// Admin check
if (!isset($_SESSION['user_id'])) exit(json_encode(['status'=>'error','message'=>'Not logged in']));
$stmt = $pdo->prepare("SELECT * FROM users WHERE id=?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if(!$user || $user['role']!=='admin') exit(json_encode(['status'=>'error','message'=>'Not authorized']));

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'] ?? null;
if(!$id) exit(json_encode(['status'=>'error','message'=>'Missing id']));

$stmt = $pdo->prepare("DELETE FROM users WHERE id=?");
$stmt->execute([$id]);

echo json_encode(['status'=>'success','message'=>'User deleted']);
