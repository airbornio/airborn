/* This file is licensed under the Affero General Public License. */

/*global GET, decryptAndMaybeUngzip, sjcl, files_hmac, files_key, getFile */

GET('object/' + sjcl.codec.hex.fromBits(files_hmac.mac('/Core/modules/core/core.js')), function(response) {
	window.eval(decryptAndMaybeUngzip(files_key, response));
	
	getFile('/Core/modules/startup/startup.js', function(contents) {
		window.eval(contents);
	});
	
	getFile('/Core/modules/startup/loader.js', function(contents) {
		window.eval(contents);
		
		var container = document.getElementById('container');
		if(container) container.parentElement.removeChild(container);
		var iframe = document.getElementsByTagName('iframe')[0];
		if(iframe && iframe.getAttribute('src') === 'content') iframe.parentElement.removeChild(iframe);
	});
});

var loginButton = document.getElementById('login');
if(loginButton) {
	loginButton.disabled = true;
	if(window.lang && window.lang.loggingIn) {
		loginButton.value = window.lang.loggingIn;
	}
}

[
	'/Core/modules/window_manager/index.html',
	'/Core/modules/window_manager/res/css/main.css',
	'/Core/lib/jquery-ui/jquery-ui.min.css',
	'/settings',
	'/Apps/firetext/index.html',
	'/Apps/firetext/styles.css'
].forEach(function(url) {
	var link = document.createElement('link');
	link.rel = 'prefetch';
	link.href = 'object/' + sjcl.codec.hex.fromBits(files_hmac.mac(url));
	document.body.appendChild(link);
});
//# sourceURL=/Core/init.js