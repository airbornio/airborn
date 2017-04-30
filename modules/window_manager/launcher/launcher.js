/* This file is licensed under the Affero General Public License. */

/*global $, airborn, openWindow, deviceType */

var appIconSize = (deviceType === 'mobile' ? 32 : 64) * (window.devicePixelRatio || 1);
function getIconUrl(icons) {
	if(!icons) return;
	return icons[Object.keys(icons).sort(function(a, b) {
		if(a >= appIconSize && b >= appIconSize) return a - b;
		return b - a;
	})[0]];
}

var toggleApps = document.createElement('div');
toggleApps.id = 'toggleApps';
toggleApps.className = 'barButton';
toggleApps.textContent = 'Apps';
toggleApps.tabIndex = '0';
toggleApps.addEventListener('click', function() {
	$(sidebar).toggle();
	updateLauncherUI();
});
toggleApps.addEventListener('keypress', function(evt) {
	if(evt.which === 13 || evt.which === 32) {
		$(sidebar).toggle();
		updateLauncherUI();
	}
});
document.body.appendChild(toggleApps);

var sidebar = document.createElement('div');
sidebar.id = 'sidebar';
$(sidebar).hide();
updateLauncherUI();
document.body.appendChild(sidebar);

loadApps();

document.body.addEventListener('click', function(evt) {
	var app = evt.target;
	if(!app) return;
	while(app.className !== 'app') {
		app = app.parentElement;
		if(!app || app.parentElement === app) return;
	}
	openWindow(app.dataset.path, {
		originDiv: $('.window.focused')[0]
	});
});
document.body.addEventListener('keypress', function(evt) {
	if(evt.which !== 13) return;
	var app = evt.target;
	if(!app) return;
	while(app.className !== 'app') {
		app = app.parentElement;
		if(!app || app.parentElement === app) return;
	}
	app.click();
	$(sidebar).hide();
	updateLauncherUI();
});

function updateSidebarHeight() {
	sidebar.style.height = window.innerHeight - 25;
}
updateSidebarHeight();
window.addEventListener('resize', updateSidebarHeight);

function loadApps() {
	var fragment = document.createDocumentFragment();
	airborn.fs.getFile('/Apps/', {codec: 'dir'}, function(contents) {
		var total = 0, done = 0, allApps = {};
		Object.keys(contents).forEach(function(line) {
			if(line.substr(-9) !== '.history/') {
				total++;
				airborn.fs.getFile('/Apps/' + line + 'manifest.webapp', function(manifest) {
					manifest = manifest ? JSON.parse(manifest.replace(/^\uFEFF/, '')) : {};
					var name;
					if(manifest.locales) {
						(navigator.languages || [navigator.language]).some(function(lang) {
							return (name = manifest.locales[lang] && manifest.locales[lang].name || lang === manifest.default_locale && manifest.name);
						});
					}
					name = name || manifest.name || line[0].toUpperCase() + line.substr(1, line.length - 2);
					var icon = getIconUrl(manifest.icons);
					if(icon) {
						airborn.fs.prepareUrl(icon, {relativeParent: '/Apps/' + line, rootParent: '/Apps/' + line}, function(url) {
							allApps[line] = {name: name, path: line, iconUrl: url};
							maybeCont();
						});
					} else {
						allApps[line] = {name: name, path: line};
						maybeCont();
					}
				});
			}
		});
		function maybeCont() {
			if(++done === total) cont();
		}
		function cont() {
			var keys = Object.keys(allApps);
			keys.alphanumSort();
			keys.forEach(function(key) {
				var props = allApps[key];
				var app = document.createElement('div');
				app.className = 'app';
				app.textContent = props.name.replace(/ /g, '\u00a0');
				var icon = document.createElement('img');
				icon.src = props.iconUrl || '';
				app.insertBefore(document.createElement('br'), app.firstChild);
				app.insertBefore(icon, app.firstChild);
				app.tabIndex = '0';
				app.title = props.name;
				app.dataset.path = '/Apps/' + props.path;
				fragment.appendChild(app);
			});
			sidebar.innerHTML = '';
			sidebar.appendChild(fragment);
		}
	});
}

airborn.fs.listenForFileChanges('/Apps/', function(path) {
	if(path === '/Apps/') loadApps();
});

document.documentElement.addEventListener('click', function(evt) {
	if(evt.target !== sidebar && evt.target !== toggleApps) {
		$(sidebar).hide();
		updateLauncherUI();
	}
});

function updateLauncherUI() {
	if ($(sidebar).is(":hidden")) {
		$('#windows').removeClass('launcher-active');
		$('#toggleApps').removeClass('launcher-active');
	} else {
		$('#windows').addClass('launcher-active');
		$('#toggleApps').addClass('launcher-active');
	}
}