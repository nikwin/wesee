/*jshint -W099*/
/* global _*/

var canvas = document.getElementById('canvas');
var width = canvas.width;
var height = canvas.height;

var ctx = canvas.getContext('2d');

var FORCE_TICK_TIME = false;

var GAMEWIDTH = width;
var GAMEHEIGHT = height;

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

var bindHandler = (function(){
    var FunctionGroup = function(){
	this.clear();
    };
    FunctionGroup.prototype.clear = function(){
	var oldSet = {
	    functions: this.functions,
	};
	this.functions = {'keydown': []};
	return oldSet;
    };
    FunctionGroup.prototype.reset = function(oldSet){
	this.functions = oldSet.functions;
    };
    FunctionGroup.prototype.run = function(key, e){
	var anyTrue = false;
	for (var i = 0; i < this.functions[key].length; i++){
	    if (this.functions[key][i](e)){
		anyTrue = true;
	    }
	}
	return anyTrue;
    };
    
    FunctionGroup.prototype.addFunction = function(func, event){
	this.functions[event].push(func);
	var that = this;
	return function(){
	    for (var i = 0; i < that.functions[event].length; i++){
		if (that.functions[event][i] === func){
		    that.functions[event].splice(i, 1);
		    return;
		}
	    }
	};
    };

    var alwaysFunctions = new FunctionGroup();
    
    var functionGroups = [alwaysFunctions];
    
    var getBindFunction = function(key){
	return function(e){
	    alwaysFunctions.run(key, e);
	};
    };

    window.addEventListener('keydown', getBindFunction('keydown'), false);
    
    return {
	bindFunction: function(func, event){
	    if (event === undefined){
		event = 'keydown';
	    }

	    return alwaysFunctions.addFunction(func, event);
	},
	clear: function(){
	    var oldSets = [];
	    for (var i = 0; i < functionGroups.length; i++){
		oldSets.push(functionGroups[i].clear());
	    }
	    return oldSets;
	},
	reset: function(oldSets){
	    /*Resets the bindings to those passed,
	      Meant to be used with the result of a clear*/
	    for (var i = 0; i < oldSets.length; i++){
		functionGroups[i].reset(oldSets[i]);
	    }
	}
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

var containsRect = function(outer, inner){
    return outer[0] < inner[0] &&
        outer[1] < inner[1] &&
        outer[0] + outer[2] > inner[0] + inner [2] &&
        outer[1] + outer[3] > innter[1] + inner[3];
};

var collideRect = function(rct1, rct2){
    return (max(rct1[0], rct2[0]) < min(rct1[0] + rct1[2], rct2[0] + rct2[2]) &&
	    max(rct1[1], rct2[1]) < min(rct1[1] + rct1[3], rct2[1] + rct2[3]));
};

var Tile = function(){
    this.rect = [0, 0, 0, 0];
};

Tile.prototype.allows = function(direction){
    return true;
};

Tile.prototype.getNeighbor = function(direction){
    return this;
};

var Player = function(startTile){
    this.pos = [50, 50];
    this.direction = [1, 0];
    this.size = [16, 16];
    this.currentTile = startTile;
    this.stopped = -1;
};

Player.prototype.speed = 60;

Player.prototype.draw = function(framePos){
    ctx.fillStyle = (this.stopped > 0) ? '#000000' : '#ff0000';
    ctx.fillText('P', this.pos[0] - framePos[0], this.pos[1] - framePos[1]);
};

Player.prototype.update = function(interval, sheep, opps){
    if (this.stopped > 0){
        this.stopped -= interval;
        return true;
    }
    
    var that = this;
    var newPos = _.map(this.pos, function(p, i){
        return p + interval * that.speed * that.direction[i];
    });
    var newRect = newPos.concat(this.size);
    if (!containsRect(this.currentTile.rect, newRect)){
        if (this.currentTile.allows(this.direction)){
            this.pos = newPos;
            if (!collideRect(this.currentTile.rect, newRect)){
                this.currentTile = this.currentTile.getNeighbor(this.direction);
            }
        }
    }

    var rect = this.pos.concat(this.size);
    if (collideRect(rect, sheep.rect)){
        return false;
    }

    var oppCollide = _.chain(opps)
        .filter(function(opp){ return collideRect(rect, opp.rect); })
        .first()
        .value();

    if (oppCollide){
        this.collided(oppCollide);
    }
    
    return true;
};

Player.prototype.collided = function(opponent){
    opponent.alive = false;
    this.stopped = 5;
};

Player.prototype.getKeyFunction = function(){
    var that = this;
    return function(e){
        if (e.keyCode == 87 || e.keyCode == 38){
            that.direction = [0, -1];
        }
        else if (e.keyCode == 65 || e.keyCode == 37){
            that.direction = [-1, 0];
        }
        else if (e.keyCode == 83 || e.keyCode == 40){
            that.direction = [0, 1];
        }
        else if (e.keyCode == 68 || e.keyCode == 39){
            that.direction = [1, 0];
        }
    };
};

var Sheep = function(){
    this.rect = [GAMEWIDTH - 50, GAMEHEIGHT - 50, 24, 24];//[100, 50, 24, 24];
};

Sheep.prototype.update = function(interval){
    return true;
};

Sheep.prototype.draw = function(framePos){
    ctx.fillStyle = '#000000';
    ctx.fillText('S', this.rect[0] - framePos[0], this.rect[1] - framePos[1], this.rect[2], this.rect[3]);
};

var Opponent = function(){
    this.rect = [Math.random() * GAMEWIDTH, Math.random() * GAMEHEIGHT, 24, 24];
    this.aiStyle = Math.floor(Math.random() * 2);
    this.alive = true;
};

Opponent.prototype.speed = 45;

Opponent.prototype.update = function(interval, player){
    if (player.stopped > 0){
        return this.alive;
    }
    var factor;
    var pos;
    if (this.aiStyle == 0){
        pos = player.pos;
    }
    else if (this.aiStyle == 1){
        pos = [player.pos[0] + (player.direction[0] * player.speed * 3),
               player.pos[1] + (player.direction[1] * player.speed * 3),]
    }

    dx = Math.abs(this.rect[0] - player.pos[0]);
    dy = Math.abs(this.rect[1] - player.pos[1]);
    if (dx > dy){
        factor = (this.rect[0] > player.pos[0]) ? -1 : 1;
        this.rect[0] += this.speed * interval * factor;
    }
    else{
        factor = (this.rect[1] > player.pos[1]) ? -1 : 1;
        this.rect[1] += this.speed * interval * factor;
    }
    
    return this.alive;
};

Opponent.prototype.draw = function(framePos){
    ctx.fillStyle = '#000000';
    ctx.fillText('O', this.rect[0] - framePos[0], this.rect[1] - framePos[1]);
};

var makeTiles = function(){
    return [[new Tile()]];
};

var makeOpps = function(){
    return [
        new Opponent(),
        new Opponent(),
        new Opponent(),
        new Opponent()
    ];
};

var Game = function(gameProperties){
    this.gameProperties = gameProperties;
};

Game.prototype.initialize = function(){
    this.tiles = makeTiles();
    this.player = new Player(this.tiles[0][0]);
    bindHandler.bindFunction(this.player.getKeyFunction());
    this.opps = makeOpps();
    this.sheep = new Sheep();
    this.stillRunning = true;
};

Game.prototype.getFramePos = function(){
    var x = max(this.player.pos[0] - width / 2, 0);
    var y = max(this.player.pos[1] - height / 2, 0);
    x = min(x, GAMEWIDTH - width / 2);
    y = min(y, GAMEHEIGHT - height / 2);
    return [x, y];
};

Game.prototype.draw = function(){
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    var framePos = this.getFramePos();
    //_.invoke(this.tiles, 'draw', framePos);
    this.player.draw(framePos);
    _.invoke(this.opps, 'draw', framePos);
    this.sheep.draw(framePos);
};

Game.prototype.update = function(interval){
    this.stillRunning = this.player.update(interval, this.sheep, this.opps);
    var that = this;
    this.opps = _.filter(this.opps, function(opp){
        return opp.update(interval, that.player);
    });
    this.sheep.update(interval);
    if (!this.stillRunning){
        this.gameProperties.next = new EndGame(this.gameProperties);
    }
    return this.stillRunning;
};

var EndGame = function(gameProperties){
    this.gameProperties = gameProperties;
};

EndGame.prototype.draw = function(){
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, width, height);
};

EndGame.prototype.update = function(){
    return true;
};

EndGame.prototype.initialize = function(){
};

var App = function(){
    this.gameProperties = {};
    this.current = new Game(this.gameProperties);
    this.current.initialize();
};

App.prototype.update = function(interval){
    var continueObject = this.current.update(interval);
    if (!continueObject){
        this.current = this.gameProperties.next;
        this.current.initialize();
    }
    return true;
};

App.prototype.draw = function(){
    this.current.draw();
};

var getFrameFunctions = function(){
    app = new App();
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
    var mazeGenerator = new MazeGenerator();
    mazeGenerator.generateMaze(10, 10);
    //mazeGenerator.print();

    var functions = getFrameFunctions();
    var tickFun = function(){
        var cont = functions.update();
        functions.draw();
        if (cont){
            requestAnimFrame(tickFun, canvas);
        }
    };
    tickFun();
};

window.onload = main;
