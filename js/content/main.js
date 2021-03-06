// It would work on github.com

var repoExp = new RegExp("^https://github.com/([^/]+)/([^/]+)(/(tree|blob)/([^/]+)(/(.*))?)?");

function showGitzipIcon(){
	// just show the icon
	browser.runtime.sendMessage({action: "showIcon"});
}

/**
 * Resolve the github repo url for recognize author, project name, branch name, and so on.
 * @private
 * @param {string} repoUrl - The github repo url.
 * @param {ResolvedURL}
 */
function resolveUrl(repoUrl){
    if(typeof repoUrl != 'string') return;
    var matches = repoUrl.match(repoExp);
    if(matches && matches.length > 0){
        var root = (matches[5])?
            "https://github.com/" + matches[1] + "/" + matches[2] + "/tree/" + matches[5] :
            repoUrl;
        return {
            author: matches[1],
            project: matches[2],
            branch: matches[5],
            type: matches[4],
            path: matches[7] || '',
            inputUrl: repoUrl,
            rootUrl: root
        };
    }
}

// https://api.github.com/repos/peers/peerjs/git/trees/bfd406219ffd35f4ad870638f2180b27b4e9c374
function getGitUrl(author, project, type, sha){
	if(type == "blob" || type == "tree"){
		type += "s";
		return ["https://api.github.com/repos", author, project, "git", type, sha].join('/');
	}else return false;	
}

function getInfoUrl(author, project, path, branch) {
	return "https://api.github.com/repos/"
		 + author + "/" + project + "/contents/"
		 + path + (branch ? ("?ref=" + branch) : "");
}

var zipContents = function(filename, contents){
	var currDate = new Date();
	var dateWithOffset = new Date(currDate.getTime() - currDate.getTimezoneOffset() * 60000);
	// replace the default date with dateWithOffset
	JSZip.defaults.date = dateWithOffset;

	var zip = new JSZip();

    contents.forEach(function(item){
        zip.file(item.path, item.content, { createFolders:true, base64:true });
    });
    return new Promise(function(res, rej){
    	zip.generateAsync({type:"blob"})
	    .then(function (content) {
	        saveAs(content, filename + ".zip");
	        res();
	    }, function(error){
	        console.log(error);
	        rej(error);
	    });
    });	
};

function callAjax(url, token){
	return new Promise(function(resolve, reject){
		var xmlhttp;
	    // compatible with IE7+, Firefox, Chrome, Opera, Safari
	    xmlhttp = new XMLHttpRequest();
	    xmlhttp.onreadystatechange = function(){
	        if (xmlhttp.readyState == 4){
	        	if(xmlhttp.status == 200){
	        		resolve(xmlhttp.response);
	        	}else if(xmlhttp.status >= 400){
	        		reject(xmlhttp.response);
	        	}
	        }
	    };
	    xmlhttp.responseType = "json";
	    xmlhttp.open("GET", url, true);
	    if ( token ) xmlhttp.setRequestHeader("Authorization", "token " + token);
	    xmlhttp.send();
	});
}

var itemCollectSelector = ".repository-content .js-navigation-item";

var Pool = {
	_locked: false,
	_el: null,
	_dashBody: null,
	init: function(){
		// create dom
		// Make the dom on right bottom
		var self = this;
		var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

		if(!self._el){
			var wrap = document.createElement('div'),
				dash = document.createElement('div'),
				down = document.createElement('p'),
				tip = document.createElement('p');
			
			wrap.className = "gitzip-collect-wrap" + (isDark ? " gitzip-dark" : "");
			dash.className = "gitzip-collect-dash";
			down.className = "gitzip-collect-down";
			tip.className = "gitzip-collect-tip";

			tip.appendChild(document.createTextNode("Download checked items"));
			
			down.appendChild(document.createTextNode("\u27A0"));

			dash.appendChild(
				(function(){
					var c = document.createElement("div");
					c.className = "gitzip-header";
					c.appendChild(document.createTextNode("Progress Dashboard"));
					return c;
				})()
			);

			dash.appendChild(
				(function(){
					var c = document.createElement("div");
					c.className = "gitzip-body";
					return c;
				})()
			);

			wrap.appendChild(dash);
			wrap.appendChild(down);
			wrap.appendChild(tip);
			document.body.appendChild(wrap);

			self._el = wrap;
			self._dashBody = dash.querySelector(".gitzip-body");

			// hook events
			down.addEventListener('click', function(){ self.download(); });
			tip.addEventListener('click', function(){ self.download(); });
		}
		
		self.reset();
	},
	show: function(){ this._el && this._el.classList.add("gitzip-show"); },
	hide: function(){ this._el && this._el.classList.remove("gitzip-show"); },
	reset: function(){
		var self = this;
		!!checkHaveAnyCheck()? self.show() : self.hide();
		self._el.classList.remove("gitzip-downloading");
		while (self._dashBody.firstChild) {
			self._dashBody.removeChild(self._dashBody.firstChild);
		}
		self._locked = false;
	},
	download: function(){
		var self = this;
		if(self._locked) return;

		self._locked = true;

		self._el.classList.add("gitzip-downloading");

		var checkedItems = document.querySelectorAll(itemCollectSelector + " p.gitzip-show");

		self.log("Collect checked items...");
		var treeAjaxItems = [];
		var blobAjaxCollection = [];
		var fileContents = [];
		var infoAjaxItems = [];
		var resolvedUrl = resolveUrl(window.location.href);
		var currentKey = "";

		self.log("Collect blob urls...");

		for(var idx = 0, len = checkedItems.length; idx < len; idx++){
			var item = checkedItems[idx],
				href = item.getAttribute('gitzip-href'),
				type = item.getAttribute('gitzip-type'),
				title = item.getAttribute('gitzip-title');

			infoAjaxItems.push({
				type: type,
				title: title,
				href: href
			});

			// ga
			// var looklink = item.closest("tr").querySelector("td.content a");
			// if(looklink){
			// 	var baseRepo = [resolvedUrl.author, resolvedUrl.project].join("/");
			// 	var githubUrl = looklink.getAttribute("href").substring(1); // ignore slash "/" from begin
			// 	browser.runtime.sendMessage({
			// 		action: "gaTrack",
			// 		baseRepo: baseRepo,
			// 		githubUrl: githubUrl,
			// 		userAction: "collected"
			// 	});
			// }

		}

		// start progress
		browser.runtime
			.sendMessage({action: "getKey"})
			.then(function(key){
				currentKey = key || "";
				var infoUrl = getInfoUrl(resolvedUrl.author, resolvedUrl.project, resolvedUrl.path, resolvedUrl.branch);
				return callAjax(infoUrl, currentKey).then(function(listRes){
					listRes
						.filter(function(item){
							return infoAjaxItems.some(function(info){
								return info.title == item.name && (
									(info.type == 'tree' && item.type == 'dir') || 
									(info.type == 'blob' && item.type == 'file')
								);
							});
						})
						.forEach(function(item){
							if(item.type == "dir"){
								treeAjaxItems.push({ title: item.name, url: item.git_url });
							}else{
								blobAjaxCollection.push({ path: item.name, blobUrl: item.git_url });	
								self.log(item.name + " url fetched.")
							}	
						});
				});
			})
			.then(function(){
				var promises = treeAjaxItems.map(function(item){
					var fetchedUrl = item.url + "?recursive=1";
					return callAjax(fetchedUrl, currentKey).then(function(treeRes){
	     				treeRes.tree.forEach(function(blobItem){
	     					if(blobItem.type == "blob"){
	     						var path = item.title + "/" + blobItem.path;
	     						blobAjaxCollection.push({ path: path, blobUrl: blobItem.url });
	     						self.log(path + " url fetched.");
	     					}
	     				});
					});
				});
				return Promise.all(promises);
			})
			.then(function(){
				self.log("Collect blob contents...");
				var promises = blobAjaxCollection.map(function(item){
		 			var fetchedUrl = item.blobUrl;
		 			return callAjax(fetchedUrl, currentKey).then(function(blobRes){
		 				fileContents.push({ path: item.path, content: blobRes.content });
		 				self.log(item.path + " content has collected.");
		 			});
		 		});
		 		return Promise.all(promises);
			})
			.then(function(){
				self.log("Zip contents and trigger download...");
				return zipContents([resolvedUrl.project].concat(resolvedUrl.path.split('/')).join('-'), fileContents);
			})
			.then(function(){ self.reset(); })
			.catch(function(err){
				console.log(err);
				var message = err.message? err.message : err;
				self.log(message);
				if (message.indexOf("rate limit exceeded") >= 0){
					self.log("<strong style='color:red;'>Please press GitZip extension icon to get token or input your token.</strong>");
				}
				if (message.indexOf("Bad credentials") >= 0){
					self.log("<strong style='color:red;'>Your token has expired, please get token again.</strong>");
				}
			});
	},
	log: function(message){
		this._dashBody.appendChild(document.createTextNode(message));
		this._dashBody.appendChild(document.createElement("br"));
		this._dashBody.scrollTop = this._dashBody.scrollHeight - this._dashBody.clientHeight;
	}
};

function createMark(parent, height, title, type, href){
	if(parent && !parent.querySelector("p.gitzip-check-mark")){
		var checkp = document.createElement('p');

		checkp.setAttribute("gitzip-title", title);
		checkp.setAttribute("gitzip-type", type);
		checkp.setAttribute("gitzip-href", href);
		checkp.className = "gitzip-check-mark";
		checkp.appendChild(document.createTextNode("\u2713"));
		checkp.style.cssText = "line-height:" + height + "px;";
		
		parent.appendChild(checkp);
	}
}

function checkHaveAnyCheck(){
	var checkItems = document.querySelectorAll(itemCollectSelector + " p.gitzip-show");
	return checkItems.length? checkItems : false;
}

function onItemDblClick(e){
	var markTarget = e.target.closest(".js-navigation-item").querySelector('p.gitzip-check-mark');
	if(markTarget) markTarget.classList.toggle("gitzip-show");
	!!checkHaveAnyCheck()? Pool.show() : Pool.hide();
}

function hookItemEvents(){
	
	// show icon in every github page.
	showGitzipIcon();

	function appendToIcons(){
		var items = document.querySelectorAll(itemCollectSelector);
		var itemLen = items.length;
		if(itemLen){
			for(var i = 0; i < itemLen; i++){
				var item = items[i],					
					link = item.querySelector("a[href]"),
					blob = item.querySelector(".octicon-file-text, .octicon-file"),
					tree = item.querySelector(".octicon-file-directory");
				
				if(!item._hasBind && link && (tree || blob)){
					createMark(
						item, 
						item.offsetHeight, 
						link.textContent, 
						tree? "tree" : "blob", 
						link.href
					);
					item.addEventListener("dblclick", onItemDblClick);
					item._hasBind = true;
				}
			}
		}
	}

	var lazyCaseObserver = null;
	var repoContent = document.querySelector(".repository-content");
	var lazyElement = repoContent ? repoContent.querySelector(".js-navigation-container") : null;

	if(lazyElement){
		// lazy case
		lazyCaseObserver = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				var addNodes = mutation.addedNodes;
				addNodes && addNodes.length && addNodes.forEach(function(el){
					if(el.classList && (el.classList.contains("js-details-container") || el.classList.contains("js-navigation-container"))){
						appendToIcons();
						lazyCaseObserver.disconnect();
						lazyCaseObserver = null;
					}
				});
			});    
		});
		lazyCaseObserver.observe(repoContent, { childList: true, subtree: true } );
	} 

	if (document.querySelector(itemCollectSelector)) {
		appendToIcons();	
	}

	Pool.init();
}

// pjax detection
function hookMutationObserver(){
	// select the target node
	var target = document.querySelector("*[data-pjax-container]");
	
	// create an observer instance
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			var addNodes = mutation.addedNodes;
			if(addNodes && addNodes.length) hookItemEvents();
		});    
	});
	 
	// pass in the target node, as well as the observer options
	target && observer.observe(target, { childList: true } );
	 
	// later, you can stop observing
	// observer.disconnect();
}

// Property run_at is "document_end" as default in Content Script
// refers: https://developer.chrome.com/extensions/content_scripts
hookMutationObserver();
hookItemEvents();
