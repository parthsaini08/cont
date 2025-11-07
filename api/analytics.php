<?php
// ================================
// CONFIG: Database Connection
// ================================
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$host = "srv1878.hstgr.io"; 
$dbname = "u485711916_call_logs_data"; 
$username = "u485711916_devs"; 
$password = "Websites@123*";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
    exit;
}

// ================================
// LOGIC: Handle different types
// ================================
$type = isset($_GET['type']) ? $_GET['type'] : 'agent';
$data = [];

switch ($type) {

    // 1️⃣ Conversions per Agent
    case 'agent':
        $sql = "
            SELECT 
                agent_name,
                SUM(CASE WHEN converted = 'converted' THEN 1 ELSE 0 END) AS converted_calls,
                SUM(CASE WHEN converted = 'not converted' THEN 1 ELSE 0 END) AS not_converted_calls,
                COUNT(*) AS total_calls
            FROM ringcentral_calls
            WHERE direction = 'inbound'
              AND queue_name IS NOT NULL
              AND queue_name <> ''
              AND start_time >= '2025-09-23'
            GROUP BY agent_name
            ORDER BY total_calls DESC;
        ";
        break;

    // 2️⃣ Daily Conversion Trend
    case 'trend':
        $sql = "
            SELECT 
                DATE(start_time) AS call_date,
                COUNT(*) AS total_calls,
                SUM(CASE WHEN converted = 'converted' THEN 1 ELSE 0 END) AS converted_calls,
                ROUND(SUM(CASE WHEN converted = 'converted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS conversion_rate
            FROM ringcentral_calls
            WHERE start_time >= '2025-09-23'
            GROUP BY DATE(start_time)
            ORDER BY call_date;
        ";
        break;

        // 6️⃣ Total Calls by Queue (without conversion breakdown)
    case 'queue_calls':
        $sql = "
            SELECT 
                queue_name,
                COUNT(*) AS total_calls
            FROM ringcentral_calls
            WHERE queue_name IS NOT NULL
              AND queue_name <> ''
              AND start_time >= '2025-09-23'
            GROUP BY queue_name
            ORDER BY total_calls DESC;
        ";
        break;


    // 3️⃣ Conversion Rate by Queue
    case 'queue':
        $sql = "
            SELECT 
                queue_name,
                COUNT(*) AS total_calls,
                SUM(CASE WHEN converted = 'converted' THEN 1 ELSE 0 END) AS converted_calls,
                ROUND(SUM(CASE WHEN converted = 'converted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS conversion_rate
            FROM ringcentral_calls
            WHERE queue_name IS NOT NULL
              AND queue_name <> ''
              AND start_time >= '2025-09-23'
            GROUP BY queue_name
            ORDER BY conversion_rate DESC;
        ";
        break;

    // 4️⃣ Conversion by Customer Type
    case 'customer':
        $sql = "
            SELECT 
                customer_type,
                COUNT(*) AS total_calls,
                SUM(CASE WHEN converted = 'converted' THEN 1 ELSE 0 END) AS converted_calls,
                ROUND(SUM(CASE WHEN converted = 'converted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS conversion_rate
            FROM ringcentral_calls
            GROUP BY customer_type
            ORDER BY conversion_rate DESC;
        ";
        break;

    // 5️⃣ Default: Agent conversions
    default:
        echo json_encode(["error" => "Invalid type parameter. Use agent, trend, queue, or customer."]);
        exit;
}

// Execute the SQL and return data
$stmt = $pdo->query($sql);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($data);
?>
