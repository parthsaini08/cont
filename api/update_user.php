<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
require_once "db.php";
session_start();

$pdo = getDBConnection();

// Admin check
if (!isset($_SESSION['user_id'])) exit(json_encode(['status'=>'error','message'=>'Not logged in']));
$stmt = $pdo->prepare("SELECT * FROM users WHERE id=?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if(!$user || $user['role']!=='admin') exit(json_encode(['status'=>'error','message'=>'Not authorized']));

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'] ?? null;
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$role = $data['role'] ?? '';
$agent_extension = $data['agent_extension'] ?? '';
$lead_extension = $data['lead_extension'] ?? '';

if(!$id || !$name || !$email || !$role || !$agent_extension) exit(json_encode(['status'=>'error','message'=>'Missing fields']));

$stmt = $pdo->prepare("UPDATE users SET name=?, email=?, role=?, agent_extension=?, lead_extension=? WHERE id=?");
$stmt->execute([$name,$email,$role,$agent_extension,$lead_extension,$id]);

echo json_encode(['status'=>'success','message'=>'User updated']);
