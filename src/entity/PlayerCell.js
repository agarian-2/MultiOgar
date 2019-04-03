'use strict';
const Cell = require('./Cell'),
    Packet = require('../packet');

function PlayerCell() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.spiked = this.gameServer.config.playerSpikedCells;
    this.cellType = 0;
    this.canRemerge = false;
}

module.exports = PlayerCell;
PlayerCell.prototype = new Cell;

PlayerCell.prototype.canEat = function(cell) {
    return 1;
};

PlayerCell.prototype.getSpeed = function(dist) {
    var scale = 2.2 * Math.pow(this._size, -.439);
    return (scale = 40 * scale * (this.owner.customSpeed || this.gameServer.config.playerSpeed) / 30) * (Math.min(dist, 32) / 32);
};

PlayerCell.prototype.onAdd = function(gameServer) {
    this.color = gameServer.config.splitRandomColor === 1 ? gameServer.randomColor() : this.owner.color;
    this.owner.cells.push(this);
    this.owner.socket.sendPacket(new Packet.AddNode(this.owner, this));
    if (gameServer.config.unshift === 1) gameServer.nodesPlayer.unshift(this);
    else gameServer.nodesPlayer.push(this);
    gameServer.gameMode.onCellAdd(this);
};

PlayerCell.prototype.onRemove = function(gameServer) {
    var index = this.owner.cells.indexOf(this);
    if (index !== -1) this.owner.cells.splice(index, 1);
    index = gameServer.nodesPlayer.indexOf(this);
    if (index !== -1) gameServer.nodesPlayer.splice(index, 1);
    gameServer.gameMode.onCellRemove(this);
};
