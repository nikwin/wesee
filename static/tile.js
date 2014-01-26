var DIRECTION_LEFT = 0;
var DIRECTION_RIGHT = 1;
var DIRECTION_TOP = 2;
var DIRECTION_BOTTOM = 3;
var NUM_DIRECTIONS = 4;

var Tile = function(){
};

Tile.prototype.initialize = function(mazeGenerator, x, y) {
    this.mazeGenerator = mazeGenerator;
    this.x = x;
    this.y = y;
    this.walls = [true, true, true, true];
    this.neighbors = [nil, nil, nil, nil];
};

Tile.prototype.walls = function() {
    return this.walls;
};

Tile.prototype.numWalls = function() {
    var numWalls = 0;
    for (var direction = 0; direction < NUM_DIRECTIONS; ++direction) {
	if (this.walls[direction]) {
	    numWalls++;
	}
    }
    return numWalls;
};

Tile.prototype.allows = function(direction) {
    return this.walls[direction];
};

Tile.prototype.getNeighbor = function(direction) {
    return this.mazeGenerator.getNeighbor(this, direction);
};

var MazeGenerator = function() {
};

MazeGenerator.prototype.initialize = function() {
};

MazeGenerator.prototype.randomWalledDirectionForTile = function(tile) {
    var walledDirections = [];
    for (var direction = 0; direction < NUM_DIRECTIONS; ++direction) {
	if (tile.walls[direction]) {
	    walledDirections.push(direction);
	}
    }
    return walledDirections[Math.floor(Math.random() * walledDirections.length)];
};

var MIN_TILES_TO_EXPAND_PER_DIRECTION = 2;
var MAX_TILES_TO_EXPAND_PER_DIRECTION = 4;

MazeGenerator.prototype.getNeighbor = function(tile, direction) {
    var x = tile.x;
    var y = tile.y;
    if (direction == DIRECTION_LEFT) {
	x--;
    } else if (direction == DIRECTION_RIGHT) {
	x++;
    } else if (direction == DIRECTION_TOP) {
	y--;
    } else if (direction == DIRECTION_BOTTOM) {
	y++;
    }

    if ((x < 0) || (x >= this.tilesWidth)) {
	return nil;
    } else if ((y < 0) || (y >= this.tilesHeight)) {
	return nil;
    } else {
	return this.tiles[x][y];
    }
}

MazeGenerator.prototype.generateMaze = function(width, height) {
    this.tilesWidth = width;
    this.tilesHeight = height;
    this.tiles = [];
    var tilesToExpand = [];
    for (var x = 0; x < width; ++x) {
	var tileColumn = [];
	this.tiles.push(tileColumn);
	for (var y = 0; y < height; ++y) {
	    var tile = new Tile();
	    tile.initialize(this, x, y);
	    tileColumn.push(tile);
	    if ((x == 0) || (x == width - 1)) {
		if (y > 0) {
		    tile.walls[DIRECTION_TOP] = false;
		}
		if (y < height - 1) {
		    tile.walls[DIRECTION_BOTTOM] = false;
		}
	    }

	    if ((y == 0) || (y == height - 1)) {
		if (x > 0) {
		    tile.walls[DIRECTION_LEFT] = false;
		}
		if (x < width - 1) {
		    tile.walls[DIRECTION_RIGHT] = false;
		}
	    }

	    if (tile.numWalls() >= 3) {
		tilesToExpand.push(tile);
	    }
	}
    }

    while (tilesToExpand.length > 0) {
	var tile = tilesToExpand[tilesToExpand.length - 1];
	if (tile.numWalls() < 3) {
	    tilesToExpand.pop();
	    continue;
	}
	var direction = this.randomWalledDirectionForTile(tile);
	var numTilesToExpand = MIN_TILES_TO_EXPAND_PER_DIRECTION + Math.floor(Math.random() * (MAX_TILES_TO_EXPAND_PER_DIRECTION - MIN_TILES_TO_EXPAND_PER_DIRECTION + 1));
	while (true) {
	    if (numTilesToExpand == 0) {
		direction = this.randomWalledDirectionForTile(tile);
		numTilesToExpand = MIN_TILES_TO_EXPAND_PER_DIRECTION + Math.floor(Math.random() * (MAX_TILES_TO_EXPAND_PER_DIRECTION - MIN_TILES_TO_EXPAND_PER_DIRECTION + 1));
	    }
	    var nextX = tile.x;
	    var nextY = tile.y;
	    if (direction == DIRECTION_LEFT) {
		tile.walls[DIRECTION_LEFT] = false;
		nextX--;
	    } else if (direction == DIRECTION_RIGHT) {
		tile.walls[DIRECTION_RIGHT] = false;
		nextX++;
	    } else if (direction == DIRECTION_TOP) {
		tile.walls[DIRECTION_TOP] = false;
		nextY--;
	    } else if (direction == DIRECTION_BOTTOM) {
		tile.walls[DIRECTION_BOTTOM] = false;
		nextY++;
	    } else {
		tile.forsaken = true;
		break;
	    }

	    var nextTile = this.tiles[nextX][nextY];
	    if (direction == DIRECTION_LEFT) {
		nextTile.walls[DIRECTION_RIGHT] = false;
	    } else if (direction == DIRECTION_RIGHT) {
		nextTile.walls[DIRECTION_LEFT] = false;
	    } else if (direction == DIRECTION_TOP) {
		nextTile.walls[DIRECTION_BOTTOM] = false;
	    } else if (direction == DIRECTION_BOTTOM) {
		nextTile.walls[DIRECTION_TOP] = false;
	    }
	    tile = nextTile;
	    numTilesToExpand--;
	    if (nextTile.numWalls() < 3) {
		break;
	    }
	}
    }
};

MazeGenerator.prototype.print = function() {
    for (var y = 0; y < this.tilesHeight; ++y) {
	var line = "";
	for (var x = 0; x < this.tilesWidth; ++x) {
	    var tile = this.tiles[x][y];
	    if (tile.walls[DIRECTION_TOP]) {
		line += "XXX";
	    } else {
		line += "X X";
	    }
	}
	console.log(line);

	line = "";
	for (var x = 0; x < this.tilesWidth; ++x) {
	    var tile = this.tiles[x][y];
	    if (tile.walls[DIRECTION_LEFT]) {
	        line += "X";
	    } else {
		line += " ";
	    }
	    line += " ";
	    if (tile.walls[DIRECTION_RIGHT]) {
		line += "X";
	    } else {
		line += " ";
	    }
	}
	console.log(line);

	line = "";
	for (var x = 0; x < this.tilesWidth; ++x) {
	    var tile = this.tiles[x][y];
	    if (tile.walls[DIRECTION_BOTTOM]) {
		line += "XXX";
	    } else {
		line += "X X";
	    }
	}
	console.log(line);
    }
}
