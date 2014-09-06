function addCustomIframeFix(plugin) {
	$.ui.plugin.add(plugin, "customIframeFix", {
		start: function(event, ui) {
			$("iframe").each(function() {
				$(this).after(
					$('<div class="ui-' + plugin + '-iframeFix"></div>')
					.css({
						width: '100%', height: 'calc(100% - 25px)',
						position: "absolute", top: 25,opacity: "0.001"
					})
				);
			});
		},
		stop: function(event, ui) {
			$("div.ui-" + plugin + "-iframeFix").each(function() {
				this.parentNode.removeChild(this);
			}); //Remove frame helpers
		}
	});
}

addCustomIframeFix("draggable");
addCustomIframeFix("resizable");

function clipResizableHandles(event, ui) {
	var overflowx = ui.position.left + (ui.size ? ui.size.width : $(this).width()) - window.innerWidth;
	var overflowy = ui.position.top + (ui.size ? ui.size.height : $(this).height()) - window.innerHeight;
	$(this).find('.ui-resizable-ne, .ui-resizable-e, .ui-resizable-se').each(function() {
		if(overflowx > 0) $(this).css('right', overflowx);
		else $(this).css('right', '');
	});
	$(this).find('.ui-resizable-s, .ui-resizable-se').each(function() {
		if(overflowy > 0) $(this).css('bottom', overflowy);
		else $(this).css('bottom', '');
	});
};
function addClipResizableHandles(plugin, evt) {
	var obj = {};
	obj[evt] = clipResizableHandles
	
	$.ui.plugin.add(plugin, "clipResizableHandles", obj);
}

addClipResizableHandles("draggable", "drag");
addClipResizableHandles("resizable", "resize");


function addHUD(pos) {
	var $hud = $('.hud');
	if(!$hud.length) $hud = $('<div>').appendTo('body');
	$hud.attr('class', 'hud hud-' + pos);
	$hud.attr('data-pos', pos);
}
function removeHUD() {
	$('.hud').remove();
}


$.ui.plugin.add("draggable", "minimize", {
	drag: function(event, ui) {
		if (event.pageY < 5) {
			removeHUD();
			this.removeClass('maximized');
			this.addClass('minimized');
		} else if (event.pageY < 25 && !this.hasClass('minimized')) {
			addHUD('max');
		} else {
			if (event.pageY > 25 && this.hasClass('minimized')) {
				this.removeClass('minimized');
			}
			if (event.pageY > 50) {
				if(event.pageX < 20) {
					addHUD('left');
				} else if (event.pageX > window.innerWidth - 20) {
					addHUD('right');
				} else {
					removeHUD();
				}
				this.removeClass('maximized');
			}
		}
	},
	stop: function(event, ui) {
		// event.toElement is the element that was responsible
		// for triggering this event. The handle, in case of a draggable.
		$(event.toElement).one('click', function(e) {
			e.stopImmediatePropagation();
		});

		if($('.hud').length) {
			this.removeClass('maximized-' + $(this).attr('data-pos'));
			$(this).attr('data-pos', $('.hud').attr('data-pos'));
			this.addClass('maximized maximized-' + $('.hud').attr('data-pos'));
			clipResizableHandles.call(this, null, {position: $(this).position()});
		}
		removeHUD();
		forceMinimize();
	}
});

$.ui.plugin.add("draggable", "forceMinimize", {
	drag: function() {
		if(this[0].realLeft) {
			this[0].style.cssText = this[0].style.cssText.replace(/left: .+?;/, 'left: ' + this[0].realLeft + ';');
			delete this[0].realLeft;
		}
		forceMinimize();
	}
});
$.ui.plugin.add("resizable", "forceMinimize", {
	resize: forceMinimize
});
$.ui.plugin.add("resizable", "unmaximize", {
	start: function() {
		if (this.hasClass('maximized')) {
			this.css(this.css(['top', 'left', 'width', 'height']));
			this.removeClass('maximized');
		}
	}
});

var messageID = 0, messageCallbacks = {};

prepareUrl = function(contents, path, callback, progress) {
	parent.postMessage({messageID: ++messageID, action: 'fs.prepareUrl', args: [contents, path]}, '*');
	
	messageCallbacks[messageID] = callback;
	messageCallbacks[messageID].progress = progress;
	messageCallbacks[messageID].listener = true;
};

getFile = function(path, options, callback) {
	parent.postMessage({messageID: ++messageID, action: 'fs.getFile', args: (typeof arguments[arguments.length -1] === 'function' ? [].slice.call(arguments, 0, -1) : [].slice.call(arguments))}, '*');
	
	messageCallbacks[messageID] = arguments[arguments.length - 1];
};

listenForFileChanges = function(fn) {
	parent.postMessage({messageID: ++messageID, action: 'fs.listenForFileChanges', args: []}, '*');
	
	messageCallbacks[messageID] = fn;
	messageCallbacks[messageID].listener = true;
};


window.addEventListener('message', function(message) {
	if (message.source === parent) {
		if(message.data.action === 'createObjectURL') {
			var arg = message.data.args[0];
			parent.postMessage({inReplyTo: message.data.messageID, result: [URL.createObjectURL(new Blob([arg.data], {type: arg.type}))]}, '*');
			return;
		}
		var inReplyTo = message.data.inReplyTo; // Callback might change message.data.inReplyTo.
		var callback = messageCallbacks[inReplyTo];
		if(!callback) return;
		if(message.data.progress) callback = callback.progress;
		if(callback.raw) {
			callback(message);
		} else {
			callback.apply(window, message.data.result);
		}
		if(!message.data.progress && !callback.listener) messageCallbacks[inReplyTo] = null;
	} else if (childWindows.indexOf(message.source) !== -1) {
		if (message.data.action.substr(0, 3) === 'wm.') {
			if (message.data.action === 'wm.focus') {
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							focusTab(tab);
						}
					});
				});
			} else if (message.data.action === 'wm.reportClicked') {
				$(apps).hide();
				$(powerMenu).hide();
			} else if (message.data.action === 'wm.setTitle') {
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							$(tab.tabtitlebar).find('.title').text(message.data.args[0]);
							$(tab).find('iframe')[0].name = message.data.args[0]; // Webkit Developer Tools hint.
							if($(div).hasClass('focused') && $(tab).hasClass('focused')) window.parent.postMessage({action: 'core.setTitle', args: message.data.args}, '*');
						}
					});
				});
			} else if (message.data.action === 'wm.setIcon') {
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							tab.icon = message.data.args[0];
							if($(tab).hasClass('focused')) $(div).find('.icon').attr('src', message.data.args[0]);
							//if($(div).hasClass('focused')) window.parent.postMessage({action: 'core.setIcon', args: message.data.args}, '*');
						}
					});
				});
			} else if (message.data.action === 'wm.openFile' || message.data.action === 'wm.openWindow') {
				var options = {};
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							if(message.data.args[1] === 'replace') {
								options.targetDiv = div;
								options.targetTab = tab;
								options.loaderElm = $(tab).find('.loader')[0];
							}
							options.originDiv = div;
						}
					});
				});
				window[message.data.action.substr(3)].apply(window, message.data.args.concat(options));
			} else if (message.data.action === 'wm.showProgress' || message.data.action === 'wm.setProgress' || message.data.action === 'wm.hideProgress') {
				var options = {};
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							options.loaderElm = $(tab).find('.loader')[0];
						}
					});
				});
				window[message.data.action.substr(3)].apply(window, message.data.args.concat(options));
			} else {
				throw 'unknown action';
			}
		} else if (message.data.action.substr(0, 3) === 'fs.' || message.data.action.substr(0, 5) === 'apps.') {
			var realMessageID = message.data.messageID;
			message.data.messageID = ++messageID;
			parent.postMessage(message.data, '*');
			messageCallbacks[messageID] = function(reply) {
				reply.data.inReplyTo = realMessageID;
				message.source.postMessage(reply.data, '*');
			};
			messageCallbacks[messageID].raw = true;
			messageCallbacks[messageID].progress = messageCallbacks[messageID];
		} else {
			throw 'unknown action';
		}
	}
}, false);

showProgress = function(options) {
	if(!options.loaderElm) return;
	options.loaderElm.progressFrac = 0;
	setProgress(.1, options);
};
setProgress = function(frac, options) {
	if(!options.loaderElm) return;
	if(options.loaderElm.progressFrac >= frac) return;
	options.loaderElm.style.backgroundColor = 'rgba(173, 216, 230, .6)';
	options.loaderElm.style.width = frac * 100 + '%';
	options.loaderElm.progressFrac = frac;
};
hideProgress = function(options) {
	if(!options.loaderElm) return;
	if(options.loaderHighlight !== false) {
		setProgress(1, options);
		$(options.loaderElm).animate({backgroundColor: 'transparent'}).queue(function() {
			$(this).css({width: ''}).dequeue();
		});
	} else {
		$(options.loaderElm).css({width: ''});
	}
}

var childDivs = [];
var childWindows = [];

openWindow = function(path, options, callback) {
	showProgress(options);
	getFile(path + 'manifest.webapp', function(manifest) {
		manifest = manifest ? JSON.parse(manifest.replace(/^\uFEFF/, '')) : {};

		var launch_path = manifest.launch_path ? manifest.launch_path.replace(/^\//, '') : path.match(/[^/]+(?=\/$)/)[0] + '.html';
		var _path = path + launch_path;

		var csp = manifest.csp || "default-src *; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'";
		if(csp.indexOf('-src ') !== -1) csp = csp.replace(/-src /g, '-src data: ');
		else csp = 'default-src data:; ' + csp;
		var root = _path.match('/Apps/.+?/')[0];
		prepareUrl(launch_path, {rootParent: root, relativeParent: root, csp: csp},	function(url) {
			var div = options.targetDiv || document.createElement('div');
			var iframeWin;

			if(!options.targetDiv) {
				div.className = 'window';
				if(options.originDiv) {
					var left = parseInt(options.originDiv.style.left) || 0;
					var top = parseInt(options.originDiv.style.top) || 25;
				} else {
					var left = 0, top = 25;
				}
				var positions = childDivs.map(function(div) {
					return (parseInt(div.style.left) || 0) + ',' + (parseInt(div.style.top) || 25);
				});
				while(positions.indexOf(left + ',' + top) !== -1) left += 25, top += 25;
				div.style.left = left + 'px';
				div.style.top = top + 'px';
				$(div).draggable({customIframeFix: true, containment: [-Infinity, 25, Infinity, Infinity], snap: 'html, .window', scroll: false, minimize: true, forceMinimize: true, cursor: 'move', clipResizableHandles: true});
				
				var titlebarDiv = document.createElement('div');
				titlebarDiv.className = 'titlebar';
				div.appendChild(titlebarDiv);
						
				var tabs = document.createElement('div');
				tabs.className = 'tabs';
				div.appendChild(tabs);
			} else {
				tabs = $(div).find('.tabs')[0];
				if(!options.innewtab) tab = $(div).find(options.targetTab)[0];
			}

			if(!options.targetDiv || options.innewtab) {
				var tab = document.createElement('div');
				tab.className = 'tab';
				tabs.appendChild(tab);
				
				var locationbar = document.createElement('div');
				locationbar.className = 'locationbar';
				tab.appendChild(locationbar);
				
				var locationContainer = document.createElement('div');
				locationContainer.className = 'loaderContainer';
				var location = document.createElement('input');
				location.addEventListener('keypress', function(evt) {
					if(evt.which === 13) return; // Chrome 34 on enter.
					var char;
					if(evt.which == null)
						char = String.fromCharCode(evt.keyCode);	// old IE
					else if(evt.which != 0 && evt.charCode != 0)
						char = String.fromCharCode(evt.which);		// All others
					else
						return;
					var value = this.value.substr(0, this.selectionStart) + char + this.value.substr(this.selectionEnd);
					var filedir = value.substr(0, value.lastIndexOf('/') + 1);
					getFile(filedir, {codec: 'dir'}, function(contents) {
						if(location.selectionStart !== location.value.length) return;
						var slashIndex = location.value.lastIndexOf('/') + 1;
						if(filedir === location.value.substr(0, slashIndex)) {
							var filebase = location.value.substr(slashIndex);
							var filebaselen = filebase.length;
							if(!filebaselen) return;
							var matches = [];
							_.each(contents, function(attrs, name) {
								if(name.substr(0, filebaselen) === filebase) matches.push(name);
							});
							matches.alphanumSort();
							if(!matches[0]) return;
							location.value = filedir + matches[0];
							location.setSelectionRange(filedir.length + filebaselen, filedir.length + matches[0].length);
						}
					});
				});
				location.addEventListener('keyup', function(evt) {
					if(evt.keyCode === 13) {
						openFile.apply(this, location.value.split(' ').concat({
							targetDiv: div,
							targetTab: tab,
							fromLocationBar: true,
							loaderElm: locationLoader
						}));
						location.setSelectionRange(this.value.length, this.value.length);
					}
				});
				locationContainer.appendChild(location);
				var locationLoader = document.createElement('div');
				locationLoader.className = 'loader';
				locationContainer.appendChild(locationLoader);
				locationbar.appendChild(locationContainer);
			}

			if(options.targetDiv) {
				if(options.innewtab) {
					cont();
					childWindows.push(iframeWin);
				} else {
					var $iframe = $(options.targetTab).find('iframe');
					$iframe[0].src = 'about:blank';
					$iframe[0].onload = function() {
						childWindows.splice(childWindows.indexOf($iframe[0].contentWindow), 1);
						$iframe.remove();
						cont();
						childWindows.push(iframeWin);
					};
				}
			} else {
				cont();
			}

			function cont() {
				var iframe = document.createElement('iframe');
				iframe.sandbox = 'allow-scripts';
				iframe.src = url;
				iframe.name = path; // Webkit Developer Tools hint.
				tab.appendChild(iframe);
				tab.path = path;
				
				if(!options.targetDiv) {
					var closeBtn = document.createElement('button');
					closeBtn.className = 'close';
					closeBtn.addEventListener('click', function(evt) {
						iframe.src = 'about:blank';
						iframe.onload = function() {
							document.body.removeChild(div);
							childDivs.splice(childDivs.indexOf(div), 1);
							childWindows.splice(childWindows.indexOf(iframeWin), 1);
							forceMinimize();
						};
					});
					closeBtn.addEventListener('mousedown', function(evt) {
						evt.stopPropagation();
					});
					titlebarDiv.appendChild(closeBtn);
					
					var minimizeBtn = document.createElement('button');
					minimizeBtn.className = 'minimize';
					minimizeBtn.addEventListener('click', function(evt) {
						div.classList.toggle('minimized');
						positionMinimized();
						forceMinimize();
						evt.stopPropagation();
					});
					titlebarDiv.appendChild(minimizeBtn);
					
					var maximizeBtn = document.createElement('button');
					maximizeBtn.className = 'maximize';
					var toggleMaximized = function() {
						if($(div).hasClass('maximized'))
						$(div).removeClass('maximized');
						else
						$(div).removeClass('maximized-' + $(div).attr('data-pos'))
							.attr('data-pos', 'max')
							.addClass('maximized maximized-max');
						clipResizableHandles.call(div, null, {position: $(div).position()});
						forceMinimize();
					};
					maximizeBtn.addEventListener('click', toggleMaximized);
					titlebarDiv.appendChild(maximizeBtn);
					
					var tabbar = document.createElement('div');
					tabbar.className = 'tabbar';
					//tabbar.addEventListener('mousedown', function(evt) {
					//	evt.stopPropagation();
					//});
					setTimeout(function() {
						// Work around a jquery UI bug where it behaves differently if there are no elements in the sortable div yet.
						$(tabbar).sortable({axis: 'x', containment: 'parent', distance: 5, tolerance: 'pointer', scrollSpeed: 5, placeholder: {
							element: function() { return $('<div class="tabtitlebar"><span class="title">&#160;</span></div>'); },
							update: function(container, p) { p.width(container.currentItem.width()); }
						}});
					});
					titlebarDiv.appendChild(tabbar);
				} else {
					tabbar = $(div).find('.tabbar')[0];
				}

				if(!options.targetDiv || options.innewtab) {
					var tabtitlebar = document.createElement('div');
					tabtitlebar.className = 'tabtitlebar';
					tabtitlebar.addEventListener('mousedown', function() {
						focusTab(tabtitlebar.tab);
					});
					tabtitlebar.tab = tab;
					tab.tabtitlebar = tabtitlebar;
					tabbar.appendChild(tabtitlebar);
					
					var title = document.createElement('span');
					title.className = 'title';
					title.innerHTML = '&nbsp;';
					tabtitlebar.appendChild(title);
				}

				if(!options.targetDiv) {
					var addtabContainer = document.createElement('div');
					addtabContainer.className = 'loaderContainer';
					var addtab = document.createElement('div');
					addtab.textContent = '+';
					addtab.className = 'addtab';
					addtab.addEventListener('click', function() {
						openWindow($(div).find('.tab.focused')[0].path, {
							targetDiv: div,
							innewtab: true,
							loaderElm: addtabLoader,
							loaderHighlight: false
						}, function(win, tab, div) {
							var tabbar = $(div).find('.tabbar')[0];
							tabbar.scrollLeft = tabbar.scrollWidth;
						});
					});
					addtabContainer.appendChild(addtab);
					var addtabLoader = document.createElement('div');
					addtabLoader.className = 'loader';
					addtabContainer.appendChild(addtabLoader);
					titlebarDiv.appendChild(addtabContainer);
					
					var icon = document.createElement('img');
					icon.className = 'icon';
					titlebarDiv.appendChild(icon);
					
					div.addEventListener('mousedown', function() {
						focus();
						var nohover = function(evt) { evt.stopImmediatePropagation(); };
						$('.window').one('mouseenter', nohover);
						setTimeout(function() { $('.window').off('mouseenter', nohover); }, 10);
					});
					//iframe.addEventListener('focus', focus);
					function focus() {
						focusWindow(div);
						$(div).find('iframe').blur().focus();
					}
					$(div).click(function() {
						if (!div.classList.contains('ui-draggable-dragging')) {
							div.classList.remove('minimized');
							focusWindow(div);
						}
					});
					
					titlebarDiv.ondblclick = toggleMaximized;
					
					$(div).resizable({customIframeFix: true, forceMinimize: true, handles: 'e, s, ne, se', unmaximize: true, clipResizableHandles: true});
					
					console.log(div);
					document.body.appendChild(div);
					childDivs.push(div);
					
					clipResizableHandles.call(div, null, {position: $(div).position()});
					
					iframeWin = iframe.contentWindow;
					childWindows.push(iframeWin);
					focusTab(tab);
					//updateZIndex();
					//forceMinimize();
				} else {
					iframeWin = iframe.contentWindow;
				}

				if(callback)
					callback(iframeWin, tab, div);
			}
		}, function(done, total) {
			var progress = done / total;
			setProgress(progress, options);
			if(progress === 1) {
				hideProgress(options);
			}
		});
	});
};

$(document).on('mouseenter', '.window', function() {
	$(this).addClass('hover');
	updateZIndex(this);
});
$(document).on('mouseleave', '.window', function() {
	$(this).removeClass('hover');
	updateZIndex();
});


function forceMinimize() {
	var windows = childDivs.filter(function(win) {
		return !win.classList.contains('minimized') || win.classList.contains('force-minimized');
	}).map(function(win, i) {
		if(win.classList.contains('maximized')) {
		if(win.classList.contains('maximized-max'))
			return {
				x1: 0,
				y1: 25,
				x2: window.innerWidth,
				y2: window.innerHeight,
				div: win
			};
		else if(win.classList.contains('maximized-left'))
			return {
				x1: 0,
				y1: 25,
				x2: window.innerWidth / 2,
				y2: window.innerHeight,
				div: win
			};
		else if(win.classList.contains('maximized-right'))
			return {
				x1: window.innerWidth / 2,
				y1: 25,
				x2: window.innerWidth,
				y2: window.innerHeight,
				div: win
			};
		}

		var $win = $(win);
		var minimized = win.classList.contains('minimized');
		var left = parseFloat(win.realLeft !== undefined ? win.realLeft : minimized ? win.style.left : $win.css('left')) || 0;
		var top = parseFloat(minimized ? win.style.top : $win.css('top')) || 25;
		var width = parseFloat(minimized ? win.style.width : $win.css('width')) || 800;
		var height = parseFloat(minimized ? win.style.height : $win.css('height')) || 600;
		return {
			x1: Math.max(0, Math.min(window.innerWidth, left)),
			y1: Math.max(25, Math.min(window.innerHeight, top)),
			x2: Math.max(0, Math.min(window.innerWidth, left + width)),
			y2: Math.max(25, Math.min(window.innerHeight, top + height)),
			div: win
		};
	}).reverse();
	
	windows.forEach(function(win, i) {
		for(var amount = 0, sign = 1, area = 0; amount <= i; amount++, sign *= -1) {
			for(var b = 0; b < Math.pow(2, i); b++) {
				if(b.toString(2).replace(/0/g, '').length === amount) {
					area += sign * I.apply(this, windows.filter(function(w, i) {
						return Math.pow(2, i) & b;
					}).concat([win]));
				}
			}
		}
		if(area === 0) {
			win.div.classList.add('force-minimized');
			win.div.classList.add('minimized');
		} else if (win.div.classList.contains('force-minimized')) {
			win.div.classList.remove('force-minimized');
			win.div.classList.remove('minimized');
		}
	});
	
	positionMinimized();
}

function I() {
	var i = {
		x1: Math.max.apply(Math, _.pluck(arguments, 'x1')),
		y1: Math.max.apply(Math, _.pluck(arguments, 'y1')),
		x2: Math.min.apply(Math, _.pluck(arguments, 'x2')),
		y2: Math.min.apply(Math, _.pluck(arguments, 'y2'))
	};
	return O(i);
}

function O(a) {
	return Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
}


function updateZIndex(hovered) {
	if(hovered && hovered.classList.contains('minimized')) {
		var hoveredI = childDivs.indexOf(hovered);
		var lastLeft = parseFloat(hovered.style.left) || 0;
	}
	childDivs.forEach(function(win, i) {
		if(i > hoveredI && win.classList.contains('minimized')) {
			var left = parseFloat(win.style.left) || 0;
			if(left < lastLeft && lastLeft - left < 250) {
				win.style.zIndex = hoveredI - i;
				lastLeft = left;
				return;
			}
		}
		win.style.zIndex = i;
	});
}

function positionMinimized() {
	var full = {};
	[].slice.call(childDivs).reverse().forEach(function(win, i) {
		if(win.classList.contains('minimized')) {
			var left =
				win.classList.contains('maximized') ?
					(win.classList.contains('maximized-max') || win.classList.contains('maximized-left') ? 0 :
					win.classList.contains('maximized-right') ? Math.floor(window.innerWidth / 2) :
					console.error('Unknown maximized state')) :
				parseInt(win.realLeft !== undefined ? win.realLeft : win.style.left) || 0;
			var minimizedLeft, moved, pushLeft;
			if (left < 63) {
				minimizedLeft = 63;
				moved = true;
			} else if (left > window.innerWidth - 350) {
				minimizedLeft = window.innerWidth - 350;
				moved = true;
				pushLeft = true;
			} else {
				minimizedLeft = left;
				moved = false;
			}
			for (; full[minimizedLeft]; moved = true) {
				if (pushLeft) {
					full[minimizedLeft].style.left = parseInt(full[minimizedLeft].style.left) - 28 + 'px';
				}
				minimizedLeft += 28;
			}
			if (moved) {
				if(!win.realLeft) win.realLeft = win.style.left;
				win.style.cssText += '; left: ' + (pushLeft ? window.innerWidth - 350 : minimizedLeft) + 'px !important;';
			}
			full[minimizedLeft] = win;
		}
		if(!moved && win.realLeft) {
			win.style.cssText = win.style.cssText.replace(/left: .+?;/, 'left: ' + win.realLeft + ';');
			delete win.realLeft;
		}
	});
}

function focusWindow(div) {
	$('.window.focused').removeClass('focused');
	div.classList.add('focused');
	childDivs.push(childDivs.splice(childDivs.indexOf(div), 1)[0]);
	updateZIndex();
	forceMinimize();
	window.parent.postMessage({action: 'core.setTitle', args: [$(div).find('.tabtitlebar.focused')[0].textContent.replace('\u00a0', '')]}, '*');
	//window.parent.postMessage({action: 'core.setIcon', args: [div.getElementsByClassName('icon')[0].src]}, '*');
}

function focusTab(tab) {
	$(tab).siblings('.focused').removeClass('focused');
	tab.classList.add('focused');
	var $window = $(tab).closest('.window');
	$window.find('.tabtitlebar').removeClass('focused');
	tab.tabtitlebar.classList.add('focused');
	$window.find('.icon').attr('src', tab.icon);
	focusWindow($window[0]);
}

window.addEventListener("resize", function() {
	forceMinimize();
	$('.window').each(function(i, win) { clipResizableHandles.call(win, null, {position: $(win).position()}); });
}, false);

extension = function(file) {
	if(file.substr(-1) === '/') return '/';
	file = file.substr(file.lastIndexOf('/') + 1);
	return file.substr(file.lastIndexOf('.') + 1);
};

openFile = function(path, action) {
	console.log('Prefetching', path);
	getFile(path); // Start downloading the file as soon as possible.
	var options = arguments[arguments.length - 1];
	if(_.isObject(options)) {
		var args = [].slice.call(arguments, 0, -1);
	} else {
		var args = [].slice.call(arguments);
		options = {};
	}
	showProgress(options);
	getFile('/Core/filetypes', function(contents) {
		if(action[0] === '/') {
			var apppath = action;
		} else {
			var filetypes = {};
			contents.split('\n').forEach(function(line) {
				var parts = line.split(' ');
				if(!filetypes[parts[0]]) filetypes[parts[0]] = {};
				parts.slice(1).forEach(function(part) {
					var keyvalue = part.split('=');
					var value = keyvalue[1].split(',');
					keyvalue[0].split(',').forEach(function(key) {
						filetypes[parts[0]][key] = value;
					});
				});
			});
			var prefs = filetypes[extension(path)] || filetypes['*'];
			var pref = (prefs[action] || prefs[prefs.default] || prefs[filetypes['*'].default] || prefs.edit || prefs.view)[0];
			var apppath = '/Apps/' + pref + '/';
		}
		if(options.targetTab && options.targetTab.path === apppath) {
			cb($(options.targetTab).find('iframe')[0].contentWindow, options.targetTab, options.targetDiv);
			return;
		}
		openWindow(apppath, options, function(win, tab, div) {
			$(div).find('iframe').one('load', function() {
				cb(win, tab, div);
			});
		});
	});
	function cb(win, tab, div) {
		hideProgress(options);
		win.postMessage({action: 'openFile', args: args}, '*');
		if(!options.fromLocationBar) $(tab).find('.locationbar input').val(path);
		if(options.callback) options.callback(win, tab, div);
	}
};

Array.prototype.alphanumSort = function(caseInsensitive) {
	for (var z = 0, t; t = this[z]; z++) {
		this[z] = [];
		var x = 0, y = -1, n = 0, i, j;

		while (i = (j = t.charAt(x++)).charCodeAt(0)) {
			var m = (i == 46 || (i >=48 && i <= 57));
			if (m !== n) {
			this[z][++y] = "";
			n = m;
			}
			this[z][y] += j;
		}
	}

	this.sort(function(a, b) {
		for (var x = 0, aa, bb; (aa = a[x]) && (bb = b[x]); x++) {
			if (caseInsensitive) {
			aa = aa.toLowerCase();
			bb = bb.toLowerCase();
			}
			if (aa !== bb) {
			var c = Number(aa), d = Number(bb);
			if (c == aa && d == bb) {
				return c - d;
			} else return (aa > bb) ? 1 : -1;
			}
		}
		return a.length - b.length;
	});

	for (var z = 0; z < this.length; z++)
	this[z] = this[z].join("");
}