/* This file is licensed under the Affero General Public License. */

/*
 * Colorbrewer colors, by Cindy Brewer
 */

var colorbrewer = {
	YlGn: ['#ffffe5','#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#006837','#004529'],
	YlGnBu: ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58'],
	GnBu: ['#f7fcf0','#e0f3db','#ccebc5','#a8ddb5','#7bccc4','#4eb3d3','#2b8cbe','#0868ac','#084081'],
	BuGn: ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#006d2c','#00441b'],
	PuBuGn: ['#fff7fb','#ece2f0','#d0d1e6','#a6bddb','#67a9cf','#3690c0','#02818a','#016c59','#014636'],
	PuBu: ['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#045a8d','#023858'],
	BuPu: ['#f7fcfd','#e0ecf4','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#810f7c','#4d004b'],
	RdPu: ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177','#49006a'],
	PuRd: ['#f7f4f9','#e7e1ef','#d4b9da','#c994c7','#df65b0','#e7298a','#ce1256','#980043','#67001f'],
	OrRd: ['#fff7ec','#fee8c8','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#b30000','#7f0000'],
	YlOrRd: ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026'],
	YlOrBr: ['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#993404','#662506'],
	Purples: ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#54278f','#3f007d'],
	Blues: ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c','#08306b'],
	Greens: ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c','#00441b'],
	Oranges: ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#a63603','#7f2704'],
	Reds: ['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d'],
	Greys: ['#ffffff','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000'],
	PuOr: ['#7f3b08','#b35806','#e08214','#fdb863','#fee0b6','#f7f7f7','#d8daeb','#b2abd2','#8073ac','#542788','#2d004b'],
	BrBG: ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e','#003c30'],
	PRGn: ['#40004b','#762a83','#9970ab','#c2a5cf','#e7d4e8','#f7f7f7','#d9f0d3','#a6dba0','#5aae61','#1b7837','#00441b'],
	PiYG: ['#8e0152','#c51b7d','#de77ae','#f1b6da','#fde0ef','#f7f7f7','#e6f5d0','#b8e186','#7fbc41','#4d9221','#276419'],
	RdBu: ['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061'],
	RdGy: ['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#ffffff','#e0e0e0','#bababa','#878787','#4d4d4d','#1a1a1a'],
	RdYlBu: ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'],
	Spectral: ['#9e0142','#d53e4f','#f46d43','#fdae61','#fee08b','#ffffbf','#e6f598','#abdda4','#66c2a5','#3288bd','#5e4fa2'],
	RdYlGn: ['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']
};

var palettes = Object.keys(colorbrewer).map(function(key) {
	return colorbrewer[key].reverse();
});
var nPalettes = palettes.length;

var size;

var style = document.createElement('style');
document.head.appendChild(style);

var favicon = document.createElement('link');
favicon.rel = 'shortcut icon';
document.head.appendChild(favicon);

function loadImage(url, callback) {
	var img = new Image();
	img.addEventListener('load', callback);
	img.src = url;
	return img;
}

// See comment explaining preloading below.
var faviconBackgroundMask = loadImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAAAAAA6xUnlAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAA3XAAAN1wFCKJt4AAABaklEQVQoz2NgGFyAiRGfrFbtykVpojil/e78////704VTBlOz/a+cKtb/8FgKQ8fD6o1AtO+/v//4/FfiPynbaeOtishy1cAZX59//cfCZzQQEgLn/v/eUlRXss1ZAWzmeHyqk9/NnbceLw19fx/hBm3ZeDy0gV51b+AQoci68tnPP3//elroH3PYRawpx27vPQ6SMvPlUcuzs5YXJyb3fb0/+9p/BD5xG/I1v7f5HT22/ul+W8+f6uFeH0XivT/z7lPgGRvZH5+CdgAnqOo8j/y7gHJ58df3+8RBslLHUKVv+q1Csr6WwEKupVo2o+eTYeFw2EeBgafL6jyf//8nzcfyt7PzcAQgOp6cPzMhtA/JwBjUuowuvTnvJMQxpNbB6QYGPSXXrgIAefPgsDekkl/IPL//n8LArqQVVAYDAS9a6uBoHnXT4RR3six7PIC3ap1gihp02XOhvVIYG29DAMqYGRBBswMAw8AXBGLv1qbABAAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTUtMTAtMDZUMDQ6MTM6NTIrMDI6MDCYcCM+AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE1LTEwLTA2VDA0OjEzOjUyKzAyOjAw6S2bggAAAABJRU5ErkJggg==');
var faviconForeground = loadImage('data:image/png;base64,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');

function updateBackground(timer) {
	if(timer || size !== Math.ceil(Math.max(window.screen.width, window.screen.height) / 25)) {
		size = Math.ceil(Math.max(window.screen.width, window.screen.height) / 25);
	} else {
		return;
	}
	
	var tenMinuteIndex = Math.floor(Date.now() / 600000);
	
	var products = nPalettes * nPalettes;
	
	var product = tenMinuteIndex % products;
	
	var firstPalette = palettes[Math.floor(product / nPalettes)];
	var secondPalette = palettes[product % nPalettes];
	
	var canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	
	var context = canvas.getContext('2d');
	context.rect(0, 0, size, size);
	
	var gradient = context.createLinearGradient(0, 0, 0, size);
	secondPalette.forEach(function(color, i) {
		gradient.addColorStop(i / secondPalette.length, color);
	});
	context.fillStyle = gradient;
	context.fill();
	
	gradient = context.createLinearGradient(0, 0, size, 0);
	firstPalette.forEach(function(color, i) {
		gradient.addColorStop(
			i / firstPalette.length,
			'rgba(' +
			parseInt(color.substr(1, 2), 16) + ',' +
			parseInt(color.substr(3, 2), 16) + ',' +
			parseInt(color.substr(5, 2), 16) + ', 0.5)'
		);
	});
	context.fillStyle = gradient;
	context.fill();
	
	if(!window.CSS || !CSS.supports || !(
		CSS.supports('image-rendering', 'pixelated') ||
		CSS.supports('image-rendering', '-moz-crisp-edges') ||
		CSS.supports('-ms-interpolation-mode', 'nearest-neighbor')
	)) {
		var scaledCanvas = document.createElement('canvas');
		scaledCanvas.width = size * 25;
		scaledCanvas.height = size * 25;
		
		var scaledContext = scaledCanvas.getContext('2d');
		scaledContext.mozImageSmoothingEnabled =
		scaledContext.webkitImageSmoothingEnabled =
		scaledContext.msImageSmoothingEnabled =
		scaledContext.imageSmoothingEnabled = false;
		scaledContext.drawImage(canvas, 0, 0, size * 25, size * 25);
		
		canvas = scaledCanvas;
	}
	
	var dataUrl = canvas.toDataURL();
	var image = 'url(' + dataUrl + ')';
	
	var cssText = [
		'body:before,',
		'#sidebar:before,',
		'.window:before,',
		'.window:not(.minimized) .titlebar:before,',
		'.window:not(.minimized) .titlebar:after,',
		'.hud {',
		timer ?
		'	transition: background-image 4s, opacity 4s;' :
		'	transition: none;',
		'	background-size: ' + size * 25 + 'px ' + size * 25 + 'px;',
		'	image-rendering: pixelated;',
		'	image-rendering: -moz-crisp-edges;',
		'	-ms-interpolation-mode: nearest-neighbor;',
		'}',
		'body:before,',
		'#sidebar:before,',
		'.window:before {',
		'	background-image:' + image + ';',
		'}',
		'.window.minimized:before,',
		'.window:not(.minimized):nth-of-type(1):nth-last-of-type(1) .titlebar:after,',
		'.hud {',
		'	background-image: linear-gradient(to right, rgba(255, 255, 255, .5), rgba(255, 255, 255, .5)),' + image + ';',
		'}',
		'@media only screen and (max-device-width: 640px) {',
		'	.window:before,',
		'	.window:not(.minimized) .titlebar:before {',
		'		background-image: linear-gradient(to right, rgba(255, 255, 255, .8), rgba(255, 255, 255, .8)),' + image + ';',
		'	}',
		'	.window.minimized:before,',
		'	.window:not(.minimized) .titlebar:after {',
		'		background-image: linear-gradient(to right, rgba(255, 255, 255, .7), rgba(255, 255, 255, .7)),' + image + ';',
		'	}',
		'}'
	].join('\n');
	
	if(style.textContent && navigator.userAgent.indexOf('Firefox') !== -1) {
		/* Firefox doesn't support cross-fading `background-image`s (https://bugzil.la/546052).
		 * Instead, we fade to blue and then to the new image. */
		style.textContent += [
			'body:before,',
			'#sidebar:before,',
			'.window:before,',
			'.window:not(.minimized) .titlebar:before,',
			'.window:not(.minimized) .titlebar:after {',
			'	opacity: 0;',
			'}',
		].join('\n');
		
		setTimeout(function() {
			style.textContent = cssText;
		}, 4000);
	} else {
		style.textContent = cssText;
	}
	
	// In Chrome, the below svg is sometimes incomplete at load event (the background is missing). (https://code.google.com/p/chromium/issues/detail?id=382170)
	// Since Chrome 47, this even sometimes happens for Data URLs. This happens more often if the tab is in the background.
	// To fix the problem, we preload the subresources in an <img> before loading it in the svg.
	loadImage(dataUrl, function() {
		
		// Chrome doesn't support svg favicons, (https://code.google.com/p/chromium/issues/detail?id=294179)
		// but compat.js renders the favicon to a png for us.
		favicon.href = 'data:image/svg+xml,' + encodeURIComponent([
			'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32">',
				'<defs>',
					'<mask id="backgroundMask">',
						'<image x="0" y="0" width="31" height="31" xlink:href="' + faviconBackgroundMask.src + '" />',
					'</mask>',
				'</defs>',
				'<image x="' + -(size * 25 / 4) + '" y="' + -(size * 25 / 4) + '" width="' + size * 25 + '" height="' + size * 25 + '" xlink:href="' + dataUrl + '" mask="url(#backgroundMask)" />',
				'<image x="0" y="0" width="32" height="32" xlink:href="' + faviconForeground.src + '" />',
			'</svg>'
		].join('\n'));
		
	});
	
	if(timer) {
		setTimeout(updateBackground, (tenMinuteIndex + 1) * 600000 - Date.now(), true);
	}
}

updateBackground(true);

window.addEventListener('resize', function() {
	updateBackground();
});