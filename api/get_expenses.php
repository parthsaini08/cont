<?php
include 'db.php';
include 'config.php';

ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- CORS setup ---
header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// --- DB connect ---
try {
    $pdo = getDBConnection();
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// --- Determine year ---
$year = isset($_GET['year']) && is_numeric($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));

try {
    // Fetch all groups
    $stmtGroups = $pdo->query("SELECT id, name FROM expense_groups ORDER BY id ASC");
    $groups = $stmtGroups->fetchAll(PDO::FETCH_ASSOC);

    $finalData = [];

    foreach ($groups as $group) {
        $groupId = $group['id'];

        // Fetch all expenses for this group + year
        $stmtExpenses = $pdo->prepare("
            SELECT id, name, months, month_updates, year
            FROM expenses
            WHERE group_id = :group_id AND year = :year
            ORDER BY id ASC
        ");
        $stmtExpenses->execute(['group_id' => $groupId, 'year' => $year]);
        $expenses = $stmtExpenses->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON fields
        foreach ($expenses as &$exp) {
            $exp['months'] = json_decode($exp['months'], true) ?? [];
            $exp['month_updates'] = json_decode($exp['month_updates'], true) ?? [];
        }

        $finalData[] = [
            "id" => $groupId,
            "name" => $group['name'],
            "expenses" => $expenses
        ];
    }

    echo json_encode([
        "status" => "success",
        "year" => $year,
        "groups" => $finalData
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
