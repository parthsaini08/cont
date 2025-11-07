<?php
// Database connection with singleton & persistent PDO
function getDBConnection() {
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

    return $pdo;
}
