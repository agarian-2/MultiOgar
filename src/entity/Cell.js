'use strict';
//const Vector = require("../modules/Vec2");

function Cell(gameServer, owner, pos, size) {
	this.gameServer = gameServer;
	this.owner = owner;
	this.tickOfBirth = 0;
	this.color = {r: 0, g: 0, b: 0};
	this.position;
	this.radius = 0;
	this._size = 0;
	this._mass = 0;
	this.cellType = -1;
	this.isAgitated = 0;
	this.killedBy = null;
	this.isMoving = 0;
	this.boostDistance = 0;
	this.boostDirection = {x: 1, y: 0};
	if (this.gameServer) {
		this.tickOfBirth = this.gameServer.tickCount;
		this.nodeID = this.gameServer.lastNodeID++ >> 0;
		if (size) this.setSize(size);
		if (pos) this.position = {x: pos.x, y: pos.y};
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
	if (!this.gameServer.config.playerBotGrow)
		if (this._size >= 250 && prey._size <= 41.23 && prey.cellType == 0) prey.radius = 0;
	this.setSize(Math.sqrt(this.radius + prey.radius));
};

Cell.prototype.setBoost = function(dist, angle) {
	this.boostDistance = dist;
	this.boostDirection = {
		x: Math.sin(angle),
		y: Math.cos(angle),
		angle: angle
	};
	this.isMoving = 1;
	if (!this.owner) {
		var index = this.gameServer.nodes.moving.indexOf(this);
		index < 0 && this.gameServer.nodes.moving.push(this);
	}
};

Cell.prototype.checkBorder = function(b) {
	var size = this._size / 2;
	var pos = this.position;
	if (this.gameServer.config.borderBouncePhysics) {
		pos.x = Math.max(pos.x, b.minX + size);
		pos.y = Math.max(pos.y, b.minY + size);
		pos.x = Math.min(pos.x, b.maxX - size);
		pos.y = Math.min(pos.y, b.maxY - size);
	} else {
		if (pos.x < b.minX + size || pos.x > b.maxX - size) {
			this.boostDirection.x = pos.x;
			pos.x = Math.max(pos.x, b.minX + size);
			pos.x = Math.min(pos.x, b.maxX - size);
		}
		if (pos.y < b.minY + size || pos.y > b.maxY - size) {
			this.boostDirection.y = pos.y;
			pos.y = Math.max(pos.y, b.minY + size);
			pos.y = Math.min(pos.y, b.maxY - size);
		}
	}
};

Cell.prototype.onEaten = function() {};
Cell.prototype.onAdd = function() {};
Cell.prototype.onRemove = function() {};