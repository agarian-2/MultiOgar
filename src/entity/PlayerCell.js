"use strict";
const Cell = require("./Cell");

class PlayerCell extends Cell {
    constructor(gameServer, owner, position, size) {
        super(gameServer, owner, position, size);
        this.spiked = this.gameServer.config.playerSpikedCells;
        this.cellType = 0;
        this._speed = null;
        this.canRemerge = false;
    }
    canEat() {
        return true;
    }
    getSpeed(dist) {
        let speed = 2.2 * Math.pow(this._size, -.439) * 40;
        speed *= (this.owner.customSpeed || this.gameServer.config.playerSpeed) / 30;
        return speed * Math.min(dist , 32) / 32;
    }
    onAdd(gameServer) {
        if (gameServer.config.gravitationalPushsplits) gameServer.nodesPlayer.unshift(this);
        else gameServer.nodesPlayer.push(this);
        gameServer.gameMode.onCellAdd(this);
    }
    onRemove(gameServer) {
        let index = this.owner.cells.indexOf(this);
        if (index !== -1) this.owner.cells.splice(index, 1);
        index = gameServer.nodesPlayer.indexOf(this);
        if (index !== -1) gameServer.nodesPlayer.splice(index, 1);
        gameServer.gameMode.onCellRemove(this);
    }
}

module.exports = PlayerCell;
