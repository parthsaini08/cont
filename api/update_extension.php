<?php
require "./../vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$rcsdk = new RingCentral\SDK\SDK(
    $_ENV["RC_CLIENT_ID"],
    $_ENV["RC_CLIENT_SECRET"],
    $_ENV["RC_SERVER_URL"]
);

$platform = $rcsdk->platform();

try {
    $platform->login(["jwt" => $_ENV["RC_JWT"]]);

    $allExtensions = [];
    $page = 1;
    $perPage = 100;

    do {
        $response = $platform->get("/restapi/v1.0/account/~/extension", [
            "page" => $page,
            "perPage" => $perPage,
        ]);
        $records = $response->json()->records;

        foreach ($records as $ext) {
            $allExtensions[] = [
                "id" => $ext->id,
                "name" => $ext->name ?? "Unknown",
                "type" => $ext->type,
            ];
        }

        $page++;
    } while (count($records) > 0);

    // Store in a file
    file_put_contents(
        __DIR__ . "/extensions.json",
        json_encode($allExtensions, JSON_PRETTY_PRINT)
    );
    echo "✅ Extensions saved to extensions.json\n";
} catch (\RingCentral\SDK\Http\ApiException $e) {
    exit("❌ API Error: " . $e->getMessage() . PHP_EOL);
}
