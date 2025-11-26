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
if (!isset($_SESSION['user_id'])) 
    exit(json_encode(['status'=>'error','message'=>'Not logged in']));

$stmt = $pdo->prepare("SELECT * FROM users WHERE id=?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$user || $user['role']!=='admin')
    exit(json_encode(['status'=>'error','message'=>'Not authorized']));

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'] ?? null;
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$role = $data['role'] ?? '';
$agent_extension = $data['agent_extension'] ?? null;
$lead_extension = $data['lead_extension'] ?? null;
$revenue_generating =  $data['revenue_generating'] ?? 'no';
$active_from = $data['active_from'] ?? NULL;
$salary = $data['salary'] ?? NULL;

// Only required fields:
if(!$id || !$name || !$email || !$role) {
    exit(json_encode(['status'=>'error','message'=>'Missing fields']));
}

$stmt = $pdo->prepare("
    UPDATE users 
    SET name=?, email=?, role=?, agent_extension=?, lead_extension=?, 
        revenue_generating=?, active_from=?, salary=? 
    WHERE id=?
");

$stmt->execute([
    $name,
    $email,
    $role,
    $agent_extension,
    $lead_extension,
    $revenue_generating,
    $active_from,
    $salary,
    $id
]);

echo json_encode(['status'=>'success','message'=>'User updated']);
