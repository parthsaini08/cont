<?php
include "config.php";

header("Access-Control-Allow-Origin: " . FRONTEND_ORIGIN);
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once "db.php";
session_start();

$pdo = getDBConnection();

/* -------------------------------------------------
   TIMEZONE CONFIGURATION
------------------------------------------------- */
// Set timezone to New York (Eastern Time)
date_default_timezone_set('America/New_York');

/* -------------------------------------------------
   HELPERS
------------------------------------------------- */

/**
 * Calculate PRODUCTIVE seconds today (available + busy)
 * Times are calculated based on New York timezone
 */
function calculateProductiveSecondsToday(PDO $pdo, int $userId): int {
    
    // Get today's start in New York timezone
    $nyTimezone = new DateTimeZone('America/New_York');
    $now = new DateTime('now', $nyTimezone);
    
    // Start of day in New York (00:00:00 ET)
    $todayStartNY = new DateTime('today', $nyTimezone);
    
    // Convert to UTC for database query (since your DB stores UTC)
    $utcTimezone = new DateTimeZone('UTC');
    $todayStartUTC = clone $todayStartNY;
    $todayStartUTC->setTimezone($utcTimezone);
    
    $stmt = $pdo->prepare("
        SELECT status, event_time
        FROM agent_presence_events
        WHERE user_id = ?
          AND event_time >= ?
        ORDER BY event_time ASC
    ");
    $stmt->execute([$userId, $todayStartUTC->format('Y-m-d H:i:s')]);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($events)) return 0;

    $total = 0;
    $counting = false;
    $startTime = null;

    foreach ($events as $event) {
        // Convert UTC event time to timestamp
        $eventDateTime = new DateTime($event['event_time'], $utcTimezone);
        $eventTimestamp = $eventDateTime->getTimestamp();
        
        if (in_array($event['status'], ['available', 'busy'])) {
            if (!$counting) {
                $counting = true;
                $startTime = $eventTimestamp;
            }
        } else {
            if ($counting && $startTime) {
                $total += $eventTimestamp - $startTime;
                $counting = false;
                $startTime = null;
            }
        }
    }

    // If still productive till now (use current time)
    if ($counting && $startTime) {
        $total += time() - $startTime;
    }

    return max(0, $total);
}

/**
 * Normalize status
 */
function normalizeStatus(?string $status): string {
    $status = strtolower((string)$status);
    return in_array($status, ['busy', 'available', 'dnd', 'queue_off', 'offline'])
        ? $status
        : 'offline';
}

/**
 * Convert UTC datetime to New York timezone
 */
function convertUTCtoNY(string $utcDatetime): string {
    $utcTimezone = new DateTimeZone('UTC');
    $nyTimezone = new DateTimeZone('America/New_York');
    
    $dt = new DateTime($utcDatetime, $utcTimezone);
    $dt->setTimezone($nyTimezone);
    
    return $dt->format('Y-m-d H:i:s');
}

/**
 * Get current date/time info in New York timezone
 */
function getNYTimezoneInfo(): array {
    $nyTimezone = new DateTimeZone('America/New_York');
    $now = new DateTime('now', $nyTimezone);
    
    return [
        'current_time' => $now->format('Y-m-d H:i:s'),
        'timezone' => 'America/New_York',
        'timezone_abbr' => $now->format('T'), // EST or EDT
        'offset' => $now->format('P') // e.g., -05:00 or -04:00
    ];
}

/* -------------------------------------------------
   1. LOAD extensions.json
------------------------------------------------- */

$extensionsFile = __DIR__ . "/extensions.json";

if (!file_exists($extensionsFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'extensions.json not found']);
    exit;
}

$extensionsData = json_decode(file_get_contents($extensionsFile), true);
if (!is_array($extensionsData)) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid extensions.json']);
    exit;
}

/* -------------------------------------------------
   2. EXTRACT USER EXTENSIONS
------------------------------------------------- */

$agentExtensionIds = [];

foreach ($extensionsData as $ext) {
    if (($ext['type'] ?? '') === 'User' && isset($ext['id'])) {
        $agentExtensionIds[] = (string)$ext['id'];
    }
}

if (empty($agentExtensionIds)) {
    echo json_encode([]);
    exit;
}

/* -------------------------------------------------
   3. SQL PLACEHOLDERS
------------------------------------------------- */

$placeholders = implode(',', array_fill(0, count($agentExtensionIds), '?'));

/* -------------------------------------------------
   4. FETCH LATEST STATUS (ONE ROW PER EXTENSION)
------------------------------------------------- */

$sql = "
SELECT
    u.id,
    u.name,
    u.agent_extension,
    p.status,
    p.event_time
FROM users u
INNER JOIN (
    SELECT
        u2.agent_extension,
        e1.status,
        e1.event_time
    FROM users u2
    INNER JOIN agent_presence_events e1
        ON e1.user_id = u2.id
    INNER JOIN (
        SELECT
            u3.agent_extension,
            MAX(e3.event_time) AS max_time
        FROM users u3
        INNER JOIN agent_presence_events e3
            ON e3.user_id = u3.id
        WHERE u3.agent_extension IS NOT NULL
        GROUP BY u3.agent_extension
    ) latest
      ON latest.agent_extension = u2.agent_extension
     AND latest.max_time = e1.event_time
) p
  ON p.agent_extension = u.agent_extension
WHERE u.agent_extension IN ($placeholders)
GROUP BY u.agent_extension
ORDER BY
  CASE p.status
    WHEN 'busy' THEN 1
    WHEN 'available' THEN 2
    WHEN 'dnd' THEN 3
    WHEN 'queue_off' THEN 4
    WHEN 'offline' THEN 5
    ELSE 6
  END,
  u.name
";

$stmt = $pdo->prepare($sql);
$stmt->execute($agentExtensionIds);

/* -------------------------------------------------
   5. BUILD RESPONSE
------------------------------------------------- */

$result = [];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {

    $status = normalizeStatus($row['status']);

    $productiveSeconds = calculateProductiveSecondsToday(
        $pdo,
        (int)$row['id']
    );

    // Convert UTC event_time to New York time for display
    $updatedAtNY = convertUTCtoNY($row['event_time']);

    $result[] = [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'status' => $status,
        'productive_seconds_today' => $productiveSeconds,
        'updated_at' => $updatedAtNY, // Now in New York time
        'updated_at_utc' => $row['event_time'] // Keep UTC for reference
    ];
}

// Include timezone info in response
$response = [
    'timezone_info' => getNYTimezoneInfo(),
    'agents' => $result
];

echo json_encode($response);