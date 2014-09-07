/*global _, jsyaml, XDomainRequest, S3Upload, JSZip, getFile: true, putFile: true, prepareFile: true, prepareString: true, prepareUrl: true, startTransaction: true, endTransaction: true, setTitle: true, resolve: true, basename: true, deepEquals: true */

var inTransaction = false;
var transaction = null;
var transactionDate;
var filesToPut;
function startTransaction() {
	inTransaction = true;
	if(!transaction) {
		transaction = {};
		transactionDate = new Date();
		filesToPut = 0;
	}
}
window.startTransaction = startTransaction;
function endTransaction() {
	console.trace(inTransaction, filesToPut, transaction);
	if(!transaction) return;
	inTransaction = false;
	if(filesToPut) return;
	var _transaction = transaction;
	transaction = null;
	Object.keys(_transaction).forEach(function(path) {
		_transaction[path][1].finishingTransaction = true;
		putFile.apply(window, _transaction[path]);
	});
}
window.endTransaction = endTransaction;

var sjcl = parent.sjcl;
var private_key = parent.private_key;
var private_hmac = parent.private_hmac;
var files_hmac = parent.files_hmac;
var S3Prefix = parent.S3Prefix;
var password = parent.password;
var files_key = parent.files_key;

sjcl.codec.raw = sjcl.codec.sjcl = {
	fromBits: function(bits) { return bits; },
	toBits: function(bits) { return bits; }
};

var utf8String_fromBits = sjcl.codec.utf8String.fromBits; // `sjcl.codec.utf8String.fromBits` will get overwritten in our getFile hackery.
var currentFilename;
sjcl.codec.dir = sjcl.codec.yaml = {
	fromBits: function(bits) { return jsyaml.safeLoad(utf8String_fromBits(bits), {filename: currentFilename}); },
	toBits: function(obj) { return sjcl.codec.utf8String.toBits(jsyaml.safeDump(obj, {flowLevel: 1})); }
};
sjcl.codec.dir.fromBits = function(bits) {
	var utf8 = utf8String_fromBits(bits);
	if(!/^.+: {.*}$/m.test(utf8)) {
		var obj = {};
		utf8.split('\n').forEach(function(line) {
			if(line) obj[line] = {};
		});
		return obj;
	}
	return jsyaml.safeLoad(utf8, {filename: currentFilename});
};

/** @namespace ArrayBuffer */
sjcl.codec.arrayBuffer = {
	/* jshint ignore:start *//* jscs: disable */
	/** Convert from a bitArray to an ArrayBuffer.
	 * Will default to 8byte padding if padding is undefined*/
	fromBits: function (arr, padding, padding_count) {
		var out, i, ol, tmp, smallest;
		padding_count = padding_count || 8
		
		ol = sjcl.bitArray.bitLength(arr)/8
		
		//check to make sure the bitLength is divisible by 8, if it isn't
		//we can't do anything since arraybuffers work with bytes, not bits
		if ( sjcl.bitArray.bitLength(arr)%8 !== 0 ) {
			throw new sjcl.exception.invalid("Invalid bit size, must be divisble by 8 to fit in an arraybuffer correctly")
		}
		
		if (padding && ol%padding_count !== 0){
			ol += padding_count - (ol%padding_count)
		}
		
		
		//padded temp for easy copying
		tmp = new DataView(new ArrayBuffer(arr.length*4))
		for (i=0; i<arr.length; i++) {
			tmp.setUint32(i*4, (arr[i]<<32)) //get rid of the higher bits
		}
		
		//now copy the final message if we are not going to 0 pad
		out = new DataView(new ArrayBuffer(ol))
		
		//save a step when the tmp and out bytelength are ===
		if (out.byteLength === tmp.byteLength){
			return tmp.buffer
		}
		
		smallest = tmp.byteLength < out.byteLength ? tmp.byteLength : out.byteLength
		for(i=0; i<smallest; i++){
			out.setUint8(i,tmp.getUint8(i))
		}
		
		
		return out.buffer
	},
	
	toBits: function (buffer) {
		var i, out=[], len, inView, tmp;
		inView = new DataView(buffer);
		len = inView.byteLength - inView.byteLength%4;
		
		for (var i = 0; i < len; i+=4) {
			out.push(inView.getUint32(i));
		}
		
		if (inView.byteLength%4 != 0) {
			tmp = new DataView(new ArrayBuffer(4));
			for (var i = 0, l = inView.byteLength%4; i < l; i++) {
				//we want the data to the right, because partial slices off the starting bits
				tmp.setUint8(i+4-l, inView.getUint8(len+i)); // big-endian,
			}
			out.push(
				sjcl.bitArray.partial( (inView.byteLength%4)*8, tmp.getUint32(0) )
			);
		}
		return out;
	},
	
	
	
	/** Prints a hex output of the buffer contents, akin to hexdump **/
	hexDumpBuffer: function(buffer){
		var stringBufferView = new DataView(buffer)
		var string = ''
		var pad = function (n, width) {
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
		}
		
		for (var i = 0; i < stringBufferView.byteLength; i+=2) {
			if (i%16 == 0) string += ('\n'+(i).toString(16)+'\t')
			string += ( pad(stringBufferView.getUint16(i).toString(16),4) + ' ')
		}
		
		if ( typeof console === undefined ){
			console = console || {log:function(){}} //fix for IE
		}
		console.log(string.toUpperCase())
	}
	/* jshint ignore:end *//* jscs: enable */
};

window.getFileCache = {};
window.getRequestCache = {};
window.getFile = function(file, options, callback) {
	if(typeof options === 'function' || options === undefined) {
		callback = options;
		options = {};
	}
	if(callback === undefined) {
		callback = function() {};
	}
	
	if(handleFromCache()) return;
	function handleFromCache() {
		var cache = window.getFileCache[file];
		if(cache) {// && Date.now() - cache.ts < 2000) {
			if((options.codec || 'utf8String') === (cache.codec || 'utf8String')) {
				callback(cache.contents);
			} else {
				currentFilename = file;
				callback(sjcl.codec[options.codec || 'utf8String'].fromBits(sjcl.codec[cache.codec || 'utf8String'].toBits(cache.contents)));
			}
			return true;
		}
	}
	
	var requestCache = window.getRequestCache[file];
	var req;
	if(requestCache) {
		req = requestCache;
		cb(); // For some reason browsers slightly delay firing readystatechange, so we check if it's already finished.
	} else {
		req = window.getRequestCache[file] = new XMLHttpRequest();
		console.log('GET', file);
	}
	req.addEventListener('readystatechange', cb);
	if(!requestCache) {
		var is_bootstrap_file = file.substr(0, 4) === '/key' || file.substr(0, 5) === '/hmac';
		req.open('GET', 'object/' + sjcl.codec.hex.fromBits((is_bootstrap_file ? private_hmac : files_hmac).mac(file)));
		req.send(null);
	}
	
	function cb() {
		if(req.readyState === 4) {
			window.getRequestCache[file] = null;
			if(handleFromCache()) return; // We might've PUT a newer version by now.
			if(req.status === 200) {
				var fromBits = sjcl.codec.utf8String.fromBits;
				if(options.codec) {
					sjcl.codec.utf8String.fromBits = sjcl.codec[options.codec].fromBits;
				}
				currentFilename = file;
				var decrypted;
				try {
					decrypted = sjcl.decrypt(files_key, req.responseText);
				} catch(e) {
					try {
						decrypted = sjcl.decrypt(private_key, req.responseText);
					} catch(e2) {
						decrypted = sjcl.decrypt(password, req.responseText);
					}
				}
				if(options.codec) {
					sjcl.codec.utf8String.fromBits = fromBits;
				}
				window.getFileCache[file] = {codec: options.codec, contents: decrypted, ts: Date.now()};
				callback(decrypted);
			} else {
				console.error('GET', file);
				callback(null, {status: req.status, statusText: req.statusText});
			}
		}
	}
};

var fileChangeListeners = [];
window.listenForFileChanges = function(fn) {
	fileChangeListeners.push(fn);
};
function notifyFileChange(path, reason) {
	fileChangeListeners.forEach(function(fn) {
		fn(path, reason);
	});
}

/*function guid() {
	var d = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random()*16)%16 | 0;
		d = Math.floor(d/16);
		return (c=='x' ? r : (r&0x7|0x8)).toString(16);
	});
	return uuid;
}*/

function extend(target) {
	[].slice.call(arguments, 1).forEach(function(obj) {
		_.each(obj, function(value, key) {
			if(value != null && value.constructor === Object) {
				if(target.hasOwnProperty(key)) extend(target[key], value);
				else target[key] = value;
			}
			else if(value === undefined) delete target[key];
			else target[key] = value;
		});
	});
	return target;
}

/* jshint ignore:start *//* jscs: disable */
function deepEquals(a, b) {
	if (b == a) return true;
	
	var p;
	for (p in a) {
		if (typeof (b[p]) == 'undefined') { return false; }
	}
	
	for (p in a) {
		if (a[p]) {
			switch (typeof (a[p])) {
				case 'object':
					if (!deepEquals(a[p], b[p])) { return false; } break;
				default:
					if (a[p] !== b[p]) { return false; }
			}
		} else {
			if (b[p])
				return false;
		}
	}
	
	for (p in b) {
		if (typeof (a[p]) == 'undefined') { return false; }
	}
	
	return true;
}
/* jshint ignore:end *//* jscs: enable */

function debounce(fn, time, obj) {
	if(obj.timeout) clearTimeout(obj.timeout);
	obj.timeout = setTimeout(function() {
		delete obj.timeout;
		fn();
	}, time);
}
var debounceObj = {};
window.putFile = function(file, options, contents, attrs, callback, progress) {
	if(!options.finishingTransaction) window.startTransaction();
	debounce(window.endTransaction, 100, debounceObj);
	
	if(typeof contents === 'function' || contents === undefined) {
		progress = attrs;
		callback = contents;
		contents = options;
		options = {};
		attrs = {};
	} else if(typeof attrs === 'function' || attrs === undefined) {
		if(_.isObject(options)) { // If contents is an object, you also need to pass options = {codec: 'dir'}.
			progress = callback;
			callback = attrs;
			attrs = {};
		} else if(_.isObject(contents)) { // 2nd argument is not an object, assume that's the contents.
			progress = callback;
			callback = attrs;
			attrs = contents;
			contents = options;
			options = {};
		}
	}
	
	var now = attrs.edited || window.transactionDate || new Date();
	
	var size, is_new_file;
	if(!options.finishingTransaction && file !== '/') {
		// Add file to parent directories
		var slashindex = file.lastIndexOf('/', file.length - 2) + 1;
		var dirname = file.substr(0, slashindex);
		var basename = file.substr(slashindex);
		filesToPut++;
		getFile(dirname, {codec: 'dir'}, function(dircontents) {
			if(!dircontents) dircontents = {};
			
			size = basename.substr(-1) === '/' ? undefined : sjcl.bitArray.bitLength(sjcl.codec[options.codec || 'utf8String'].toBits(contents)) / 8;
			is_new_file = !dircontents.hasOwnProperty(basename);
			var newattrs = extend({}, is_new_file ? {created: now} : dircontents[basename], {edited: now, size: size}, attrs);
			if(!dircontents.hasOwnProperty(basename) || !deepEquals(newattrs, dircontents[basename])) {
				var newdircontents = extend({}, dircontents); // Don't modify getFileCache entry.
				newdircontents[basename] = newattrs;
				putFile(dirname, {codec: 'dir'}, newdircontents, {edited: now});
			}
			filesToPut--;
			if(transaction && !inTransaction && !filesToPut) window.endTransaction();
		});
	}
	
	if(!/\.history\//.test(file)) {
		window.getFileCache[file] = {codec: options.codec, contents: contents, ts: Date.now()};
		// Add to file history
		filesToPut++;
		getFile(file + '.history/', {codec: 'dir'}, function(history) {
			var histname = file + '.history/v' + (history ? Math.max.apply(Math, Object.keys(history).map(function(name) { return parseInt(name.substr(1), 10); })) + 1 : 1) + file.match(/(\/|\.\w+)?$/)[0];
			putFile(histname, {codec: options.codec}, contents, {edited: now}, function(histid) {
				
				// Copy history file to destination
				var is_bootstrap_file = file.substr(0, 4) === '/key' || file.substr(0, 5) === '/hmac';
				var id = S3Prefix + '/' + sjcl.codec.hex.fromBits((is_bootstrap_file ? private_hmac : files_hmac).mac(file));
				var s3upload = _.extend(Object.create(S3Upload.prototype), {
					s3_sign_put_url: '/sign_s3_copy_' + histid,
					s3_object_name: id,
					method: 'PUT',
					prepareXHR: function(xhr) {
						xhr.setRequestHeader('x-amz-acl', 'public-read');
						xhr.setRequestHeader('x-amz-copy-source', '/laskya-cloud/' + histid);
					},
					onProgress: function() {}, // (percent, message)
					onFinishS3Put: function() { // (public_url)
						if(callback) callback();
						notifyFileChange(file, is_new_file ? 'created' : 'modified');
					},
					onError: function(status) {
						console.log('error', status);
					}
				});
				s3upload.uploadFile({type: ''});
				
			}, progress);
			filesToPut--;
			if(transaction && !inTransaction && !filesToPut) window.endTransaction();
		});
	} else {
		if(transaction) {
			transaction[file] = [file, options, contents, attrs, callback, progress];
		} else {
			// Upload file
			console.log('PUT', file);
			var is_bootstrap_file = file.substr(0, 4) === '/key' || file.substr(0, 5) === '/hmac';
			var id = S3Prefix + '/' + sjcl.codec.hex.fromBits((is_bootstrap_file ? private_hmac : files_hmac).mac(file));
			if(options.codec) contents = sjcl.codec[options.codec].toBits(contents);
			var blob = new Blob([sjcl.encrypt(is_bootstrap_file ? private_key : files_key, contents)], {type: 'binary/octet-stream'});
			var blobsize = blob.size;
			var s3upload = _.extend(Object.create(S3Upload.prototype), {
				s3_sign_put_url: '/sign_s3_post_' + blobsize,
				s3_object_name: id,
				method: 'POST',
				onProgress: function(percent, message) {
					console.log('Upload progress: ' + percent + '% ' + message, file);
					var _size = (size === undefined ? 1 : size);
					if(progress) progress(percent / 100 * _size, _size);
				},
				onFinishS3Put: function() { // (public_url)
					if(callback) callback(id);
				},
				onError: function(status) {
					console.log('error', status);
				}
			});
			s3upload.uploadFile(blob);
		}
	}
};

var mimeTypes = {
	js: 'text/javascript',
	css: 'text/css',
	png: 'image/png',
	html: 'text/html'
};

function resolve(from, to, rootParent) {
	if(to === '') return from;
	if(to[0] === '/') return resolve(rootParent, to.substr(1));
	var resolved = from.replace(/[^/]*$/, '') + to;
	var rParentOrCurrent = /([^./]+\/\.\.\/|\/\.(?=\/))/g;
	while(rParentOrCurrent.test(resolved)) resolved = resolved.replace(rParentOrCurrent, '');
	return resolved;
}
function basename(path) {
	return path.substr(path.lastIndexOf('/') + 1);
}

window.prepareFile = function(file, options, callback, progress, createObjectURL) {
	var _options = {};
	Object.keys(options).forEach(function(key) {
		_options[key] = options[key];
	});
	var is_html = file.substr(-5) === '.html';
	if(is_html && options.bootstrap !== false) {
		_options.bootstrap = false;
		var inline_linenr = +(new Error().stack.match(/[:@](\d+)/) || [])[1] + 2;
		var data = [
			'<!DOCTYPE html>',
			'<html>',
			'<head>',
			'	<meta charset="utf-8">',
			'</head>',
			'<body>',
			'Loading…',
			'<script>',
			'window.addEventListener("message", function(message) {',
			'	if(message.data.action === "createObjectURL") {',
			'		var arg = message.data.args[0];',
			'		window.top.postMessage({inReplyTo: message.data.messageID, result: [URL.createObjectURL(new Blob([arg.data], {type: arg.type}))]}, "*");',
			'		return;',
			'	}',
			'	if(!message.data.progress) {',
			'		document.write(message.data.result[0]);',
			'	}',
			'});',
			'window.top.postMessage({action: "fs.prepareFile", args: ' + JSON.stringify([file, _options]) + ', key: ' + JSON.stringify(getAPIKey()) + '}, "*");',
			'</script>',
			'</body>',
			'</html>',
			'<!--# sourceURL = /Core/core.js > inline at line ' + inline_linenr + ' -->'
		].join('\n');
		callback(data);
		
		// Bogus prepareFile which exists solely for the calls to `progress`.
		prepareFile(file, _options, function() {}, progress, function(data, callback) { callback(''); });
	} else if(is_html && (options.compat !== false || options.csp)) {
		_options.compat = false;
		prepareFile(file, _options, function(c, err) {
			if(err) return callback('');
			prepareString('\n<script src="/Core/compat.js"></script>\n', {rootParent: '/'}, function(compat, err) {
				callback((options.csp ? '<meta http-equiv="Content-Security-Policy" content="' + options.csp.replace(/"/g, '&quot;') + '">' : '') + c.replace(/^\uFEFF/, '').replace(/(?=<script|<\/head)/i, compat), err);
			}, function() {}, createObjectURL);
		}, progress, createObjectURL);
		getFile('/Core/compat.js');
	} else {
		getFile(file, function(contents, err) {
			if(err) return callback('');
			_options.rootParent = _options.relativeParent = file;
			delete _options.bootstrap;
			delete _options.compat;
			prepareString(contents, _options, callback, progress, createObjectURL);
		});
	}
};

window.prepareString = function(contents, options, callback, progress, createObjectURL) {
	var i = 0,
		match, matches = [],
		rURL = /((?:(?:src|href|icon)\s*=|url\()\s*(["']?))(.*?)(?=["') >])(\2\s*\)?)/,
		rSchema = /^([a-z]+:|\/\/)/i,
		filesDownloaded = 0;
	while((match = contents.substr(i).match(rURL))) {
		if(!rSchema.test(match[3])) {
			matches.push(match);
		}
		
		i += match.index;
		match.pos = i;
		i++;
	}
	if(matches.length) {
		matches.forEach(function(match) { // We don't process matches immediately for when getFile calls callback immediately.
			prepareUrl(match[3], options, function(data, err) {
				if(!err) match[5] = data;
				filesDownloaded++;
				updateProgress();
				if(filesDownloaded === matches.length) {
					matches.reverse().forEach(function(match) {
						if(match[5]) contents = contents.substr(0, match.pos + match[1].length) + match[5] + contents.substr(match.pos + match[0].length - match[4].length);
					});
					callback(contents);
				}
			}, function(done, total) {
				match.progressDone = done;
				match.progressTotal = total;
				updateProgress();
			}, createObjectURL);
		});
	} else {
		callback(contents);
	}
	function updateProgress() {
		if(!progress) return;
		var done = filesDownloaded;
		var total = matches.length;
		matches.forEach(function(match) {
			if('progressDone' in match) {
				done += match.progressDone; 
				total += match.progressTotal;
			}
		});
		progress(done, total);
	}
};

var rArgs = /[?#].*$/;
window.prepareUrl = function(url, options, callback, progress, createObjectURL) {
	var args = (url.match(rArgs) || [''])[0];
	url = url.replace(rArgs, '');
	if(url === '') {
		callback(args);
		return;
	}
	var extension = url.substr(url.lastIndexOf('.') + 1);
	var path = resolve(options.relativeParent, url, options.rootParent);
	if(extension === 'html' || extension === 'css') prepareFile(path, {bootstrap: options.bootstrap, compat: options.compat}, cb, progress, createObjectURL);
	else getFile(path, {codec: extension === 'js' ? undefined : 'sjcl'}, cb);
	
	function cb(c, err) {
		var data;
		if(!err) {
			if(navigator.userAgent.match(/Firefox\/\d+/)) {
				if(extension === 'js') data = ',' + encodeURIComponent(c + '\n//# sourceURL=') + path;
				else if(extension === 'css') data = ',' + encodeURIComponent(c + '\n/*# sourceURL=' + path + ' */');
				else if(extension === 'html') data = ',' + encodeURIComponent(c + '\n<!--# sourceURL=' + path + ' -->');
				else if(typeof c === 'string') data = ',' + encodeURIComponent(c);
				else data = ';base64,' + sjcl.codec.base64.fromBits(c);
				data = 'data:' + mimeTypes[extension] + ';filename=' + encodeURIComponent(path + args) + ';charset=utf-8' + data;
				callback(data + args);
			} else {
				if(extension === 'js') data = c + '\n//# sourceURL=' + path;
				else if(extension === 'css') data = c + '\n/*# sourceURL=' + path + ' */';
				else if(extension === 'html') data = c + '\n<!--# sourceURL=' + path + ' -->';
				else if(typeof c === 'string') data = c;
				else data = sjcl.codec.arrayBuffer.fromBits(c);
				createObjectURL({data: data, type: mimeTypes[extension], name: path + args}, callback);
			}
		} else {
			callback(null, err);
		}
	}
};

getFile('/Core/lodash.min.js', eval);
getFile('/Core/s3upload.js', eval);
getFile('/Core/js-yaml.js', eval);
getFile('/Core/3rdparty/jszip/jszip.min.js', eval);

var mainWindow;

window.openWindow = function(path, document, container) {
	prepareUrl(path, {compat: false, rootParent: '/'}, function(url) {
		var div = document.createElement('div');
		div.className = 'window';
		var iframe = document.createElement('iframe'); 
		iframe.sandbox = 'allow-scripts';
		iframe.src = url;
		iframe.scrolling = 'no';
		div.appendChild(iframe);
		container.appendChild(div);
		mainWindow = iframe.contentWindow;
	}, function() {}, function(arg, callback) {
		callback(URL.createObjectURL(new Blob([arg.data], {type: arg.type})));
	});
};

var title = document.createElement('title');
document.head.appendChild(title);
window.setTitle = function(t) {
	title.textContent = t ? t + ' - Airborn' : 'Airborn';
};
setTitle('');

var icon = document.createElement('link');
icon.rel = 'shortcut icon';
document.head.appendChild(icon);
window.setIcon = function(href) {
	icon.href = href;
};

function corsReq(url, callback, responseType) {
	var req = new XMLHttpRequest();
	if('withCredentials' in req) {
		req.open('GET', url, true);
	} else if(typeof XDomainRequest !== 'undefined') {
		req = new XDomainRequest();
		req.open('GET', url);
	} else {
		throw new Error('CORS not supported.');
	}
	req.onload = callback;
	if(responseType) req.responseType = responseType;
	req.send();
}

window.installPackage = function(manifest_url, params, callback) {
	if(typeof params === 'function') {
		callback = params;
		params = {};
	}
	corsReq(manifest_url, function() {
		var manifest = JSON.parse(this.responseText);
		corsReq(manifest.package_path, function() {
			var zip = new JSZip(this.response);
			var keys = Object.keys(zip.files);
			var uploaded = 0;
			var total = 0;
			var target = '/Apps/' + basename(manifest.package_path).replace('-' + manifest.version, '').replace('.zip', '') + '/';
			keys.forEach(function(path) {
				var file = zip.files[path];
				if(!file.options.dir) {
					total++;
					putFile(target + path, {codec: 'arrayBuffer'}, file.asArrayBuffer(), function() {
						uploaded++;
						if(uploaded === total) {
							callback({installState: 'installed'});
						}
					});
				}
			});
		}, 'arraybuffer');
	});
};

function update() {
	corsReq('http://airborn-update-stage.herokuapp.com/current-id', function() {
		var currentId = this.response;
		getFile('/Core/version-id', function(contents) {
			if(currentId !== contents) {
				corsReq('http://airborn-update-stage.herokuapp.com/current', function() {
					var zip = new JSZip(this.response);
					var keys = Object.keys(zip.folder('airborn').files);
					var target = '/Core/';
					keys.forEach(function(path) {
						var file = zip.files[path];
						if(!file.options.dir) {
							putFile(target + path.replace(/^airborn\//, ''), {codec: 'arrayBuffer'}, file.asArrayBuffer());
						}
					});
				}, 'arraybuffer');
			}
		});
	});
}
setTimeout(update, 10000); // After ten seconds
setInterval(update, 3600000); // Each hour

window.logout = function() {
	sessionStorage.clear();
	localStorage.clear();
	document.cookie = document.cookie.split('=')[0] + '=';
	window.location.reload();
};

var APIKeys = [];
function getAPIKey() {
	var array = new Uint32Array(10);
	window.crypto.getRandomValues(array);
	var key = Array.prototype.slice.call(array).toString();
	APIKeys.push(key);
	return key;
}
function isValidAPIKey(key) {
	return APIKeys.indexOf(key) !== -1;
}

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
//# sourceURL=/Core/core.js