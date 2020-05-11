// For ga
// (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
// (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
// m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
// })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

// ga('create', 'UA-9111169-4', 'auto');

// // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
// ga('set', 'checkProtocolTask', function(){}); 

// ga('send', 'pageview', '/background.html');

const colorNames = ['AliceBlue','AntiqueWhite','Aqua','Aquamarine','Azure','Beige','Bisque','Black','BlanchedAlmond','Blue','BlueViolet','Brown','BurlyWood','CadetBlue','Chartreuse','Chocolate','Coral','CornflowerBlue','Cornsilk','Crimson','Cyan','DarkBlue','DarkCyan','DarkGoldenRod','DarkGray','DarkGrey','DarkGreen','DarkKhaki','DarkMagenta','DarkOliveGreen','DarkOrange','DarkOrchid','DarkRed','DarkSalmon','DarkSeaGreen','DarkSlateBlue','DarkSlateGray','DarkSlateGrey','DarkTurquoise','DarkViolet','DeepPink','DeepSkyBlue','DimGray','DimGrey','DodgerBlue','FireBrick','FloralWhite','ForestGreen','Fuchsia','Gainsboro','GhostWhite','Gold','GoldenRod','Gray','Grey','Green','GreenYellow','HoneyDew','HotPink','IndianRed','Indigo','Ivory','Khaki','Lavender','LavenderBlush','LawnGreen','LemonChiffon','LightBlue','LightCoral','LightCyan','LightGoldenRodYellow','LightGray','LightGrey','LightGreen','LightPink','LightSalmon','LightSeaGreen','LightSkyBlue','LightSlateGray','LightSlateGrey','LightSteelBlue','LightYellow','Lime','LimeGreen','Linen','Magenta','Maroon','MediumAquaMarine','MediumBlue','MediumOrchid','MediumPurple','MediumSeaGreen','MediumSlateBlue','MediumSpringGreen','MediumTurquoise','MediumVioletRed','MidnightBlue','MintCream','MistyRose','Moccasin','NavajoWhite','Navy','OldLace','Olive','OliveDrab','Orange','OrangeRed','Orchid','PaleGoldenRod','PaleGreen','PaleTurquoise','PaleVioletRed','PapayaWhip','PeachPuff','Peru','Pink','Plum','PowderBlue','Purple','RebeccaPurple','Red','RosyBrown','RoyalBlue','SaddleBrown','Salmon','SandyBrown','SeaGreen','SeaShell','Sienna','Silver','SkyBlue','SlateBlue','SlateGray','SlateGrey','Snow','SpringGreen','SteelBlue','Tan','Teal','Thistle','Tomato','Turquoise','Violet','Wheat','White','WhiteSmoke','Yellow','YellowGreen'];
const colorValues = ['f0f8ff','faebd7','00ffff','7fffd4','f0ffff','f5f5dc','ffe4c4','000000','ffebcd','0000ff','8a2be2','a52a2a','deb887','5f9ea0','7fff00','d2691e','ff7f50','6495ed','fff8dc','dc143c','00ffff','00008b','008b8b','b8860b','a9a9a9','a9a9a9','006400','bdb76b','8b008b','556b2f','ff8c00','9932cc','8b0000','e9967a','8fbc8f','483d8b','2f4f4f','2f4f4f','00ced1','9400d3','ff1493','00bfff','696969','696969','1e90ff','b22222','fffaf0','228b22','ff00ff','dcdcdc','f8f8ff','ffd700','daa520','808080','808080','008000','adff2f','f0fff0','ff69b4','cd5c5c','4b0082','fffff0','f0e68c','e6e6fa','fff0f5','7cfc00','fffacd','add8e6','f08080','e0ffff','fafad2','d3d3d3','d3d3d3','90ee90','ffb6c1','ffa07a','20b2aa','87cefa','778899','778899','b0c4de','ffffe0','00ff00','32cd32','faf0e6','ff00ff','800000','66cdaa','0000cd','ba55d3','9370db','3cb371','7b68ee','00fa9a','48d1cc','c71585','191970','f5fffa','ffe4e1','ffe4b5','ffdead','000080','fdf5e6','808000','6b8e23','ffa500','ff4500','da70d6','eee8aa','98fb98','afeeee','db7093','ffefd5','ffdab9','cd853f','ffc0cb','dda0dd','b0e0e6','800080','663399','ff0000','bc8f8f','4169e1','8b4513','fa8072','f4a460','2e8b57','fff5ee','a0522d','c0c0c0','87ceeb','6a5acd','708090','708090','fffafa','00ff7f','4682b4','d2b48c','008080','d8bfd8','ff6347','40e0d0','ee82ee','f5deb3','ffffff','f5f5f5','ffff00','9acd32'];
const colorValRe = /^(#)?([0-9a-fA-F]+)$/;

function convertHexToRgba(hex){
	let sixDigits = "a0a0a0";
	if ( hex.length == 6 ) {
		sixDigits = hex;
	} else if ( hex.length == 3 ) {
		sixDigits = ""; // reset
		for(let i=0; i < 3; i++) {
			sixDigits += hex[i] + hex[i];
		}
	}
	return [
		parseInt(sixDigits.slice(0, 2), 16),
		parseInt(sixDigits.slice(2, 4), 16),
		parseInt(sixDigits.slice(4, 6), 16),
		1
	];
}

function getValidThemeColorSet(theme){
	if ( theme.colors && theme.colors.icons ) {
		var matches, nameIdx = -1;
		var	colorLowerNames = colorNames.map(n => n.toLowerCase());
		if ( matches = theme.colors.icons.match(/rgb(a)?\((.*)\)/) ) {
			var colorSets = matches.pop().split(",").map(function(str){ return str.trim(); });
			return colorSets.slice(0, 3).map(function(str){ return parseInt(str); }).concat([parseFloat(colorSets[3]) || 1]);
		} else if ( (nameIdx = colorLowerNames.indexOf(theme.colors.icons.toLowerCase())) != -1 ) {
			return convertHexToRgba(colorValues[nameIdx]);
		} else if ( matches = theme.colors.icons.match(colorValRe) ) {
			return convertHexToRgba(matches.pop());
		}
	}
	// default use #bababa
	return convertHexToRgba("bababa");
}

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
				var colorSets = getValidThemeColorSet(theme);
				for (var i = 0; i < imageData.data.length; i += 4) {
					outputData.data[i + 0] = colorSets[0];
					outputData.data[i + 1] = colorSets[1];
					outputData.data[i + 2] = colorSets[2];
					outputData.data[i + 3] = Math.floor(imageData.data[i + 3] * colorSets[3]);
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
