var toggleAppsContainer = document.createElement('div');
toggleAppsContainer.className = 'loaderContainer';
var toggleApps = document.createElement('button');
toggleApps.textContent = 'apps';
toggleApps.addEventListener('click', function(evt) {
	$(apps).toggle();
	evt.stopPropagation();
});
toggleAppsContainer.appendChild(toggleApps);
var toggleAppsLoader = document.createElement('div');
toggleAppsLoader.className = 'loader';
toggleAppsContainer.appendChild(toggleAppsLoader);
document.body.appendChild(toggleAppsContainer);

var apps = document.createElement('div');
apps.className = 'apps';
getFile('/Apps/', {codec: 'dir'}, function(contents) {
	$.each(contents, function(line, attrs) {
		if(line.substr(-9) !== '.history/') {
			var app = document.createElement('div');
			app.className = 'app';
			app.textContent = line.substr(0, line.length - 1);
			app.addEventListener('click', function() {
				openWindow('/Apps/' + line, {
					originDiv: $('.window.focused')[0],
					loaderElm: toggleAppsLoader
				});
			});
			apps.appendChild(app);
		}
	});
});
document.body.appendChild(apps);

document.documentElement.addEventListener('click', function(evt) {
	if(evt.target !== apps) $(apps).hide();
});