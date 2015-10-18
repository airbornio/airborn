/* This file is licensed under the Affero General Public License. */

/*global GET, sjcl, files_hmac, files_key, getFile */

GET('object/' + sjcl.codec.hex.fromBits(files_hmac.mac('/Core/core.js')), function(response) {
	window.eval(sjcl.decrypt(files_key, response));
	
	getFile('/Core/startup.js', function(contents) {
		window.eval(contents);
	});
});

document.getElementById('container').style.display = 'none';
var iframe = document.getElementsByTagName('iframe')[0];
if(iframe) iframe.style.display = 'none';

[
	'/Core/startup.js',
	'/settings',
	'/Core/compat.js',
	'/Apps/firetext/index.html',
	'/Apps/firetext/styles.css'
].forEach(function(url) {
	var link = document.createElement('link');
	link.rel = 'prefetch';
	link.href = 'object/' + sjcl.codec.hex.fromBits(files_hmac.mac(url));
	document.body.appendChild(link);
});
//# sourceURL=/Core/init.js