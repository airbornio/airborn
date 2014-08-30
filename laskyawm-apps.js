var toggleAppsContainer = document.createElement('div');
toggleAppsContainer.className = 'loaderContainer';
var toggleApps = document.createElement('button');
toggleApps.textContent = 'apps';
toggleApps.addEventListener('click', function(evt) {
	$(apps).toggle();
});
toggleAppsContainer.appendChild(toggleApps);
var toggleAppsLoader = document.createElement('div');
toggleAppsLoader.className = 'loader';
toggleAppsContainer.appendChild(toggleAppsLoader);
document.body.appendChild(toggleAppsContainer);

var apps = document.createElement('div');
apps.className = 'apps';
document.body.appendChild(apps);

loadApps(function(fragment) {
	apps.appendChild(fragment);
});

function loadApps(callback) {
	var fragment = document.createDocumentFragment();
	getFile('/Apps/', {codec: 'dir'}, function(contents) {
		var total = 0, done = 0, apps = {};
		Object.keys(contents).forEach(function(line) {
			if(line.substr(-9) !== '.history/') {
				total++;
				getFile('/Apps/' + line + 'manifest.webapp', function(manifest) {
					manifest = manifest ? JSON.parse(manifest.replace(/^\uFEFF/, '')) : {};
					var name = manifest.name || line[0].toUpperCase() + line.substr(1, line.length - 2);
					if(manifest.icons) {
						prepareUrl(manifest.icons[Math.min.apply(Math, Object.keys(manifest.icons))], {relativeParent: '/Apps/' + line, rootParent: '/Apps/' + line}, function(url) {
							apps[line] = {name: name, path: line, iconUrl: url};
							maybeCont();
						});
					} else {
						apps[line] = {name: name, path: line, iconUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}; // Blank gif
						maybeCont();
					}
				});
			}
		});
		function maybeCont() {
			if(++done === total) cont();
		}
		function cont() {
			var keys = Object.keys(apps);
			keys.alphanumSort();
			keys.forEach(function(key) {
				var props = apps[key];
				var app = document.createElement('div');
				app.className = 'app';
				app.textContent = props.name;
				var icon = document.createElement('img');
				icon.src = props.iconUrl;
				app.insertBefore(icon, app.firstChild);
				app.tabIndex = '0';
				app.title = '/Apps/' + props.path;
				app.addEventListener('click', click);
				app.addEventListener('keypress', function(evt) {
					if(evt.which === 13) {
						click();
						$(apps).hide();
					}
				});
				function click() {
					openWindow('/Apps/' + props.path, {
						originDiv: $('.window.focused')[0],
						loaderElm: toggleAppsLoader
					});
				}
				fragment.appendChild(app);
			});
			callback(fragment);
		}
	});
}

function reload() {
	loadApps(function(fragment) {
		apps.innerHTML = '';
		apps.appendChild(fragment);
	});
}

listenForFileChanges(function(path, reason) {
	if(path === '/Apps/') reload();
});

document.documentElement.addEventListener('click', function(evt) {
	if(evt.target !== apps && evt.target !== toggleApps) $(apps).hide();
});