(function() {
	if(window.wmLoaded) {
		console.log('wmLoaded was true, not showing loader');
		return;
	}
	
	var loaderNode = document.createElement('div');
	loaderNode.id = 'loading';
	loaderNode.innerHTML = [
		'<div class="background"></div>',
		'<img class="airborn-logo" src="images/logo.png">',
		'<canvas id="loading-canvas"></canvas>',
		'<p>Loading…</p>',
		'<style>',
		'	#loading {',
		'		position: fixed;',
		'		width: 100%;',
		'		height: 100%;',
		'		top: 0;',
		'		text-align: center;',
		'		color: #fff;',
		'		font-size: 18px;',
		'		transition: opacity 0.5s;',
		'	}',
		'	#loading .airborn-logo {',
		'		position: absolute;',
		'		bottom: 60px;',
		'		left: 60px;',
		'		background: rgba(255, 255, 255, .7);',
		'		padding: 10px 15px;',
		'		border-radius: 15px;',
		'	}',
		'	#loading-canvas {',
		'		display: inline-block;',
		'		width: 240px;',
		'		height: 240px;',
		'		margin-top: 60px;',
		'	}',
		'	#loading-canvas.spinning {',
		'		animation: spin 4s linear infinite;',
		'	}',
		'	#loading p {',
		'		position: relative;',
		'		top: -155px;',
		'	}',
		'	@keyframes spin {',
		'		from { transform: rotate(0deg); }',
		'		to { transform: rotate(360deg); }',
		'	}',
		'</style>',
	].join('\n');
	document.body.appendChild(loaderNode);
	
	var dpr = window.devicePixelRatio || 1;
	var canvas = document.getElementById('loading-canvas');
	canvas.width = canvas.height = 240 * dpr;
	var ctx = canvas.getContext('2d');
	ctx.scale(dpr, dpr);
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
	
	var imd = ctx.getImageData(0, 0, canvas.width, canvas.height);
	
	var last;
	function updateLoader(current) {
		if(last >= current) {
			return;
		}
		last = current;
		ctx.putImageData(imd, 0, 0);
		ctx.beginPath();
		ctx.arc(120, 120, 70, -quart, Math.max(0.05, current) * circ - quart, false);
		ctx.stroke();
		canvas.className = current ? '' : 'spinning';
	}
	
	updateLoader(0);
	
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