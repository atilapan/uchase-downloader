chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){
    if (changeInfo.url === undefined) {
        if (changeInfo.status == 'loading') {
            injectJS();
        }
    }

    if (tab.status !== 'complete') {
        return;
    } else {
        injectJS();
    }
});

chrome.runtime.onMessage.addListener(function(msg, sender) {
    if(sender.tab.url.startsWith("https://ucha.se"))
    {
        console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
        
        if(msg.path && msg.fileName)
            chrome.downloads.download({
                url: msg.path,
                conflictAction: "uniquify",
                filename: msg.fileName
            });   
    }
});

function injectJS()
{
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let url = tabs[0].url;
        
        if(url.startsWith("https://ucha.se/watch"))
        {
            chrome.tabs.executeScript(tabs[0].tabId, {
                file: 'js/jquery.js'
            });

            chrome.tabs.executeScript(tabs[0].tabId, {
                file: 'js/main.js'
            });
        } 
    });
}