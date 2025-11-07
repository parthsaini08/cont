<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// Allow requests from your frontend
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN); // React app URL
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
// require_once 'db.php'; // your Hostinger DB connection

    static $pdo = null; // Reuse connection within script execution

    if ($pdo === null) {
        $host = "srv1878.hstgr.io"; 
        $dbname = "u485711916_call_logs_data"; 
        $username = "u485711916_devs"; 
        $password = "Websites@123*";

        try {
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_PERSISTENT => true // ✅ persistent connection
            ];

            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, $options);
        } catch (Exception $e) {
            die(json_encode(["error" => "Database connection failed: " . $e->getMessage()]));
        }
    }
    // Get POSTed JSON data
    $data = json_decode(file_get_contents("php://input"), true);

    $name = trim($data['name']);
    $email = trim($data['email']);
    $password = trim($data['password']);

    // Validate required fields
    if (!$name || !$email || !$password) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
        exit;
    }

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Email already registered']);
        exit;
    }

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Default role is user
    $role = 'user';

    // Insert into users table
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    if ($stmt->execute([$name, $email, $hashed_password, $role])) {
        echo json_encode(['status' => 'success', 'message' => 'Signup successful']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error during signup']);
    }
