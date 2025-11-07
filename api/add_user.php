<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once "db.php";
session_start();

$pdo = getDBConnection();

// Admin check
if (!isset($_SESSION['user_id'])) exit(json_encode(['status'=>'error','message'=>'Not logged in']));
$stmt = $pdo->prepare("SELECT * FROM users WHERE id=?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if(!$user || $user['role']!=='admin') exit(json_encode(['status'=>'error','message'=>'Not authorized']));

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'user';
$agent_extension = $data['agent_extension'] ?? '';
$lead_extension = $data['lead_extension'] ?? null;

if(!$name || !$email || !$password || !$agent_extension) {
    exit(json_encode(['status'=>'error','message'=>'Missing fields']));
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (name,email,password,role,agent_extension,lead_extension) VALUES (?,?,?,?,?,?)");
$stmt->execute([$name,$email,$hash,$role,$agent_extension,$lead_extension]);

echo json_encode(['status'=>'success','message'=>'User added']);
