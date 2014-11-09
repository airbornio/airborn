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
//# sourceURL=/Core/init.js