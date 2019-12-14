// For ga
// (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
// (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
// m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
// })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

// ga('create', 'UA-9111169-4', 'auto');

// // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
// ga('set', 'checkProtocolTask', function(){}); 

// ga('send', 'pageview', '/background.html');

function dynamicChangeColor(tabId) {
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");

	var poolimg = new Image();

	poolimg.onload = function () {
		//draw background image
		ctx.drawImage(poolimg, 0, 0);

		var imageData = ctx.getImageData(0, 0, 128, 128);

		var outputData = ctx.createImageData(128, 128);

		browser.theme.getCurrent()
			.then(function(theme){
				var matches;
				if ( theme.colors && theme.colors.icons && ( matches = theme.colors.icons.match(/rgb(a)?\((.*)\)/) ) ) {
					var colorSets = matches.pop().split(",").map(function(str){ return str.trim(); });

					var pureColors = colorSets.slice(0, 3).map(function(str){ return parseInt(str); });
					var alphaRatio = parseFloat(colorSets[3]) || 1;

					for (var i = 0; i < imageData.data.length; i += 4) {
						outputData.data[i + 0] = pureColors[0];
						outputData.data[i + 1] = pureColors[1];
						outputData.data[i + 2] = pureColors[2];
						outputData.data[i + 3] = Math.floor(imageData.data[i + 3] * alphaRatio);
					}
				}
				browser.pageAction.setIcon({
					tabId: tabId, 
					imageData: outputData
				});
				browser.pageAction.show(tabId);
			});
	};

	poolimg.src = browser.runtime.getURL("images/icon-128px.png");
}

// Received a message from content script
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.action){
		case "showIcon":
			dynamicChangeColor(sender.tab.id);
			return true;
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
