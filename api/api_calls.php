<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once "db.php";
$pdo = getDBConnection();

// Get filter (today, week, month)
$filter = $_GET['filter'] ?? 'today';

$where = "WHERE 1=1";
if ($filter === "today") {
    $where .= " AND DATE(start_time) = CURDATE()";
} elseif ($filter === "week") {
    $where .= " AND start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
} elseif ($filter === "month") {
    $where .= " AND start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
}

// ✅ Use updated columns
$sql = "
    SELECT 
        id,
        session_id,
        direction,
        from_number,
        from_name,
        from_location,
        to_number,
        to_name,
        call_status,
        start_time,
        end_time,
        duration_ms,
        call_type,
        internal_type,
        action,
        result,
        transport,
        last_modified,
        recording_id,
        recording_uri,
        recording_type,
        recording_content_uri,
        billing_cost_included,
        agent_name,
        billing_cost_purchased
    FROM ringcentral_calls
    $where
    ORDER BY start_time DESC
";

$stmt = $pdo->query($sql);
$calls = $stmt->fetchAll(PDO::FETCH_ASSOC);

// ✅ Add computed duration (seconds) for readability
foreach ($calls as &$call) {
    if (!empty($call['duration_ms'])) {
        $call['duration_sec'] = round($call['duration_ms'] / 1000, 2);
    } else {
        $call['duration_sec'] = null;
    }
}

echo json_encode([
    "filter" => $filter,
    "count" => count($calls),
    "calls" => $calls
]);
