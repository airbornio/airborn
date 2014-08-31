var togglePowerMenu = document.createElement('input');
togglePowerMenu.id = 'togglePowerMenu';
togglePowerMenu.className = 'barButton';
togglePowerMenu.type = 'image';
togglePowerMenu.alt = 'Log Out…';
prepareUrl('/Core/power.png', {rootParent: '/'}, function(url) {
	togglePowerMenu.src = url;
});
togglePowerMenu.addEventListener('click', function(evt) {
	$(powerMenu).toggle();
});
document.body.appendChild(togglePowerMenu);

var powerMenu = document.createElement('div');
powerMenu.id = 'powerMenu';
powerMenu.className = 'barMenu';
var logout = document.createElement('div');
logout.tabIndex = '0';
logout.textContent = 'Log Out';
logout.addEventListener('click', function(evt) {
	window.parent.postMessage({action: 'core.logout', args: []}, '*');
});
powerMenu.appendChild(logout);
document.body.appendChild(powerMenu);

document.documentElement.addEventListener('click', function(evt) {
	if(evt.target !== powerMenu && evt.target !== togglePowerMenu) $(powerMenu).hide();
});