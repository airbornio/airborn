/*global DOMError, airborn: true, laskya: true */

(function() {
	var messageID = 0, messageCallbacks = {};
	var apikey = document.apikey;
	delete document.apikey;
	var action = function(action, args, callback, progress, transfer) {
		(action.substr(0, 3) === 'wm.' ? parent : window['top']).postMessage({messageID: ++messageID, action: action, args: args, apikey: apikey}, '*', transfer);
		messageCallbacks[messageID] = callback;
		if(messageCallbacks[messageID]) {
			messageCallbacks[messageID].progress = progress;
			messageCallbacks[messageID].listener = action === 'fs.listenForFileChanges' || action.substr(0, 10) === 'fs.prepare';
		}
	};
	window.addEventListener('message', function(message) {
		if(message.source === window['top'] || message.source === parent) {
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
					message.source.postMessage({inReplyTo: message.data.messageID, result: [URL.createObjectURL(object)]}, '*');
					return;
				}
				airborn.listeners[message.data.action + 'Request'].forEach(function(listener) {
					listener.apply(airborn, message.data.args);
				});
			}
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
				action('fs.putFile', args.slice(0, 4), args[4], args[5], [arrayBuffer]);
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
	
	var title = document.getElementsByTagName('title')[0];
	if(title) airborn.wm.setTitle(title.textContent);
	var icon = document.querySelector('link[rel="shortcut icon"], link[rel="icon"]');
	if(icon) {
		var img = document.createElement('img');
		img.src = icon.href;
		img.addEventListener('load', function() {
			var canvas = document.createElement('canvas');
			canvas.width = canvas.height = 16;
			
			var ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0, 16, 16);
			
			airborn.wm.setIcon(canvas.toDataURL('image/png'));
		});
	}
	
	window.addEventListener('mousedown', function() {
		airborn.wm.focus();
		airborn.wm.reportClicked();
	}, true);
	
	var filenames = document.filenames;
	delete document.filenames;
	var rArgs = /[?#].*$/;
	function getURLFilename(url) {
		if(filenames.hasOwnProperty(url)) {
			return filenames[url];
		}
		var startIndex = url.indexOf('filename=');
		if(startIndex === -1) return url;
		var args = (url.match(rArgs) || [''])[0];
		var filename = url.substr(startIndex + 9); // 'filename='.length == 9
		return decodeURIComponent(filename.substr(0, filename.indexOf(';'))) + args;
	}
	
	var requestOpen = XMLHttpRequest.prototype.open;
	var rSchema = /^([a-z]+:|\/\/)/i;
	var rArgs = /[?#].*$/;
	var root = document.root;
	delete document.root;
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
			Object.defineProperty(this, 'responseType', {set: function(_responseType) {
				console.log(this, arguments);
				console.log("codec = '" + _responseType + "';");
				responseType = _responseType;
			}});
			this.send = function() {
				var req = this;
				url = url.replace(rArgs, '');
				url = root.replace(/[^/]*$/, '') + airborn.path.resolve('/', url).substr(1).replace(/^(\.\.\/)+/, '');
				airborn.fs.getFile(url, {codec: codec}, function(contents, err) {
					Object.defineProperty(req, 'readyState', {get: function() { return 4; }});
					Object.defineProperty(req, 'status', {get: function() { return !err && 200; }});
					Object.defineProperty(req, 'response', {get: function() {
						if(responseType === 'document') {
							var doc = document.implementation.createHTMLDocument('');
							doc.documentElement.innerHTML = contents;
							return doc;
						}
						return contents;
					}});
					if(!codec) Object.defineProperty(req, 'responseText', {get: function() { return contents; }});
					req.dispatchEvent(new Event('readystatechange'));
					req.dispatchEvent(new Event('load'));
				});
			};
		} else if(method === 'HEAD' && !rSchema.test(url)) {
			this.airbornFile = true;
			this.setRequestHeader = function() { console.log(this, arguments); };
			this.overrideMimeType = function() { console.log(this, arguments); };
			this.send = function() {
				var req = this;
				url = url.replace(rArgs, '');
				url = root.replace(/[^/]*$/, '') + airborn.path.resolve('/', url).substr(1).replace(/^(\.\.\/)+/, '');
				airborn.fs.getFile(airborn.path.dirname(url), {codec: 'dir'}, function(contents, err) {
					var getResponseHeader = req.getResponseHeader;
					req.getResponseHeader = function(header) {
						if(header === 'Content-Length') return contents[airborn.path.basename(url)].size;
						return getResponseHeader.apply(this, arguments);
					};
					Object.defineProperty(req, 'readyState', {get: function() { return 4; }});
					Object.defineProperty(req, 'status', {get: function() { return !err && 200; }});
					req.dispatchEvent(new Event('readystatechange'));
					req.dispatchEvent(new Event('load'));
				});
			};
		} else if(method === 'GET' && url.substr(0, 5) === 'data:') {
			this.setRequestHeader = function() { console.log(this, arguments); };
			this.overrideMimeType = function() { console.log(this, arguments); };
			Object.defineProperty(this, 'responseType', {set: function(_responseType) {
				console.log(this, arguments);
				console.log("codec = '" + _responseType + "';");
				responseType = _responseType;
			}});
			this.send = function() {
				var req = this;
				var parts = url.substr(5).split(',');
				var contents = parts[0].indexOf('base64') === -1 ? decodeURIComponent(parts[1]) : atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
				setTimeout(function() {
					Object.defineProperty(req, 'readyState', {get: function() { return 4; }});
					Object.defineProperty(req, 'status', {get: function() { return 200; }});
					Object.defineProperty(req, 'response', {get: function() {
						if(responseType === 'document') {
							var doc = document.implementation.createHTMLDocument('');
							doc.documentElement.innerHTML = contents;
							return doc;
						}
						return contents;
					}});
					Object.defineProperty(req, 'responseText', {get: function() { return contents; }});
					req.dispatchEvent(new Event('readystatechange'));
					req.dispatchEvent(new Event('load'));
				});
			};
		} else if(method === 'HEAD' && url.substr(0, 5) === 'data:') {
			this.setRequestHeader = function() { console.log(this, arguments); };
			this.overrideMimeType = function() { console.log(this, arguments); };
			this.send = function() {
				var req = this;
				var parts = url.substr(5).split(',');
				var contents = parts[0].indexOf('base64') === -1 ? decodeURIComponent(parts[1]) : atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
				setTimeout(function() {
					var getResponseHeader = req.getResponseHeader;
					req.getResponseHeader = function(header) {
						if(header === 'Content-Length') return contents.length;
						return getResponseHeader.apply(this, arguments);
					};
					Object.defineProperty(req, 'readyState', {get: function() { return 4; }});
					Object.defineProperty(req, 'status', {get: function() { return 200; }});
					req.dispatchEvent(new Event('readystatechange'));
					req.dispatchEvent(new Event('load'));
				});
			};
		} else {
			if(url.substr(0, 5) === 'data:') console.log(method, url);
			requestOpen.apply(this, arguments);
		}
	};
	
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
			if(to[0] === '/') return to;
			var resolved = from.replace(/[^/]*$/, '') + to;
			var rParentOrCurrent = /([^./]+\/\.\.\/|\/\.(?=\/))/g;
			while(rParentOrCurrent.test(resolved)) resolved = resolved.replace(rParentOrCurrent, '');
			return resolved;
		}
	};
	
	/*document.createElement = (function(createElement) {
		return function(tagName) {
			if(tagName.toLowerCase() === 'script') {
				var element = createElement(tagName);
				
		};
	})(document.createElement);*/
	var linkHrefDescriptor = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, 'href');
	Object.defineProperty(HTMLLinkElement.prototype, 'href', {
		set: function(url) {
			var link = this;
			airborn.fs.prepareUrl(url, {rootParent: root, relativeParent: root}, function(url) {
				linkHrefDescriptor.set.call(link, url);
			});
		}
	});
	var scriptSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
	Object.defineProperty(HTMLScriptElement.prototype, 'src', {
		get: function() {
			return getURLFilename(scriptSrcDescriptor.get.call(this));
		},
		set: function(url) {
			var script = this;
			if(rSchema.test(url)) return scriptSrcDescriptor.set.call(script, url);
			var winloaded = false;
			function winload(evt) {
				evt.stopImmediatePropagation();
				winloaded = true;
				window.removeEventListener('load', winload);
			}
			window.addEventListener('load', winload);
			airborn.fs.prepareUrl(url, {rootParent: root, relativeParent: root}, function(url) {
				scriptSrcDescriptor.set.call(script, url);
				script.addEventListener('load', function() {
					if(winloaded) window.dispatchEvent(new Event('load'));
				});
				//script.textContent = contents + '\n//# sourceURL=' + path;
				//window.eval(contents); script.dispatchEvent(new Event('load'));
			});
		}
	});
	var aHrefDescriptor = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, 'href');
	Object.defineProperty(HTMLAnchorElement.prototype, 'href', {
		get: function() {
			return getURLFilename(aHrefDescriptor.get.call(this));
		}
	});
	var scriptGetAttribute = HTMLScriptElement.prototype.getAttribute;
	HTMLScriptElement.prototype.getAttribute = function(attrName) {
		var realAttr = scriptGetAttribute.call(this, attrName);
		if(realAttr && attrName === 'src') {
			return getURLFilename(realAttr);
		}
		return realAttr;
	};
	var linkGetAttribute = HTMLLinkElement.prototype.getAttribute;
	HTMLLinkElement.prototype.getAttribute = function(attrName) {
		var realAttr = linkGetAttribute.call(this, attrName);
		if(realAttr && attrName === 'href') {
			return getURLFilename(realAttr);
		}
		return realAttr;
	};
	var elementInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
	Object.defineProperty(Element.prototype, 'innerHTML', {
		get: function() {
			return elementInnerHTMLDescriptor.get.call(this);
		},
		set: function(html) {
			elementInnerHTMLDescriptor.set.call(this, html);
			findNewElements();
		}
	});
	function findNewElements() {
		['src', 'href', 'icon'].forEach(function(attrName) {
			Array.prototype.forEach.call(document.querySelectorAll(
				'[' + attrName + ']:not([' + attrName + '^="blob:"]):not([' + attrName + '^="data:"]):not([' + attrName + '^="http:"]):not([' + attrName + '^="https:"]):not([' + attrName + '^="//"])'
			), function(elm) {
				var attr = elm.getAttribute(attrName);
				if(attr && !rSchema.test(attr)) airborn.fs.prepareUrl(attr, {rootParent: root, relativeParent: root}, function(url, err) {
					if(!err) elm.setAttribute(attrName, url);
				});
			});
		});
	}
	if(!scriptSrcDescriptor) { // Chrome (https://code.google.com/p/chromium/issues/detail?id=43394).
		window.addEventListener('load', function() {
			setInterval(findNewElements, 2000);
		});
		Object.defineProperty(document, 'currentScript', {
			get: function() {
				var scripts = document.getElementsByTagName('script');
				var currentScript = scripts[scripts.length - 1];
				var realSrc = currentScript.src;
				Object.defineProperty(currentScript, 'src', {
					get: function() {
						return getURLFilename(realSrc);
					}
				});
				return currentScript;
			}
		});
		var createElement = document.createElement;
		document.createElement = function(tagName) {
			var elm = createElement.call(document, tagName);
			if(tagName.toLowerCase() === 'script') {
				var src;
				Object.defineProperty(elm, 'src', {
					set: function(url) {
						src = url;
						if(rSchema.test(url)) return elm.setAttribute('src', url), url;
						var winloaded = false;
						function winload(evt) {
							evt.stopImmediatePropagation();
							winloaded = true;
							window.removeEventListener('load', winload);
						}
						window.addEventListener('load', winload);
						airborn.fs.prepareUrl(url, {rootParent: root, relativeParent: root}, function(url) {
							elm.setAttribute('src', url);
							elm.addEventListener('load', function() {
								if(winloaded) window.dispatchEvent(new Event('load'));
							});
							//elm.textContent = contents + '\n//# sourceURL=' + path;
							//window.eval(decodeURIComponent(url.substr(21))); elm.dispatchEvent(new Event('load'));
						});
					},
					get: function() {
						return src;
					}
				});
			} else if(tagName.toLowerCase() === 'link') {
				var href;
				Object.defineProperty(elm, 'href', {
					set: function(url) {
						href = url;
						airborn.fs.prepareUrl(url, {rootParent: root, relativeParent: root}, function(url) {
							elm.setAttribute('href', url);
						});
					},
					get: function() {
						return href;
					}
				});
			}
			return elm;
		};
	}
	
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
			Object.defineProperty(event, 'target', {value: this});
			if(listeners[event.type]) {
				listeners[event.type].forEach(function(fn) {
					fn.call(this, event);
				});
			}
			if(this['on' + event.type]) {
				this['on' + event.type](event);
			}
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
	function DeviceStorage(storageName) {
		EventTarget.call(this);
		Object.defineProperty(this, 'storageName', {value: storageName});
		Object.defineProperty(this, 'default', {value: storageName === 'sdcard'});
		var prefix = storageLocations[storageName];
		var prefixLen = prefix.length;
		var deviceStorage = this;
		airborn.fs.listenForFileChanges(function(path, reason) {
			if(path.substr(0, prefixLen) === prefix && path.substr(-1) !== '/') {
				var evt = new Event('change');
				evt.path = path.substr(prefixLen);
				evt.reason = reason;
				deviceStorage.dispatchEvent(evt);
			}
		});
	}
	DeviceStorage.prototype = new EventTarget();
	function getDeviceStoragePath(deviceStorage, path) {
		if(path[0] === '/') {
			var parts = path.split('/');
			if(storageLocations[parts[1]]) {
				return storageLocations[parts[1]] + parts.slice(2).join('/');
			}
			return path;
		}
		return storageLocations[deviceStorage.storageName] + path;
	}
	DeviceStorage.prototype.onchange = null;
	DeviceStorage.prototype.available = function() {
		var request = new DOMRequest();
		setTimeout(function() {
			request.result = 'available';
			request.dispatchEvent(new Event('success'));
		});
		return request;
	};
	DeviceStorage.prototype.addNamed = function(file, name) {
		var path = getDeviceStoragePath(this, name);
		var request = new DOMRequest();
		airborn.fs.getFile(airborn.path.dirname(path), function(contents) {
			if(contents && contents.hasOwnProperty(airborn.path.basename(path))) {
				request.error = new DOMError('FileExists', 'The file already exists.');
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
		var path = getDeviceStoragePath(this, name);
		var request = new DOMRequest();
		airborn.fs.getFile(path + '.history/', {codec: 'dir'}, function(contents, err) {
			if(err) {
				request.error = new DOMError('FileNotFound', "The file doesn't exist.");
				request.dispatchEvent(new Event('error'));
			} else {
				var key = Object.keys(contents).pop();
				request.result = new AsyncFile({name: path, type: contents[key].type, snapshotpath: path + '.history/' + key});
				request.dispatchEvent(new Event('success'));
			}
		});
		return request;
	};
	DeviceStorage.prototype.delete = function(name) {
		var path = getDeviceStoragePath(this, name);
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
		var prefix = getDeviceStoragePath(this, _prefix == null ? '' : _prefix);
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
						files.push({name: filePath, type: contents[name].type, path: filePath});
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
					Object.defineProperty(reader, 'result', {get: function() { return result; }});
					reader.dispatchEvent(new Event('load'));
				});
			} else {
				origMethod.apply(this, arguments);
			}
		};
	}
	extendFileReader('readAsText', function(file, callback) {
		airborn.fs.getFile(file.snapshotpath || file.path, callback);
	});
	extendFileReader('readAsDataURL', function(file, callback) {
		airborn.fs.getFile(file.snapshotpath || file.path, {codec: 'base64url'}, function(contents) {
			callback('data:' + file.type + ';base64,' + contents);
		});
	});
	
	navigator.getDeviceStorage = function(storageName) {
		if(arguments.length !== 1) throw new TypeError('navigator.getDeviceStorage takes exactly one argument: storageName.');
		if(!storageLocations[storageName]) return null;
		return new DeviceStorage(storageName);
	};
	
	function Storage_() {}
	Storage_.prototype.getItem = function(name) {
		return this.hasOwnProperty(name) ? this[name] : undefined;
	};
	Storage_.prototype.setItem = function(name, value) {
		return (this[name] = value);
	};
	var localStorage = new Storage_();
	try {
		Object.defineProperty(window, 'localStorage', {
			get: function() {
				return localStorage;
			}
		});
	} catch(e) {
		Object.defineProperty(window, 'airborn_localStorage', {
			get: function() {
				return localStorage;
			}
		});
	}
	
	Object.defineProperty(document, 'airborn_cookie', {value: ''});
	Object.defineProperty(Object.prototype, 'airborn_cookie', {get: function() { return this['cookie'] }, set: function(value) { return this['cookie'] = value }});
	
	function createLocationUrl(url) {
		var urlobj = new URL('airborn:' + root);
		return {
			hash: urlobj.hash,
			host: '',
			hostname: '',
			href: url,
			origin: 'null',
			pathname: urlobj.pathname,
			port: '',
			protocol: '',
			search:  urlobj.search
		};
	}
	var locationurl = createLocationUrl(root);
	Object.defineProperty(window, 'airborn_location', {get: function() {
		return locationurl;
	}});
	Object.defineProperty(Object.prototype, 'airborn_location', {get: function() { return this['location'] }, set: function(value) { return this['location'] = value }});
	
	History.prototype.pushState = History.prototype.replaceState = function(state, title, url) {
		locationurl = createLocationUrl(url);
	};
	window.addEventListener('hashchange', function() {
		locationurl.hash = window['location'].hash;
		locationurl.href = locationurl.pathname + locationurl.search + locationurl.hash;
	});
	
	Object.defineProperty(window, 'airborn_top', { value: (function() {
		var top = window;
		while(top.parent.parent.parent.parent !== top.parent.parent.parent) top = top.parent;
		return top;
	})() });
	Object.defineProperty(Object.prototype, 'airborn_top', {get: function() { return this['top'] }, set: function(value) { return this['top'] = value }});
	
	function Worker_() {}
		Worker_.prototype = new EventTarget();
		Worker_.prototype.postMessage = function() {
		console.log('postMessage', this, arguments);
	}
	var _Worker = window.Worker;
	window.Worker = function(url) {
		var worker = new Worker_();
		airborn.fs.prepareUrl(url, {rootParent: root, relativeParent: root, webworker: true}, function(url) {
			var _worker = new _Worker(url);
			console.log(worker);
			_worker.addEventListener('message', worker.dispatchEvent.bind(worker));
		});
		return worker;
	};
})();