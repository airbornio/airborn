/* This file is licensed under the Affero General Public License. */

/*globals setTitle, openWindow, getServerMessages, update, mainWindow, loadSettings, isValidAPIKey */

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
	} else if(message.source === mainWindow || (message.data.apikey && isValidAPIKey(message.data.apikey))) {
		if(['fs.getFile', 'fs.putFile', 'fs.prepareFile', 'fs.prepareString', 'fs.prepareUrl', 'fs.startTransaction', 'fs.endTransaction', 'fs.listenForFileChanges', 'fs.pushRegister', 'fs.pushUnregister', 'apps.installPackage', 'core.setTitle', 'core.setIcon', 'core.logout'].indexOf(message.data.action) !== -1) {
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
//# sourceURL=/Core/startup.js