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
    die('Missing Video URL');

$url = trim($_POST['video']);

if (!preg_match('/^(https?:\/\/)([^\/]+)(\/.+)\/(.+\..+)$/', $url, $match)) {
    die('Link error' . PHP_EOL);
}
//https:\/\/[a-zA-Z0-9.\/_:-]+\/(media_[a-z0-9_]+\.ts)

$global_host = $match[1] . $match[2];
$global_urldirname = $match[1] . $match[2] . $match[3];
$path = str_replace('/', '-', $match[3]);

$pathHashed = hash("adler32", $path, false);

if(file_exists($pathHashed . "/done.mp4"))
{
    http_response_code(200);
    exit(json_encode(array("status" => true, "path" => $pathHashed . "/done.mp4", "fullpath" => "https://tos.ubique.club/" . $pathHashed . "/done.mp4")));
}
else
{
    http_response_code(404);
    exit(json_encode(array("status" => false, "error_message" => "File doesn't exist")));
}