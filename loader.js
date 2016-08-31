var loaderNode = document.createElement("div");
loaderNode.id = "loading";
loaderNode.innerHTML = ' \
<div class="airborn-logo"></div> \
<canvas id="loading-canvas" width="240" height="240"></canvas> \
<p>Loading</p> \
<style> \
	#loading { \
		position: fixed; \
		top: 0; \
		bottom: 0; \
		left: 0; \
		right: 0; \
		background: url(/images/background.png); \
		text-align: center; \
		color: #fff; \
		font-size: 20px; \
		font-weight: 100; \
		padding: 60px; \
		transition: opacity 0.3s; \
	} \
	#loading .airborn-logo { \
		background: url(/images/logo.png); \
		width: 248px; \
		height: 43px; \
		display: inline-block; \
		position: absolute; \
		bottom: 60px; \
		left: 60px; \
	} \
	#loading-canvas { \
		display: inline-block; \
	} \
	#loading p { \
		position: relative; \
		top: -155px; \
	} \
</style>';
document.body.appendChild(loaderNode);

var loadingCanvas = function(){
  // SVG stuff
  var bg = document.getElementById('loading-canvas');
  var ctx = ctx = bg.getContext('2d');
  var imd = null;
  var circ = Math.PI * 2;
  var quart = Math.PI / 2;

  ctx.beginPath();
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'square';
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 4.0;

  imd = ctx.getImageData(0, 0, 240, 240);

  loadingCanvas.draw = function(current) {
      ctx.putImageData(imd, 0, 0);
      ctx.beginPath();
      ctx.arc(120, 120, 70, -(quart), ((circ) * current) - quart, false);
      ctx.stroke();
  };
}

loadingCanvas();
loadingCanvas.draw(0.05);

window.addEventListener('message', function(evt) {
  if(evt.data.action === 'wm.setProgress') {
    evt.stopImmediatePropagation();
    loadingCanvas.draw(evt.data.args[0]);
  } else if (evt.data.action === 'wm.hideProgress') {
    var loadingElement = document.getElementById("loading");
    loadingElement.style.opacity = "0";
    setTimeout(function(){
      loadingElement.parentNode.removeChild(loadingElement);
    },301);
  }
}, false);