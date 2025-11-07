<?php
// Show errors for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Start session (important!)
session_start();

// CORS headers
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true"); // ✅ allow cookies/sessions

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- DATABASE CONNECTION ---
static $pdo = null;

if ($pdo === null) {
    $host = "srv1878.hstgr.io"; 
    $dbname = "u485711916_call_logs_data"; 
    $username = "u485711916_devs"; 
    $password = "Websites@123*";

    try {
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_PERSISTENT => true
        ];

        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, $options);
    } catch (Exception $e) {
        die(json_encode(["error" => "Database connection failed: " . $e->getMessage()]));
    }
}

// --- GET JSON DATA ---
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
    exit();
}

// --- FETCH USER ---
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'Email not registered']);
    exit();
}

// --- VERIFY PASSWORD ---
if (!password_verify($password, $user['password'])) {
    echo json_encode(['status' => 'error', 'message' => 'Incorrect password']);
    exit();
}

// --- SUCCESS LOGIN ---
// Save user info in session
$_SESSION['user_id'] = $user['id'];
$_SESSION['role'] = $user['role'];
$_SESSION['agent_extension'] = $user['agent_extension'];
$_SESSION['lead_extension'] = $user['lead_extension'];

echo json_encode([
    'status' => 'success',
    'message' => 'Login successful',
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'agent_extension' => $user['agent_extension'],
        'lead_extension' => $user['lead_extension']
    ]
]);
