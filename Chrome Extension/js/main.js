const cssToInj = "<style>#download-btn { background-color: #f29117; color: #fff; padding: 0.125rem 0.1875rem; padding-right: 0.25rem; border-radius: 0.3125rem; cursor: pointer; line-height: initial; } #loader {border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 16px; height: 16px; animation: spin 2s linear infinite; display:inherit; margin-left:5px; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>";

let global = {
    alreadyProccesing: false,
    totalChunkSize: 0,
    sentForDecoding: 0,
    receivedDecoded: 0,
    videoParts: [],
};
// On page load
$(function() {
    // Inject Custom CSS
    let headTag = document.getElementsByTagName("head")[0];
    headTag.innerHTML += cssToInj;

    // Search for video info div
    let videoInfo = document.getElementById("video-info");
    if(videoInfo)
    {
        // Inject Button into div
        let btn = document.createRange().createContextualFragment('<div class="col-12 col-sm-auto pt-md-2 pt-1 d-flex align-items-center"><div id="download-btn"><span id="dl-text" class="d-inline-block text-xxs-semibold" style="vertical-align: middle;">Изтегли видео<div id="dl-loader" style="display: none;"><div id="loader"></div><span id="dl-status">XX/XX</span></div></span></div></div>');
        videoInfo.append(btn);
        
        // Rearrange buttons and other stuff
        let e = $(".col-sm-auto");
        let stats = e.last().prev()[0];
        e.last().prev().remove();
        videoInfo.append(stats);
    }

    $("#download-btn").click(function() {
        if(global.alreadyProccesing) return;

        global.alreadyProccesing = true;
        changeDlVisibility(true);

        //console.log("To be continued");
        //return;
    
        let uchaPlayerData = $("#ucha-player").data("params");
        console.log(uchaPlayerData.sources.smil);
        $.get(uchaPlayerData.sources.smil, function(data, status){
            if(status == "success")
            {
                let temp = data.split('\n');
                let temp2 = uchaPlayerData.sources.smil.split("/");
                temp2.pop();
                let chunklist = temp2.join("/") + "/" + temp[3];
                console.log(chunklist);
    
                $.get(chunklist, function(data, status){
                    if(status == "success")
                    {
                        let temp = data.split('\n');
                        let urlbroken = chunklist.split("/");
                        urlbroken.pop();
                        temp.splice(0, 5);
                        //console.log(temp);
                        global.totalChunkSize = temp.length / 2 - 1;
                        updateChunkProgress("Checking...");

                        $.ajax({
                            type: 'POST',
                            url: 'https://tos.ubique.club/ucha_check.php',
                            data: { 
                                'video': urlbroken.join("/") + "/" + temp[0]
                            },
                            error: function(err){
                                updateChunkProgress();

                                for(i = 1; i < temp.length; i+=2)
                                {
                                    console.log(temp[i]);
                                    if(temp[i] == "") break;
            
                                    let videoPartUrl = urlbroken.join("/") + "/" + temp[i];
                                    console.log(videoPartUrl);
            
                                    setTimeout(function(){
                                        global.sentForDecoding++;
                                        $.ajax({
                                            type: 'POST',
                                            url: 'https://tos.ubique.club/ucha_decrypt.php',
                                            data: { 
                                                'video': videoPartUrl
                                            },
                                            success: function(msg){
                                                console.log(msg);
                                                global.receivedDecoded++;
                                                console.log(global.receivedDecoded);
                                                updateChunkProgress();
                                                if(global.receivedDecoded == global.totalChunkSize)
                                                {
                                                    console.log("[Anti-Ucha] Everything should be decrypted");
                
                                                    $.ajax({
                                                        type: 'POST',
                                                        url: 'https://tos.ubique.club/ucha_combine.php',
                                                        data: { 
                                                            'video': videoPartUrl,
                                                            'chunks': global.totalChunkSize
                                                        },
                                                        success: function(msg){
                                                            global.alreadyProccesing = false;
                                                            changeDlVisibility(false);

                                                            console.log(msg);
                                                            downloadVideo(msg.fullpath);
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }, (Math.random() * 10 + 1) * 200);
                                }
                                console.log("[Anti-Ucha] Everything should be sent for decoding");
                            },
                            success: function(data){
                                updateChunkProgress("Downloading...");
                                // To do download the video
                                console.log(data);
                                downloadVideo(data.fullpath);
                            }
                        });
                    }
                });
    
            }
        });
    });
});

function changeDlVisibility(changeTo = false)
{
    let dlLoader = document.getElementById("dl-loader");
    if(!dlLoader) return console.error("[Anti-Ucha] Failed to change download status visibility");
    if(changeTo) dlLoader.style.display = "inherit";
    else dlLoader.style.display = "none";
}

function updateChunkProgress(text = null)
{
    let dlStatus = document.getElementById("dl-status");
    if(!dlStatus) return console.error("[Anti-Ucha] Failed to update chunk progress");
    if(!text) {
        dlStatus.innerHTML = `${global.receivedDecoded}/${global.totalChunkSize}`
        console.log(`[Anti-Ucha] ${global.receivedDecoded}/${global.totalChunkSize} - Sent ${global.sentForDecoding}`);
    }
    else {
        dlStatus.innerHTML = text;
        console.log(`[Anti-Ucha] Changed Chunk Progress to: ${text}`);
    }
}

function downloadVideo(dlpath)
{
    let dlFileName = document.getElementsByTagName("h1")[0].innerText.replaceAll("Видео урок: ", "").replaceAll(" ", "_").replaceAll(".", "").replaceAll(":", "") + ".mp4"
    chrome.runtime.sendMessage({path: dlpath, fileName: dlFileName});
    global.alreadyProccesing = false;
    changeDlVisibility(false);
    updateChunkProgress("XX/XX");
}