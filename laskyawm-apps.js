/*global $, getFile, prepareUrl, openWindow, listenForFileChanges */

var apps;

var toggleApps = document.createElement('div');
toggleApps.id = 'toggleApps';
toggleApps.className = 'barButton';
toggleApps.textContent = 'Apps';
toggleApps.tabIndex = '0';
toggleApps.addEventListener('click', function() {
	$(apps).toggle();
});
toggleApps.addEventListener('keypress', function(evt) {
	if(evt.which === 13 || evt.which === 32) {
		$(apps).toggle();
	}
});
document.body.appendChild(toggleApps);

apps = document.createElement('div');
apps.id = 'apps';
apps.className = 'barMenu';
apps.textContent = 'Loading…';
document.body.appendChild(apps);

var sidebar = document.createElement('div');
sidebar.id = 'sidebar';
document.body.appendChild(sidebar);

loadApps();

document.body.addEventListener('click', function(evt) {
	var app = evt.target;
	if(!app) return;
	while(app.className !== 'app') {
		app = app.parentElement;
		if(!app || app.parentElement === app) return;
	}
	openWindow(app.title, {
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
	$(apps).hide();
});

function updateSidebarHeight() {
	sidebar.style.height = window.innerHeight - 25;
}
updateSidebarHeight();
window.addEventListener('resize', updateSidebarHeight);

function loadApps() {
	var fragment = document.createDocumentFragment();
	getFile('/Apps/', {codec: 'dir'}, function(contents) {
		var total = 0, done = 0, allApps = {};
		Object.keys(contents).forEach(function(line) {
			if(line.substr(-9) !== '.history/') {
				total++;
				getFile('/Apps/' + line + 'manifest.webapp', function(manifest) {
					manifest = manifest ? JSON.parse(manifest.replace(/^\uFEFF/, '')) : {};
					var name = manifest.name || line[0].toUpperCase() + line.substr(1, line.length - 2);
					var icon = manifest.icons && (manifest.icons['64'] || manifest.icons['128'] || manifest.icons['256'] || manifest.icons['512']);
					if(icon) {
						prepareUrl(icon, {relativeParent: '/Apps/' + line, rootParent: '/Apps/' + line}, function(url) {
							allApps[line] = {name: name, path: line, iconUrl: url};
							maybeCont();
						});
					} else {
						allApps[line] = {name: name, path: line, iconUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}; // Blank gif
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
				icon.src = props.iconUrl;
				app.insertBefore(icon, app.firstChild);
				app.tabIndex = '0';
				app.title = '/Apps/' + props.path;
				fragment.appendChild(app);
			});
			apps.innerHTML = '';
			apps.appendChild(fragment.cloneNode(true));
			sidebar.innerHTML = '';
			sidebar.appendChild(fragment);
		}
	});
}

listenForFileChanges(function(path) {
	if(path === '/Apps/') loadApps();
});

document.documentElement.addEventListener('click', function(evt) {
	if(evt.target !== apps && evt.target !== toggleApps) $(apps).hide();
});