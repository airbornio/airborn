/* This file is licensed under the Affero General Public License. */

/*global airborn */

var apps = document.createElement('div');
apps.id = 'apps';
document.body.appendChild(apps);

loadApps();

document.body.addEventListener('click', function(evt) {
	var app = evt.target;
	if(!app) return;
	while(app.className !== 'app') {
		app = app.parentElement;
		if(!app || app.parentElement === app) return;
	}
	airborn.wm.openWindow(app.title, {}, null); // No originDiv, please.
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
					var name = manifest.name || line[0].toUpperCase() + line.substr(1, line.length - 2);
					var icon = manifest.icons && (manifest.icons['64'] || manifest.icons['128'] || manifest.icons['256'] || manifest.icons['512']);
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
				icon.src = props.iconUrl || ''; // Work around compat error.
				app.insertBefore(icon, app.firstChild);
				app.tabIndex = '0';
				app.title = '/Apps/' + props.path;
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

/* jshint ignore:start *//* jscs: disable */
Array.prototype.alphanumSort = function(caseInsensitive) {
	for (var z = 0, t; t = this[z]; z++) {
		this[z] = [];
		var x = 0, y = -1, n = 0, i, j;
		
		while (i = (j = t.charAt(x++)).charCodeAt(0)) {
			var m = (i == 46 || (i >=48 && i <= 57));
			if (m !== n) {
			this[z][++y] = "";
			n = m;
			}
			this[z][y] += j;
		}
	}
	
	this.sort(function(a, b) {
		for (var x = 0, aa, bb; (aa = a[x]) && (bb = b[x]); x++) {
			if (caseInsensitive) {
			aa = aa.toLowerCase();
			bb = bb.toLowerCase();
			}
			if (aa !== bb) {
			var c = Number(aa), d = Number(bb);
			if (c == aa && d == bb) {
				return c - d;
			} else return (aa > bb) ? 1 : -1;
			}
		}
		return a.length - b.length;
	});
	
	for (var z = 0; z < this.length; z++)
	this[z] = this[z].join("");
};
/* jshint ignore:end *//* jscs: enable */