<?php
include 'db.php';
include 'config.php';
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;

ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

try { $pdo = getDBConnection(); } catch (Exception $e) {
  echo json_encode(["status"=>"error","message"=>"Database connection failed"]); exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['year'], $input['groups'], $input['requested_by'], $input['notify_admin'])) {
  echo json_encode(["status"=>"error","message"=>"Invalid request payload"]); exit;
}

$year = (int)$input['year'];
$groups = json_encode($input['groups']);
$requested_by = trim($input['requested_by']);
$notify_admin = trim($input['notify_admin']);

try {
  $stmt = $pdo->prepare("
    INSERT INTO expense_change_requests (year, expense_data, requested_by, status, created_at)
    VALUES (:year, :expense_data, :requested_by, 'pending', NOW())
  ");
  $stmt->execute(['year'=>$year,'expense_data'=>$groups,'requested_by'=>$requested_by]);
  $request_id = $pdo->lastInsertId();

  $approveLink = "http://localhost:8000/" . "approve_request.php?id=$request_id&action=approve";
  $rejectLink  = "http://localhost:8000/" . "approve_request.php?id=$request_id&action=reject";

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
    <div style='font-family:Arial,sans-serif;background:#f9fafb;padding:20px'>
      <div style='max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:25px;border:1px solid #ddd'>
        <h2 style='color:#111827;'>Expense Change Request</h2>
        <p><strong>$requested_by</strong> made changes to Operations Expenses ($year).</p>
        <div style='margin-top:20px;text-align:center'>
          <a href='$approveLink' style='background:#16a34a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;border-radius:6px;'>Approve</a>
          &nbsp;
          <a href='$rejectLink' style='background:#dc2626;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;'>Reject</a>
        </div>
      </div>
    </div>";
  $mail->send();

  echo json_encode(["status"=>"success","message"=>"Change request sent to $notify_admin for approval."]);
} catch (Exception $e) {
  echo json_encode(["status"=>"error","message"=>$e->getMessage()]);
}
