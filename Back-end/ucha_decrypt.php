<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header('Content-Type: application/json');
/*ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);*/

if(!isset($_POST["video"]))
    $_POST = json_decode(file_get_contents("php://input"), true);

if(!isset($_POST["video"]))
{
    http_response_code(404);
    exit(json_encode(array("status" => false, "error_message" => "Missing Video URL")));
}

$url = trim($_POST['video']);

if (!preg_match('/^(https?:\/\/)([^\/]+)(\/.+)\/(.+\..+)$/', $url, $match)) 
{
    http_response_code(404);
    exit(json_encode(array("status" => false, "error_message" => "Link doesn't match expectations")));
}
//https:\/\/[a-zA-Z0-9.\/_:-]+\/(media_[a-z0-9_]+\.ts)

$global_host = $match[1] . $match[2];
$global_urldirname = $match[1] . $match[2] . $match[3];
$path = str_replace('/', '-', $match[3]);

$pathHashed = hash("adler32", $path, false);

if (!is_dir($pathHashed)) {
    if (!mkdir($pathHashed, 0755))
    {
        throw new Exception("Directory creation error");
    }
}

$key = file_get_contents(__DIR__ . '/ucha.se.key');
$video = file_get_contents($_POST['video']);
$chunkcontent = openssl_decrypt($video, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $key);
file_put_contents($pathHashed . "/" . $match[4], $chunkcontent);

if(file_exists($pathHashed . "/" . $match[4]))
{
    http_response_code(200);
    exit(json_encode(array("status" => true, "chunkpath" => $pathHashed . "/" . $match[4])));
}
else
{
    http_response_code(404);
    exit(json_encode(array("status" => false, "error_message" => "Something failed while downloading and decoding")));
}