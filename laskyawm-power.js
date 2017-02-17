/* This file is licensed under the Affero General Public License. */

/*global $, airborn, deviceType, bar */

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
['Plans', 'Feedback'].forEach(function(page) {
	var link = document.createElement('div');
	link.tabIndex = '0';
	link.textContent = page;
	if(deviceType === 'desktop') {
		link.style.borderBottom = '1px solid #aaa';
		link.style.paddingBottom = '5px';
		link.style.marginBottom = '6px';
	}
	link.addEventListener('click', function() {
		window.open(airborn.top_location.origin + '/' + page.toLowerCase());
	});
	powerMenu.appendChild(link);
});
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

if(airborn.top_location.pathname === '/demo') {
	var register = document.createElement('div');
	register.tabIndex = '0';
	register.textContent = 'Register';
	register.addEventListener('click', function() {
		window.open(airborn.top_location.origin + '/register');
	});
	if(deviceType === 'mobile') {
		powerMenu.insertBefore(register, powerMenu.firstChild);
	} else {
		register.style.cursor = 'pointer';
		register.style.textDecoration = 'underline';
		register.style.marginLeft = '10px';
		bar.addItem(register);
	}
}