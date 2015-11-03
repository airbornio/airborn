/* This file is licensed under the Affero General Public License. */

/*global _, $, barIconsWidth, apps, powerMenu, airborn, showProgress: true, setProgress: true, hideProgress: true, openFile: true, openWindow: true, extension: true */

var deviceType = window.matchMedia('only screen and (max-device-width: 640px)').matches ? 'mobile' : 'desktop';

var workspace_start_top = deviceType === 'mobile' ? 50 : 25;
var workspace_start_left = deviceType === 'mobile' ? 0 : 100;

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
}
function addClipResizableHandles(plugin, evt) {
	var obj = {};
	obj[evt] = clipResizableHandles;
	
	$.ui.plugin.add(plugin, 'clipResizableHandles', obj);
}

addClipResizableHandles('draggable', 'drag');
addClipResizableHandles('resizable', 'resize');


function addHUD(pos) {
	var $hud = $('.hud');
	if(!$hud.length) $hud = $('<div>').appendTo('body');
	$hud.attr('class', 'hud hud-' + pos);
	$hud.attr('data-pos', pos);
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
			addHUD('max');
		} else {
			if(event.pageY > workspace_start_top && this.hasClass('minimized')) {
				this.removeClass('minimized');
			}
			if(event.pageY > 2 * workspace_start_top) {
				if(event.pageX < workspace_start_left + 20) {
					addHUD('left');
				} else if(event.pageX > window.innerWidth - 20) {
					addHUD('right');
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
									var icon = manifest.icons && (manifest.icons['32'] || manifest.icons['64'] || manifest.icons['128'] || manifest.icons['256'] || manifest.icons['512']);
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
		var appData = _path.match('/Apps/.+?/')[0].replace('Apps', 'AppData');
		
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
			manageApps: (manifest.permissions || {})['webapps-manage']
		};
		airborn.fs.prepareUrl('/', {rootParent: _path, relativeParent: _path, permissions: permissions, csp: csp, appData: appData}, function(url) {
			var div = options.targetDiv || document.createElement('div');
			var iframeWin;
			
			var tabs, tab;
			if(!options.targetDiv) {
				div.className = 'window';
				var left, top;
				if(options.originDiv) {
					left = parseInt(options.originDiv.style.left) || workspace_start_left;
					top = parseInt(options.originDiv.style.top) || workspace_start_top;
				} else {
					left = workspace_start_left;
					top = workspace_start_top;
				}
				var positions = childDivs.map(function(div) {
					return (parseInt(div.style.left) || workspace_start_left) + ',' + (parseInt(div.style.top) || workspace_start_top);
				});
				while(positions.indexOf(left + ',' + top) !== -1) {
					left += 25;
					top += 25;
				}
				div.style.left = left + 'px';
				div.style.top = top + 'px';
				$(div).draggable({customIframeFix: true, containment: [-Infinity, workspace_start_top, Infinity, Infinity], snap: 'html, .window', scroll: false, minimize: true, forceMinimize: true, cursor: 'move', clipResizableHandles: true});
				
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
				iframe.sandbox = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox';
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
								document.body.removeChild(div);
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
					title.textContent = 'Loading…'; // This element needs at least a nbsp
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

openWindow('/Apps/firetext/', {}, function(win, tab, div) {
	if(deviceType !== 'mobile') $(div).addClass('maximized maximized-max');
	clipResizableHandles.call(div, null, {position: $(div).position()});
});


function forceMinimize() {
	var windows = childDivs.filter(function(win) {
		return !win.classList.contains('minimized') || win.classList.contains('force-minimized');
	}).map(function(win) {
		if(win.classList.contains('maximized') || deviceType === 'mobile') {
			if(win.classList.contains('maximized-max') || deviceType === 'mobile')
				return {
					x1: workspace_start_left,
					y1: workspace_start_top,
					x2: window.innerWidth,
					y2: window.innerHeight,
					div: win
				};
			else if(win.classList.contains('maximized-left'))
				return {
					x1: workspace_start_left,
					y1: workspace_start_top,
					x2: Math.ceil((window.innerWidth + workspace_start_left) / 2),
					y2: window.innerHeight,
					div: win
				};
			else if(win.classList.contains('maximized-right'))
				return {
					x1: Math.ceil((window.innerWidth + workspace_start_left) / 2),
					y1: workspace_start_top,
					x2: window.innerWidth,
					y2: window.innerHeight,
					div: win
				};
		}
		
		var $win = $(win);
		var minimized = win.classList.contains('minimized');
		var left = parseFloat(win.realLeft !== undefined ? win.realLeft : minimized ? win.style.left : $win.css('left')) || workspace_start_left;
		var top = parseFloat(minimized ? win.style.top : $win.css('top')) || workspace_start_top;
		var width = parseFloat(minimized ? win.style.width : $win.css('width')) || 800;
		var height = parseFloat(minimized ? win.style.height : $win.css('height')) || 600;
		return {
			x1: Math.max(workspace_start_left, Math.min(window.innerWidth, left)),
			y1: Math.max(workspace_start_top, Math.min(window.innerHeight, top)),
			x2: Math.max(workspace_start_left, Math.min(window.innerWidth, left + width)),
			y2: Math.max(workspace_start_top, Math.min(window.innerHeight, top + height)),
			div: win
		};
	}).reverse();
	
	for(var i = 0, len = windows.length; i < len; i++) {
		var win = windows[i];
		for(var amount = 0, sign = 1, area = 0; amount <= i; amount++, sign *= -1) {
			for(var b = 0; b < Math.pow(2, i); b++) {
				if(b.toString(2).replace(/0/g, '').length === amount) {
					var x1 = win.x1, y1 = win.y1, x2 = win.x2, y2 = win.y2;
					for(var j = 0; j < len; j++) {
						if(Math.pow(2, j) & b) {
							if(windows[j].x1 > x1) x1 = windows[j].x1;
							if(windows[j].y1 > y1) y1 = windows[j].y1;
							if(windows[j].x2 < x2) x2 = windows[j].x2;
							if(windows[j].y2 < y2) y2 = windows[j].y2;
						}
					}
					area += sign * O(x1, y1, x2, y2);
				}
			}
		}
		if(area === 0) {
			win.div.classList.add('force-minimized');
			win.div.classList.add('minimized');
		} else if(win.div.classList.contains('force-minimized')) {
			win.div.classList.remove('force-minimized');
			win.div.classList.remove('minimized');
		}
	}
	
	positionMinimized();
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
	var minMinimizedLeft = deviceType === 'mobile' ? 100 : 150;
	[].slice.call(childDivs).reverse().forEach(function(win) {
		var moved;
		if(win.classList.contains('minimized')) {
			var left =
				win.classList.contains('maximized') || deviceType === 'mobile' ?
					(win.classList.contains('maximized-max') || deviceType === 'mobile' || win.classList.contains('maximized-left') ? workspace_start_left :
					win.classList.contains('maximized-right') ? Math.floor((window.innerWidth + workspace_start_left) / 2) :
					console.error('Unknown maximized state')) :
				parseInt(win.realLeft !== undefined ? win.realLeft : win.style.left) || 0;
			var minimizedLeft, pushLeft;
			if(left < minMinimizedLeft) {
				minimizedLeft = minMinimizedLeft;
				moved = true;
			} else if(left > window.innerWidth - barIconsWidth - 260) {
				minimizedLeft = window.innerWidth - barIconsWidth - 260;
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
				win.style.cssText += '; left: ' + (pushLeft ? window.innerWidth - barIconsWidth - 260 : minimizedLeft) + 'px !important;';
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
	if(_.isObject(options)) {
		args = [].slice.call(arguments, 0, -1);
	} else {
		args = [].slice.call(arguments);
		options = {};
	}
	showProgress(options);
	airborn.fs.getFile('/Core/filetypes', function(contents) {
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