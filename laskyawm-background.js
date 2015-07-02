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
	
	var scaledCanvas = document.createElement('canvas');
	scaledCanvas.width = size * 25;
	scaledCanvas.height = size * 25;
	
	var scaledContext = scaledCanvas.getContext('2d');
	scaledContext.mozImageSmoothingEnabled =
	scaledContext.webkitImageSmoothingEnabled =
	scaledContext.msImageSmoothingEnabled =
	scaledContext.imageSmoothingEnabled = false;
	scaledContext.drawImage(canvas, 0, 0, size * 25, size * 25);
	
	var image = 'url(' + scaledCanvas.toDataURL() + ')';
	
	var cssText = [
		'body:before,',
		'#sidebar:before,',
		'.window:before,',
		'.window:not(.minimized) .titlebar:before,',
		'.window:not(.minimized) .titlebar:after {',
		timer ?
		'	transition: background-image 4s, opacity 4s;' :
		'	transition: none;',
		'}',
		'body:before,',
		'#sidebar:before,',
		'.window:before {',
		'	background-image:' + image + ';',
		'}',
		'.window.minimized:before,',
		'.window:not(.minimized):nth-of-type(5):nth-last-of-type(2) .titlebar:after, /* Firefox */',
		'.window:not(.minimized):nth-of-type(6):nth-last-of-type(1) .titlebar:after { /* Chrome */',
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
	
	if(timer) {
		setTimeout(updateBackground, (tenMinuteIndex + 1) * 600000 - Date.now(), true);
	}
}

updateBackground(true);

window.addEventListener('resize', function() {
	updateBackground();
});