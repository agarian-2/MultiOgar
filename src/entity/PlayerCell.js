var Cell = require("./Cell");

function PlayerCell() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.spiked = this.gameServer.config.playerSpikedCells;
    this.cellType = 0;
    this._speed = null;
    this.canRemerge = false;
}

module.exports = PlayerCell;
PlayerCell.prototype = new Cell;

PlayerCell.prototype.canEat = function() {
    return true;
};

PlayerCell.prototype.getSpeed = function(dist) {
    var scale = 2.2 * Math.pow(this._size, -.439),
        normalized = Math.min(dist , 32) / 32;
    return (scale = 40 * scale * (this.owner.customSpeed || this.gameServer.config.playerSpeed) / 30) * normalized;
};

PlayerCell.prototype.onAdd = function(gameServer) {
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
