/* This file is licensed under the Affero General Public License. */

/*global deviceType */
(function() {
	// Don't show on mobile
	if(deviceType === 'mobile') {
		return;
	}

	// Create clock widget
	var fsbutton = document.createElement('span');
	fsbutton.id = 'barFullscreen';
	fsbutton.textContent = "Fullscreen";

	// Handle clicks
	fsbutton.addEventListener("click",fs);

	// Add to bar
	window.bar.addItem(fsbutton);

	// Fullscreen functions
	var html = document.getElementsByTagName('html')[0];
	function fs(enter) {
		if (enter === true ||
					enter != false &&
					!html.classList.contains('fullscreen')) {	// current working methods
			// Make app fullscreen
			if (html.requestFullscreen) {
				html.requestFullscreen();
			} else if (html.mozRequestFullScreen) {
				html.mozRequestFullScreen();
			} else if (html.webkitRequestFullscreen) {
				html.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			// Exit fullscreen
			if (document.cancelFullScreen) {
				document.cancelFullScreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
		}
	}

	function onFullScreenChange() {
		if (
			document.fullscreenElement ||
			document.mozFullScreenElement ||
			document.webkitFullscreenElement
		) {
			html.classList.add('fullscreen');
			fsbutton.textContent = "Close fullscreen";
		} else {
			html.classList.remove('fullscreen');
			fsbutton.textContent = "Fullscreen";
		}
	}

	function onFullScreenError() {
		alert('Could not enter into fullscreen.');
	}

	document.addEventListener('fullscreenchange', onFullScreenChange);
	document.addEventListener('mozfullscreenchange', onFullScreenChange);
	document.addEventListener('webkitfullscreenchange', onFullScreenChange);

	document.addEventListener('fullscreenerror', onFullScreenError);
	document.addEventListener('mozfullscreenerror', onFullScreenError);
	document.addEventListener('webkitfullscreenerror', onFullScreenError);
})();
