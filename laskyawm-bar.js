/* This file is licensed under the Affero General Public License. */

(function(){
	// Add namespace
	window.bar = {};
	
	// Add bar
	var barElement = document.createElement('div');
	barElement.id = 'bar';
	document.body.appendChild(barElement);

	// Add icon panel
	var barIcons = document.createElement('div');
	barIcons.id = 'bar-icons';
	barElement.appendChild(barIcons);
	
	bar.addItem = function (node) {
		$(barIcons).append(node);		
	}
	
	bar.removeItem = function (node) {
		barIcons.removeChild(node);		
	}
})(window);
