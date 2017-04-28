/* This file is licensed under the Affero General Public License. */

/*global $, barIconsWidth, apps, getIconUrl, powerMenu, airborn, airborn_localStorage, showProgress: true, setProgress: true, hideProgress: true, openFile: true, openWindow: true, extension: true */

var deviceType = window.matchMedia('only screen and (max-device-width: 640px)').matches ? 'mobile' : 'desktop';

var workspace_start_top = deviceType === 'mobile' ? 0 : 25;
var workspace_start_left = deviceType === 'mobile' ? 0 : 100;
function workspace_height() { return window.innerHeight - workspace_start_top; }
function workspace_width() { return window.innerWidth - workspace_start_left; }


var windowsContainer = document.createElement('div');
windowsContainer.id = 'windows';
windowsContainer.style.top = workspace_start_top;
windowsContainer.style.left = workspace_start_left;
document.body.appendChild(windowsContainer);

var childDivs = [];
var childWindows = [];

function addCustomIframeFix(plugin) {
	$.ui.plugin.add(plugin, 'customIframeFix', {
		start: function() {
			$('iframe').each(function() {
				$(this).after(
					$('<div class="ui-' + plugin + '-iframeFix"></div>')
					.css({
						width: '100%', height: '100%',
						position: 'absolute', opacity: '0.001'
					})
				);
			});
		},
		stop: function() {
			$('div.ui-' + plugin + '-iframeFix').each(function() {
				this.parentNode.removeChild(this);
			}); //Remove frame helpers
		}
	});
}

addCustomIframeFix('draggable');
addCustomIframeFix('resizable');

function clipResizableHandles(event, ui) {
	var overflowx = ui.position.left + (ui.size ? ui.size.width : $(this).width()) - workspace_width();
	var overflowy = ui.position.top + (ui.size ? ui.size.height : $(this).height()) - workspace_height();
	$(this).find('.ui-resizable-ne, .ui-resizable-e, .ui-resizable-se').each(function() {
		if(overflowx > 0) $(this).css('right', overflowx);
		else $(this).css('right', '');
	});
	$(this).find('.ui-resizable-sw, .ui-resizable-s, .ui-resizable-se').each(function() {
		if(overflowy > 0) $(this).css('bottom', overflowy);
		else $(this).css('bottom', '');
	});
	$(this).find('.ui-resizable-nw, .ui-resizable-w, .ui-resizable-sw').each(function() {
		if(ui.position.left < 0) $(this).css('left', -ui.position.left);
		else $(this).css('left', '');
	});
}
function addClipResizableHandles(plugin, evt) {
	var obj = {};
	obj[evt] = clipResizableHandles;
	
	$.ui.plugin.add(plugin, 'clipResizableHandles', obj);
}

addClipResizableHandles('draggable', 'drag');
addClipResizableHandles('resizable', 'resize');


function addHUD(pos, div) {
	var $hud = $('.hud');
	if(!$hud.length) $hud = $('<div>').appendTo(windowsContainer);
	$hud.attr('class', 'hud hud-' + pos);
	$hud.attr('data-pos', pos);
	$hud.css('z-index', div.css('z-index') - 1);
}
function removeHUD() {
	$('.hud').remove();
}


$.ui.plugin.add('draggable', 'minimize', {
	drag: function(event) {
		if(event.pageY < 5) {
			removeHUD();
			this.removeClass('maximized');
			this.addClass('minimized');
		} else if(event.pageY < workspace_start_top && !this.hasClass('minimized')) {
			addHUD('max', this);
		} else {
			if(event.pageY > workspace_start_top && this.hasClass('minimized')) {
				this.removeClass('minimized');
			}
			if(event.pageY > 2 * workspace_start_top) {
				if(event.pageX < workspace_start_left + 20) {
					addHUD('left', this);
				} else if(event.pageX > window.innerWidth - 20) {
					addHUD('right', this);
				} else {
					removeHUD();
				}
				this.removeClass('maximized');
			}
		}
	},
	stop: function(event) {
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

$.ui.plugin.add('draggable', 'forceMinimize', {
	drag: function() {
		var _this = this;
		setTimeout(function() {
			if(_this[0].realLeft) {
				_this[0].style.cssText = _this[0].style.cssText.replace(/left: .+?;/, 'left: ' + _this[0].realLeft + ';');
				delete _this[0].realLeft;
			}
			forceMinimize();
		});
	}
});
$.ui.plugin.add('resizable', 'forceMinimize', {
	resize: function() {
		setTimeout(forceMinimize);
	}
});
$.ui.plugin.add('resizable', 'unmaximize', {
	start: function() {
		if(this.hasClass('maximized')) {
			this.css(this.css(['top', 'left', 'width', 'height']));
			this.removeClass('maximized');
		}
	}
});
$.ui.plugin.add('resizable', 'customContainment', {
	start: function() {
		/* Only contain resizing at the top and left side of the window */
		var that = $(this).resizable('instance');
		that.parentData.width =
		that.parentData.height = 1 << 16;
	}
});


window.addEventListener('message', function(message) {
	if(childWindows.indexOf(message.source) !== -1) {
		if(message.data.action.substr(0, 3) === 'wm.') {
			var options;
			if(message.data.action === 'wm.focus') {
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							focusTab(tab);
						}
					});
				});
			} else if(message.data.action === 'wm.reportClicked') {
				$(apps).hide();
				$(powerMenu).hide();
			} else if(message.data.action === 'wm.setTitle') {
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							var cont = function(title) {
								$(tab.tabtitlebar).find('.title').text(title);
								$(tab).find('iframe')[0].name = title; // Webkit Developer Tools hint.
								if($(div).hasClass('focused') && $(tab).hasClass('focused')) window.parent.postMessage({action: 'core.setTitle', args: [title]}, '*');
							};
							if(message.data.args[0]) {
								cont(message.data.args[0]);
							} else {
								airborn.fs.getFile(tab.path + 'manifest.webapp', function(manifest) {
									manifest = manifest ? JSON.parse(manifest.replace(/^\uFEFF/, '')) : {};
									cont(manifest.name);
								});
							}
						}
					});
				});
			} else if(message.data.action === 'wm.setIcon') {
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							var cont = function(icon) {
								tab.icon = icon;
								if($(tab).hasClass('focused')) $(div).find('.icon').attr('src', icon);
								//if($(div).hasClass('focused')) window.parent.postMessage({action: 'core.setIcon', args: [icon]}, '*');
							};
							if(message.data.args[0]) {
								cont(message.data.args[0]);
							} else {
								airborn.fs.getFile(tab.path + 'manifest.webapp', function(manifest) {
									manifest = manifest ? JSON.parse(manifest.replace(/^\uFEFF/, '')) : {};
									var icon = getIconUrl(manifest.icons);
									if(icon) {
										airborn.fs.prepareUrl(icon, {relativeParent: tab.path, rootParent: tab.path}, function(url) {
											cont(url);
										});
									} else {
										cont();
									}
								});
							}
						}
					});
				});
			} else if(message.data.action === 'wm.openFile' || message.data.action === 'wm.openWindow') {
				options = {};
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							if(message.data.args[1] === 'replace') {
								options.targetDiv = div;
								options.targetTab = tab;
								if(message.data.action === 'wm.openFile') options.loaderElm = $(tab.tabtitlebar).find('.loader')[0];
							}
							options.originDiv = div;
						}
					});
				});
				window[message.data.action.substr(3)].apply(window, message.data.args.concat(options));
			} else if(message.data.action === 'wm.showProgress' || message.data.action === 'wm.setProgress' || message.data.action === 'wm.hideProgress') {
				options = {};
				childDivs.forEach(function(div) {
					$(div).find('.tab').each(function(i, tab) {
						if($(tab).find('iframe')[0].contentWindow === message.source) {
							options.loaderElm = $(tab.tabtitlebar).find('.loader')[0];
						}
					});
				});
				window[message.data.action.substr(3)].apply(window, message.data.args.concat(options));
			} else {
				throw 'unknown action';
			}
		} else {
			throw 'unknown action';
		}
	}
}, false);

showProgress = function(options) {
	if(!options.loaderElm) return;
	options.loaderElm.progressFrac = 0;
	setProgress(0.1, options);
};
setProgress = function(frac, options) {
	if(!options.loaderElm) return;
	if(options.loaderElm.progressFrac >= frac) return;
	options.loaderElm.style.backgroundColor = 'rgba(77, 164, 213, .5)';
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
};

openWindow = function(path, options, callback) {
	showProgress(options);
	airborn.fs.getFile(path + 'manifest.webapp', function(manifest) {
		manifest = manifest ? JSON.parse(manifest.replace(/^\uFEFF/, '')) : {};
		
		var launch_path = manifest.launch_path ? manifest.launch_path.replace(/^\//, '') : path.match(/[^/]+(?=\/$)/)[0] + '.html';
		var _path = path + launch_path;
		var appData = path.replace('Apps', 'AppData');
		
		var csp = manifest.csp || "default-src *; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'";
		if(csp.indexOf('-src ') !== -1) csp = csp.replace(/-src /g, '-src data: ');
		else csp = 'default-src data:; ' + csp;
		var storageLocations = {
			apps: '/Apps/',
			music: '/Music/',
			pictures: '/Pictures/',
			sdcard: '/Documents/',
			system: '/Core/',
			videos: '/Videos/'
		};
		var permissions = {
			read: [path, appData].concat(Object.keys(manifest.permissions || {}).filter(function(permission) {
				return storageLocations[permission.replace('device-storage:', '')] && ['readonly', 'readwrite', 'readcreate'].indexOf(manifest.permissions[permission].access) !== -1;
			}).map(function(permission) {
				return storageLocations[permission.replace('device-storage:', '')];
			})),
			write: [appData].concat(Object.keys(manifest.permissions || {}).filter(function(permission) {
				return storageLocations[permission.replace('device-storage:', '')] && ['readwrite', 'readcreate', 'createonly'].indexOf(manifest.permissions[permission].access) !== -1;
			}).map(function(permission) {
				return storageLocations[permission.replace('device-storage:', '')];
			})),
			manageApps: (manifest.permissions || {})['webapps-manage'],
			urlArgs: (_path.match('/Apps/(.+?)/') || [])[1],
			getObjectLocations: (manifest.permissions || {})['get-object-locations'],
		};
		airborn.fs.prepareUrl('/', {rootParent: path, relativeParent: _path, permissions: permissions, csp: csp, appData: appData}, function(url) {
			var div = options.targetDiv || document.createElement('div');
			var iframeWin;
			
			var tabs, tab;
			if(!options.targetDiv) {
				div.className = 'window';
				var left, top;
				if(options.originDiv) {
					left = parseInt(options.originDiv.style.left) || 0;
					top = parseInt(options.originDiv.style.top) || 0;
				} else {
					left = 0;
					top = 0;
				}
				var positions = childDivs.map(function(div) {
					return (parseInt(div.style.left) || 0) + ',' + (parseInt(div.style.top) || 0);
				});
				while(positions.indexOf(left + ',' + top) !== -1) {
					left += 25;
					top += 25;
				}
				div.style.left = left + 'px';
				div.style.top = top + 'px';
				$(div).draggable({customIframeFix: true, containment: [-Infinity, workspace_start_top, Infinity, Infinity], snap: '#windows, .window', scroll: false, minimize: true, forceMinimize: true, cursor: 'move', clipResizableHandles: true});
				
				var titlebarDiv = document.createElement('div');
				titlebarDiv.className = 'titlebar';
				div.appendChild(titlebarDiv);
				
				tabs = document.createElement('div');
				tabs.className = 'tabs';
				div.appendChild(tabs);
			} else {
				tabs = $(div).find('.tabs')[0];
				if(!options.innewtab) tab = $(div).find(options.targetTab)[0];
			}
			
			if(!options.targetDiv || options.innewtab) {
				tab = document.createElement('div');
				tab.className = 'tab';
				tabs.appendChild(tab);
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
				iframe.sandbox = 'allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox';
				iframe.setAttribute('allowfullscreen', 'true');
				iframe.src = url;
				iframe.name = path; // Webkit Developer Tools hint.
				tab.appendChild(iframe);
				tab.path = path;
				
				var tabbar;
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
				if(!options.targetDiv) {
					var closeBtn = document.createElement('button');
					closeBtn.className = 'close';
					closeBtn.addEventListener('click', function() {
						iframe.src = 'about:blank';
						iframe.onload = function() {
							setTimeout(function() { // Fix infinite spinning indicator in Firefox.
								windowsContainer.removeChild(div);
								childDivs.splice(childDivs.indexOf(div), 1);
								childWindows.splice(childWindows.indexOf(iframeWin), 1);
								forceMinimize();
							});
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
					maximizeBtn.addEventListener('click', toggleMaximized);
					titlebarDiv.appendChild(maximizeBtn);
					
					tabbar = document.createElement('div');
					tabbar.className = 'tabbar';
					tabbar.addEventListener('mousedown', function(evt) {
						evt.stopPropagation();
					});
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
					title.textContent = manifest.name; // This element needs at least a nbsp
					tabtitlebar.appendChild(title);
					
					var titleloader = document.createElement('div');
					titleloader.className = 'loader';
					tabtitlebar.appendChild(titleloader);
				}
				
				if(!options.targetDiv) {
					var addtab = document.createElement('div');
					addtab.textContent = '+';
					addtab.className = 'addtab';
					addtab.addEventListener('click', function() {
						openWindow($(div).find('.tab.focused')[0].path, {
							targetDiv: div,
							innewtab: true
						}, function(win, tab, div) {
							var tabbar = $(div).find('.tabbar')[0];
							tabbar.scrollLeft = tabbar.scrollWidth;
						});
					});
					titlebarDiv.appendChild(addtab);
					
					var icon = document.createElement('img');
					icon.className = 'icon';
					var iconUrl = getIconUrl(manifest.icons);
					if(iconUrl) {
						airborn.fs.prepareUrl(iconUrl, {relativeParent: path, rootParent: path}, function(url) {
							icon.src = tab.icon = url;
						});
					}
					titlebarDiv.appendChild(icon);
					
					var focus = function() {
						focusWindow(div);
						$(div).find('iframe').blur().focus();
					};
					div.addEventListener('mousedown', function() {
						focus();
						var nohover = function(evt) { evt.stopImmediatePropagation(); };
						$('.window').one('mouseenter', nohover);
						setTimeout(function() { $('.window').off('mouseenter', nohover); }, 10);
					});
					//iframe.addEventListener('focus', focus);
					
					$(div).click(function() {
						if(!div.classList.contains('ui-draggable-dragging')) {
							div.classList.remove('minimized');
							focusWindow(div);
						}
					});
					
					titlebarDiv.ondblclick = toggleMaximized;
					
					$(div).resizable({customIframeFix: true, containment: '#windows', customContainment: true, forceMinimize: true, handles: 'all', unmaximize: true, clipResizableHandles: true});
					
					console.log(div);
					windowsContainer.appendChild(div);
					childDivs.push(div);
					
					if(manifest.window_size === 'maximize' && deviceType !== 'mobile') {
						$(div).attr('data-pos', 'max');
						$(div).addClass('maximized maximized-max');
					}
					
					if(manifest.window_size === 'maximize') {
						// This is kind of a weird condition but the same built-
						// in apps which we want to start maximized are the apps
						// we want to remember to start as the first app next
						// time. This is because we consider those apps "real
						// apps" and the Marketplace just a "tool". Eventually
						// we should just remember the entire session instead
						// and offer to restart those apps.
						airborn_localStorage.lastApp = path;
					}
					
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

var hashArgumentOpenApp = airborn.top_location.hash.match(/[#&;]open=([^&;]+)/);
openWindow(
	hashArgumentOpenApp ? '/Apps/' + hashArgumentOpenApp[1].replace(/[./]/g, '') + '/' :
	airborn_localStorage.lastApp ||
	'/Apps/firetext/',
	{}
);


function forceMinimize() {
	var windows = childDivs.filter(function(win) {
		return !win.classList.contains('minimized') || win.classList.contains('force-minimized');
	}).map(function(win, i, windows) {
		if(win.classList.contains('maximized') || deviceType === 'mobile') {
			if(win.classList.contains('maximized-max') || deviceType === 'mobile')
				return {
					x1: 0,
					y1: 0,
					x2: workspace_width(),
					y2: workspace_height(),
					div: win
				};
			else if(win.classList.contains('maximized-left'))
				return {
					x1: 0,
					y1: 0,
					x2: Math.ceil(workspace_width() / 2),
					y2: workspace_height(),
					div: win
				};
			else if(win.classList.contains('maximized-right'))
				return {
					x1: Math.ceil(workspace_width() / 2),
					y1: 0,
					x2: workspace_width(),
					y2: workspace_height(),
					div: win
				};
		}
		
		var $win = $(win);
		var minimized = win.classList.contains('minimized');
		var left = parseFloat(win.realLeft !== undefined ? win.realLeft : minimized ? win.style.left : $win.css('left')) || 0;
		var top = parseFloat(minimized ? win.style.top : $win.css('top')) || 0;
		var width = parseFloat(minimized ? win.style.width : $win.css('width')) || 800;
		var height = parseFloat(minimized ? win.style.height : $win.css('height')) || 600;
		return {
			x1: windows.length < 20 ? Math.max(0, Math.min(workspace_width(), left)) : left,
			y1: windows.length < 20 ? Math.max(0, Math.min(workspace_height(), top)) : top,
			x2: windows.length < 20 ? Math.max(0, Math.min(workspace_width(), left + width)) : left + width,
			y2: windows.length < 20 ? Math.max(0, Math.min(workspace_height(), top + height)) : top + height,
			div: win
		};
	}).reverse();
	
	var i, win;
	if(windows.length < 20) {
		// Calculate visible area of windows.
		for(i = windows.length; --i >= 0;) {
			win = windows[i];
			forceMinimizeWin(win.div, add(1, i, win.x1, win.y1, win.x2, win.y2, windows) === 0);
		}
	} else {
		// Ray cast screen for visible windows. We cast rays in a 10x10
		// grid instead of every pixel to trade some accuracy for a lot
		// of performance.
		for(var x = 0; x < workspace_width(); x += 10) {
			for(var y = 0; y < workspace_height(); y += 10) {
				for(i = 0; i < windows.length; i++) {
					win = windows[i];
					if(x >= win.x1 && x <= win.x2 && y >= win.y1 && y <= win.y2) {
						win.visible = true;
						break;
					}
				}
			}
		}
		for(i = 0; i < windows.length; i++) {
			win = windows[i];
			forceMinimizeWin(win.div, !win.visible);
		}
	}
	
	positionMinimized();
}

function forceMinimizeWin(div, minimize) {
	if(minimize) {
		div.classList.add('force-minimized');
		div.classList.add('minimized');
	} else if(div.classList.contains('force-minimized')) {
		div.classList.remove('force-minimized');
		div.classList.remove('minimized');
	}
}

function add(sign, i, _x1, _y1, _x2, _y2, windows) {
	var area = sign * O(_x1, _y1, _x2, _y2);
	
	for(var j = i; --j >= 0;) {
		var x1 = _x1, y1 = _y1, x2 = _x2, y2 = _y2;
		
		if(windows[j].x1 > x1) x1 = windows[j].x1;
		if(windows[j].y1 > y1) y1 = windows[j].y1;
		if(windows[j].x2 < x2) x2 = windows[j].x2;
		if(windows[j].y2 < y2) y2 = windows[j].y2;
		
		area += add(-sign, j, x1, y1, x2, y2, windows);
	}
	
	return area;
}

function O(x1, y1, x2, y2) {
	return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
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
	var minMinimizedLeft = deviceType === 'mobile' ? 100 : 50;
	[].slice.call(childDivs).reverse().forEach(function(win) {
		var moved;
		if(win.classList.contains('minimized')) {
			var left =
				win.classList.contains('maximized') || deviceType === 'mobile' ?
					(win.classList.contains('maximized-max') || deviceType === 'mobile' || win.classList.contains('maximized-left') ? 0 :
					win.classList.contains('maximized-right') ? Math.floor(workspace_width() / 2) :
					console.error('Unknown maximized state')) :
				parseInt(win.realLeft !== undefined ? win.realLeft : win.style.left) || 0;
			var minimizedLeft, pushLeft;
			if(left < minMinimizedLeft) {
				minimizedLeft = minMinimizedLeft;
				moved = true;
			} else if(left > workspace_width() - barIconsWidth - 260) {
				minimizedLeft = workspace_width() - barIconsWidth - 260;
				moved = true;
				pushLeft = true;
			} else {
				minimizedLeft = left;
				moved = false;
			}
			for(; full[minimizedLeft]; moved = true) {
				if(pushLeft) {
					full[minimizedLeft].style.left = parseInt(full[minimizedLeft].style.left) - 28 + 'px';
				}
				minimizedLeft += 28;
			}
			if(moved) {
				if(!win.realLeft) win.realLeft = win.style.left;
				win.style.cssText += '; left: ' + (pushLeft ? workspace_width() - barIconsWidth - 260 : minimizedLeft) + 'px !important;';
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
	airborn.core.setTitle($(div).find('.tabtitlebar.focused')[0].textContent.replace('\u00a0', ''));
	//airborn.core.setIcon(div.getElementsByClassName('icon')[0].src);
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

window.addEventListener('resize', function() {
	forceMinimize();
	$('.window').each(function(i, win) { clipResizableHandles.call(win, null, {position: $(win).position()}); });
}, false);

window.addEventListener('scroll', function() {
	window.scrollTo(0, 0);
});

extension = function(file) {
	if(file.substr(-1) === '/') return '/';
	file = file.substr(file.lastIndexOf('/') + 1);
	return file.substr(file.lastIndexOf('.') + 1);
};

openFile = function(path, action) {
	console.log('Prefetching', path);
	airborn.fs.getFile(path); // Start downloading the file as soon as possible.
	var options = arguments[arguments.length - 1];
	var args;
	if(options && typeof options === 'object') {
		args = [].slice.call(arguments, 0, -1);
	} else {
		args = [].slice.call(arguments);
		options = {};
	}
	showProgress(options);
	airborn.fs.getFile('/Core/modules/config/filetypes', function(contents) {
		var apppath;
		if(action[0] === '/') {
			apppath = action;
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
			apppath = '/Apps/' + pref + '/';
		}
		if(options.targetTab && options.targetTab.path === apppath) {
			cb($(options.targetTab).find('iframe')[0].contentWindow, options.targetTab, options.targetDiv);
			return;
		}
		openWindow(apppath, options, function(win, tab, div) {
			$(div).find('iframe').one('load', function() { // App bootstrapper.
				$(div).find('iframe').one('load', function() { // The actual app.
					cb(win, tab, div);
				});
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

/* jshint ignore:start *//* jscs: disable */
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
};
/* jshint ignore:end *//* jscs: enable */