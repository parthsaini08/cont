<?php
require "./vendor/autoload.php";


$rcsdk = new RingCentral\SDK\SDK(
    "8qIqz0kMjXVcyFxA8WZcLY",
   "ANk4Gfekw5te3p1a5b0RdNegq16AAHQk7fMYtlQdXK75",
    "https://platform.ringcentral.com"
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
