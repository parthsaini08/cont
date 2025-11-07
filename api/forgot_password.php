<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require 'vendor/autoload.php'; // ✅ make sure this path is correct

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

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

// --- GET EMAIL ---
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode(['status' => 'error', 'message' => 'Email required']);
    exit();
}

// --- FIND USER ---
$stmt = $pdo->prepare("SELECT id, email, name FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'Email not registered']);
    exit();
}

// --- CREATE RESET TOKEN ---
$token = bin2hex(random_bytes(32));
$expiry = date("Y-m-d H:i:s", time() + 3600);

$stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?");
$stmt->execute([$token, $expiry, $user['id']]);

// --- RESET LINK ---
$resetLink = FRONTEND_ORIGIN . "/reset-password?token=" . $token;

// --- SEND EMAIL WITH PHPMailer ---
$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'farmerjames786@gmail.com'; // Your Gmail
    $mail->Password   = 'smwp utic uhmq pdji';      // App password
    $mail->SMTPSecure = 'tls';
    $mail->Port       = 587;
    // Recipients
    $mail->setFrom('farmerjames786@gmail.com', 'Contrack Password reset');
    $mail->addAddress($user['email'], $user['name']);

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Password Reset Request';
    $mail->Body = "
        <p>Hi {$user['name']},</p>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p><a href='$resetLink'>$resetLink</a></p>
        <p>This link expires in 1 hour.</p>
    ";
    $mail->AltBody = "Use this link to reset your password: $resetLink (expires in 1 hour)";

    $mail->send();

    echo json_encode(['status' => 'success', 'message' => 'Password reset link sent to your email']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
}
