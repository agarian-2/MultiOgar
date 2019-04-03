'use strict';

function Cell(gameServer, owner, pos, size) {
    this.gameServer = gameServer;
    this.owner = owner;
    this.tickOfBirth = 0;
    this.color = {
        r: 0,
        g: 0,
        b: 0
    };
    this.position = {
        x: 0,
        y: 0
    };
    this.radius = 0;
    this._size = 0;
    this._mass = 0;
    this.cellType = -1;
    this.isAgitated = false;
    this.killedBy = null;
    this.isMoving = false;
    this.boostDistance = 0;
    this.boostDirection = {
        x: 1,
        y: 0
    };
    this.isRemoved = false;
    if (this.gameServer) {
        this.tickOfBirth = this.gameServer.tickCount;
        this.nodeID = this.gameServer.lastNodeID++ >> 0;
        if (size) this.setSize(size);
        if (pos) this.position = {
            x: pos.x,
            y: pos.y
        };
    }
}

module.exports = Cell;

Cell.prototype.setSize = function(size) {
    this._size = size;
    this.radius = size * size;
    this._mass = this.radius / 100;
    if (this.owner) this.owner.massChanged = 1;
};

Cell.prototype.canEat = function() {
    return 0;
};

Cell.prototype.getAge = function() {
    if (this.tickOfBirth === null) return 0;
    return Math.max(0, this.gameServer.tickCount - this.tickOfBirth);
};

Cell.prototype.onEat = function(prey) {
    if (!this.gameServer.config.playerBotGrow && this._size >= 250 && prey._size <= 41.23 && prey.cellType === 0) prey.radius = 0;
    this.setSize(Math.sqrt(this.radius + prey.radius));
};

Cell.prototype.setBoost = function(dist, angle) {
    this.boostDistance = dist;
    this.boostDirection = {
        x: Math.sin(angle),
        y: Math.cos(angle),
        angle: angle
    };
    this.isMoving = true;
    if (!this.owner) {
        var index = this.gameServer.nodesMoving.indexOf(this);
        if (index < 0) this.gameServer.nodesMoving.push(this);
    }
};

Cell.prototype.checkBorder = function(border) {
    var size = this._size / 2,
        pos = this.position;
    if (this.gameServer.config.borderBouncePhysics) {
        pos.x = Math.max(pos.x, border.minX + size);
        pos.y = Math.max(pos.y, border.minY + size);
        pos.x = Math.min(pos.x, border.maxX - size);
        pos.y = Math.min(pos.y, border.maxY - size);
    } else {
        if (pos.x < border.minX + size || pos.x > border.maxX - size) {
            this.boostDirection.x = pos.x;
            pos.x = Math.max(pos.x, border.minX + size);
            pos.x = Math.min(pos.x, border.maxX - size);
        }
        if (pos.y < border.minY + size || pos.y > border.maxY - size) {
            this.boostDirection.y = pos.y;
            pos.y = Math.max(pos.y, border.minY + size);
            pos.y = Math.min(pos.y, border.maxY - size);
        }
    }
};

Cell.prototype.onEaten = function() {};
Cell.prototype.onAdd = function() {};
Cell.prototype.onRemove = function() {};
