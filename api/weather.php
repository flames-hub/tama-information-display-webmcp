<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300, stale-if-error=21600');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$configPath = dirname(__DIR__) . '/data/config.json';
$config = is_file($configPath) ? json_decode((string) file_get_contents($configPath), true) : null;
$location = is_array($config) && isset($config['weatherLocation']) && is_array($config['weatherLocation'])
    ? $config['weatherLocation']
    : [];

$latitude = filter_var($location['latitude'] ?? 34.6851, FILTER_VALIDATE_FLOAT);
$longitude = filter_var($location['longitude'] ?? 135.8048, FILTER_VALIDATE_FLOAT);
$timezone = (string) ($location['timezone'] ?? 'Asia/Tokyo');
$locationName = (string) ($location['name'] ?? '奈良市');

if ($latitude === false || $longitude === false || !in_array($timezone, timezone_identifiers_list(), true)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'invalid_server_config'], JSON_UNESCAPED_UNICODE);
    exit;
}

$params = [
    'latitude' => $latitude,
    'longitude' => $longitude,
    'current' => 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    'hourly' => 'temperature_2m,precipitation_probability,weather_code',
    'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    'timezone' => $timezone,
    'forecast_days' => 7,
    'forecast_hours' => 24,
];

$upstreamUrl = 'https://api.open-meteo.com/v1/forecast?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
$cachePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'tama-info-weather-v1.json';
$cacheTtl = 600;
$staleTtl = 21600;

function readCache(string $path, int $maxAge): ?string
{
    if (!is_file($path)) return null;
    $modified = filemtime($path);
    if ($modified === false || (time() - $modified) > $maxAge) return null;
    $contents = file_get_contents($path);
    return is_string($contents) && $contents !== '' ? $contents : null;
}

function writeCache(string $path, string $contents): void
{
    $temporary = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($temporary, $contents, LOCK_EX) === false) return;
    @chmod($temporary, 0600);
    if (!@rename($temporary, $path)) @unlink($temporary);
}

function fetchJson(string $url): ?string
{
    if (function_exists('curl_init')) {
        $handle = curl_init($url);
        if ($handle === false) return null;
        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_USERAGENT => 'TAMA-Information-Display/0.1',
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $body = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        curl_close($handle);
        return is_string($body) && $status === 200 ? $body : null;
    }

    $context = stream_context_create([
        'http' => ['timeout' => 8, 'header' => "Accept: application/json\r\nUser-Agent: TAMA-Information-Display/0.1\r\n"],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);
    $body = @file_get_contents($url, false, $context);
    return is_string($body) ? $body : null;
}

$fresh = readCache($cachePath, $cacheTtl);
if ($fresh !== null) {
    header('X-TAMA-Weather-Cache: HIT');
    echo $fresh;
    exit;
}

$body = fetchJson($upstreamUrl);
$decoded = is_string($body) ? json_decode($body, true) : null;
if (is_array($decoded) && isset($decoded['current'], $decoded['hourly'], $decoded['daily'])) {
    $decoded['_meta'] = [
        'provider' => 'Open-Meteo',
        'location' => $locationName,
        'fetchedAt' => gmdate(DATE_ATOM),
        'stale' => false,
    ];
    $encoded = json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (is_string($encoded)) {
        writeCache($cachePath, $encoded);
        header('X-TAMA-Weather-Cache: MISS');
        echo $encoded;
        exit;
    }
}

$stale = readCache($cachePath, $staleTtl);
if ($stale !== null) {
    $staleData = json_decode($stale, true);
    if (is_array($staleData)) {
        $staleData['_meta']['stale'] = true;
        $staleData['_meta']['servedAt'] = gmdate(DATE_ATOM);
        header('Warning: 110 - "Response is stale"');
        header('X-TAMA-Weather-Cache: STALE');
        echo json_encode($staleData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

http_response_code(502);
echo json_encode(['ok' => false, 'error' => 'weather_unavailable'], JSON_UNESCAPED_UNICODE);
