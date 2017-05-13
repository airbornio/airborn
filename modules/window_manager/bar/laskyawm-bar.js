/* This file is licensed under the Affero General Public License. */

/*global $ */

(function() {
	// Add namespace
	var bar = window.bar = {};
	
	// Add bar
	var barElement = document.createElement('div');
	barElement.id = 'bar';
	document.body.appendChild(barElement);
	
	// Add icon panel
	var barIcons = window.barIcons = document.createElement('div');
	barIcons.id = 'barIcons';
	barElement.appendChild(barIcons);
	
	bar.addItem = function(node) {
		$(barIcons).append(node);
		bar.updateWidth();
	};
	
	bar.removeItem = function(node) {
		barIcons.removeChild(node);
		bar.updateWidth();
	};
	
	bar.updateWidth = function() {
		window.barIconsWidth = barIcons.offsetWidth;
	};
	
	bar.updateWidth();
})(window);