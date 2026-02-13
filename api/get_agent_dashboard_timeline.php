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

/* =========================================================
   TIMEZONE SETUP (BEST PRACTICE)
   - Store timestamps in UTC
   - Calculate "today" in America/New_York
========================================================= */

$utcTz = new DateTimeZone('UTC');
$nyTz  = new DateTimeZone('America/New_York');

/* =========================================================
   HELPER: Normalize status
========================================================= */

function normalizeStatus(?string $status): string {
    $status = strtolower((string)$status);
    return in_array($status, ['busy','available','dnd','queue_off','offline'])
        ? $status
        : 'offline';
}

/* =========================================================
   HELPER: Calculate Productive Seconds (available + busy)
========================================================= */

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


/* =========================================================
   HELPER: Build Timeline For Today
========================================================= */

function getTodayTimeline(PDO $pdo, int $userId, DateTime $todayStartUtc): array {

    $stmt = $pdo->prepare("
        SELECT status, event_time
        FROM agent_presence_events
        WHERE user_id = ?
          AND event_time >= ?
        ORDER BY event_time ASC
    ");

    $stmt->execute([
        $userId,
        $todayStartUtc->format('Y-m-d H:i:s')
    ]);

    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $timeline = [];

    if (empty($events)) {
        return $timeline;
    }

    for ($i = 0; $i < count($events); $i++) {

        $current = $events[$i];

        $start = $current['event_time'];

        if (isset($events[$i + 1])) {
            $end = $events[$i + 1]['event_time'];
        } else {
            $end = gmdate('Y-m-d H:i:s'); // now in UTC
        }

        $timeline[] = [
            'status' => normalizeStatus($current['status']),
            'start'  => $start,
            'end'    => $end
        ];
    }

    return $timeline;
}

/* =========================================================
   STEP 1: Calculate Today Start in NY → Convert to UTC
========================================================= */

$nowNy = new DateTime('now', $nyTz);

$todayStartNy = clone $nowNy;
$todayStartNy->setTime(0,0,0);

$todayStartUtc = clone $todayStartNy;
$todayStartUtc->setTimezone($utcTz);

/* =========================================================
   STEP 2: Load extensions.json
========================================================= */

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

/* =========================================================
   STEP 3: Extract User Extension IDs
========================================================= */

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

/* =========================================================
   STEP 4: Fetch Latest Status (One Row Per Extension)
========================================================= */

$placeholders = implode(',', array_fill(0, count($agentExtensionIds), '?'));

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
ORDER BY u.name
";

$stmt = $pdo->prepare($sql);
$stmt->execute($agentExtensionIds);

/* =========================================================
   STEP 5: Build Final Response
========================================================= */

$result = [];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {

    $userId = (int)$row['id'];

    $status = normalizeStatus($row['status']);

    $productiveSeconds = calculateProductiveSecondsToday(
        $pdo,
        $userId,
        $todayStartUtc
    );

    $timeline = getTodayTimeline(
        $pdo,
        $userId,
        $todayStartUtc
    );

    $result[] = [
        'id' => $userId,
        'name' => $row['name'],
        'status' => $status,
        'productive_seconds_today' => $productiveSeconds,
        'timeline' => $timeline,
        'updated_at' => $row['event_time']
    ];
}

echo json_encode($result);


//1 2 4 8
//200,1500,7500,300,12000
//CRITICAL 2026 Disk failrue

// 34 

//6+2+4++4+5+6+7+8
//5 4.8 5 5
//65