(function() {
	if(window.wmLoaded) {
		console.log('wmLoaded was true, not showing loader');
		return;
	}
	
	var loaderNode = document.createElement('div');
	loaderNode.id = 'loading';
	loaderNode.innerHTML = [
		'<img class="airborn-logo" src="images/logo-small.png">',
		'<canvas id="loading-canvas" width="240" height="240"></canvas>',
		'<p>Loading…</p>',
		'<style>',
		'	#loading {',
		'		position: fixed;',
		'		top: 0;',
		'		left: 0;',
		'		width: 100%;',
		'		height: 100%;',
		'		background-image: url(images/background.png);',
		'		text-align: center;',
		'		color: #fff;',
		'		font-size: 18px;',
		'		font-weight: 100;',
		'		padding: 60px;',
		'		transition: opacity 0.5s;',
		'	}',
		'	@media (max-device-width: 640px) and (max-device-height: 640px) {',
		'		#loading {',
		'			background-image: url(images/background-small.png)',
		'		}',
		'	}',
		'	@supports (',
		'		(image-rendering: pixelated) or',
		'		(image-rendering: -moz-crisp-edges) or',
		'		(-ms-interpolation-mode: nearest-neighbor)',
		'	) {',
		'		#loading {',
		'			background-image: url(images/background-pixelated.png);',
		'			background-size: 1925px 1100px;',
		'			image-rendering: pixelated;',
		'			image-rendering: -moz-crisp-edges;',
		'			-ms-interpolation-mode: nearest-neighbor;',
		'		}',
		'		@media (max-device-width: 640px) and (max-device-height: 640px) {',
		'			#loading {',
		'				background-image: url(images/background-pixelated-small.png);',
		'				background-size: 650px 650px;',
		'			}',
		'		}',
		'	}',
		'	#loading .airborn-logo {',
		'		position: absolute;',
		'		bottom: 60px;',
		'		left: 60px;',
		'	}',
		'	#loading-canvas {',
		'		display: inline-block;',
		'	}',
		'	#loading p {',
		'		position: relative;',
		'		top: -155px;',
		'	}',
		'</style>',
	].join('\n');
	document.body.appendChild(loaderNode);
	
	var canvas = document.getElementById('loading-canvas');
	var ctx = canvas.getContext('2d');
	var circ = Math.PI * 2;
	var quart = Math.PI / 2;
	
	ctx.strokeStyle = 'rgba(255, 255, 255, .2)';
	ctx.lineWidth = 4;
	ctx.lineCap = 'square';
	ctx.beginPath();
	ctx.arc(120, 120, 70, 0, circ, false);
	ctx.closePath();
	ctx.stroke();
	ctx.strokeStyle = '#fff';
	
	var imd = ctx.getImageData(0, 0, 240, 240);
	
	var last;
	function updateLoader(current) {
		if(last >= current) {
			return;
		}
		last = current;
		ctx.putImageData(imd, 0, 0);
		ctx.beginPath();
		ctx.arc(120, 120, 70, -quart, current * circ - quart, false);
		ctx.stroke();
	}
	
	updateLoader(0.05);
	
	window.addEventListener('message', function(evt) {
		if(evt.data.action === 'wm.setProgress') {
			updateLoader(evt.data.args[0]);
		} else if(evt.data.action === 'wm.hideProgress') {
			loaderNode.style.opacity = 0;
			loaderNode.style.pointerEvents = 'none';
			loaderNode.addEventListener('transitionend', function() {
				document.body.removeChild(loaderNode);
			});
		}
	});
})();
//# sourceURL=/Core/loader.js