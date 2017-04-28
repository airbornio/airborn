/* This file is licensed under the Affero General Public License. */

/*global deviceType */

(function() {
	// Don't show clock on mobile
	if(deviceType === 'mobile') {
		return;
	}
	
	// Create clock widget
	var clock = document.createElement('span');
	clock.id = 'barClock';
	updateTime();
	
	// Add to bar
	window.bar.addItem(clock);
	
	// Prevent freeze
	var updateTimeout;
	
	function updateTime() {
		// Clear timeout
		clearTimeout(updateTimeout);
		
		// Get time
		var currentTime = new Date();
		clock.textContent = currentTime.toLocaleTimeString(navigator.languages || navigator.language, {hour: 'numeric', minute: 'numeric'}).replace(/(:..):../, '$1');
		
		// Keep up-to-date
		updateTimeout = setTimeout(updateTime, 60000 - (currentTime.getSeconds() * 1000) - currentTime.getMilliseconds());
	}
})();