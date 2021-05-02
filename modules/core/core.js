/* This file is licensed under the Affero General Public License. */
/*global jsyaml, cherow, estraverse, Promise, io, File, XDomainRequest, JSZip, getFile: true, putFile: true, prepareFile: true, prepareString: true, prepareUrl: true, startTransaction: true, endTransaction: true, deepEquals: true */

var core_version = 3;

var settings = {};

var inTransaction = false;
var transaction = null;
var transactionDate;
var transactionIdPrefix;
var filesToPut;
window.startTransaction = function() {
	inTransaction = true;
	if(!transaction) {
		transaction = {};
		transactionDate = new Date();
		transactionIdPrefix = Math.round(Math.random() * Date.now()).toString(16);
		filesToPut = 0;
	}
};
window.endTransaction = function() {
	console.log(inTransaction, filesToPut, transaction);
	if(!transaction) return;
	inTransaction = false;
	if(filesToPut) return;
	var _transaction = transaction;
	transaction = null;
	var transactions = {};
	var _transactionPaths = Object.keys(_transaction);
	_transactionPaths.forEach(function(path) {
		var transactionId =
			transactionIdPrefix +
			(_transaction[path][1].S3Prefix ? ':' + _transaction[path][1].S3Prefix : '') +
			(_transaction[path][1].transactionId ? ':' + _transaction[path][1].transactionId : '');
		_transaction[path][1].fullTransactionId = transactionId;
		if(!transactions[transactionId]) {
			transactions[transactionId] = 0;
		}
		transactions[transactionId]++;
	});
	Object.keys(transactions).forEach(function(transactionId) {
		if(transactions[transactionId] > 1) {
			var req = new XMLHttpRequest();
			req.open('POST', '/transaction/add');
			req.setRequestHeader('Content-Type', 'application/json');
			req.send(JSON.stringify({
				transactionId: transactionId,
				messageCount: transactions[transactionId]
			}));
		}
	});
	var i = 0, len = _transactionPaths.length;
	const chunkSize = 50;
	(function transactionChunk() {
		var finished = 0;
		for(; i < len; i++) {
			let path = _transactionPaths[i];
			_transaction[path][1].finishingTransaction = true;
			_transaction[path][1].messageCount = transactions[_transaction[path][1].fullTransactionId];
			if(/\/\.history\//.test(_transaction[path][0])) {
				window.getFileCache[_transaction[path][0]] = {codec: _transaction[path][1].codec, contents: _transaction[path][2], ts: Date.now()};
			}
			let callback = _transaction[path][4];
			_transaction[path][4] = function(err) { // jshint ignore:line
				if(err && err.status === 403 && !_transaction[path][1].S3Prefix) {
					setTimeout(function() {
						putFile.apply(window, _transaction[path]);
					}, 5000);
					relogin();
					return;
				}
				if(!err && ++finished === chunkSize) {
					transactionChunk();
				}
				callback.apply(this, arguments);
			};
			putFile.apply(window, _transaction[path]);
			if((i + 1) % chunkSize === 0) {
				i++;
				break;
			}
		}
	})();
};

var sjcl = parent.sjcl;
var pako = parent.pako;
var private_key = parent.private_key;
var private_hmac = parent.private_hmac;
var files_hmac = parent.files_hmac;
var password = parent.password;
var files_key = parent.files_key;
var account_info = parent.account_info;
var S3Prefix = parent.S3Prefix;

var arrayBuffer_fromBits = sjcl.codec.arrayBuffer.fromBits;
sjcl.codec.arrayBuffer.fromBits = function(bits, padding) {
	return arrayBuffer_fromBits(bits, !!padding); // Default to no padding.
};

var codec = {};

codec.raw = codec.arrayBuffer = {
	fromAB: function(ab) { return ab; },
	toAB: function(ab) { return ab; }
};

if(!window.TextDecoder) {
	window.TextDecoder = function() {};
	TextDecoder.prototype.decode = function(dataview) { return sjcl.codec.utf8String.fromBits(sjcl.codec.arrayBuffer.toBits(dataview.buffer)); };
}
if(!window.TextEncoder) {
	window.TextEncoder = function() {};
	TextEncoder.prototype.encode = function(str) { return {buffer: sjcl.codec.arrayBuffer.fromBits(sjcl.codec.utf8String.toBits(str))}; };
}
var decoder = new TextDecoder('utf8');
var encoder = new TextEncoder('utf8');
codec.utf8String = {
	fromAB: function(ab) { return decoder.decode(new DataView(ab)); },
	toAB: function(string) { return encoder.encode(string).buffer; }
};

codec.json = {
	toAB: function(obj) { return codec.utf8String.toAB(JSON.stringify(obj)); }
};
codec.prettyjson = {
	toAB: function(obj) { return codec.utf8String.toAB(JSON.stringify(obj, null, '\t')); }
};
codec.json.fromAB = codec.prettyjson.fromAB = function(ab) { return JSON.parse(codec.utf8String.fromAB(ab)); };

var currentFilename;
codec.dir = codec.yaml = {
	fromAB: function(ab) { return jsyaml.safeLoad(codec.utf8String.fromAB(ab), {filename: currentFilename}); },
	toAB: function(obj) { return codec.utf8String.toAB(jsyaml.safeDump(obj, {flowLevel: 1})); }
};
codec.dir.fromAB = function(ab) {
	var utf8 = codec.utf8String.fromAB(ab);
	if(utf8 !== '{}' && !/^.+: {.*}$/m.test(utf8)) {
		var obj = {};
		utf8.split('\n').forEach(function(line) {
			if(line) obj[line] = {};
		});
		return obj;
	}
	return jsyaml.safeLoad(utf8, {filename: currentFilename});
};

codec.base64 = {
	fromAB: function(ab) {
		var bytes = new Uint8Array(ab);
		var len = bytes.byteLength;
		var binary = new Array(len);
		for(var i = 0; i < len; i++) {
			binary[i] = String.fromCharCode(bytes[i]);
		}
		return btoa(binary.join(''));
	},
	toAB: function(string) {
		var binary = atob(string);
		var len = binary.length;
		var bytes = new Uint8Array(len);
		for(var i = 0; i < len; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes.buffer;
	}
};

var subtle = window.crypto.subtle || window.crypto.webkitSubtle;
var subtleKeys = {};
function encrypt(key, plaintext, params, callback) {
	try {
		if(!subtleKeys[key]) {
			subtleKeys[key] = subtle.importKey('raw', sjcl.codec.arrayBuffer.fromBits(key), {name: 'AES-CTR'}, false, ['encrypt', 'decrypt']);
		}
		subtleKeys[key].then(function(_key) {
			var iv = sjcl.codec.arrayBuffer.fromBits(sjcl.random.randomWords(4,0));
			var ivLength = iv.byteLength;
			var plaintextLength = plaintext.byteLength;
			var L = _computeL(plaintextLength, ivLength);
			var ctr = new Uint8Array(16);
			ctr[0] = L - 1;
			ctr.set(new Uint8Array(iv, 0, 15 - L), 1);
			var ks = 128;
			var adata = codec.json.toAB(params.adata);
			var ts = 64;
			var tag = _computeTag(key, plaintext, iv, adata, ts, plaintextLength, L);
			return Promise.all([
				subtle.encrypt({
					name: 'AES-CTR',
					counter: ctr,
					length: ks,
				}, _key, sjcl.codec.arrayBuffer.fromBits(tag)),
				subtle.encrypt({
					name: 'AES-CTR',
					counter: (ctr[15] = 1, ctr),
					length: ks,
				}, _key, plaintext)
			]).then(function(result) {
				var tag = result[0];
				var ct = result[1];
				var concat = new Uint8Array(ct.byteLength + tag.byteLength);
				concat.set(new Uint8Array(ct), 0);
				concat.set(new Uint8Array(tag), ct.byteLength);
				return JSON.stringify({
					adata: codec.base64.fromAB(adata),
					cipher: 'aes',
					ct: codec.base64.fromAB(concat),
					iter: params.iter != null ? params.iter : 1000,
					salt: params.salt,
					iv: codec.base64.fromAB(iv),
					ks: ks,
					ts: ts,
					v: 1
				});
			});
		}).then(callback, error);
	} catch(e) {
		error(e);
	}
	function error() {
		// Web Crypto or the algorithm may be unsupported, try sjcl.
		params.adata = params.adata ? sjcl.codec.arrayBuffer.toBits(codec.json.toAB(params.adata)) : [];
		callback(sjcl.encrypt(key, sjcl.codec.arrayBuffer.toBits(plaintext), params));
	}
}

function decrypt(key, str, outparams, callback) {
	try {
		if(!subtleKeys[key]) {
			subtleKeys[key] = subtle.importKey('raw', sjcl.codec.arrayBuffer.fromBits(key), {name: 'AES-CTR'}, false, ['encrypt', 'decrypt']);
		}
		subtleKeys[key].then(function(_key) {
			var obj = JSON.parse(str);
			var ct = codec.base64.toAB(obj.ct);
			var iv = codec.base64.toAB(obj.iv);
			var ivLength = iv.byteLength;
			var ts = obj.ts;
			var plaintextLength = ct.byteLength - ts / 8;
			var L = _computeL(plaintextLength, ivLength);
			var ctr = new Uint8Array(16);
			ctr[0] = L - 1;
			ctr.set(new Uint8Array(iv, 0, 15 - L), 1);
			var ks = obj.ks;
			var adata = codec.base64.toAB(obj.adata);
			return Promise.all([
				subtle.decrypt({
					name: 'AES-CTR',
					counter: ctr,
					length: ks,
				}, _key, new DataView(ct, plaintextLength)),
				subtle.decrypt({
					name: 'AES-CTR',
					counter: (ctr[15] = 1, ctr),
					length: ks,
				}, _key, new DataView(ct, 0, plaintextLength))
			]).then(function(result) {
				var tag = sjcl.codec.arrayBuffer.toBits(result[0]);
				var plaintext = result[1];
				var tag2 = _computeTag(key, plaintext, iv, adata, ts, plaintextLength, L);
				if(sjcl.bitArray.equal(tag, tag2)) {
					return cont();
				}
				if(plaintextLength % 16 === 0) {
					var paddedPlaintext = new Uint8Array(plaintextLength + 16);
					paddedPlaintext.set(new Uint8Array(plaintext), 0);
					var tag3 = _computeTag(key, paddedPlaintext.buffer, iv, adata, ts, plaintextLength, L);
					if(sjcl.bitArray.equal(tag, tag3)) {
						return cont();
					}
				}
				throw new sjcl.exception.corrupt("ccm: tag doesn't match");
				function cont() {
					if(obj.adata) outparams.adata = codec.json.fromAB(codec.base64.toAB(obj.adata));
					return plaintext;
				}
			});
		}).then(callback, error);
	} catch(e) {
		error(e);
	}
	function error(e) {
		// Web Crypto or the algorithm may be unsupported, try sjcl.
		var decrypted, error;
		try {
			decrypted = sjcl.decrypt(key, str, {raw: 1}, outparams);
		} catch(e2) {
			error = e;
		}
		if(error) {
			callback(null, error);
		} else {
			outparams.adata = outparams.adata.length ? codec.json.fromAB(sjcl.codec.arrayBuffer.fromBits(outparams.adata)) : undefined;
			callback(sjcl.codec.arrayBuffer.fromBits(decrypted));
		}
	}
}

function _computeL(plaintextLength, ivLength) {
	var L;
	for(L = 2; L < 4 && plaintextLength >>> 8 * L; L++) {}
	if(L < 15 - ivLength) {
		L = 15 - ivLength;
	}
	return L;
}

function _computeTag(key, plaintext, iv, adata, ts, plaintextLength, L) {
	var _sjcl_computeTag = sjcl.arrayBuffer.ccm.r; // Minified name.
	if(plaintextLength % 16 !== 0) {
		var paddedPlaintext = new Uint8Array(plaintextLength + (16 - plaintextLength % 16));
		paddedPlaintext.set(new Uint8Array(plaintext), 0);
		plaintext = paddedPlaintext.buffer;
	}
	var tag = _sjcl_computeTag(new sjcl.cipher.aes(key), plaintext, sjcl.codec.arrayBuffer.toBits(iv.slice(0, 15 - L)), sjcl.codec.arrayBuffer.toBits(adata), ts / 8, plaintextLength, L);
	return tag;
}

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
	const fromlive = file.startsWith('/Core/') || file.startsWith('/Apps/firetext/') || file.startsWith('/Apps/strut/');
	
	if((options.S3Prefix && options.S3Prefix !== window.S3Prefix) || options.object) {
		options.cache = false;
	}
	if(handleFromCache()) return;
	function handleFromCache() {
		if(options.cache === false) return;
		var cache = window.getFileCache[file];
		if(cache) {// && Date.now() - cache.ts < 2000) {
			if((options.codec || 'utf8String') === (cache.codec || 'utf8String')) {
				callback(cache.contents);
			} else {
				currentFilename = file;
				var decrypted;
				try {
					decrypted = codec[options.codec || 'utf8String'].fromAB(codec[cache.codec || 'utf8String'].toAB(cache.contents));
				} catch(e) {
					callback(null, {status: 0, statusText: e.message});
					return true;
				}
				callback(decrypted);
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
		req.open('GET', fromlive ? '/v2/live' + file : getObjectUrl('GET', file, options));
		if (fromlive) req.responseType = 'arraybuffer';
		if(options.S3Prefix) { req.setRequestHeader('X-S3Prefix', options.S3Prefix); }
		req.send(null);
	}
	
	function cb() {
		if(req.readyState === 4) {
			window.getRequestCache[file] = null;
			if(handleFromCache()) return; // We might've PUT a newer version by now.
			if(req.status === 200) {
				currentFilename = file;
				var outparams = {};
				new Promise(function(resolve, reject) {
					if (fromlive) {
						resolve(req.response);
						return;
					}
					decrypt(options.password != null ? options.password : files_key, req.response, outparams, function(decrypted, e) {
						if(e) {
							decrypt(password, req.response, outparams, function(decrypted, e2) {
								if(e2) {
									reject(e);
								} else {
									resolve(decrypted);
								}
							});
						} else {
							resolve(decrypted);
						}
					});
				}).then(function(decrypted) {
					if(outparams.adata && outparams.adata.gz) {
						if(outparams.adata.rel) {
							return new Promise(function(resolve, reject) {
								getFile(outparams.adata.rel, {rawObjectLocation: true, codec: 'arrayBuffer'}, function(contents, e) {
									if(e) {
										reject(e);
										return;
									}
									resolve(pako.inflate(new Uint8Array(decrypted), {dictionary: _getRelativeDictionary(contents)}).buffer);
								});
							});
						}
						return pako.ungzip(new Uint8Array(decrypted)).buffer;
					}
					return decrypted;
				}).then(function(decompressed) {
					var encoded = codec[options.codec || 'utf8String'].fromAB(decompressed); // Can throw
					if(options.cache !== false) window.getFileCache[file] = {codec: options.codec, contents: encoded, ts: Date.now()};
					callback(encoded);
				}).catch(function(e) {
					callback(null, e.status ? e : {status: 0, statusText: e.message});
				});
			} else if(req.status === 403 && !options.S3Prefix) {
				relogin(function() {
					getFile(file, options, callback);
				});
			} else {
				console.error('GET', file);
				callback(null, {status: req.status, statusText: req.statusText});
			}
		}
	}
};

var relogging = false;
function relogin(callback) {
	if(relogging) {
		if(callback) setTimeout(callback, 100);
		return;
	}
	var creds = JSON.parse(localStorage.creds || sessionStorage.creds || '{}');
	if(window.login && creds && creds.username === window.username) {
		relogging = true;
		window.login(creds, null, function() {}, function() {
			relogging = false;
			if(callback) callback();
		}, function() {
			window.location.reload();
		});
	} else {
		window.location.reload();
	}
}

var fileChangeListeners = [];
window.listenForFileChanges = function(path, fn) {
	fileChangeListeners.push({
		path: path,
		fn: fn
	});
};
function notifyFileChange(path, reason) {
	fileChangeListeners.forEach(function(listener) {
		if(startsWith(listener.path, path)) listener.fn(path, reason);
	});
}

function getObjectUrl(method, file, options) {
	if(options.rawObjectLocation) {
		return '/object/' + file;
	}
	return '/object/' + (options.object || _getObjectLocation(file)) +
		// Chrome, when we prefetch a file and it returns a 404, caches
		// that 404 even for subsequent PUT requests (crbug.com/635350).
		// So we add a ? to the URL to make it actually request the PUT.
		(method === 'PUT' ? '?' : '') +
		'#' + (options.S3Prefix && options.S3Prefix !== S3Prefix && !options.demo ? '1' : '0') + '.' + file;
}
function _getObjectLocation(file) {
	var is_bootstrap_file = startsWith('/key', file) || startsWith('/hmac', file);
	return sjcl.codec.hex.fromBits((is_bootstrap_file ? private_hmac : files_hmac).mac(file));
}
function _getUploadHistory(file) {
	return account_info.tier >= 5 && startsWith('/Documents/', file);
}
window.getObjectLocation = function(file, fn) {
	var upload_history = _getUploadHistory(file);
	fn({
		S3Prefix: S3Prefix,
		object: _getObjectLocation(file),
		demo: location.pathname === '/demo' ? true : undefined,
		hist: upload_history ? true : undefined,
	});
};

/* https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/#2117523 */
window.guid = function() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
};

function extend(target) {
	[].slice.call(arguments, 1).forEach(function(obj) {
		Object.keys(obj).forEach(function(key) {
			var value = obj[key];
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
	if(!options.finishingTransaction) {
		startTransaction();
		debounce(endTransaction, 100, debounceObj);
	}
	
	if(typeof contents === 'function' || contents === undefined) {
		progress = attrs;
		callback = contents;
		contents = options;
		options = {};
		attrs = {};
	} else if(typeof attrs === 'function' || attrs === undefined) {
		if(options && typeof options === 'object') { // If contents is an object, you also need to pass options = {codec: 'dir'}.
			progress = callback;
			callback = attrs;
			attrs = {};
		} else if(contents && typeof contents === 'object') { // 2nd argument is not an object, assume that's the contents.
			progress = callback;
			callback = attrs;
			attrs = contents;
			contents = options;
			options = {};
		}
	}
	if(!callback) {
		callback = function() {};
	}
	
	var upload_history = _getUploadHistory(file);
	var now = attrs.edited || transactionDate || new Date();
	
	var size, is_new_file;
	if(!options.finishingTransaction && file !== '/' && !(options.S3Prefix && options.S3Prefix !== window.S3Prefix)) {
		// Add file to parent directories
		var slashindex = file.lastIndexOf('/', file.length - 2) + 1;
		var dirname = file.substr(0, slashindex);
		var basename = file.substr(slashindex);
		filesToPut++;
		getFile(dirname, {codec: 'dir'}, function(dircontents) {
			if(!dircontents) dircontents = {};
			
			size = basename.substr(-1) === '/' ? undefined : codec[options.codec || 'utf8String'].toAB(contents).byteLength;
			is_new_file = !dircontents.hasOwnProperty(basename);
			var newattrs = extend({}, is_new_file ? {created: now} : dircontents[basename], {edited: upload_history ? now : undefined, size: upload_history ? size : undefined}, attrs);
			if(!dircontents.hasOwnProperty(basename) || !deepEquals(newattrs, dircontents[basename])) {
				var newdircontents = extend({}, dircontents); // Don't modify getFileCache entry.
				newdircontents[basename] = newattrs;
				putFile(dirname, {codec: 'dir', transactionId: options.transactionId}, newdircontents, {edited: upload_history ? now : undefined});
			}
			filesToPut--;
			if(transaction && !inTransaction && !filesToPut) window.endTransaction();
		});
	}
	
	if((options.S3Prefix && options.S3Prefix !== window.S3Prefix) || options.object) {
		options.cache = false;
	}
	if(!/\/\.history\//.test(file)) {
		if(options.cache !== false) window.getFileCache[file] = {codec: options.codec, contents: contents, ts: Date.now()};
	}
	
	if(!/\.history\//.test(file) && upload_history && !options.finishingTransaction) {
		// Add to file history
		filesToPut++;
		getFile(file + '.history/', {codec: 'dir'}, function(history) {
			if(!history && !is_new_file) {
				// User switched tier
				filesToPut++;
				getFile(file, {codec: 'raw', cache: false}, function(old, err) {
					if(!err) {
						putFile(file + '.history/v0' + file.match(/(\/|\.\w+)?$/)[0], {codec: 'raw', transactionId: options.transactionId}, old, {created: undefined, edited: undefined});
					}
					filesToPut--;
					if(transaction && !inTransaction && !filesToPut) window.endTransaction();
				});
			}
			
			var histname =
				file + '.history/v' +
				(history ? Math.max.apply(Math, Object.keys(history).map(function(name) { return parseInt(name.substr(1), 10); })) + 1 : 1) +
				file.match(/(\/|\.\w+)?$/)[0];
			putFile(histname, {codec: options.codec, transactionId: options.transactionId, histprevname: history && file + '.history/' + Object.keys(history).pop()}, contents, {edited: now});
			filesToPut--;
			if(transaction && !inTransaction && !filesToPut) window.endTransaction();
		});
	}
	
	if(!options.finishingTransaction) {
		transaction[file] = [file, options, contents, attrs, callback, progress];
	} else {
		// Upload file
		console.log('PUT', file);
		contents = codec[options.codec || 'utf8String'].toAB(contents);
		var compressed, adata, histprevcached;
		if(options.histprevname && (histprevcached = window.getFileCache[options.histprevname])) {
			var histprevcachedbuf = codec[histprevcached.codec || 'utf8String'].toAB(histprevcached.contents);
			compressed = pako.deflate(new Uint8Array(contents), {dictionary: _getRelativeDictionary(histprevcachedbuf)}).buffer;
			if(compressed.byteLength * (histprevcached.chainLength + 1 || 2) < (histprevcached.compressionRatio || 1) * contents.byteLength) {
				// We try to ensure that to download a particular history
				// entry, you never have to download more than 2x the data
				// that that entry compressed on its own would take (1x for
				// the original version, compressed, and at most 1x for the
				// chain of versions relative to that). This calculation
				// ignores metadata, headers and latency in the
				// consideration.
				// However, we don't know what the size of the entry
				// compressed on its own would be, so we estimate based on
				// the compression ratio of the first version in the chain.
				(window.getFileCache[file] || {}).compressionRatio = histprevcached.compressionRatio;
				(window.getFileCache[file] || {}).chainLength = (histprevcached.chainLength || 0) + 1;
				contents = compressed;
				adata = {gz: 1, rel: _getObjectLocation(options.histprevname)};
			}
		}
		if(options.compress !== false && !adata) {
			compressed = pako.gzip(new Uint8Array(contents)).buffer;
			if(compressed.byteLength < contents.byteLength) {
				(window.getFileCache[file] || {}).compressionRatio = compressed.byteLength / contents.byteLength;
				contents = compressed;
				adata = {gz: 1};
			}
		}
		encrypt(options.password != null ? options.password : startsWith('/key', file) || startsWith('/hmac', file) ? private_key : files_key, contents, extend({adata: adata}, options.password != null ? {iter: options.iter, salt: options.salt} : {}), function(encrypted) {
			var blob = new Blob([encrypted], {type: 'binary/octet-stream'});
			var req = new XMLHttpRequest();
			req.open('PUT', getObjectUrl('PUT', file, options) + '?');
			var transactionId = options.fullTransactionId;
			var messageCount = options.messageCount;
			if(messageCount > 1) { req.setRequestHeader('X-Transaction-Id', transactionId); }
			if(options.ACL) { req.setRequestHeader('X-ACL', options.ACL); }
			if(options.S3Prefix) { req.setRequestHeader('X-S3Prefix', options.S3Prefix); }
			if(options.objectAuthkey) { req.setRequestHeader('X-Object-Authentication', options.objectAuthkey); }
			req.addEventListener('readystatechange', function() {
				if(this.readyState === 4) {
					if(this.status === 200) {
						callback();
						notifyFileChange(file, is_new_file ? 'created' : 'modified');
					} else {
						console.log('error', this);
						callback({status: this.status, statusText: this.statusText});
					}
				}
			});
			req.addEventListener('progress', function(evt) {
				if(evt.lengthComputable) {
					if(progress) progress(evt.loaded, evt.total);
				}
			});
			req.send(blob);
		});
	}
};

function _getRelativeDictionary(contents) {
	// "The current implementation of deflate will use at most the window size
	// minus 262 bytes of the provided dictionary." (http://zlib.net/manual.html#Advanced)
	// Furthermore, deflate uses the end of the dictionary, while for us, the
	// beginning of the previous version is more likely to be useful.
	
	// It's a shame that we can't make the window size larger than 32kB (the
	// size of `contents`, for example). Also, zlib/pako searches for matches in
	// the dictionary backwards, which is in this case of course less efficient
	// than searching forwards. These two things are the downside of the hack
	// that is using zlib with a dictionary for delta compression.
	return new Uint8Array(contents, 0, Math.min(contents.byteLength, (1 << 15) - 262));
}

var mimeTypes = {
	js: 'text/javascript',
	css: 'text/css',
	png: 'image/png',
	svg: 'image/svg+xml',
	woff: 'application/font-woff',
	html: 'text/html',
	htm: 'text/html',
	xhtml: 'text/html'
};

function startsWith(start, path) {
	return path.substr(0, start.length) === start;
}
function resolve(from, to, rootParent) {
	if(to === '') return from;
	if(to[0] === '/') return resolve(rootParent, to.substr(1), rootParent);
	var resolved = from.replace(/[^/]*$/, '') + to;
	var rParentOrCurrent = /([^./]+\/\.\.\/|\/\.(?=\/))/g;
	while(rParentOrCurrent.test(resolved)) resolved = resolved.replace(rParentOrCurrent, '');
	if(!startsWith(dirname(rootParent), resolved)) resolved = resolve(rootParent, resolved.substr(resolved.lastIndexOf('/', resolved.length - 2) + 1), rootParent);
	return resolved;
}
function dirname(path) {
	return path.substr(0, path.lastIndexOf('/') + 1);
}
function basename(path) {
	return path.substr(path.lastIndexOf('/') + 1);
}

function parallel(fns, callback) {
	var todo = fns.length,
		results = new Array(todo),
		error;
	fns.forEach(function(fn, i) {
		fns[i](function(data, err) {
			results[i] = data;
			error = err;
			if(!--todo) {
				callback.apply(this, results.concat(error));
			}
		});
	});
}

function getTopLocation(urlArgs) {
	var url = new URL(top.location);
	if(url.hash && urlArgs !== true) {
		url.hash = '#' + url.hash.slice(1).split(';').filter(function(part) {
			return part.split(':')[0] === urlArgs;
		}).map(function(part) {
			return part.replace(urlArgs + ':', '');
		}).join(';');
	}
	return url.href;
}

function isHTML(extension) {
	return extension === 'html' || extension === 'htm' || extension === 'xhtml';
}

window.prepareFile = function(file, options, callback, progress, createObjectURL) {
	var _options = {};
	Object.keys(options).forEach(function(key) {
		_options[key] = options[key];
	});
	var extension = file.substr(file.lastIndexOf('.') + 1);
	if(isHTML(extension) && options.bootstrap !== false) {
		_options.bootstrap = false;
		delete _options.apikey;
		delete _options.permissions;
		delete _options.csp;
		var inline_linenr = +(new Error().stack.match(/[:@](\d+)/) || [])[1] + 2;
		var data = [
			'<!DOCTYPE html>',
			'<html>',
			'<head>',
			'	<meta charset="utf-8">',
			'</head>',
			'<body>',
			'<script>',
			'if(window.parent !== window.top && window.matchMedia("only screen and (max-device-width: 640px)").matches) document.write("Loading…");',
			'document.rootParent = ' + JSON.stringify(options.rootParent) + ';',
			'document.relativeParent = ' + JSON.stringify(file) + ';',
			'document.filenames = {};',
			'document.apikey = ' + JSON.stringify(options.apikey || getAPIKey(options.permissions)) + ';',
			'document.top_location = ' + JSON.stringify(getTopLocation((options.permissions || {}).urlArgs)) + ';',
			'window.addEventListener("message", function(message) {',
			'	if(message.data.action === "createObjectURL") {',
			'		var arg = message.data.args[0], object;',
			'		try {',
			'			object = new File([arg.data], arg.name, {type: arg.type});',
			'		} catch(e) {',
			'			object = new Blob([arg.data], {type: arg.type});',
			'		}',
			'		var url = URL.createObjectURL(object);',
			'		document.filenames[url] = arg.name;',
			'		window.top.postMessage({inReplyTo: message.data.messageID, result: [url]}, "*");',
			'		return;',
			'	}',
			'	if(message.data.progress) {',
			'		window.parent.postMessage({action: "wm.setProgress", args: [message.data.result[0] / message.data.result[1]]}, "*");',
			'	} else {',
			'		document.open("text/html", "replace");',
			'		document.write(message.data.result[0]);',
			'		document.close();',
			'		window.parent.postMessage({action: "wm.hideProgress", args: []}, "*");',
			'	}',
			'});',
			'window.top.postMessage({action: "fs.prepareFile", args: ' + JSON.stringify([file, _options]) + ', apikey: document.apikey}, "*");',
			'window.parent.postMessage({action: "wm.showProgress", args: []}, "*");',
			'</script>',
			'</body>',
			'</html>',
			'<!--# sourceURL = /Core/modules/core/core.js > inline at line ' + inline_linenr + ' -->'
		].join('\n');
		callback(data);
	} else if(isHTML(extension) && (options.compat !== false || options.csp)) {
		_options.compat = false;
		delete _options.csp;
		parallel([
			function(cb) {
				prepareString('\n<script src="/Core/modules/webapi/webapi.js"></script>\n', {rootParent: '/', compat: false, selfContained: options.selfContained}, cb, function() {}, createObjectURL);
			},
			function(cb) {
				prepareFile(file, _options, cb, progress, createObjectURL);
			},
			function(cb) {
				getFile(options.appData + 'localStorage', function(localStorage) {
					cb(localStorage || '{}');
				});
			}
		], function(compat, c, localStorage, err) {
			if(err) return callback('');
			callback(c
				.replace(/^\uFEFF/, '')
				.replace(/(?=<script|<\/head|<!--|$)/i,
					'<script>' +
					'document.airborn_localStorage = ' + localStorage.replace(/<\/(script)/ig, '<\\\/$1') + ';' +
					(options.selfContained ? [
						'document.rootParent = ' + JSON.stringify(options.rootParent) + ';',
						'document.relativeParent = ' + JSON.stringify(file) + ';',
						'document.filenames = {};',
						'document.apikey = null;',
						'document.top_location = window.location;',
					].join('\n') : '') +
					'</script>' +
					(options.csp ? '<meta http-equiv="Content-Security-Policy" content="' + options.csp.replace(/"/g, '&quot;') + '">' : '') +
					compat
				)
			);
		});
	} else if(extension === 'js') {
		getFile(file, function(contents, err) {
			if(err) return callback('');
			if(options.compat !== false && !options.webworker) {
				var renames = {};
				renames.cookie = 'airborn_cookie';
				renames.location = 'airborn_location';
				renames.top = 'airborn_top';
				renames.parent = 'airborn_parent';
				if(navigator.userAgent.match(/Safari/)) { // Safari or Chrome
					renames.localStorage = 'airborn_localStorage';
					renames.src = 'airborn_src';
					renames.href = 'airborn_href';
					renames.pathname = 'airborn_pathname';
					renames.source = 'airborn_source';
					renames.contentWindow = 'airborn_contentWindow';
					if(!navigator.userAgent.match(/Chrome/)) { // Safari
						renames.indexedDB = 'airborn_indexedDB';
						renames.responseType = 'airborn_responseType';
						renames.readyState = 'airborn_readyState';
						renames.status = 'airborn_status';
						renames.response = 'airborn_response';
						renames.responseText = 'airborn_responseText';
						renames.innerHTML = 'airborn_innerHTML';
						renames.result = 'airborn_result';
					}
				}
				contents = renameGlobalVariables(file, contents, renames);
			}
			if(options.webworker) {
				_options.relativeParent = file;
				_options.rootParent = file.match(/\/Apps\/.+?\//)[0];
				prepareString(contents, _options, callback, progress, createObjectURL);
				return;
			}
			callback(contents);
		});
	} else {
		getFile(file, function(contents, err) {
			if(err) return callback('');
			_options.rootParent = _options.rootParent || file;
			_options.relativeParent = file;
			delete _options.bootstrap;
			delete _options.compat;
			prepareString(contents, _options, callback, progress, createObjectURL);
		});
	}
};

window.prepareString = function(contents, options, callback, progress, createObjectURL) {
	var i = 0,
		match, matches = [],
		rURL,
		rSchema = /^(?!airbornstorage)[a-z]+:/i,
		filesDownloaded = 0;
	if(options.webworker) {
		var rImportScripts = /importScripts\s*\([\s\S]*?\)/;
		while((match = contents.substr(i).match(rImportScripts))) {
			var j = 0,
				subject = match[0];
			rURL = /((["']))(.*?)(\2)()/;
			i += match.index;
			match.pos = i;
			while((match = subject.substr(j).match(rURL))) {
				if(!rSchema.test(match[3])) {
					matches.push(match);
				}
				
				j += match.index;
				match.pos = i + j;
				j++;
			}
			i++;
		}
	} else {
		rURL = /((?:\s(?:src|(?:xlink:)?href|icon|data)\s*=|[:,\s]url\()\s*(["']?))(.*?)(?=["') >])(\2\s*\)?)/;
		while((match = contents.substr(i).match(rURL))) {
			if(!rSchema.test(match[3])) {
				matches.push(match);
			}
			
			i += match.index;
			match.pos = i;
			i++;
		}
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
var rHMAC = /([?&#])hmac=(\w+)&?/;
window.prepareUrl = function(url, options, callback, progress, createObjectURL) {
	var args = (url.match(rArgs) || [''])[0];
	url = url.replace(rArgs, '');
	if(startsWith('//', url)) {
		callback('https:' + url + args);
		return;
	}
	if(url === '/') {
		url = ''; // resolve to relativeParent
	}
	var path;
	if(startsWith('airbornstorage:', url)) {
		/* Note: we specifically calculate the HMAC including the
		 * "airbornstorage:" bit to make sure that this HMAC can't be
		 * observed on the network.
		 */
		if(_getObjectLocation(url) !== (args.match(rHMAC) || [])[2]) {
			console.warn('Access denied: HMAC for airbornstorage: URL is incorrect:', url + args);
			callback(url + args);
			return;
		}
		path = url.substr(15);
	} else {
		path = resolve(options.relativeParent, url, options.rootParent);
	}
	if(args && path === options.relativeParent) {
		callback(args);
		return;
	}
	var extension = path.substr(path.lastIndexOf('.') + 1);
	var _options = {};
	Object.keys(options).forEach(function(key) {
		_options[key.replace(/^_/, '')] = options[key];
	});
	if(isHTML(extension) || extension === 'css' || extension === 'js' || extension === 'svg') prepareFile(path, _options, cb, progress, createObjectURL);
	else getFile(path, {codec: 'arrayBuffer'}, cb);
	
	function cb(c, err) {
		var data;
		if(!err) {
			if(options.selfContained || (navigator.userAgent.match(/Firefox\/(\d+)/) || [])[1] >= 51 || (navigator.userAgent.match(/Safari/) && !navigator.userAgent.match(/Chrome/))) {
				if(extension === 'js') data = ',' + encodeURIComponent(c + '\n//# sourceURL=') + path;
				else if(extension === 'css') data = ',' + encodeURIComponent(c + '\n/*# sourceURL=' + path + ' */');
				else if(isHTML(extension)) data = ',' + encodeURIComponent(c + '\n<!--# sourceURL=' + path + ' -->');
				else if(typeof c === 'string') data = ',' + encodeURIComponent(c);
				else data = ';base64,' + codec.base64.fromAB(c);
				data = 'data:' + mimeTypes[extension] + ';filename=' + encodeURIComponent(path) + ';charset=utf-8' + data;
				callback(data.replace(/'/g, '%27'));
			} else {
				if(extension === 'js') data = c + '\n//# sourceURL=' + path;
				else if(extension === 'css') data = c + '\n/*# sourceURL=' + path + ' */';
				else if(isHTML(extension)) data = c + '\n<!--# sourceURL=' + path + ' -->';
				else data = c; // string or arrayBuffer
				createObjectURL({data: data, type: mimeTypes[extension], name: path + args}, callback);
			}
		} else {
			callback(null, err);
		}
	}
};

getFile('/Core/lib/yaml/js-yaml.js', eval);
getFile('/Core/lib/cherow/cherow.js', eval);
getFile('/Core/lib/estraverse/estraverse.js', eval);

var mainWindow;

window.openWindow = function(path, callback) {
	prepareUrl(path, {__compat: false, rootParent: '/Core/', appData: '/CoreData/', permissions: {urlArgs: true}}, function(url) {
		var div = document.createElement('div');
		div.className = 'window';
		div.style.overflow = 'hidden';
		div.addEventListener('scroll', function() {
			div.scrollLeft = div.scrollTop = 0;
		});
		var iframe = document.createElement('iframe'); 
		iframe.sandbox = 'allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox';
		iframe.setAttribute('allowfullscreen', 'true');
		iframe.src = url;
		iframe.scrolling = 'no';
		iframe.name = 'LaskyaWM'; // Webkit Developer Tools hint.
		div.appendChild(iframe);
		document.body.appendChild(div);
		mainWindow = iframe.contentWindow;
		callback(iframe);
	}, function() {}, function(arg, callback) {
		var object;
		try {
			object = new File([arg.data], arg.name, {type: arg.type});
		} catch(e) {
			object = new Blob([arg.data], {type: arg.type});
		}
		callback(URL.createObjectURL(object));
	});
};

window.setTitle = function(t) {
	document.title = t ? t + ' - Airborn' : 'Airborn';
};

window.setIcon = function() {};

window.openWindowTop = function(args, appName, callback) {
	window.open.apply(window, args);
	window.addEventListener('message', function(evt) {
		if(evt.data.action === 'requestMessageChannel') {
			var win = window.open('', args[1]); // Get reference to window by name.
			if(evt.source === win) {
				evt.stopImmediatePropagation();
				var channel = new MessageChannel();
				win.postMessage({
					action: 'setupMessageChannel',
					appName: appName,
				}, '*', [channel.port1]);
				callback(channel.port2);
			}
		}
	});
};

var pushUrl, pushHandlers = {};
function pushInit() {
	return new Promise(function(resolve/*, reject*/) {
		getFile('/Core/lib/socket.io/socket.io.js', function(contents) {
			eval(contents);
			var socket = io();
			var url;
			socket.on('hello', function(path) {
				url = new URL(path, location.href).href;
				resolve(url);
			});
			socket.on('push', function(data) {
				if(pushHandlers[data.registrationId]) {
					pushHandlers[data.registrationId].forEach(function(handler) {
						handler({
							event: 'push',
							result: {
								pushEndpoint: url + '?registrationId=' + data.registrationId,
								version: data.version
							}
						});
					});
				}
			});
			function notifyPushRegister() {
				Object.keys(pushHandlers).forEach(function(key) {
					pushHandlers[key].forEach(function(handler) {
						handler({
							event: 'push-register'
						});
					});
				});
				pushHandlers = {};
			}
			socket.on('reconnect', function() {
				pushUrl = new Promise(function(_resolve) {
					resolve = _resolve;
				});
				notifyPushRegister();
			});
			socket.on('reconnect_failed', function() {
				console.error('socket.io reconnect failed');
				pushUrl = null;
				notifyPushRegister();
			});
		});
	});
}

window.pushRegister = function(callback) {
	if(!pushUrl) {
		pushUrl = pushInit();
	}
	pushUrl.then(function(url) {
		var registrationId = Math.round(Math.random() * Date.now()).toString(16);
		var endpoint = url + '?registrationId=' + registrationId;
		
		if(!pushHandlers[registrationId]) {
			pushHandlers[registrationId] = [];
		}
		pushHandlers[registrationId].push(callback);
		
		callback({
			event: 'registered',
			result: endpoint
		});
	});
};

window.pushUnregister = function(endpoint, callback) {
	delete pushHandlers[endpoint.split('?registrationId=')[1]];
	callback();
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

function includeJSZip(callback) {
	getFile('/Core/lib/jszip/jszip.min.js', function(contents) {
		if(!window.JSZip) window.eval(contents);
		if(callback) callback();
	});
}

window.installPackage = function(manifest_url, params, callback) {
	if(typeof params === 'function') {
		callback = params;
		params = {};
	}
	includeJSZip();
	corsReq(manifest_url, function() {
		var manifest = JSON.parse(this.responseText);
		corsReq(manifest.package_path, function() {
			var response = this.response;
			includeJSZip(function() {
				var zip = new JSZip(response);
				var keys = Object.keys(zip.files);
				var uploaded = 0;
				var total = 0;
				var target = '/Apps/' + basename(manifest.package_path).replace('-' + manifest.version, '').replace('.zip', '') + '/';
				getFile(target, {codec: 'dir'}, function(contents) {
					putFile(target, {codec: 'dir', transactionId: 'packageinstall'}, contents || {}, {x: {marketplace: extend({}, params, {manifest_url: manifest_url})}});
				});
				keys.forEach(function(path) {
					var file = zip.files[path];
					if(!file.options.dir) {
						total++;
						putFile(
							target + path,
							{codec: 'arrayBuffer', transactionId: 'packageinstall'},
							file.asArrayBuffer(),
							function() {
								uploaded++;
								if(uploaded === total) {
									callback({installState: 'installed'});
								}
							}
						);
					}
				});
			});
		}, 'arraybuffer');
	});
};

window.update = function() {
	corsReq('/v2/current-id', function() {
		var currentId = this.response;
		getFile('/Core/version-id', function(contents) {
			if(currentId !== contents) {
				if(!(settings.core && settings.core.notifyOfUpdates || account_info.tier >= 10) || (document.hasFocus() && confirm(
					'There is an update for Airborn. Do you want to install it now? You can continue using Aiborn while and after updating. The update will apply next time you open Airborn.\nIf you click Cancel, you will be asked again in 1 hour or next time you open Airborn.'
				))) {
					includeJSZip();
					corsReq('/v2/current', function() {
						var response = this.response;
						includeJSZip(function() {
							var zip = new JSZip(response);
							var keys = Object.keys(zip.files);
							var target = '/';
							window.showNotice('airbornupdating', "Updating… Please don't close this tab.");
							keys.forEach(function(path, i) {
								var file = zip.files[path];
								if(!file.options.dir) {
									putFile(target + path, {codec: 'arrayBuffer', transactionId: 'airbornupdate'}, file.asArrayBuffer(), i === keys.length - 1 ? function() {
										// Transaction finished; all files have been uploaded
										setTimeout(function() { // Wait 10s to be sure
											window.hideNotice('airbornupdating');
										}, 10000);
									} : undefined);
								}
							});
						});
					}, 'arraybuffer');
				}
			}
		});
	});
};

var notices;
window.showNotice = function(id, message, closeButton) {
	if(!notices) {
		notices = {};
		document.body.insertAdjacentHTML('beforeend', [
			'<style>',
			'.airborn-notice {',
			'	position: absolute;',
			'	top: 0;',
			'	left: 50%;',
			'	height: var(--height);',
			'	line-height: 25px;',
			'	pointer-events: none;',
			'	z-index: 999;',
			'	transform: translateX(-50%);',
			'	margin-right: -50%;',
			'	padding: 0 10px;',
			'	transition: opacity 1s;',
			'	color: white;',
			'	text-shadow: 1px 1px 1px black;',
			'	font-weight: normal;',
			'}',
			'.airborn-notice:before {',
			'	content: "";',
			'	position: absolute;',
			'	width: 100%;',
			'	height: 100%;',
			'	background: url(/images/logo-hanger.svg) no-repeat 0%/100% 100%;',
			'	top: -100%;',
			'	z-index: -1;',
			'	transform: scaleX(2.2);',
			'	filter: drop-shadow(0px var(--height) rgba(154, 132, 0, 0.3));',
			'	border-bottom: transparent 1px solid; /* Force Chrome to render this offscreen element. */',
			'}',
			'.airborn-notice .close-button, .airborn-notice a {',
			'	pointer-events: all;',
			'	color: inherit;',
			'	padding: 10px;',
			'	margin: -10px;',
			'}',
			'.airborn-notice .close-button {',
			'	cursor: pointer;',
			'	float: right;',
			'}',
			'.airborn-notice a {',
			'	margin-right: 0;',
			'}',
			'@media only screen and (max-device-width: 640px) {',
			'	.airborn-notice {',
			'		top: auto;',
			'		bottom: 0;',
			'		width: 100%;',
			'		color: inherit;',
			'		text-shadow: none;',
			'		background: rgba(154, 132, 0, 0.3);',
			'	}',
			'	.airborn-notice:before {',
			'		display: none;',
			'	}',
			'}',
			'</style>',
		].join('\n'));
	}
	
	notices[id] = document.createElement('div');
	notices[id].className = 'airborn-notice';
	notices[id].innerHTML = message;
	notices[id].style.opacity = 0;
	if(closeButton) {
		notices[id].insertAdjacentHTML('afterbegin', '<span class="close-button" onclick="window.hideNotice(\'' + id + '\')">✖</span>');
	}
	document.body.appendChild(notices[id]);
	notices[id].style.setProperty('--height', notices[id].offsetHeight + 'px');
	var img = new Image();
	img.src = '/images/logo-hanger.svg';
	img.addEventListener('load', function() {
		notices[id].style.opacity = 1;
	});
};

window.hideNotice = function(id) {
	notices[id].style.opacity = 0;
	notices[id].addEventListener('transitionend', function() {
		notices[id].remove();
		delete notices[id];
	});
};

window.getServerMessages = function() {
	var req = new XMLHttpRequest();
	req.open('GET', '/messages');
	req.responseType = 'json';
	req.addEventListener('load', function() {
		if(this.status === 200) {
			this.response.forEach(function(message) {
				if(message.min_core_version && message.min_core_version > core_version) return;
				if(message.max_core_version && message.max_core_version < core_version) return;
				alert(message.text);
			});
		}
	});
	req.send();
};

window.loadSettings = function() {
	getFile('/settings', {codec: 'json'}, function(_settings) {
		settings = _settings;
	});
};

window.logout = function() {
	sessionStorage.clear();
	localStorage.clear();
	document.cookie = document.cookie.split('=')[0] + '=';
	window.location.reload();
};

var APIKeys = [];
function getAPIKey(permissions) {
	var array = new Uint32Array(10);
	window.crypto.getRandomValues(array);
	var key = Array.prototype.slice.call(array).toString();
	APIKeys[key] = permissions || {};
	return key;
}
window.isValidAPIKey = function(key) {
	return APIKeys[key] !== undefined;
};
function givesAccessToPath(permissions, path, type) {
	return (permissions[type || 'read'] || []).some(function(allowed) {
		return startsWith(allowed, path);
	});
}
window.hasPermission = function(key, action, args) {
	var permissions = APIKeys[key];
	switch(action) {
		case 'getFile':
			return givesAccessToPath(permissions, args[0]);
		case 'putFile':
			return givesAccessToPath(permissions, args[0], 'write');
		case 'prepareFile':
			return givesAccessToPath(permissions, args[1].rootParent) && givesAccessToPath(permissions, args[0]) && !Object.keys(args[1]).some(function(key) {
				return key.replace(/^_+/, '') === 'permissions';
			});
		case 'prepareString':
		case 'prepareUrl':
			return givesAccessToPath(permissions, args[1].rootParent) && !Object.keys(args[1]).some(function(key) {
				return key.replace(/^_+/, '') === 'permissions';
			});
		case 'startTransaction':
		case 'endTransaction':
			return false;
		case 'listenForFileChanges':
			return givesAccessToPath(permissions, args[0]);
		case 'getObjectLocation':
			return givesAccessToPath(permissions, args[0].replace(/^airbornstorage:/, '')) && permissions.getObjectLocations;
		case 'pushRegister':
		case 'pushUnregister':
		case 'openWindowTop':
			return true;
		case 'installPackage':
			return permissions.hasOwnProperty('manageApps');
		case 'setTitle':
		case 'setIcon':
		case 'logout':
			return false;
		default:
			return false;
	}
};

// From: http://tobyho.com/2013/12/02/fun-with-esprima/
function renameGlobalVariables(file, source, variables) {
	if(typeof cherow === 'undefined' || typeof estraverse === 'undefined') return source;
	if(source.substr(-22) === '//# airbornos:prepared') {
		return source;
	}
	var variablesContained = Object.keys(variables).filter(function(variable) {
		return new RegExp('(?:^|[^"\'])\\b' + variable + '\\b').test(source);
	});
	if(!variablesContained.length) {
		return source;
	}
	console.log('Parsing', file, 'because it appears to contain the following variables:', variablesContained.join(', '));
	var ast;
	if(window.parseTime === undefined) window.parseTime = 0;
	window.startTime = performance.now();
	try {
		ast = cherow.parseScript(source, {ranges: true});
	} catch(e) {
		console.log(e);
		return source;
	}
	window.parseTime += performance.now() - window.startTime;
	console.log('parse ' + file, performance.now() - window.startTime, 'cumulative:', window.parseTime);
	var scopeChain = [];
	var identifiers = [];
	var replaces = [];
	estraverse.traverse(ast, {
		enter: enter,
		leave: leave
	});
	replaces.sort(function(a, b) {
		return a.start - b.start;
	});
	var replaced = [];
	var lastEnd = 0;
	for(var i = 0; i < replaces.length; i++) {
		replaced.push(source.substring(lastEnd, replaces[i].start), variables[replaces[i].name]);
		lastEnd = replaces[i].end;
	}
	return replaced.join('') + source.substr(lastEnd) + '\n//# airbornos:prepared';
	
	function enter(node) {
		if(createsNewScope(node)) {
			if(node.type === 'FunctionDeclaration') {
				scopeChain[scopeChain.length - 1].push(node.id.name);
			}
			if(node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
				scopeChain.push(node.params.map(function(node) { return node.name; }));
				if(node.rest) {
					scopeChain[scopeChain.length - 1].push(node.rest.name);
				}
			} else {
				scopeChain.push([]);
			}
		}
		if(node.type === 'VariableDeclarator') {
			var currentScope = scopeChain[scopeChain.length - 1];
			currentScope.push(node.id.name);
		}
		if(node.type === 'Identifier') {
			identifiers.push(node);
		}
		if(node.type === 'ObjectExpression') {
			node.properties.forEach(function(property) {
				property.key.isObjectKey = true;
			});
			return node;
		}
		if(node.type === 'MemberExpression') {
			if(!node.computed) {
				node.property.isProperty = true;
				return node;
			}
		}
	}
	function leave(node) {
		if(createsNewScope(node)) {
			renameGlobals(identifiers, scopeChain);
			scopeChain.pop();
			identifiers = [];
		}
	}
	function isVarDefined(varname, scopeChain) {
		for(var i = 0; i < scopeChain.length; i++) {
			var scope = scopeChain[i];
			if(scope.indexOf(varname) !== -1) {
				return true;
			}
		}
		return false;
	}
	function renameGlobals(identifiers, scopeChain) {
		for(var i = 0; i < identifiers.length; i++) {
			var identifier = identifiers[i];
			var varname = identifier.name;
			if(!identifier.isObjectKey && variables.hasOwnProperty(varname) && (identifier.isProperty || !isVarDefined(varname, scopeChain))) {
				replaces.push(identifier);
			}
		}
	}
	function createsNewScope(node) {
		return node.type === 'FunctionDeclaration' ||
			node.type === 'FunctionExpression' ||
			node.type === 'Program';
	}
}
//# sourceURL=/Core/core.js