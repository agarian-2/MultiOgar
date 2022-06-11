"use strict";

class Cell {
    constructor(gameServer, owner, position, size) {
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
            if (position) this.position = {
                x: position.x,
                y: position.y
            };
        }
    }
    setSize(size) {
        this._size = size;
        this.radius = size * size;
        this._mass = this.radius / 100;
        if (this.owner) this.owner.massChanged = 1;
    }
    canEat() {
        return false;
    }
    getAge() {
        if (this.tickOfBirth === null) return 0;
        return Math.max(0, this.gameServer.tickCount - this.tickOfBirth);
    }
    onEat(cell) {
        if (!this.gameServer.config.playerBotGrow && this._size >= 250 && cell._size <= 41.23 && cell.cellType === 0) cell.radius = 0;
        this.setSize(Math.sqrt(this.radius + cell.radius));
    }
    setBoost(dist, angle) {
        this.boostDistance = dist;
        this.boostDirection = {
            x: Math.sin(angle),
            y: Math.cos(angle),
            angle: angle
        };
        this.isMoving = true;
        if (!this.owner) {
            let index = this.gameServer.nodesMoving.indexOf(this);
            if (index < 0) this.gameServer.nodesMoving.push(this);
        }
    }
    checkBorder(border) {
        let size = this._size / 2;
        this.position.x = Math.max(this.position.x, border.minX + size);
        this.position.y = Math.max(this.position.y, border.minY + size);
        this.position.x = Math.min(this.position.x, border.maxX - size);
        this.position.y = Math.min(this.position.y, border.maxY - size);
    }
    onEaten() {}
    onAdd() {}
    onRemove() {}
}

module.exports = Cell;
