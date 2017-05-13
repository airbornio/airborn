/* This file is licensed under the Affero General Public License. */

/*globals setTitle, openWindow, getServerMessages, update, mainWindow, loadSettings, isValidAPIKey, hasPermission */

setTitle('');

openWindow('/modules/window_manager/index.html', function(iframe) {
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
		if(message.source !== mainWindow && !hasPermission(message.data.apikey, message.data.action.split('.')[1], message.data.args)) {
			if(message.data.action === 'fs.getFile') {
				message.source.postMessage({inReplyTo: message.data.messageID, result: [null, {status: 0, statusText: 'Permission denied.'}]}, '*');
			} else if(message.data.action === 'fs.putFile') {
				message.source.postMessage({inReplyTo: message.data.messageID, result: [{status: 0, statusText: 'Permission denied.'}]}, '*');
			} else if(message.data.action === 'fs.prepareFile' || message.data.action === 'fs.prepareString') {
				message.source.postMessage({inReplyTo: message.data.messageID, result: ['']}, '*');
			} else if(message.data.action === 'fs.prepareUrl') {
				message.source.postMessage({inReplyTo: message.data.messageID, result: [message.data.args[0]]}, '*');
			}
			throw new Error('Permission denied: ' + message.data.action + '(' + message.data.args.map(JSON.stringify).join(', ') + ')');
		}
		if(['fs.getFile', 'fs.putFile', 'fs.prepareFile', 'fs.prepareString', 'fs.prepareUrl', 'fs.startTransaction', 'fs.endTransaction', 'fs.listenForFileChanges', 'fs.getObjectLocation', 'fs.pushRegister', 'fs.pushUnregister', 'apps.installPackage', 'core.setTitle', 'core.setIcon', 'core.logout'].indexOf(message.data.action) !== -1) {
			window[message.data.action.split('.')[1]].apply(window, message.data.args.concat(function() {
				message.source.postMessage({inReplyTo: message.data.messageID, result: [].slice.call(arguments)}, '*');
			}, function() {
				message.source.postMessage({inReplyTo: message.data.messageID, result: [].slice.call(arguments), progress: true}, '*');
			}, function(data, callback) {
				message.source.postMessage({inReplyTo: message.data.messageID, action: 'createObjectURL', args: [data], messageID: ++messageID}, '*');
				messageCallbacks[messageID] = callback;
			}));
		} else if(message.data.action.substr(0, 3) === 'wm.') {
			if(message.data.action === 'wm.hideProgress') {
				window.wmLoaded = true;
			}
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