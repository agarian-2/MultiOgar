'use strict';
const PlayerTracker = require("../PlayerTracker");

function MinionPlayer() {
    PlayerTracker.apply(this, Array.prototype.slice.call(arguments));
    this.isMi = 1;
}

module.exports = MinionPlayer;

MinionPlayer.prototype = new PlayerTracker;

MinionPlayer.prototype.checkConnection = function() { // TO DO (maybe): Minion color change with X
    if (this.gameServer.config.minionSameColor) {
        this.color = this.owner.color;
        this.cells.forEach(function(item) {
            item.color = this.owner.color;
        }, this);
    }
    if (this.socket.isCloseReq) {
        for (;this.cells.length > 0;) this.gameServer.removeNode(this.cells[0]);
        return void (this.isRemoved = 1);
    }
    if (!this.cells.length) {
        this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
        if (!this.cells.length) this.socket.close();
    }
    if (!this.owner.socket.isConnected || !this.owner.minion.control) this.socket.close();
    if (this.owner.minion.frozen) this.frozen = 1;
    else this.frozen = 0;
    if (this.owner.minion.split) this.socket.packetHandler.pressSpace = 1;
    if (this.owner.minion.eject) this.socket.packetHandler.pressW = 1;
    if (this.owner.minion.follow) this.mouse = this.owner.centerPos;
    else this.mouse = this.owner.mouse;
    if (this.owner.minion.collect) {
        this.viewNodes = [];
        var self = this;
        this.gameServer.quadTree.find(this.viewBox, function(item) {
            if (item.cell.cellType == 1 || item.cell.cellType == 3) self.viewNodes.push(item.cell);
        });
        var bestDist = 1/0; // Infinite
        for (var i in this.viewNodes) {
            var node = this.viewNodes[i];
            var dx = this.cells[0].position.x - node.position.x;
            var dy = this.cells[0].position.y - node.position.y;
            if (dx * dx + dy * dy < bestDist) {
                bestDist = dx * dx + dy * dy;
                this.mouse = node.position;
            }
        }
    }
};