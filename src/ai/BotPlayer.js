"use strict";
const PlayerTracker = require("../PlayerTracker");
const Vector = require("../modules/Vec2");

class BotPlayer extends PlayerTracker {
    constructor(gameServer, socket) {
        super(gameServer, socket);
        this.splitCooldown = 0;
        this.isBot = true;
        this.targetPursuit = 0;
        this.splitTarget = null;
    }
    getLargest(list) {
        if (!list.length) return null;
        let sorted = list.valueOf();
        sorted.sort((a, b) => b._size - a._size);
        return sorted[0];
    }
    checkConnection() {
        if (this.socket.isCloseReq) {
            for (;this.cells.length;) this.gameServer.removeNode(this.cells[0]);
            return this.isRemoved = true;
        }
        if (!this.cells.length) {
            this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
            if (!this.cells.length) this.socket.close();
        }
    }
    sendUpdate() {
        if (this.splitCooldown) this.splitCooldown--;
        this.decide(this.getLargest(this.cells));
    }
    decide(cell) {
        if (!cell) return;
        let result = new Vector(0, 0),
            prey = null;
        if (this.splitTarget) {
            // De-compress later
            if (this.splitTarget.isRemoved && (this.splitTarget = null, this.targetPursuit = 0), !(this.targetPursuit <= 0)) return this.targetPursuit--, void(this.mouse = {
                x: this.splitTarget.position.x,
                y: this.splitTarget.position.y
            });
            this.splitTarget = null;
        }
        let merge = this.gameServer.config.playerMergeTime <= 0 || this.recMode,
            splitCooldown = 1.5 * this.cells.length < 9 && !this.splitCooldown,
            size = cell._size / 1.3;
        for (let i = 0; i < this.viewNodes.length; i++) {
            let check = this.viewNodes[i];
            if (check.owner !== this) {
                let influence = 0;
                if (check.cellType === 0) {
                    if (this.gameServer.gameMode.isTeams && cell.owner.team == check.owner.team) continue;
                    if (cell._size > check._size * 1.3) influence = check._size / Math.log(this.viewNodes.length);
                    else if (check._size > cell._size * 1.3) influence = -Math.log(check._size / cell._size);
                    else influence = -check._size / cell._size;
                } else if (check.cellType === 1) influence = 1;
                else if (check.cellType === 2) {
                    if (cell._size > check._size * 1.3) {
                        if (this.cells.length >= this.gameServer.config.playerMaxCells) influence = 2;
                        else influence = -1;
                    } else if (check.isMotherCell && check._size > cell._size * 1.3) influence = -1;
                }
                else if (check.cellType === 3 && cell._size > check._size * 1.3) influence = 2;
                if (influence != 0) {
                    let displacement = new Vector(check.position.x - cell.position.x, check.position.y - cell.position.y),
                        dist = displacement.length();
                    if (influence < 0) dist -= cell._size + check._size;
                    if (dist < 1) dist = 1;
                    influence /= dist;
                    let scale = displacement.normalize().scale(influence);
                    // De-compress later
                    splitCooldown && 0 === check.cellType && size > 1.3 * check._size && cell._size * (merge ? .1 : .4) < check._size && this.splitKill(cell, check, dist) && (prey ? check._size > prey._size && (prey = check) : prey = check), result.add(scale);
                }
            }
        }
        result.normalize();
        this.mouse = {
            x: cell.position.x + result.x * this.viewBox.halfWidth,
            y: cell.position.y + result.y * this.viewBox.halfWidth
        }; 
        if (prey != null) {
            this.mouse = {
                x: prey.position.x,
                y: prey.position.y
            };
            this.splitTarget = prey;
            this.targetPursuit = merge ? 5 : 20;
            this.splitCooldown = merge ? 5 : 15;
            this.socket.packetHandler.pressSpace = true;
        }
    }
    splitKill(cell, prey, dist) {
        if (prey.cellType === 2) return 1.3 * this.gameServer.config.virusShotSpeed - cell._size / 2 - prey._size >= dist;
        let speed = Math.max(1.3 * this.gameServer.config.playerSplitSpeed, cell._size / 1.4142 * 4.5);
        return speed >= dist;
    }
}

module.exports = BotPlayer;
