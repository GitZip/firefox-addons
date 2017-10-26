// The DOMContentLoaded means the popup.html page has load. (trigger this event after click the ext icon)
document.addEventListener('DOMContentLoaded', function() {
	// alert("has loaded");

	var form = document.getElementById('tokenForm');
	var input = document.getElementById('tokenInput');
	var tokenlink = form.querySelector('.gettoken-link');
	var tip = form.querySelector('.tip-left');
	form.addEventListener('submit', function(){
		browser.runtime.sendMessage({action: "setKey", value: input.value});
		window.close();
	});

	input.addEventListener('input', function(){
		if(tip) tip.style.cssText += "display:block;";
	});

	browser.runtime
		.sendMessage({action: "getKey"})
		.then(function(response){
			input.value = response;
		});

	browser.tabs.query({currentWindow: true, active: true}, function(tabs){
		var tab = tabs[0];
		if(tab && tab.url){
			tokenlink.href += encodeURIComponent(tab.url);
			tokenlink.addEventListener('click', function(e){
				e.preventDefault();
				browser.tabs.update(tab.id, {url: tokenlink.href});
				window.close();
			});
		}
	});

}, false);
