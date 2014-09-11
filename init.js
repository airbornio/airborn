/*global GET, sjcl, files_hmac, files_key, openWindow */

GET('object/' + sjcl.codec.hex.fromBits(files_hmac.mac('/Core/core.js')), function(response) {
	window.eval(sjcl.decrypt(files_key, response));
	
	setTitle('');
	
	openWindow('/Core/laskyawm.html', function(iframe) {
		iframe.addEventListener('load', function firstLoad() {
			iframe.removeEventListener('load', firstLoad);
			iframe.addEventListener('load', function secondLoad() {
				iframe.removeEventListener('load', secondLoad);
				
				getServerMessages();
				
				update();
				setInterval(update, 3600000); // Each hour
			});
		});
	});
	
	var messageID = 0, messageCallbacks = {};
	window.addEventListener('message', function(message) {
		if(message.data.inReplyTo) {
			messageCallbacks[message.data.inReplyTo].apply(this, message.data.result);
		} else if(message.source === mainWindow || (message.data.key && isValidAPIKey(message.data.key))) {
			if(['fs.getFile', 'fs.putFile', 'fs.prepareFile', 'fs.prepareString', 'fs.prepareUrl', 'fs.startTransaction', 'fs.endTransaction', 'fs.listenForFileChanges', 'apps.installPackage', 'core.setTitle', 'core.setIcon', 'core.logout'].indexOf(message.data.action) !== -1) {
				window[message.data.action.split('.')[1]].apply(window, message.data.args.concat(function() {
					message.source.postMessage({inReplyTo: message.data.messageID, result: [].slice.call(arguments)}, '*');
				}, function() {
					message.source.postMessage({inReplyTo: message.data.messageID, result: [].slice.call(arguments), progress: true}, '*');
				}, function(data, callback) {
					message.source.postMessage({action: 'createObjectURL', args: [data], messageID: ++messageID}, '*');
					messageCallbacks[messageID] = callback;
				}));
			} else {
				throw new TypeError('Unknown action: ' + message.data.action);
			}
		} else {
			console.info('Forwarding message.');
			var src = message.source;
			var parent = src.parent;
			while(parent !== mainWindow) {
				src = parent;
				parent = src.parent;
			}
			src.postMessage({data: message.data, forwardedFrom: message.origin}, '*');
		}
	});
	
	loadSettings();
});

document.getElementById('container').style.display = 'none';
var iframe = document.getElementsByTagName('iframe')[0];
if(iframe) iframe.style.display = 'none';
//# sourceURL=/Core/init.js