// For ga
// (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
// (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
// m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
// })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

// ga('create', 'UA-9111169-4', 'auto');

// // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
// ga('set', 'checkProtocolTask', function(){}); 

// ga('send', 'pageview', '/background.html');

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
		// case "gaTrack":
		// 	var eventGaObj = {
		// 		hitType: 'event',
		// 		eventCategory: request.baseRepo,	// /author/repo/
		// 		eventAction: request.userAction,
		// 		eventLabel: request.githubUrl
		// 	};
		// 	ga('send', eventGaObj);
		// 	return;
	}
});
