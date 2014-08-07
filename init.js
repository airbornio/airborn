GET('object/' + S3Prefix + '/' + sjcl.codec.hex.fromBits(private_hmac.mac('/Core/core.js')), function(response) {
	window.eval(sjcl.decrypt(files_key, response));
});

document.getElementById('container').style.display = 'none';
var iframe = document.getElementsByTagName('iframe')[0];
if(iframe) iframe.style.display = 'none';
//# sourceURL=/Core/init.js