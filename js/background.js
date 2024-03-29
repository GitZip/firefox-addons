
// Received a message from content script
browser.runtime.onMessage.addListener(function(request, sender) {
	switch (request.action){
		case "showIcon":
			return browser.pageAction.show(sender.tab.id);
		case "getKey":
			return browser.storage.sync.get("gitzip-github-token")
				.then(function(res){ return res["gitzip-github-token"] || ""; });
		case "setKey":
			return browser.storage.sync.set( {"gitzip-github-token": request.value} );
		case "createContextNested":
			var main = browser.contextMenus.create({
				id: "gitzip-nested",
				title: "GitZip Download",
				contexts: ["all"]
			});
			browser.contextMenus.create({
				id: "gitzip-nested-items",
				parentId: main,
				title: "Checked Items",
				contexts: ["all"],
				enabled: false
			});
			browser.contextMenus.create({
				id: "gitzip-nested-seperator",
				parentId: main,
				title: "seperator",
				type: "separator",
				contexts: ["all"]
			});
			browser.contextMenus.create({
				id: "gitzip-nested-selected",
				parentId: main,
				title: "(selected)",
				contexts: ["all"],
				enabled: false
			});
			browser.contextMenus.create({
				id: "gitzip-nested-current",
				parentId: main,
				title: "(current)",
				contexts: ["all"],
				enabled: false
			});
			return false;
		case "updateContextNested":
			var id = request.target;
			var updateObj = { enabled: request.enabled !== false };
			switch (id) {
				case "selected":
					updateObj.title = updateObj.enabled ? ("Selected " + (request.urlType == "blob" ? "File - " : "Folder - ") + request.urlName) : "(selected)";
					break;
				case "current":
					if (request.root === true) 
						updateObj.title = "Whole Repository";
					else 
						updateObj.title = updateObj.enabled ? ("Current " + (request.urlType == "blob" ? "File - " : "Folder - ") + request.urlName) : "(current)";
					break;
			}
			return browser.contextMenus.update("gitzip-nested-" + id, updateObj);
		case "removeContext": 
			return browser.contextMenus.removeAll();
	}
});

browser.contextMenus.onClicked.addListener(function(info, tab){
	if ( info.menuItemId.toString().indexOf("gitzip-") != -1 ) {
		browser.tabs.sendMessage(tab.id, {action: info.menuItemId + "-clicked"});
	}
});

browser.tabs.onActivated.addListener(function(activeInfo) {
	// handle other tabs active
    browser.contextMenus.removeAll();

    // change back to current tab
    browser.tabs.sendMessage(activeInfo.tabId, {action: "github-tab-active", from: "onActivated" });
});

browser.tabs.onUpdated.addListener(function(tabId, changeInfo){
	if ( changeInfo.status == "loading" ) {
		browser.contextMenus.removeAll();
	} else if ( changeInfo.status == "complete" ) {
		// coding like this because it would cause error during current page loading and then shift another tab quickly.
		browser.tabs.query({currentWindow: true, active: true}, function(tabs){
			var tab = tabs[0];
			if(tab) browser.tabs.sendMessage(tab.id, {action: "github-tab-active", from: "onUpdated" });
		});
	}
});

