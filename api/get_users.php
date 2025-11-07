<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

require_once "db.php";
session_start();

$pdo = getDBConnection();

// Check admin
if (!isset($_SESSION['user_id'])) exit(json_encode(['status'=>'error','message'=>'Not logged in']));
$stmt = $pdo->prepare("SELECT * FROM users WHERE id=?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if(!$user || $user['role']!=='admin') exit(json_encode(['status'=>'error','message'=>'Not authorized']));

// Fetch all users
$stmt = $pdo->query("SELECT id, name, email, role, agent_extension, lead_extension FROM users ORDER BY id ASC");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['status'=>'success','users'=>$users]);
