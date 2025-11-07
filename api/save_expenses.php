<?php
include 'db.php';
include 'config.php';

ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- CORS setup ---
header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
    exit;
}

// --- DB connection ---
try {
    $pdo = getDBConnection();
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// --- Parse JSON input ---
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!$data || !isset($data['groups']) || !isset($data['year'])) {
    echo json_encode(["status" => "error", "message" => "Invalid input data"]);
    exit;
}

$groups = $data['groups'];
$year = intval($data['year']);

try {
    $pdo->beginTransaction();

    // Preload prepared statements
    $stmtCheckGroup = $pdo->prepare("SELECT COUNT(*) FROM expense_groups WHERE id = ?");
    $stmtInsertGroup = $pdo->prepare("INSERT INTO expense_groups (name) VALUES (:name)");
    $stmtUpdateGroup = $pdo->prepare("UPDATE expense_groups SET name = :name WHERE id = :id");

    $stmtSelectExpense = $pdo->prepare("SELECT months, month_updates FROM expenses WHERE id = ? AND group_id = ? AND year = ?");
    $stmtInsertExpense = $pdo->prepare("
        INSERT INTO expenses (group_id, name, months, month_updates, year)
        VALUES (:group_id, :name, :months, :month_updates, :year)
    ");
    $stmtUpdateExpense = $pdo->prepare("
        UPDATE expenses 
        SET name = :name, months = :months, month_updates = :month_updates
        WHERE id = :id AND year = :year
    ");

    $groupIds = [];

    foreach ($groups as $group) {
        $groupName = trim($group['name'] ?? '');
        if ($groupName === '') continue; // Skip unnamed groups

        // Ensure group exists
        if (!empty($group['id'])) {
            $stmtCheckGroup->execute([$group['id']]);
            $exists = $stmtCheckGroup->fetchColumn() > 0;
            if ($exists) {
                $stmtUpdateGroup->execute(['name' => $groupName, 'id' => $group['id']]);
                $groupId = $group['id'];
            } else {
                $stmtInsertGroup->execute(['name' => $groupName]);
                $groupId = $pdo->lastInsertId();
            }
        } else {
            $stmtInsertGroup->execute(['name' => $groupName]);
            $groupId = $pdo->lastInsertId();
        }

        $groupIds[] = $groupId; // Track all groups still present

        $expensesList = $group['expenses'] ?? [];
        $existingExpenseIds = [];

        foreach ($expensesList as $expense) {
            $expenseName = trim($expense['name'] ?? '');
            if ($expenseName === '') continue; // skip unnamed

            $months = $expense['months'] ?? [];
            if (!is_array($months)) $months = [];
            $monthsJson = json_encode($months);

            $prevMonths = [];
            $prevUpdates = [];
            $hasExisting = false;

            if (!empty($expense['id'])) {
                $stmtSelectExpense->execute([$expense['id'], $groupId, $year]);
                $existing = $stmtSelectExpense->fetch(PDO::FETCH_ASSOC);
                if ($existing) {
                    $hasExisting = true;
                    $prevMonths = json_decode($existing['months'], true) ?? [];
                    $prevUpdates = json_decode($existing['month_updates'], true) ?? [];
                }
            }

            // Detect changed months
            $newUpdates = $prevUpdates;
            foreach ($months as $monthKey => $val) {
                $oldVal = $prevMonths[$monthKey] ?? null;
                if ($oldVal != $val) {
                    $newUpdates[$monthKey] = date('Y-m-d H:i:s');
                }
            }
            $updatesJson = json_encode($newUpdates);

            // Update or insert
            if ($hasExisting) {
                $stmtUpdateExpense->execute([
                    'name' => $expenseName,
                    'months' => $monthsJson,
                    'month_updates' => $updatesJson,
                    'id' => $expense['id'],
                    'year' => $year
                ]);
                $existingExpenseIds[] = $expense['id'];
            } else {
                $stmtInsertExpense->execute([
                    'group_id' => $groupId,
                    'name' => $expenseName,
                    'months' => $monthsJson,
                    'month_updates' => $updatesJson,
                    'year' => $year
                ]);
                $existingExpenseIds[] = $pdo->lastInsertId();
            }
        }

        // Delete expenses not in list
        $existingExpenseIds = array_filter($existingExpenseIds, fn($id) => !empty($id) && is_numeric($id));
        if (!empty($existingExpenseIds)) {
            $placeholders = implode(',', array_fill(0, count($existingExpenseIds), '?'));
            $stmtDelete = $pdo->prepare("DELETE FROM expenses WHERE group_id = ? AND year = ? AND id NOT IN ($placeholders)");
            $stmtDelete->execute(array_merge([$groupId, $year], $existingExpenseIds));
        } else {
            $stmtDeleteAll = $pdo->prepare("DELETE FROM expenses WHERE group_id = ? AND year = ?");
            $stmtDeleteAll->execute([$groupId, $year]);
        }
    }

    // --- NEW: Delete expense groups removed from frontend ---
    $groupIds = array_filter($groupIds, fn($id) => !empty($id) && is_numeric($id));
    if (!empty($groupIds)) {
        $placeholders = implode(',', array_fill(0, count($groupIds), '?'));
        // Delete all expenses belonging to removed groups
        $stmtDelExpenses = $pdo->prepare("DELETE FROM expenses WHERE group_id NOT IN ($placeholders)");
        $stmtDelExpenses->execute($groupIds);
        // Delete the groups themselves
        $stmtDelGroups = $pdo->prepare("DELETE FROM expense_groups WHERE id NOT IN ($placeholders)");
        $stmtDelGroups->execute($groupIds);
    } else {
        // If no groups left, wipe all
        $pdo->exec("DELETE FROM expenses");
        $pdo->exec("DELETE FROM expense_groups");
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Expenses and groups saved successfully for year $year"]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
