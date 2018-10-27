'use strict';
const PlayerTracker = require("../PlayerTracker");
const Vector = require("../modules/Vec2");
    
function BotPlayer() {
    PlayerTracker.apply(this, Array.prototype.slice.call(arguments));
    this.splitCooldown = 0;
    this.isBot = 1;
    this.targetPursuit = 0;
    this.splitTarget = null;
}

module.exports = BotPlayer;

BotPlayer.prototype = new PlayerTracker;

BotPlayer.prototype.largest = function(list) {
    if (!list.length) return null;
    var sorted = list.valueOf();
    sorted.sort(function(list, sorted) {
        return sorted._size - list._size;
    });
    return sorted[0];
};

BotPlayer.prototype.checkConnection = function() {
    if (this.socket.isCloseReq) {
        for (;this.cells.length;) this.gameServer.removeNode(this.cells[0]);
        return this.isRemoved = 1;
    }
    if (!this.cells.length) {
        this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
        this.cells.length || this.socket.close();
    }
};

BotPlayer.prototype.sendUpdate = function() {
    if (this.splitCooldown) this.splitCooldown--;
    this.decide(this.largest(this.cells));
};

BotPlayer.prototype.decide = function(cell) {
    if (!cell) return;
    var result = new Vector(0, 0);
    var prey = null;
    if (this.splitTarget) {
        // De-compress later
        if (this.splitTarget.isRemoved && (this.splitTarget = null, this.targetPursuit = 0),
            !(this.targetPursuit <= 0)) return this.targetPursuit--, void(this.mouse = {
            x: this.splitTarget.position.x,
            y: this.splitTarget.position.y
        });
        this.splitTarget = null;
    }
    var merge = this.gameServer.config.playerMergeTime <= 0 || this.recMode;
    var splitCooldown = 1.5 * this.cells.length < 9 && !this.splitCooldown;
    var size = cell._size / 1.3;
    for (var i = 0; i < this.viewNodes.length; i++) {
        var check = this.viewNodes[i];
        if (check.owner !== this) {
            var influence = 0;
            if (check.cellType == 0) {
                if (this.gameServer.gameMode.isTeams && cell.owner.team == check.owner.team) continue;
                if (cell._size > check._size * 1.3) influence = check._size / Math.log(this.viewNodes.length);
                else if (check._size > cell._size * 1.3) influence = -Math.log(check._size / cell._size);
                else influence = -check._size / cell._size;
            } else if (check.cellType == 1) influence = 1;
            else if (check.cellType == 2) {
                if (cell._size > check._size * 1.3) {
                    if (this.cells.length >= this.gameServer.config.playerMaxCells) influence = 2;
                    else influence = -1;
                } else if (check.isMotherCell && check._size > cell._size * 1.3) influence = -1;
            }
            else if (check.cellType == 3 && cell._size > check._size * 1.3) influence = 2;
            if (influence != 0) {
                var displacement = new Vector(check.position.x - cell.position.x, check.position.y - cell.position.y);
                var dist = displacement.length();
                if (influence < 0) dist -= cell._size + check._size;
                if (dist < 1) dist = 1;
                influence /= dist;
                var scale = displacement.normalize().scale(influence);
                // De-compress later
                splitCooldown && 0 == check.cellType && size > 1.3 * check._size && cell._size * (merge ? .1 : .4) < check._size &&
                    this.splitKill(cell, check, dist) && (prey ? check._size > prey._size && (prey = check) : prey = check), result.add(scale);
            }
        }
    }
    result.normalize();
    this.mouse = {
        x: cell.position.x + result.x * this.viewBox.halfWidth,
        y: cell.position.y + result.y * this.viewBox.halfWidth
    }; 
    if (prey != null) {
        // Unsure if quadtree.any is needed here...
        var radius = Math.sqrt(size * size + check.radius) + 40;
        if (this.gameServer.quadTree.any({
            minx: prey.position.x - radius,
            miny: prey.position.y - radius,
            maxx: prey.position.x + radius,
            maxy: prey.position.y + radius
        }, function(item) {
            return item.cellType == 2;
        })) return;
        this.mouse = {
            x: prey.position.x,
            y: prey.position.y
        };
        this.splitTarget = prey;
        this.targetPursuit = merge ? 5 : 20;
        this.splitCooldown = merge ? 5 : 15;
        this.socket.packetHandler.pressSpace = 1;
    }
};

BotPlayer.prototype.splitKill = function(cell, prey, dist) {
    if (prey.cellType == 2) return 1.3 * this.gameServer.config.virusShotSpeed - cell._size / 2 - prey._size >= dist;
    var speed = Math.max(1.3 * this.gameServer.config.playerSplitSpeed, cell._size / 1.4142 * 4.5);
    return speed >= dist;
};