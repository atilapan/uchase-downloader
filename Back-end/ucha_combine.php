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

if(!isset($_POST["chunks"]))
{
    http_response_code(404);
    exit(json_encode(array("status" => false, "error_message" => "Missing chunks count")));
}

$url = trim($_POST['video']);
$chunks = intval($_POST['chunks']);

if (!preg_match('/^(https?:\/\/)([^\/]+)(\/.+)\/(.+_)([0-9]{1,2})\.ts$/', $url, $match)) 
{
    http_response_code(404);
    exit(json_encode(array("status" => false, "error_message" => "Link doesn't match expectations")));
}
//https:\/\/[a-zA-Z0-9.\/_:-]+\/(media_[a-z0-9_]+\.ts)

$global_host = $match[1] . $match[2];
$global_urldirname = $match[1] . $match[2] . $match[3];
$path = str_replace('/', '-', $match[3]);
$filename = $match[4];

$pathHashed = hash("adler32", $path, false);

/*$arr_length = intval(count(scandir($path . "/")));
exit($arr_length);*/

if(!is_dir($pathHashed))
{
    http_response_code(404);
    exit(json_encode(array("status" => false, "error_message" => "Such video has not been decoded yet")));
}

if(file_exists($pathHashed . "/done.mp4"))
{
    http_response_code(200);
    exit(json_encode(array("status" => true, "path" => $pathHashed . "/done.mp4", "fullpath" => "https://tos.ubique.club/" . $pathHashed . "/done.mp4")));
}

if(count(scandir($pathHashed . "/")) - 2 == $chunks) {
    $command = "";
    for($i = 0; $i < $chunks; $i++)
    {
        $command .= "{$pathHashed}/{$filename}{$i}.ts ";
    }

    //exit("cat {$command}> {$pathHashed}/all_media.ts");
    exec("cat {$command}> {$pathHashed}/all_media.ts");
    //exec("cat {$pathHashed}/*.ts >{$pathHashed}/all_media.ts");
    exec("ffmpeg -i \"/var/www/html/{$pathHashed}/all_media.ts\" -c copy -bsf:a aac_adtstoasc \"/var/www/html/{$pathHashed}/done.mp4\"");
    exec("rm -f {$pathHashed}/*.ts");

    if(file_exists($pathHashed . "/done.mp4"))
    {
        http_response_code(200);
        exit(json_encode(array("status" => true, "path" => $pathHashed . "/done.mp4", "fullpath" => "https://tos.ubique.club/" . $pathHashed . "/done.mp4")));
    }
    else 
    {
        http_response_code(404);
        exit(json_encode(array("status" => false, "error_message" => "Something failed while combining the video")));
    }
}
else 
{
    http_response_code(404);
    exit(json_encode(array("status" => false, "error_message" => "Chunks are missing")));
}