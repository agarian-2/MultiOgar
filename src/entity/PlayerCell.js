'use strict';
const Cell = require('./Cell');

function PlayerCell() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.spiked = this.gameServer.config.playerSpikedCells;
    this.cellType = 0;
    this._speed = null;
    this.canRemerge = 0;
}

module.exports = PlayerCell;
PlayerCell.prototype = new Cell;

PlayerCell.prototype.canEat = function(cell) {return 1};

PlayerCell.prototype.getSpeed = function(dist) {
    var scale = 2.2 * Math.pow(this._size, -.439);
    var normalized = Math.min(dist , 32) / 32;
    if (this.owner.customSpeed) var speed = (scale = 40 * scale * this.owner.customSpeed / 30) * normalized;
    else speed = (scale = 40 * scale * this.gameServer.config.playerSpeed / 30) * normalized;
    return speed;
};

PlayerCell.prototype.onAdd = function(gameServer) {
    if (this.gameServer.config.unshift) this.gameServer.nodes.player.unshift(this);
    else this.gameServer.nodes.player.push(this);
    gameServer.gameMode.onCellAdd(this);
};

PlayerCell.prototype.onRemove = function(gameServer) {
    var index = this.owner.cells.indexOf(this);
    if (index != -1) this.owner.cells.splice(index, 1);
    index = gameServer.nodes.player.indexOf(this);
    if (index != -1) gameServer.nodes.player.splice(index, 1);
    gameServer.gameMode.onCellRemove(this);
};
