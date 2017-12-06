/* This file is licensed under the Affero General Public License. */

/*global airborn, openTab, getName, getIconUrl */

var apps;

var toggleApps = document.createElement('div');
toggleApps.id = 'toggleApps';
toggleApps.className = 'barButton';
toggleApps.textContent = 'Apps';
toggleApps.tabIndex = '0';
toggleApps.addEventListener('click', function() {
	apps.classList.toggle('shown');
});
toggleApps.addEventListener('keypress', function(evt) {
	if(evt.which === 13 || evt.which === 32) {
		apps.classList.toggle('shown');
	}
});
document.body.appendChild(toggleApps);

apps = document.createElement('div');
apps.id = 'apps';
apps.className = 'barMenu';
apps.textContent = 'Loading…';
document.body.appendChild(apps);

loadApps();

document.body.addEventListener('click', function(evt) {
	var app = evt.target;
	if(!app) return;
	while(app.className !== 'app') {
		app = app.parentElement;
		if(!app || app.parentElement === app) return;
	}
	openTab(app.dataset.path);
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
	apps.classList.remove('shown');
});

function loadApps() {
	var fragment = document.createDocumentFragment();
	airborn.fs.getFile('/Apps/', {codec: 'dir'}, function(contents) {
		var total = 0, done = 0, allApps = {};
		Object.keys(contents).forEach(function(line) {
			if(line.substr(-9) !== '.history/') {
				total++;
				airborn.fs.getFile('/Apps/' + line + 'manifest.webapp', function(manifest) {
					manifest = manifest ? JSON.parse(manifest.replace(/^\uFEFF/, '')) : {};
					var name = getName(manifest);
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
			Object.keys(allApps).sort().forEach(function(key) {
				var props = allApps[key];
				var app = document.createElement('div');
				app.className = 'app';
				app.textContent = props.name.replace(/ /g, '\u00a0');
				var icon = document.createElement('img');
				icon.src = props.iconUrl || '';
				app.insertBefore(icon, app.firstChild);
				app.tabIndex = '0';
				app.title = props.name;
				app.dataset.path = '/Apps/' + props.path;
				fragment.appendChild(app);
			});
			apps.innerHTML = '';
			apps.appendChild(fragment);
		}
	});
}

airborn.fs.listenForFileChanges('/Apps/', function(path) {
	if(path === '/Apps/') loadApps();
});

document.documentElement.addEventListener('click', function(evt) {
	if(evt.target !== apps && evt.target !== toggleApps) apps.classList.remove('shown');
});