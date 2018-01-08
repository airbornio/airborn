/* This file is licensed under the Affero General Public License. */

/*global apps, getName: true, getIconUrl: true, powerMenu, airborn, airborn_localStorage, showProgress: true, setProgress: true, hideProgress: true, openWindow: true, openTab: true */

var deviceType = window.matchMedia('only screen and (max-device-width: 640px)').matches ? 'mobile' : 'desktop';

var childDiv;
var childTabs = [];
var childWindows = [];
var childWindowsTabs = new Map();


window.addEventListener('message', function(message) {
	var tab = childWindowsTabs.get(message.source);
	if(tab) {
		if(message.data.action.substr(0, 3) === 'wm.') {
			var options;
			if(message.data.action === 'wm.focus') {
			} else if(message.data.action === 'wm.reportClicked') {
				apps.classList.remove('shown');
				powerMenu.classList.remove('shown');
			} else if(message.data.action === 'wm.setTitle') {
				var title = message.data.args[0] || getName(tab.manifest);
				tab.tabtitlebar.querySelector('.title').textContent = tab.title = title;
				tab.querySelector('iframe').name = title; // Webkit Developer Tools hint.
				if(tab.classList.contains('focused')) airborn.core.setTitle(title);
				updateDummyTabs();
			} else if(message.data.action === 'wm.setIcon') {
			} else if(message.data.action === 'wm.openFile') {
			} else if(message.data.action === 'wm.openWindow') {
				window.openTab.apply(window, message.data.args);
			} else if(message.data.action === 'wm.showProgress' || message.data.action === 'wm.setProgress' || message.data.action === 'wm.hideProgress') {
				options = {
					loaderElm: tab.tabtitlebar.querySelector('.loader')
				};
				window[message.data.action.substr(3)].apply(window, message.data.args.concat(options));
			} else {
				throw 'unknown action';
			}
		} else {
			throw 'unknown action';
		}
	}
}, false);

showProgress = function(options) {
	if(!options.loaderElm) return;
	options.loaderElm.progressFrac = 0;
	setProgress(0.1, options);
};
setProgress = function(frac, options) {
	if(!options.loaderElm) return;
	if(options.loaderElm.progressFrac >= frac) return;
	options.loaderElm.style.backgroundColor = 'rgba(77, 164, 213, .5)';
	options.loaderElm.style.width = frac * 100 + '%';
	options.loaderElm.progressFrac = frac;
};
hideProgress = function(options) {
	if(!options.loaderElm) return;
	options.loaderElm.style.width = '';
};

getName = function(manifest) {
	var name;
	if(manifest.locales) {
		(navigator.languages || [navigator.language]).some(function(lang) {
			return (name = manifest.locales[lang] && manifest.locales[lang].name || lang === manifest.default_locale && manifest.name);
		});
	}
	return name || manifest.name;
};

var appIconSize = (deviceType === 'mobile' ? 32 : 64) * (window.devicePixelRatio || 1);
getIconUrl = function(icons) {
	if(!icons) return;
	return icons[Object.keys(icons).sort(function(a, b) {
		if(a >= appIconSize && b >= appIconSize) return a - b;
		return b - a;
	})[0]];
};

openWindow = function() {
	var div = document.createElement('div');
	div.className = 'window';
	
	var titlebarDiv = document.createElement('div');
	titlebarDiv.className = 'titlebar';
	div.appendChild(titlebarDiv);
	
	var tabs = document.createElement('div');
	tabs.className = 'tabs';
	div.appendChild(tabs);
	
	var tabbar = document.createElement('div');
	tabbar.className = 'tabbar';
	tabbar.addEventListener('mousedown', function(evt) {
		evt.stopPropagation();
	});
	titlebarDiv.appendChild(tabbar);
	
	var addtab = document.createElement('div');
	addtab.textContent = '+';
	addtab.className = 'addtab';
	addtab.addEventListener('click', function() {
		openTab(div.querySelector('.tab.focused').path);
	});
	titlebarDiv.appendChild(addtab);
	
	document.body.appendChild(div);
	
	childDiv = div;
};

openTab = function(path, options) {
	if(!options) options = {};
	
	var div = childDiv;
	
	var tabs = div.querySelector('.tabs');
	
	var tab = document.createElement('div');
	tab.className = 'tab';
	tabs.appendChild(tab);
	
	tab.path = path;
	
	var tabbar = div.querySelector('.tabbar');
	
	var tabtitlebar = document.createElement('div');
	tabtitlebar.className = 'tabtitlebar';
	tabtitlebar.addEventListener('mousedown', function() {
		switchTab(tabtitlebar.tab);
	});
	tabtitlebar.addEventListener(navigator.userAgent.includes('Firefox') ? 'click' : 'mousedown', function(evt) {
		focusTab(tabtitlebar.tab);
		evt.preventDefault(); // Prevent focus from leaving iframe.
	});
	tabtitlebar.tab = tab;
	tab.tabtitlebar = tabtitlebar;
	tabbar.insertBefore(tabtitlebar, options.after && options.after.tabtitlebar.nextSibling);
	
	childTabs.splice(options.after ? childTabs.indexOf(options.after) + 1 : childTabs.length, 0, tab);
	
	airborn.fs.getFile(path + 'manifest.webapp', function(manifest) {
		
		manifest = manifest ? JSON.parse(manifest.replace(/^\uFEFF/, '')) : {};
		
		var icon = document.createElement('img');
		icon.className = 'icon';
		var iconUrl = getIconUrl(manifest.icons);
		if(iconUrl) {
			airborn.fs.prepareUrl(iconUrl, {relativeParent: path, rootParent: path}, function(url) {
				icon.src = url;
			});
		}
		tabtitlebar.appendChild(icon);
		
		var title = document.createElement('span');
		title.className = 'title';
		title.textContent = tab.title = getName(manifest); // This element needs at least a nbsp
		tabtitlebar.appendChild(title);
		
		var titleloader = document.createElement('div');
		titleloader.className = 'loader';
		tabtitlebar.appendChild(titleloader);
		
		tab.manifest = manifest;
		
		tab.dummy = options.dummy;
		updateDummyTabs();
		
		if(options.dummy) {
			tabtitlebar.addEventListener('mousedown', function() {
				tab.tabtitlebar.style.display = 'none';
				openTab(path, {after: tab});
			});
		} else {
			loadTab(path, options, tab);
			
			switchTab(tab);
			
			if(!options.after) {
				tabbar.scrollLeft = tabbar.scrollWidth;
				
				icon.addEventListener('load', function() {
					tabbar.scrollLeft = tabbar.scrollWidth;
				});
			}
			
			airborn_localStorage.lastApp = path;
		}
	});
};

function loadTab(path, options, tab) {
	var manifest = tab.manifest;
	
	var launch_path = manifest.launch_path ? manifest.launch_path.replace(/^\//, '') : path.match(/[^/]+(?=\/$)/)[0] + '.html';
	var _path = path + launch_path;
	var appData = path.replace('Apps', 'AppData');
	
	var csp = manifest.csp || "default-src *; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'";
	if(csp.indexOf('-src ') !== -1) csp = csp.replace(/-src /g, '-src data: ');
	else csp = 'default-src data:; ' + csp;
	var storageLocations = {
		apps: '/Apps/',
		music: '/Music/',
		pictures: '/Pictures/',
		sdcard: '/Documents/',
		system: '/Core/',
		videos: '/Videos/'
	};
	var appName = (_path.match('/Apps/(.+?)/') || [])[1];
	var permissions = {
		read: [path, appData].concat(Object.keys(manifest.permissions || {}).filter(function(permission) {
			return storageLocations[permission.replace('device-storage:', '')] && ['readonly', 'readwrite', 'readcreate'].indexOf(manifest.permissions[permission].access) !== -1;
		}).map(function(permission) {
			return storageLocations[permission.replace('device-storage:', '')];
		})),
		write: [appData].concat(Object.keys(manifest.permissions || {}).filter(function(permission) {
			return storageLocations[permission.replace('device-storage:', '')] && ['readwrite', 'readcreate', 'createonly'].indexOf(manifest.permissions[permission].access) !== -1;
		}).map(function(permission) {
			return storageLocations[permission.replace('device-storage:', '')];
		})),
		manageApps: (manifest.permissions || {})['webapps-manage'],
		appName: appName,
		urlArgs: appName,
		getObjectLocations: (manifest.permissions || {})['get-object-locations'],
	};
	airborn.fs.prepareUrl(options.path || '/', {rootParent: path, relativeParent: _path, permissions: permissions, csp: csp, appData: appData}, function(url) {
		var iframe = document.createElement('iframe');
		iframe.sandbox = 'allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox';
		iframe.setAttribute('allowfullscreen', 'true');
		iframe.src = url;
		iframe.name = path; // Webkit Developer Tools hint.
		tab.appendChild(iframe);
		
		childWindows.push(iframe.contentWindow);
		childWindowsTabs.set(iframe.contentWindow, tab);
		
		focusTab(tab);
	});
}

function updateDummyTabs() {
	childTabs.forEach(function(tab, i) {
		if(tab.dummy) {
			var nextTab = childTabs[i + 1];
			tab.tabtitlebar.style.display = nextTab && nextTab.path === tab.path && nextTab.title === tab.title ? 'none' : '';
		}
	});
}


openWindow();

openTab('/Apps/firetext/', {dummy: true});
openTab('/Apps/strut/', {dummy: true});

var hashArgumentOpenApp = airborn.top_location.hash.match(/[#&;]open=([^&;]+)/);
var firstApp =
	hashArgumentOpenApp ? '/Apps/' + hashArgumentOpenApp[1].replace(/[./]/g, '') + '/' :
	airborn_localStorage.lastApp ||
	'/Apps/firetext/';
openTab(firstApp, {after: firstApp === '/Apps/firetext/' ? childTabs[0] : null});


function switchTab(tab) {
	childDiv.querySelectorAll('.tabs .tab.focused, .tabtitlebar.focused').forEach(elm => elm.classList.remove('focused'));
	tab.classList.add('focused');
	tab.tabtitlebar.classList.add('focused');
	airborn.core.setTitle(tab.tabtitlebar.textContent.replace('\u00a0', ''));
}

function focusTab(tab) {
	tab.querySelector('iframe').focus();
}

window.addEventListener('scroll', function() {
	window.scrollTo(0, 0);
});