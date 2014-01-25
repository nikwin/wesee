var canvas = document.getElementById('canvas');
var width = canvas.width;
var height = canvas.height;

var ctx = canvas.getContext('2d');

var FORCE_TICK_TIME = false;

var max = function(a, b){return (a > b) ? a : b;};
var min = function(a, b){return (a < b) ? a : b;};

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame   || 
	window.webkitRequestAnimationFrame || 
	window.mozRequestAnimationFrame    || 
	window.oRequestAnimationFrame      || 
	window.msRequestAnimationFrame     || 
	function(callback, element){
	    window.setTimeout(callback, 1000 / FPS_CAP);
	};
})();



var timeFeed = (function(){
    var lastTime = new Date();
    var startTime = new Date();
    var baseTimeFactor = 1.0;
    var timeFactor = baseTimeFactor;
    var fullTimeElapsed = 0;
    var getInterval = function(){
        var nowTime = new Date();
	var interval = (nowTime.getTime() - lastTime.getTime()) / 1000;
	interval *= timeFactor;
	lastTime = nowTime;
        fullTimeElapsed = (nowTime.getTime() - startTime.getTime()) / 1000;
        if (FORCE_TICK_TIME){
            return FORCE_TICK_TIME;
        }
        else{
            return min(interval, 1);
        }
    };
    var setPaused = function(pause){
	timeFactor = pause ? 0 : baseTimeFactor;
    };
    var setFactor = function(factor){
	baseTimeFactor = factor;
	timeFactor = (timeFactor === 0) ? 0 : baseTimeFactor;
    };
    var setStartTime = function(){
        startTime = new Date();
    };
    
    return {getInterval: getInterval,
	    setPaused: setPaused,
	    setFactor: setFactor,
            setStartTime: setStartTime,
            getFullTime: function(){
                return fullTimeElapsed;
            },
           };
})();

var App = function(){
};

App.prototype.initialize = function(){
};

App.prototype.draw = function(){
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
};

App.prototype.update = function(interval){
    return true;
}

var getFrameFunctions = function(){
    app = new App();
    app.initialize();
    return {
        'update': function(){
            var interval = timeFeed.getInterval();
            return app.update(interval);
        },
        'draw': function(){
            app.draw();
        }
    };
};

var main = function(){
    try{
        var functions = getFrameFunctions();
        var tickFun = function(){
            var cont = functions.update();
            functions.draw();
            if (cont){
                requestAnimFrame(tickFun, canvas);
            }
        };
        tickFun();
    }
    catch(e){
        alert(e);
    }
};

window.onload = main;
