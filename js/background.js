// Received a message from content script
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.action){
		case "showIcon":
			return browser.pageAction.show(sender.tab.id);
		case "getKey":
			return browser.storage.sync.get("gitzip-github-token")
				.then(function(res){ return res["gitzip-github-token"] || ""; });
		case "setKey":
			return browser.storage.sync.set( {"gitzip-github-token": request.value} );
	}
});
