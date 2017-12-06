/* This file is licensed under the Affero General Public License. */

/*global File, History, DOMError, HTMLAudioElement, airborn: true, laskya: true */

(function() {
	var rootParent = document.rootParent;
	delete document.rootParent;
	var relativeParent = document.relativeParent;
	delete document.relativeParent;
	var appData = rootParent.replace('Apps', 'AppData').replace('Core', 'CoreData');
	var rootParentWithoutSlash = rootParent.substr(0, rootParent.length - 1);
	Object.defineProperty(document, 'baseURI', {get: function() { return relativeParent.replace(rootParentWithoutSlash, ''); }});
	var filenames = document.filenames;
	delete document.filenames;
	
	var messageCallbacks = {};
	var apikey = document.apikey;
	delete document.apikey;
	var action = function(action, args, callback, progress, transfer) {
		var messageID = guid();
		(action.substr(0, 3) === 'wm.' ? window.parent : window.top).postMessage({messageID: messageID, action: action, args: args, apikey: apikey}, '*', transfer);
		messageCallbacks[messageID] = callback;
		if(messageCallbacks[messageID]) {
			messageCallbacks[messageID].progress = progress;
			messageCallbacks[messageID].listener = action === 'fs.listenForFileChanges' || action === 'fs.pushRegister' || action.substr(0, 10) === 'fs.prepare' || action === 'core.openWindowTop';
		}
	};
	window.addEventListener('message', function(message) {
		if(message.airborn_source === windowProxy(window.top) || message.airborn_source === windowProxy(window.parent)) {
			if(message.data.inReplyTo) {
				var callback = messageCallbacks[message.data.inReplyTo];
				if(callback !== undefined && message.data.progress) callback = callback.progress;
				if(callback === undefined) return;
				callback.apply(window, message.data.result);
				if(!message.data.progress && !callback.listener) messageCallbacks[message.data.inReplyTo] = null;
			} else if(message.data.action) {
				if(message.data.action === 'createObjectURL') {
					var arg = message.data.args[0], object;
					try {
						object = new File([arg.data], arg.name, {type: arg.type});
					} catch(e) {
						object = new Blob([arg.data], {type: arg.type});
					}
					var url = URL.createObjectURL(object);
					filenames[url] = arg.name;
					message.source.postMessage({inReplyTo: message.data.messageID, result: [url]}, '*');
					return;
				}
				airborn.listeners[message.data.action + 'Request'].forEach(function(listener) {
					listener.apply(airborn, message.data.args);
				});
			}
		} else if(window.parent === window.top) {
			return;
		} else if([].map.call(document.getElementsByTagName('iframe'), function(iframe) { return iframe.contentWindow; }).indexOf(message.source) !== -1) {
			if(message.data.action) {
				action(message.data.action, message.data.args, function() {
					message.source.postMessage({inReplyTo: message.data.messageID, result: [].slice.call(arguments)}, '*');
				}, function() {
					message.source.postMessage({inReplyTo: message.data.messageID, result: [].slice.call(arguments), progress: true}, '*');
				}, message.data.args.filter(function(arg) {
					return arg instanceof ArrayBuffer;
				}));
			}
		} else {
			console.info('unknown source');
		}
	}, false);
	function guid() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
	airborn = laskya = {
		listeners: {
			openFileRequest: []
		},
		addEventListener: function(eventName, listener) {
			airborn.listeners[eventName].push(listener);
		}
	};
	function addAction(name) {
		var parts = name.split('.');
		var target = airborn;
		parts.slice(0, -1).forEach(function(part) {
			if(!target[part]) target[part] = {};
			target = target[part];
		});
		target[parts[parts.length - 1]] = function() {
			var args = [].slice.call(arguments);
			var firstfunction = args.map(function(arg) { return Object.prototype.toString.call(arg); }).indexOf('[object Function]');
			if(firstfunction === -1) firstfunction = args.length;
			action(name, args.slice(0, firstfunction), args[firstfunction], args[firstfunction + 1]);
		};
	}
	addAction('wm.focus');
	addAction('wm.reportClicked');
	addAction('wm.setTitle');
	addAction('wm.setIcon');
	addAction('wm.openFile');
	addAction('wm.openWindow');
	addAction('wm.showProgress');
	addAction('wm.setProgress');
	addAction('wm.hideProgress');
	
	addAction('fs.getFile');
	addAction('fs.putFile');
	addAction('fs.prepareFile');
	addAction('fs.prepareString');
	addAction('fs.prepareUrl');
	addAction('fs.startTransaction');
	addAction('fs.endTransaction');
	addAction('fs.listenForFileChanges');
	addAction('fs.getObjectLocation');
	addAction('fs.pushRegister');
	addAction('fs.pushUnregister');
	
	addAction('core.openWindowTop');
	
	if(window.parent === window.top) {
		addAction('core.setTitle');
		addAction('core.setIcon');
		addAction('core.logout');
		airborn.wm = airborn.core;
	}
	
	var getFileCache = {};
	var listeningForDirectory = {};
	var _getFile = airborn.fs.getFile;
	airborn.fs.getFile = function(file, options, callback) {
		if(typeof options === 'function' || options === undefined) {
			callback = options;
			options = {};
		}
		if(callback === undefined) {
			callback = function() {};
		}
		
		var JSON_options = JSON.stringify(options);
		if(!getFileCache[file]) {
			getFileCache[file] = {};
		}
		if(getFileCache[file][JSON_options]) {
			callback.apply(this, getFileCache[file][JSON_options]);
			return;
		}
		var mainDirectory = file.substr(0, rootParent.length) === rootParent ? rootParent : (file.match(/\/[^\/]*\//) || ['/'])[0];
		if(!listeningForDirectory[mainDirectory]) {
			listeningForDirectory[mainDirectory] = true;
			airborn.fs.listenForFileChanges(mainDirectory, function(path) {
				getFileCache[path] = {};
			});
		}
		_getFile(file, options, function() {
			if(!getFileCache[file][JSON_options]) {
				getFileCache[file][JSON_options] = arguments;
			}
			callback.apply(this, getFileCache[file][JSON_options]);
		});
	};
	
	var _putFile = airborn.fs.putFile;
	airborn.fs.putFile = function() {
		var args = [].slice.call(arguments);
		if(args[1] instanceof Blob) {
			throw new TypeError('You have to pass putFile(name, {codec: "blob"}, blob).');
		}
		if(args[2] instanceof Blob) {
			if(!args[1] || args[1].codec !== 'blob') {
				throw new TypeError('You have to pass putFile(name, {codec: "blob"}, blob).');
			}
			var blob = args[2];
			if(typeof args[3] === 'function' || args[3] === undefined) {
				args[5] = args[4];
				args[4] = args[3];
				args[3] = {};
			}
			args[3].type = blob.type;
			var reader = new FileReader();
			reader.onload = function() {
				var arrayBuffer = this.result;
				args[2] = arrayBuffer;
				args[1].codec = 'arrayBuffer';
				if(navigator.userAgent.match(/Safari/) && !navigator.userAgent.match(/Chrome/)) { // Safari
					action('fs.putFile', args.slice(0, 4), args[4], args[5]);
				} else {
					action('fs.putFile', args.slice(0, 4), args[4], args[5], [arrayBuffer]);
				}
			};
			reader.readAsArrayBuffer(blob);
			return;
		}
		_putFile.apply(this, arguments);
	};
	
	navigator.mozApps = {};
	navigator.mozApps.installPackage = function() {
		var args = [].slice.call(arguments);
		var request = new DOMRequest();
		action('apps.installPackage', args, function(result, err) {
			if(err) {
				request.error = err;
				request.dispatchEvent(new Event('error'));
			} else {
				request.result = result;
				request.dispatchEvent(new Event('success'));
			}
		});
		return request;
	};
	
	window.addEventListener('mousedown', function() {
		if(window.parent !== window.top) {
			airborn.wm.focus();
			airborn.wm.reportClicked();
		}
	}, true);
	
	var rArgs = /[?#].*$/;
	var rSchema = /^(?!airbornstorage)[a-z]+:/i;
	var rAnySchema = /^[a-z]+:/i;
	function getURLFilename(url, relativeTo) {
		var args = (url.match(rArgs) || [''])[0];
		url = url.replace(rArgs, '');
		var filename;
		if(filenames.hasOwnProperty(url)) {
			filename = filenames[url];
		} else {
			var startIndex = url.indexOf('filename=');
			if(startIndex === -1) {
				if(rAnySchema.test(url)) {
					return url + args;
				}
				return airborn.path.resolve(relativeTo, url) + args;
			} else {
				filename = url.substr(startIndex + 9); // 'filename='.length == 9
				filename = decodeURIComponent(filename.substr(0, filename.indexOf(';')));
			}
		}
		if(filename[0] !== '/' || filename.substr(0, rootParent.length) === rootParent) {
			return airborn.path.resolve(relativeTo, filename.replace(rootParentWithoutSlash, '')) + args;
		} else {
			return 'airbornstorage:' + filename + args;
		}
	}
	
	function defineWithPrefixed(obj, prop, rewrittenProp, descriptor) {
		try {
			Object.defineProperty(obj, prop, descriptor);
		} catch(e) {}
		Object.defineProperty(obj, rewrittenProp, descriptor);
	}
	function redefineWithPrefixed(obj, prop, rewrittenProp, getDescriptor) {
		var realDescriptor = Object.getOwnPropertyDescriptor(obj, prop);
		var realGet = realDescriptor && realDescriptor.get || function() { return this[prop]; };
		var realSet = realDescriptor && realDescriptor.set || function(value) { this[prop] = value; };
		defineWithPrefixed(obj, prop, rewrittenProp, getDescriptor(realGet, realSet));
	}
	var AirbornObjectPrototype = Object.create(null);
	function defineDummy(prop, rewrittenProp) {
		Object.defineProperty(Object.prototype, rewrittenProp, {get: function() { return this[prop]; }, set: function(value) { this[prop] = value; }});
		Object.defineProperty(AirbornObjectPrototype, rewrittenProp, {get: function() { return this[prop]; }, set: function(value) { this[prop] = value; }});
	}
	var _Object_create = Object.create;
	Object.create = function(O) {
		if(O === null) {
			O = AirbornObjectPrototype;
		}
		return _Object_create.apply(this, arguments);
	};
	
	var requestOpen = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function(_method, url) {
		var method = _method.toUpperCase();
		var responseType;
		if((url.substr(0, 7) === 'data://' && url.indexOf(',') === -1) || url.substr(0, 7) === 'blob://') url = url.substr(7); // Workaround for URI.js in Firetext
		if(method === 'GET' && !rSchema.test(url)) {
			this.airbornFile = true;
			this.setRequestHeader = function() { console.log(this, arguments); };
			var codec;
			this.overrideMimeType = function(mimeType) {
				console.log(this, arguments);
				// mimeType is of the form mime/type; charset=utf-8
				if(mimeType.split('/')[0] === 'text') return;
				console.log("codec = 'arrayBuffer';");
				codec = 'arrayBuffer';
			};
			defineWithPrefixed(this, 'responseType', 'airborn_responseType', {
				set: function(_responseType) {
					console.log(this, arguments);
					console.log("codec = '" + _responseType + "';");
					if(_responseType === 'arraybuffer') {
						codec =          'arrayBuffer';
					} else if(_responseType === 'json') {
						codec = 'json';
					} else {
						responseType = _responseType;
					}
				},
			});
			this.send = function() {
				var req = this;
				url = url.replace(/^file:(?:\/\/)?/, '');
				url = url.replace(rArgs, '');
				url = rootParent + airborn.path.resolve('/', url).substr(1).replace(/^(\.\.\/)+/, '');
				if(url.substr(-1) === '/') url += 'index.html';
				airborn.fs.getFile(url, {codec: codec}, function(contents, err) {
					defineWithPrefixed(req, 'readyState', 'airborn_readyState', {get: function() { return 4; }});
					defineWithPrefixed(req, 'status', 'airborn_status', {get: function() { return !err && 200; }});
					defineWithPrefixed(req, 'response', 'airborn_response', {
						get: function() {
							if(responseType === 'document') {
								var doc = document.implementation.createHTMLDocument('');
								Object.defineProperty(doc, 'baseURI', {get: function() { return url.replace(rootParentWithoutSlash, ''); }});
								doc.documentElement.innerHTML = contents;
								return doc;
							}
							return contents;
						},
					});
					if(!codec) defineWithPrefixed(req, 'responseText', 'airborn_responseText', {get: function() { return contents; }});
					setTimeout(function() {
						req.dispatchEvent(new Event('readystatechange'));
						req.dispatchEvent(new Event('load'));
					});
				});
			};
		} else if(method === 'HEAD' && !rSchema.test(url)) {
			this.airbornFile = true;
			this.setRequestHeader = function() { console.log(this, arguments); };
			this.overrideMimeType = function() { console.log(this, arguments); };
			this.send = function() {
				var req = this;
				url = url.replace(/^file:(?:\/\/)?/, '');
				url = url.replace(rArgs, '');
				url = rootParent + airborn.path.resolve('/', url).substr(1).replace(/^(\.\.\/)+/, '');
				if(url.substr(-1) === '/') url += 'index.html';
				airborn.fs.getFile(airborn.path.dirname(url), {codec: 'dir'}, function(contents, err) {
					var getResponseHeader = req.getResponseHeader;
					req.getResponseHeader = function(header) {
						if(header === 'Content-Length') return contents[airborn.path.basename(url)].size;
						return getResponseHeader.apply(this, arguments);
					};
					defineWithPrefixed(req, 'readyState', 'airborn_readyState', {get: function() { return 4; }});
					defineWithPrefixed(req, 'status', 'airborn_status', {get: function() { return !err && 200; }});
					setTimeout(function() {
						req.dispatchEvent(new Event('readystatechange'));
						req.dispatchEvent(new Event('load'));
					});
				});
			};
		} else if(method === 'HEAD' && url.substr(0, 5) === 'data:') {
			this.setRequestHeader = function() { console.log(this, arguments); };
			this.overrideMimeType = function() { console.log(this, arguments); };
			this.send = function() {
				var req = this;
				var parts = url.substr(5).split(',');
				var contents = parts[0].indexOf('base64') === -1 ? decodeURIComponent(parts[1]) : atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
				var getResponseHeader = req.getResponseHeader;
				req.getResponseHeader = function(header) {
					if(header === 'Content-Length') return contents.length;
					return getResponseHeader.apply(this, arguments);
				};
				defineWithPrefixed(req, 'readyState', 'airborn_readyState', {get: function() { return 4; }});
				defineWithPrefixed(req, 'status', 'airborn_status', {get: function() { return 200; }});
				setTimeout(function() {
					req.dispatchEvent(new Event('readystatechange'));
					req.dispatchEvent(new Event('load'));
				});
			};
		} else {
			if(url.substr(0, 5) === 'data:') console.log(method, url);
			requestOpen.apply(this, arguments);
		}
	};
	defineDummy('responseType', 'airborn_responseType');
	defineDummy('readyState', 'airborn_readyState');
	defineDummy('status', 'airborn_status');
	defineDummy('response', 'airborn_response');
	defineDummy('responseText', 'airborn_responseText');
	
	var prepareUrlRequestCache = {};
	function prepareUrl(url, callback) {
		if(prepareUrlRequestCache[url]) {
			if(prepareUrlRequestCache[url].result) {
				callback.apply(this, prepareUrlRequestCache[url].result);
			} else {
				prepareUrlRequestCache[url].push(callback);
			}
		} else {
			prepareUrlRequestCache[url] = [callback];
			airborn.fs.prepareUrl(url, {rootParent: rootParent, relativeParent: relativeParent, appData: appData, apikey: apikey}, function() {
				var args = arguments;
				prepareUrlRequestCache[url].forEach(function(cb) {
					cb.apply(this, args);
				});
				prepareUrlRequestCache[url].result = args;
			});
		}
	}
	airborn.fs.listenForFileChanges(rootParent, function() {
		Object.keys(prepareUrlRequestCache).forEach(function(url) {
			if(prepareUrlRequestCache[url].result) {
				delete prepareUrlRequestCache[url];
			}
		});
	});
	
	airborn.path = {
		dirname: function(path) {
			return path.substr(0, path.replace(/\/+$/, '').lastIndexOf('/') + 1);
		},
		basename: function(path, ext) {
			var basename = path.substr(path.replace(/\/+$/, '').lastIndexOf('/') + 1);
			if(ext && basename.substr(-ext.length) === ext) return basename.substr(0, basename.length - ext.length);
			return basename;
		},
		split: function(path) {
			return path.split('/').map(function(part, i, parts) {
				return part + (i + 1 === parts.length ? '' : '/');
			});
		},
		join: function() {
			return [].join.call(arguments, '');
		},
		resolve: function(from, to) {
			if(to === '') return from;
			if(to[0] === '/') return airborn.path.resolve('/', to.substr(1));
			var resolved = from.replace(/[^/]*$/, '') + to;
			var rParentOrCurrent = /([^./]+\/\.\.\/|\/\.(?=\/))/g;
			while(rParentOrCurrent.test(resolved)) resolved = resolved.replace(rParentOrCurrent, '');
			return resolved;
		}
	};
	
	var preventWindowLoad = 0, windowLoadPrevented = 0;
	window.addEventListener('load', function(evt) {
		if(preventWindowLoad) {
			evt.stopImmediatePropagation();
			preventWindowLoad--;
			windowLoadPrevented++;
		}
	});
	[
		[HTMLAnchorElement, 'href', 'airborn_href', function() {}, function() {}],
		[HTMLLinkElement, 'href', 'airborn_href', function() {}, function() {}],
		[HTMLAudioElement, 'src', 'airborn_src', function() {}, function() {}],
		[HTMLScriptElement, 'src', 'airborn_src',
			function() {
				preventWindowLoad++;
			},
			function() {
				this.addEventListener('load', function() {
					if(windowLoadPrevented--) window.dispatchEvent(new Event('load'));
				});
			}
		],
		[HTMLImageElement, 'src', 'airborn_src',
			function() {
				var imgCompleteDescriptor = Object.getOwnPropertyDescriptor(this, 'complete');
				Object.defineProperty(this, 'complete', {get: function() { return false; }, configurable: true});
				function onError(evt) {
					evt.stopImmediatePropagation();
				}
				this.addEventListener('error', onError);
				
				return function() {
					if(imgCompleteDescriptor) {
						Object.defineProperty(this, 'complete', imgCompleteDescriptor);
					} else {
						delete this.complete;
					}
					this.removeEventListener('error', onError);
				};
			}
		],
		[HTMLIFrameElement, 'src', 'airborn_src',
			function() {
				this.addEventListener('load', function onLoad(evt) {
					evt.stopImmediatePropagation();
					this.removeEventListener('load', onLoad);
				});
			},
			function() {}
		]
	].forEach(function(element) {
		var HTMLElm = element[0];
		var attr = element[1];
		var rewrittenAttr = element[2];
		var onStart = element[3];
		var onEnd = element[4];
		
		var descriptor = (get, set) => ({
			get: function() {
				// this.src is sometimes empty: https://crbug.com/291791
				return this.getAttribute(attr) || '';
			},
			set: function(url) {
				var _this = this;
				if(rSchema.test(url)) return set.call(_this, url);
				var absoluteUrl = airborn.path.resolve(rootParent, url);
				if(Object.keys(filenames).some(function(objectURL) {
					if(filenames[objectURL] === absoluteUrl) {
						set.call(_this, objectURL);
						return true;
					}
				})) return;
				onEnd = onStart.call(_this) || onEnd;
				prepareUrl(url, function(url) {
					set.call(_this, url);
					onEnd.call(_this);
				});
			}
		});
		redefineWithPrefixed(HTMLElm.prototype, attr, rewrittenAttr, descriptor);
		var realGetAttribute = HTMLElm.prototype.getAttribute;
		HTMLElm.prototype.getAttribute = function(attrName) {
			var realAttr = realGetAttribute.call(this, attrName);
			if(realAttr && attrName === attr) {
				return getURLFilename(realAttr, this.ownerDocument.baseURI);
			}
			return realAttr;
		};
	});
	defineDummy('src', 'airborn_src');
	defineDummy('href', 'airborn_href');
	defineWithPrefixed(HTMLAnchorElement.prototype, 'pathname', 'airborn_pathname', {
		get: function() {
			return this.airborn_href && new URL(this.airborn_href, 'file://').pathname;
		}
	});
	defineDummy('pathname', 'airborn_pathname');
	redefineWithPrefixed(Element.prototype, 'innerHTML', 'airborn_innerHTML', (get, set) => ({
		get: get,
		set: function(html) {
			set.call(this, html);
			findNewElements(this);
		}
	}));
	defineDummy('innerHTML', 'airborn_innerHTML');
	function findNewElements(context) {
		['src', 'href', 'icon'].forEach(function(attrName) {
			Array.prototype.forEach.call(context.querySelectorAll(
				'[' + attrName + ']:not([' + attrName + '^="blob:"]):not([' + attrName + '^="data:"]):not([' + attrName + '^="http:"]):not([' + attrName + '^="https:"])'
			), function(elm) {
				var attr = elm.getAttribute(attrName);
				if(attr && !rSchema.test(attr)) elm['airborn_' + attrName] = attr;
			});
		});
	}
	
	var windowOpen = window.open;
	window.open = function(url) {
		if(!rSchema.test(url)) {
			airborn.wm.openWindow(rootParent, {path: url}, null);
			return;
		}
		var win = windowOpen.apply(this, arguments);
		/* maybeWindowProxy(win) doesn't work in this case because at this point,
		 * win contains about:blank. So we guess whether the window will be
		 * same-origin with ours based on the url instead.
		 */
		if(url.substr(0, 9) === 'blob:null' || url.substr(0, 5) === 'data:') {
			return win;
		} else {
			return windowProxy(win);
		}
	};
	
	var storageLocations = {
		apps: '/Apps/',
		music: '/Music/',
		pictures: '/Pictures/',
		sdcard: '/Documents/',
		system: '/Core/',
		videos: '/Videos/'
	};
	function EventTarget() {
		var listeners = {};
		this.addEventListener = function(eventName, fn) {
			if(!listeners[eventName]) listeners[eventName] = [];
			listeners[eventName].push(fn);
		};
		this.removeEventListener = function(eventName, fn) {
			if(!listeners[eventName]) return;
			if(fn) {
				listeners[eventName] = listeners[eventName].filter(function(elm) { return elm !== fn; });
			} else {
				listeners[eventName] = [];
			}
		};
		this.dispatchEvent = function(event) {
			var _this = this;
			setTimeout(function() {
				Object.defineProperty(event, 'target', {get: function() { return _this; }});
				if(listeners[event.type]) {
					listeners[event.type].forEach(function(fn) {
						fn.call(_this, event);
					});
				}
				if(_this['on' + event.type]) {
					_this['on' + event.type](event);
				}
			});
			return true;
		};
	}
	function DOMRequest() {
		EventTarget.call(this);
		this.readyState = 'pending';
	}
	DOMRequest.prototype = new EventTarget();
	function DOMCursor() {
		DOMRequest.call(this);
	}
	DOMCursor.prototype = new DOMRequest();
	if(!window.DOMError) {
		window.DOMError = function DOMError(name, message) {
			Object.defineProperty(this, 'name', {value: name});
			Object.defineProperty(this, 'message', {value: message});
		};
	}
	function DeviceStorage(storageName) {
		EventTarget.call(this);
		Object.defineProperty(this, 'storageName', {value: storageName});
		Object.defineProperty(this, 'default', {value: true});
		var prefix = storageLocations[storageName];
		var deviceStorage = this;
		airborn.fs.listenForFileChanges(prefix, function(path, reason) {
			if(path.substr(-1) !== '/' && !/\.history\//.test(path)) {
				var evt = new Event('change');
				Object.defineProperty(evt, 'path', {value: toDeviceStoragePath(path)});
				Object.defineProperty(evt, 'reason', {value: reason});
				deviceStorage.dispatchEvent(evt);
			}
		});
	}
	DeviceStorage.prototype = new EventTarget();
	function toAirbornPath(deviceStorage, path) {
		if(path[0] === '/') {
			var parts = path.split('/');
			if(storageLocations[parts[1]]) {
				return storageLocations[parts[1]] + parts.slice(2).join('/');
			}
			return path;
		}
		return storageLocations[deviceStorage.storageName] + path;
	}
	function toDeviceStoragePath(path) {
		var parts = path.split('/');
		Object.keys(storageLocations).forEach(function(deviceStorage) {
			if(storageLocations[deviceStorage] === '/' + parts[1] + '/') {
				parts[1] = deviceStorage;
			}
		});
		return parts.join('/');
	}
	DeviceStorage.prototype.onchange = null;
	DeviceStorage.prototype.available = function() {
		var request = new DOMRequest();
		request.result = 'available';
		request.dispatchEvent(new Event('success'));
		return request;
	};
	DeviceStorage.prototype.addNamed = function(file, name) {
		var path = toAirbornPath(this, name);
		var request = new DOMRequest();
		airborn.fs.getFile(airborn.path.dirname(path), {codec: 'dir'}, function(contents) {
			if(contents && contents.hasOwnProperty(airborn.path.basename(path))) {
				request.error = new DOMError('NoModificationAllowedError', 'The file already exists.');
				request.dispatchEvent(new Event('error'));
			} else {
				airborn.fs.putFile(path, {codec: 'blob'}, file, function(err) {
					request.readyState = 'done';
					if(err) {
						request.dispatchEvent(new Event('error'));
					} else {
						request.dispatchEvent(new Event('success'));
					}
				});
			}
		});
		return request;
	};
	DeviceStorage.prototype.get = function(name) {
		var path = toAirbornPath(this, name);
		var request = new DOMRequest();
		var dirname = airborn.path.dirname(path);
		var basename = airborn.path.basename(path);
		airborn.fs.getFile(dirname, {codec: 'dir'}, function(contents) {
			if(!contents || !contents.hasOwnProperty(basename)) {
				request.error = new DOMError('NotFoundError', "The file doesn't exist.");
				request.dispatchEvent(new Event('error'));
			} else {
				request.result = new AsyncFile({name: toDeviceStoragePath(path), type: contents[basename].type, path: path, lastModifiedDate: contents[basename].edited || new Date()});
				request.dispatchEvent(new Event('success'));
			}
		});
		return request;
	};
	DeviceStorage.prototype.delete = function(name) {
		var path = toAirbornPath(this, name);
		var request = new DOMRequest();
		var dirname = airborn.path.dirname(path);
		var basename = airborn.path.basename(path);
		airborn.fs.getFile(dirname, {codec: 'dir'}, function(contents) {
			delete contents[basename];
			airborn.fs.putFile(dirname, {codec: 'dir'}, contents, function() {
				request.dispatchEvent(new Event('success'));
			});
		});
		return request;
	};
	DeviceStorage.prototype.enumerate = function(_prefix) {
		var prefix = toAirbornPath(this, _prefix == null ? '' : _prefix);
		var prefixLen = prefix.length;
		var lastDir = prefix.split('/').slice(0, -1).join('/') + '/';
		var cursor = new DOMCursor();
		var files = [];
		(function add(path, done) {
			airborn.fs.getFile(path, {codec: 'dir'}, function(contents) {
				var dirs = 0, dirsdone = -1;
				if(contents) Object.keys(contents).forEach(function(name) {
					if(name.substr(-9) === '.history/') return;
					var filePath = path + name;
					if(_prefix && filePath.substr(0, prefixLen) !== prefix) return;
					if(name.substr(-1) === '/') {
						dirs++;
						add(filePath, dirdone);
					} else {
						files.push({name: toDeviceStoragePath(filePath), type: contents[name].type, path: filePath, lastModifiedDate: contents[name].edited || new Date()});
					}
				});
				function dirdone() {
					if(++dirsdone === dirs) done();
				}
				dirdone();
			});
		})(lastDir, function() {
			cursor.readyState = 'done';
			var next = 0;
			(cursor.continue = function() {
				this.result = files[next] && new AsyncFile(files[next]);
				this.done = !files[next];
				next++;
				cursor.dispatchEvent(new Event('success'));
			}).call(cursor);
		});
		return cursor;
	};
	function AsyncFile(options) {
		var _this = this;
		Object.keys(options).forEach(function(key) {
			_this[key] = options[key];
		});
	}
	function extendFileReader(methodName, readerFn) {
		var origMethod = FileReader.prototype[methodName];
		FileReader.prototype[methodName] = function(file) {
			if(file instanceof AsyncFile) {
				var reader = this;
				readerFn(file, function(result) {
					defineWithPrefixed(reader, 'result', 'airborn_result', {get: function() { return result; }});
					setTimeout(function() {
						reader.dispatchEvent(new Event('load'));
					});
				});
			} else {
				origMethod.apply(this, arguments);
			}
		};
	}
	defineDummy('result', 'airborn_result');
	extendFileReader('readAsText', function(file, callback) {
		airborn.fs.getFile(file.path, callback);
	});
	extendFileReader('readAsArrayBuffer', function(file, callback) {
		airborn.fs.getFile(file.path, {codec: 'arrayBuffer'}, callback);
	});
	extendFileReader('readAsDataURL', function(file, callback) {
		airborn.fs.getFile(file.path, {codec: 'base64'}, function(contents) {
			callback('data:' + file.type + ';base64,' + contents);
		});
	});
	
	navigator.getDeviceStorage = function(storageName) {
		if(arguments.length !== 1) throw new TypeError('navigator.getDeviceStorage takes exactly one argument: storageName.');
		if(!storageLocations[storageName]) return null;
		return new DeviceStorage(storageName);
	};
	
	function Storage_(data) {
		var _this = this;
		Object.keys(data).forEach(function(key) {
			_this[key] = data[key];
		});
	}
	Storage_.prototype.getItem = function(name) {
		return this.hasOwnProperty(name) ? this[name] : null;
	};
	Storage_.prototype.setItem = function(name, value) {
		this[name] = value + '';
		flushStorage();
	};
	Storage_.prototype.removeItem = function(name) {
		delete this[name];
		flushStorage();
	};
	Storage_.prototype.clear = function() {
		var _this = this;
		Object.keys(_this).forEach(function(key) {
			delete _this[key];
		});
		flushStorage();
	};
	Storage_.prototype.key = function(i) {
		return Object.keys(this)[i];
	};
	Object.defineProperty(Storage_.prototype, 'length', {
		get: function() {
			return Object.keys(this).length;
		}
	});
	var localStorage = new Storage_(document.airborn_localStorage);
	var localStorageDescr;
	if(window.Proxy) {
		localStorageDescr = {
			value: new Proxy(localStorage, {
				set: function(target, name, value) {
					target.setItem(name, value);
					return true;
				},
				deleteProperty: function(target, name) {
					target.removeItem(name);
					return true;
				},
			})
		};
	} else {
		var stringifyStorageValues = function() {
			Object.keys(localStorage).forEach(function(key) {
				localStorage[key] += '';
			});
		};
		var stringifyAndFlush = function() {
			stringifyStorageValues();
			flushStorage();
		};
		localStorageDescr = {
			get: function() {
				stringifyStorageValues();
				return localStorage;
			}
		};
		setInterval(stringifyAndFlush, 300);
		window.addEventListener('unload', stringifyAndFlush); // Doesn't work on browser tab close or in Firefox
	}
	
	delete document.airborn_localStorage;
	defineWithPrefixed(window, 'localStorage', 'airborn_localStorage', localStorageDescr);
	var localStorageJSON = JSON.stringify(localStorage);
	function flushStorage() {
		var json = JSON.stringify(localStorage);
		if(json !== localStorageJSON) {
			airborn.fs.putFile(appData + 'localStorage', json);
			localStorageJSON = json;
		}
	}
	
	Object.defineProperty(document, 'airborn_cookie', {value: ''});
	defineDummy('cookie', 'airborn_cookie');
	
	function createLocationUrl(url, base) {
		var urlobj = new URL(url, 'file://' + (base || ''));
		var obj = {
			host: '',
			hostname: '',
			href: urlobj.href.substr(7),
			origin: 'null',
			pathname: urlobj.pathname,
			port: '',
			protocol: 'file:',
			search: urlobj.search
		};
		Object.defineProperty(obj, 'hash', {
			get: function() {
				return window.location.hash;
			},
			set: function(hash) {
				window.location.hash = hash;
			}
		});
		obj.reload = window.location.reload.bind(window.location);
		return obj;
	}
	var locationurl = createLocationUrl(relativeParent.replace(rootParentWithoutSlash, ''));
	Object.defineProperty(window, 'airborn_location', {
		get: function() {
			return locationurl;
		},
	});
	defineDummy('location', 'airborn_location');
	
	function setState(state, url) {
		locationurl = createLocationUrl(url, locationurl.href);
		Object.defineProperty(History.prototype, 'state', {value: state, enumerable: true, configurable: true});
	}
	if(navigator.userAgent.match(/Safari/) && !navigator.userAgent.match(/Chrome/)) {
		var _history = window.history;
		window.History = function() {};
		try {
			Object.defineProperty(window, 'history', {value: new window.History(), enumerable: true, configurable: true}); // Safari 10
		} catch(e) {
			window.history = new window.History(); // Safari 9
		}
		['go', 'back', 'forward'].forEach(function(name) {
			window.History.prototype[name] = function() {
				_history[name].apply(_history, arguments);
			};
		});
		var hist = [{href: locationurl.href, state: null}];
		var curr = 0;
		History.prototype.replaceState = function(state, title, url) {
			setState(state, url);
			hist[curr] = {href: locationurl.href, state: state};
			window.location.hash = '#_airborn_state_' + curr;
		};
		History.prototype.pushState = function(state, title, url) { // jshint ignore:line
			curr++;
			History.prototype.replaceState.apply(this, arguments);
		};
		window.addEventListener('hashchange', function(evt) {
			if(window.location.hash.substr(0, 16) === '#_airborn_state_') {
				evt.stopImmediatePropagation();
				if(curr === +window.location.hash.substr(16)) {
					return;
				}
				curr = +window.location.hash.substr(16);
				var state = hist[curr];
				setState(state.state, state.href);
				var popstateevt = new Event('popstate');
				Object.defineProperty(popstateevt, 'state', {value: state.state, enumerable: true, configurable: true});
				window.dispatchEvent(popstateevt);
			}
		}, true);
	} else {
		var history_replaceState = History.prototype.replaceState;
		History.prototype.replaceState = function(state, title, url) {
			setState(state, url);
			history_replaceState.call(this, {href: locationurl.href, state: state, _airborn: true}, '', '');
		};
		var history_pushState = History.prototype.pushState;
		History.prototype.pushState = function(state, title, url) {
			setState(state, url);
			history_pushState.call(this, {href: locationurl.href, state: state, _airborn: true}, '', '');
		};
		window.addEventListener('popstate', function(evt) {
			if(evt.state && evt.state._airborn) {
				setState(evt.state.state, evt.state.href);
				Object.defineProperty(evt, 'state', {value: evt.state.state, enumerable: true, configurable: true});
			}
		}, true);
	}
	
	function WindowProxy(window) {
		Object.defineProperty(this, 'airborn_top', {
			value: (function() {
				var top = window;
				while(top.parent.parent.parent !== top.parent.parent) top = top.parent;
				return top === window ? this : maybeWindowProxy(top);
			})()
		});
		Object.defineProperty(this, 'airborn_parent', {value: this === this.airborn_top || window.parent === window ? this : maybeWindowProxy(window.parent)});
		this.postMessage = function() {
			window.postMessage.apply(window, arguments);
		};
		this.focus = function() {
			window.focus.apply(window, arguments);
		};
		Object.defineProperty(this, 'location', {get: function() { return window.location; }, set: function(value) { window.location = value; }});
	}
	var windowProxies = new Map();
	function windowProxy(window) {
		if(windowProxies.has(window)) {
			return windowProxies.get(window);
		}
		var proxy = new WindowProxy(window);
		windowProxies.set(window, proxy);
		return proxy;
	}
	function maybeWindowProxy(window) {
		try {
			if(window.location.href === undefined) throw 0;
		} catch(e) {
			return windowProxy(window);
		}
		return window;
	}
	
	Object.defineProperty(window, 'airborn_top', {
		value: (function() {
			var top = window;
			while(top.parent.parent.parent !== top.parent.parent) top = top.parent;
			return maybeWindowProxy(top);
		})()
	});
	defineDummy('top', 'airborn_top');
	
	Object.defineProperty(window, 'airborn_parent', {value: window === window.airborn_top ? window : maybeWindowProxy(window.parent)});
	defineDummy('parent', 'airborn_parent');
	
	redefineWithPrefixed(MessageEvent.prototype, 'source', 'airborn_source', get => ({get: function() { return maybeWindowProxy(get.call(this)); }}));
	defineDummy('source', 'airborn_source');
	
	redefineWithPrefixed(HTMLIFrameElement.prototype, 'contentWindow', 'airborn_contentWindow', get => ({get: function() { return maybeWindowProxy(get.call(this)); }}));
	defineDummy('contentWindow', 'airborn_contentWindow');
	
	if(window === window.airborn_top) {
		var title = document.querySelector('head > title');
		airborn.wm.setTitle(title && title.textContent);
		document.addEventListener('DOMContentLoaded', function() {
			title = document.querySelector('head > title');
			if(title) {
				airborn.wm.setTitle(title.textContent);
				var observer = new window[window.MutationObserver ? 'MutationObserver' : 'WebKitMutationObserver'](function(mutations) {
					mutations.forEach(function(mutation) {
						airborn.wm.setTitle(mutation.target.textContent);
					});
				});
				observer.observe(title, {subtree: true, characterData: true, childList: true});
			}
		});
	}
	
	airborn.top_location = new URL(document.top_location);
	delete document.top_location;
	
	window.MozActivity = function(options) {
		var request = new DOMRequest();
		if(options.name === 'pick') {
			var input = document.createElement('input');
			input.type = 'file';
			input.accept = options.data.type;
			input.style.display = 'none';
			input.addEventListener('change', function() {
				request.result = {
					blob: input.files[0],
				};
				request.dispatchEvent(new Event('success'));
			});
			document.body.appendChild(input);
			input.click();
			document.body.removeChild(input);
			// Neither Chrome nor Firefox seems to mind sending change
			// events to a file input that is not in the document, and
			// there is no cancel event, so we wanna clean up after
			// ourselves. We should listen to focus events to detect
			// cancel to send an error event to the MozActivity, but
			// Firetext doesn't need it and it's a bit of a hassle
			// (Chrome doesn't seem to fire a blur event) so we
			// currently don't. An additional benefit of immediately
			// removing the element might be that it reduces the
			// potential disruption of adding an element into a web app
			// that doesn't expect it.
		} else {
			request.error = new DOMError('NotSupportedError', 'That activity is not supported.');
			request.dispatchEvent(new Event('error'));
		}
		return request;
	};
	
	function MockWorker() {
		EventTarget.call(this);
	}
	MockWorker.prototype = new EventTarget();
	var RealWorker = window.Worker;
	window.Worker = function(url) {
		var mockWorker = new MockWorker();
		var messages = [];
		mockWorker.postMessage = function() {
			messages.push(arguments);
		};
		airborn.fs.prepareUrl(url, {rootParent: rootParent, relativeParent: relativeParent, webworker: true}, function(url) {
			var realWorker = new RealWorker(url);
			realWorker.addEventListener('message', mockWorker.dispatchEvent.bind(mockWorker));
			mockWorker.postMessage = function() {
				realWorker.postMessage.apply(realWorker, arguments);
			};
			messages.forEach(function(message) {
				mockWorker.postMessage.apply(mockWorker, message);
			});
		});
		return mockWorker;
	};
	
	var messageHandlers = {};
	navigator.mozSetMessageHandler = function(event, handler) {
		if(!messageHandlers[event]) {
			messageHandlers[event] = [];
		}
		messageHandlers[event].push(handler);
	};
	function mozCallMessageHandlers(event, data) {
		if(messageHandlers[event]) {
			messageHandlers[event].forEach(function(handler) {
				handler(data);
			});
		}
	}
	
	var endpoints = {};
	var pushManager = {
		register: function() {
			var req = new DOMRequest();
			airborn.fs.pushRegister(function(data) {
				switch(data.event) {
					case 'registered':
						endpoints[data.result] = {
							pushEndpoint: data.result,
							version: undefined
						};
						req.result = data.result;
						req.dispatchEvent(new Event('success'));
						break;
					case 'push':
						if(!endpoints[data.result.pushEndpoint] || data.result.version <= endpoints[data.result.pushEndpoint].version) {
							return;
						}
						endpoints[data.result.pushEndpoint] = {
							pushEndpoint: data.result.pushEndpoint,
							version: data.result.version
						};
						mozCallMessageHandlers('push', data.result);
						break;
					case 'push-register':
						endpoints = {};
						mozCallMessageHandlers('push-register', {});
						break;
				}
			});
			return req;
		},
		unregister: function(endpoint) {
			var req = new DOMRequest();
			airborn.fs.pushUnregister(endpoint, function() {
				delete endpoints[endpoint];
				req.dispatchEvent(new Event('success'));
			});
			return req;
		},
		registrations: function() {
			var req = new DOMRequest();
			req.result = Object.keys(endpoints).map(function(key) { return endpoints[key]; });
			req.dispatchEvent(new Event('success'));
			return req;
		}
	};
	Object.defineProperty(navigator, 'push', {get: function() { return pushManager; }});
})();