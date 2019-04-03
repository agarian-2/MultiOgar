'use strict';
const PlayerTracker = require("../PlayerTracker");

function MinionPlayer() {
    PlayerTracker.apply(this, Array.prototype.slice.call(arguments));
    this.isMi = true;
}

module.exports = MinionPlayer;

MinionPlayer.prototype = new PlayerTracker;

MinionPlayer.prototype.checkConnection = function() {
    if (this.gameServer.config.minionSameColor) {
        this.color = this.owner.color;
        this.cells.forEach(function(item) {
            item.color = this.owner.color;
        }, this);
    }
    if (this.socket.isCloseReq) {
        for (;this.cells.length;) this.gameServer.removeNode(this.cells[0]);
        return void (this.isRemoved = true);
    }
    if (!this.cells.length) {
        this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
        if (!this.cells.length) this.socket.close();
    }
    if (this.owner.socket.isConnected === false || !this.owner.minion.control) this.socket.close();
    this.frozen = this.owner.minion.frozen;
    if (this.owner.minion.split) this.socket.packetHandler.pressSpace = true;
    if (this.owner.minion.eject) this.socket.packetHandler.pressW = true;
    if (this.owner.minion.follow) this.mouse = this.owner.centerPos;
    else this.mouse = this.owner.mouse;
    if (this.owner.minion.collect) {
        this.viewNodes = [];
        var self = this;
        this.gameServer.quadTree.find(this.viewBox, function(item) {
            if (item.cell.cellType === 1 || item.cell.cellType === 3) self.viewNodes.push(item.cell);
        });
        var bestDist = 1 / 0; // Infinite
        for (var i in this.viewNodes) {
            var node = this.viewNodes[i],
                dx = this.cells[0].position.x - node.position.x,
                dy = this.cells[0].position.y - node.position.y;
            if (dx * dx + dy * dy < bestDist) {
                bestDist = dx * dx + dy * dy;
                this.mouse = node.position;
            }
        }
    }
};
