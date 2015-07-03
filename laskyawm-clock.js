/* This file is licensed under the Affero General Public License. */

(function(){
	// Create clock widget
	var clock = document.createElement('span');
	clock.id = "bar-clock";
	updateTime();
	
	// Add to bar
	bar.addItem(clock);

	// Prevent freeze
	var updateTimeout;
	
	function updateTime() {
		// Clear timeout
		clearTimeout(updateTimeout);
		
		// Get time
		var currentTime = new Date();
		clock.textContent = currentTime.toLocaleTimeString(navigator.language,{hour:"numeric",minute:"numeric"});

		// Keep up-to-date
		updateTimeout = setTimeout(updateTime,(60000-(currentTime.getSeconds()*1000)-currentTime.getMilliseconds()));
	}
})();
