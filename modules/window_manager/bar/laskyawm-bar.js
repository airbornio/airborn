/* This file is licensed under the Affero General Public License. */

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
		barIcons.appendChild(node);
		bar.updateWidth();
	};
	
	bar.removeItem = function(node) {
		barIcons.removeChild(node);
		bar.updateWidth();
	};
	
	bar.updateWidth = function() {
		document.body.style.setProperty('--bar-icons-width', barIcons.offsetWidth + 'px');
	};
	
	bar.updateWidth();
})(window);