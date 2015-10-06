/* This file is licensed under the Affero General Public License. */

/*global $, airborn, bar */

var powerMenu;

var togglePowerMenu = document.createElement('input');
togglePowerMenu.id = 'togglePowerMenu';
togglePowerMenu.className = 'barButton';
togglePowerMenu.type = 'image';
togglePowerMenu.alt = 'Log Out…';
airborn.fs.prepareUrl('/Core/power.png', {rootParent: '/'}, function(url) {
	togglePowerMenu.src = url;
	togglePowerMenu.addEventListener('load', function() {
		bar.updateWidth();
	});
});
togglePowerMenu.addEventListener('click', function() {
	$(powerMenu).toggle();
});
bar.addItem(togglePowerMenu);

powerMenu = document.createElement('div');
powerMenu.id = 'powerMenu';
powerMenu.className = 'barMenu';
var logout = document.createElement('div');
logout.tabIndex = '0';
logout.textContent = 'Log Out';
logout.addEventListener('click', function() {
	airborn.core.logout();
});
powerMenu.appendChild(logout);
document.body.appendChild(powerMenu);

document.documentElement.addEventListener('click', function(evt) {
	if(evt.target !== powerMenu && evt.target !== togglePowerMenu) $(powerMenu).hide();
});