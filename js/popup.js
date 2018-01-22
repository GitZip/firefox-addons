// The DOMContentLoaded means the popup.html page has load. (trigger this event after click the ext icon)
document.addEventListener('DOMContentLoaded', function() {
	// alert("has loaded");

	var form = document.getElementById('tokenForm');
	var input = document.getElementById('tokenInput');
	var tokenlinks = form.querySelector('.gettoken-link');
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
			function onTokenLinkClick(e){
				e.preventDefault();
				browser.tabs.update(tab.id, {url: this.href + encodeURIComponent(tab.url) });
				window.close();
			}
			tokenlinks.forEach(function(link){
				link.addEventListener('click', onTokenLinkClick);
			});
		}
	});

}, false);
