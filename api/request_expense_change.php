<?php
include 'db.php';
include 'config.php';
require 'vendor/autoload.php'; // 👈 load PHPMailer via Composer autoloader

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --- Error reporting ---
ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- CORS setup ---
header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// --- DB connection ---
try {
    $pdo = getDBConnection();
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// --- Parse JSON body ---
$input = json_decode(file_get_contents("php://input"), true);
if (
    !$input ||
    empty($input['year']) ||
    empty($input['groups']) ||
    empty($input['requested_by']) ||
    empty($input['notify_admin'])
) {
    echo json_encode(["status" => "error", "message" => "Invalid request payload"]);
    exit;
}

$year = intval($input['year']);
$groups = json_encode($input['groups']);
$requested_by = trim($input['requested_by']);
$notify_admin = trim($input['notify_admin']);

try {
    // --- Insert into approval requests table ---
    $stmt = $pdo->prepare("
        INSERT INTO expense_change_requests (year, expense_data, requested_by, status, created_at)
        VALUES (:year, :expense_data, :requested_by, 'pending', NOW())
    ");
    $stmt->execute([
        'year' => $year,
        'expense_data' => $groups,
        'requested_by' => $requested_by
    ]);

    $request_id = $pdo->lastInsertId();

    // --- Generate approval/reject links ---
    $approveLink = "http://localhost:8000/" . "approve_request.php?id=$request_id&action=approve";
    $rejectLink  = "http://localhost:8000/" . "approve_request.php?id=$request_id&action=reject";

    // --- Setup and send mail ---
    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'farmerjames786@gmail.com'; // your Gmail
    $mail->Password   = 'smwp utic uhmq pdji';      // your app password
    $mail->SMTPSecure = 'tls';
    $mail->Port       = 587;


    $mail->setFrom('farmerjames786@gmail.com', 'Operations Expense System');
    $mail->addAddress($notify_admin);

    $mail->isHTML(true);
    $mail->Subject = "Expense Change Pending Approval – $year";

    $mail->Body = "
      <div style='font-family:Arial, sans-serif; background:#f9fafb; padding:20px;'>
        <div style='max-width:600px; margin:auto; background:#ffffff; border-radius:10px; padding:25px; border:1px solid #e5e7eb;'>
          <h2 style='color:#111827; margin-bottom:10px;'>Expense Change Request</h2>
          <p style='color:#374151; font-size:15px;'>
            <strong>$requested_by</strong> has made changes to the <strong>Operations Expenses ($year)</strong>.
          </p>
          <p style='color:#6b7280; font-size:14px; margin-top:15px;'>
            Please review and approve or reject this request:
          </p>

          <div style='margin-top:25px; text-align:center;'>
            <a href='$approveLink' style='background:#16a34a; color:white; padding:10px 18px; text-decoration:none; border-radius:6px; font-weight:bold;'>Approve</a>
            &nbsp;&nbsp;
            <a href='$rejectLink' style='background:#dc2626; color:white; padding:10px 18px; text-decoration:none; border-radius:6px; font-weight:bold;'>Reject</a>
          </div>

          <hr style='margin-top:30px; border:0; border-top:1px solid #e5e7eb;'>
          <p style='color:#9ca3af; font-size:13px; text-align:center; margin-top:15px;'>
            This is an automated notification from the Operations Expense Management System.
          </p>
        </div>
      </div>";

    $mail->send();

    echo json_encode([
        "status" => "success",
        "message" => "Change request sent to $notify_admin for approval."
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed: " . $e->getMessage()
    ]);
}
