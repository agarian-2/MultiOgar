"use strict";
const PlayerTracker = require("../PlayerTracker");

class MinionPlayer extends PlayerTracker {
    constructor(gameServer, socket) {
        super(gameServer, socket);
        this.isMi = true;
    }
    checkConnection() {
        if (this.gameServer.config.minionSameColor) {
            this.color = this.owner.color;
            this.cells.forEach(item => {
                item.color = this.owner.color;
            }, this);
        }
        if (this.socket.isCloseReq) {
            for (;this.cells.length;) this.gameServer.removeNode(this.cells[0]);
            let index = this.owner.minions.indexOf(this);
            if (index !== -1) this.owner.minions.splice(index, 1);
            return this.isRemoved = true;
        }
        if (!this.cells.length) {
            this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
            if (!this.cells.length) return this.socket.close();
        }
        if (this.owner.socket.isConnected === false || !this.owner.minion.control) return this.socket.close();
        this.frozen = this.owner.minion.frozen ? true : false;
        if (this.owner.minion.split) this.socket.packetHandler.pressSpace = true;
        if (this.owner.minion.eject) this.socket.packetHandler.pressW = true;
        if (this.owner.minion.follow) this.mouse = this.owner.centerPos;
        else this.mouse = this.owner.mouse;
        if (this.owner.minion.collect) {
            this.viewNodes = [];
            let self = this;
            this.gameServer.quadTree.find(this.viewBox, item => {
                if (item.cell.cellType === 1 || item.cell.cellType === 3) self.viewNodes.push(item.cell);
            });
            let bestDist = Infinity;
            for (let i in this.viewNodes) {
                let node = this.viewNodes[i],
                    dx = this.cells[0].position.x - node.position.x,
                    dy = this.cells[0].position.y - node.position.y;
                if (dx * dx + dy * dy < bestDist) {
                    bestDist = dx * dx + dy * dy;
                    this.mouse = node.position;
                }
            }
        }
    }
}

module.exports = MinionPlayer;
