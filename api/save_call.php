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
$pdo = getDBConnection();

// Read JSON from React frontend
$input = json_decode(file_get_contents("php://input"), true);

try {
    $sql = "
        UPDATE ringcentral_calls
        SET 
            -- Phase 1
            customer_type = :customer_type,
            language = :language,
            segment = :segment,

            -- Phase 2
            productivity = :productivity,
            type = :type,
            airline = :airline,
            flight_usage = :flight_usage,
            cabin_type = :cabin_type,
            car_company = :car_company,
            car_usage = :car_usage,
            car_type = :car_type,
            notes = :notes,

            -- Phase 3
            converted = :converted,
            mco = :mco,
            booking_number = :booking_number,
            auth_type = :auth_type,
            gateway = :gateway,
            company_billing = :company_billing,
            card = :card,
            amount = :amount,
            reason = :reason,

            updated_at = NOW()
        WHERE session_id = :id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":id" => $input["callId"],

        // Phase 1  
        ":customer_type" => $input["customer_type"] ?? null,
        ":language" => $input["language"] ?? null,
        ":segment" => $input["segment"] ?? null,

        // Phase 2
        ":productivity" => $input["productivity"] ?? null,
        ":type" => $input["type"] ?? null,
        ":airline" => $input["airline"] ?? null,
        ":flight_usage" => $input["flightUsage"] ?? null,
        ":cabin_type" => $input["cabinType"] ?? null,
        ":car_company" => $input["carCompany"] ?? null,
        ":car_usage" => $input["carUsage"] ?? null,
        ":car_type" => $input["carType"] ?? null,
        ":notes" => $input["notes"] ?? null,

        // Phase 3
        ":converted" => $input["converted"] ?? null,
        ":mco" => $input["mco"] ?? null,
        ":booking_number" => $input["booking_number"] ?? null,
        ":auth_type" => $input["authType"] ?? null,
        ":gateway" => $input["gateway"] ?? null,
        ":company_billing" => $input["company_billing"] ?? null, // frontend sends "billing"
        ":card" => $input["card"] ?? null,
        ":amount" => $input["amount"] ?? null,
        ":reason" => $input["reason"] ?? null,
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Call updated successfully"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
