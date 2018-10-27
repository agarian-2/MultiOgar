'use strict';
const Packet = require('./packet');
const BinaryWriter = require('./packet/BinaryWriter');
//const Vector = require('./modules/Vec2');

function PlayerTracker(gameServer, socket) {
    this.OP = {
        enabled: 0,
        foodSize: 10,
        foodColor: {r: 0, g: 0, b: 0},
    };
    this.gameServer = gameServer;
    this.socket = socket;
    this.pID = -1;
    this.userAuth = null;
    this.isRemoved = 0;
    this.isCloseReq = 0;
    this._name = "";
    this._skin = "";
    this._nameUtf8 = null;
    this._nameUnicode = null;
    this._skinUtf8 = null;
    this.color = {r: 0, g: 0, b: 0};
    this.viewNodes = [];
    this.clientNodes = [];
    this.cells = [];
    this.mergeOverride = 0;
    this._score = 0;
    this._scale = 1;
    this.massChanged = 1;
    this.borderCount = 0;
    this.tickLeaderboard = 0;
    this.team = 0;
    this.spectating = 0;
    this.freeRoam = 0;
    this.lastQTick = 0;
    this.centerPos = {x: 0, y: 0};
    this.mouse = {x: 0, y: 0};
    this.viewBox = {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        halfWidth: 0,
        halfHeight: 0
    };
    this.scramble = {X: 0, Y: 0, ID: 0};
    this.connectedTime = 0;
    this.isMinion = 0;
    this.isMuted = 0;
    this.spawnMass = 0;
    this.frozen = 0;
    this.customSpeed = 0;
    this.recMode = 0;
    this.isMi = 0;
    this.isBot = 0;
    this.minion = {
        control: 0,
        split: 0,
        eject: 0,
        frozen: 0,
        collect: 0,
        follow: 0
    };
    if (gameServer) {
        this.connectedTime = gameServer.stepDateTime;
        this.centerPos = {x: 0, y: 0};
        this.pID = this.gameServer.lastPlayerID++ >> 0;
        gameServer.gameMode.onPlayerInit(this);
        this.scrambleCoords();
    }
    var UserRoleEnum  = require("./enum/UserRoleEnum");
    this.userRole = UserRoleEnum.GUEST;
}

module.exports = PlayerTracker;

PlayerTracker.prototype.scrambleCoords = function() {
    if (!this.gameServer.config.scrambleLevel) {
        this.scramble.ID = 0;
        this.scramble.X = 0;
        this.scramble.Y = 0;
    } else { // 0xFFFFFFFF = 4294967295?
        this.scramble.ID = (Math.random() * 0xFFFFFFFF) >>> 0;
        var maxX = Math.max(0, 31767 - this.gameServer.border.width);
        var maxY = Math.max(0, 31767 - this.gameServer.border.height);
        var x = maxX * Math.random();
        var y = maxY * Math.random();
        if (Math.random() >= .5) x = -x;
        if (Math.random() >= .5) y = -y;
        this.scramble.X = x;
        this.scramble.Y = y;
    }
    this.borderCount = 0;
};

PlayerTracker.prototype.setName = function(name) {
    this._name = name;
    var writer = new BinaryWriter();
    writer.writeStringZeroUnicode(name);
    this._nameUnicode = writer.toBuffer();
    writer = new BinaryWriter();
    writer.writeStringZeroUtf8(name);
    this._nameUtf8 = writer.toBuffer();
};

PlayerTracker.prototype.setSkin = function(skin) {
    this._skin = skin;
    var writer = new BinaryWriter();
    writer.writeStringZeroUtf8(skin);
    this._skinUtf8 = writer.toBuffer();
    var writer1 = new BinaryWriter();
    writer1.writeStringZeroUtf8("%" + skin);
    this._skinUtf8protocol11 = writer1.toBuffer();
};

PlayerTracker.prototype.getScale = function() {
    this.massChanged && this.updateScale();
    return this._scale;
};

PlayerTracker.prototype.updateScale = function() {
    var totalSize = 0;
    var totalScore = 0;
    for (var i = 0; i < this.cells.length; i++) {
        var node = this.cells[i];
        totalSize += node._size;
        totalScore += node.radius;
    }
    if (totalSize == 0) this._score = 0;
    else {
        this._score = totalScore;
        this._scale = Math.pow(Math.min(64 / totalSize, 1), .4);
    }
    this.massChanged = 0;
};

PlayerTracker.prototype.joinGame = function(name, skin) {
    if (this.cells.length) return;
    if (skin) this.setSkin(skin);
    this.setName(name);
    this.spectating = 0;
    this.freeRoam = 0;
    if (!this.isMi && this.socket.isConnected != null) {
        if (this.socket.packetHandler.protocol < 6) this.socket.sendPacket(new Packet.UpdateNodes(this, [], [], [], this.clientNodes));
        this.socket.sendPacket(new Packet.ClearAll());
        this.clientNodes = [];
        this.scrambleCoords();
        if (this.gameServer.config.scrambleLevel < 2) this.socket.sendPacket(new Packet.SetBorder(this, this.gameServer.border));
        else if (this.gameServer.config.scrambleLevel == 3) {
            var rand = 10065536 * Math.random();
            var border = {
                minX: this.gameServer.border.minX - rand,
                minY: this.gameServer.border.minY - rand,
                maxX: this.gameServer.border.maxX + rand,
                maxY: this.gameServer.border.maxY + rand
            };
            this.socket.sendPacket(new Packet.SetBorder(this, border));
        }
    }
    this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
};

PlayerTracker.prototype.checkConnection = function() {
    if (!this.socket.isConnected) {
        var pt = this.gameServer.config.playerDisconnectTime;
        if (pt < 0) return;
        var dt = (this.gameServer.stepDateTime - this.socket.closeTime) / 1000;
        if (!this.cells.length || dt >= pt) {
            var cells = this.cells;
            this.cells = [];
            for (var i = 0; i < cells.length; i++)
                this.gameServer.removeNode(cells[i]);
            this.isRemoved = 1;
            return;
        }
        this.mouse.x = this.centerPos.x;
        this.mouse.y = this.centerPos.y;
        this.socket.packetHandler.pressSpace = 0;
        this.socket.packetHandler.pressQ = 0;
        this.socket.packetHandler.pressW = 0;
        return;
    }
    if (!this.isCloseReq && this.gameServer.config.serverTimeout) {
        dt = (this.gameServer.stepDateTime - this.socket.lastAliveTime) / 1000;
        if (dt >= this.gameServer.config.serverTimeout) {
            this.socket.close(1000, "Connection timeout");
            this.isCloseReq = 1;
        }
    }
};

PlayerTracker.prototype.updateTick = function() {
    if (this.isRemoved || this.isMinion) return;
    this.socket.packetHandler.process();
    if (this.gameServer.clients.length > 400 && this.isMi) return;
    var config = this.gameServer.config;
    this.updateViewNodes(this.cells.length);
    if (this.spectating) var viewBaseX = 2150, viewBaseY = 1250;
    else viewBaseX = config.serverViewBaseX, viewBaseY = config.serverViewBaseY;
    var scale = Math.max(this.getScale(), config.serverMinScale);
    var width = (viewBaseX / scale) / 2;
    var height = (viewBaseY / scale) / 2;
    this.viewBox = {
        minX: this.centerPos.x - width,
        minY: this.centerPos.y - height,
        maxX: this.centerPos.x + width,
        maxY: this.centerPos.y + height,
        halfWidth: width,
        halfHeight: height
    };
    this.viewNodes = [];
    var self = this;
    this.gameServer.quadTree.find(this.viewBox, function(item) {
        if (item.cell.owner != self) self.viewNodes.push(item.cell);
    });
    this.viewNodes = this.viewNodes.concat(this.cells);
    this.viewNodes.sort(function(a, b) {return a.nodeID - b.nodeID});
};

PlayerTracker.prototype.sendUpdate = function() {
    if (this.isRemoved || !this.socket.packetHandler.protocol ||
        !this.socket.isConnected || this.isMi || this.isMinion ||
        (this.socket._socket.writable != null && !this.socket._socket.writable) ||
        this.socket.readyState != this.socket.OPEN) return;
    if (this.gameServer.config.scrambleLevel == 2) {
        if (!this.borderCount) {
            var border = this.gameServer.border;
            var view = this.viewBox;
            var bound = {
                minX: Math.max(border.minX, view.minX - view.halfWidth),
                minY: Math.max(border.minY, view.minY - view.halfHeight),
                maxX: Math.min(border.maxX, view.maxX + view.halfWidth),
                maxY: Math.min(border.maxY, view.maxY + view.halfHeight)
            };
            this.socket.sendPacket(new Packet.SetBorder(this, bound));
        }
        if (++this.borderCount >= 20) this.borderCount = 0;
    }
    var nodes = {
        add: [],
        upd: [],
        eat: [],
        del: [],
        oldI: 0,
        newI: 0
    };
    for (;nodes.newI < this.viewNodes.length && nodes.oldI < this.clientNodes.length;) {
        if (this.viewNodes[nodes.newI].nodeID < this.clientNodes[nodes.oldI].nodeID) {
            nodes.add.push(this.viewNodes[nodes.newI]);
            nodes.newI++;
            continue;
        }
        if (this.viewNodes[nodes.newI].nodeID > this.clientNodes[nodes.oldI].nodeID) {
            var node = this.clientNodes[nodes.oldI];
            if (node.isRemoved && node.killedBy !== null && node.owner != node.killedBy.owner) nodes.eat.push(node);
            else nodes.del.push(node);
            nodes.oldI++;
            continue;
        }
        node = this.viewNodes[nodes.newI];
        if (node.isRemoved) continue;
        if (node.isMoving || node.cellType == 0) nodes.upd.push(node);
        if (this.gameServer.gameMode.ID == 3 || node.cellType == 2) nodes.add.push(node);
        nodes.newI++;
        nodes.oldI++;
    }
    for (;nodes.newI < this.viewNodes.length;) {
        nodes.add.push(this.viewNodes[nodes.newI]);
        nodes.newI++;
    }
    for (;nodes.oldI < this.clientNodes.length;) {
        node = this.clientNodes[nodes.oldI];
        if (node.isRemoved && node.killedBy !== null && node.owner != node.killedBy.owner) nodes.eat.push(node);
        else nodes.del.push(node);
        nodes.oldI++;
    }
    this.clientNodes = this.viewNodes;
    this.socket.sendPacket(new Packet.UpdateNodes(this, nodes.add, nodes.upd, nodes.eat, nodes.del));
    if (++this.tickLeaderboard > this.gameServer.config.serverLBUpdate) {
        this.tickLeaderboard = 0;
        if (this.gameServer.leaderboardType >= 0) this.socket.sendPacket(
            new Packet.UpdateLeaderboard(this, this.gameServer.leaderboard, this.gameServer.leaderboardType)
        );
    }
};

PlayerTracker.prototype.updateViewNodes = function(len) {
    if (!this.spectating || len) { // In-game
        var cx = 0, cy = 0;
        for (var i = 0; i < len; i++) {
            cx += this.cells[i].position.x / len;
            cy += this.cells[i].position.y / len;
            this.centerPos.x = cx;
            this.centerPos.y = cy;
        }
    } else { // Spectating
        if (this.freeRoam || this.getSpecTarget() == null) { // In free-roam
            var dx = this.mouse.x - this.centerPos.x;
            var dy = this.mouse.y - this.centerPos.y;
            var squared = dx * dx + dy * dy;
            if (squared < 1) return;
            var sqrt = Math.sqrt(squared);
            var nx = dx / sqrt;
            var ny = dy / sqrt;
            var speed = Math.min(sqrt, this.gameServer.config.freeRoamSpeed);
            if (!speed) return;
            this._scale = this.gameServer.config.serverSpecScale;
            cx = this.centerPos.x + nx * speed;
            cy = this.centerPos.y + ny * speed;
            this.setCenterPos(cx, cy);
        } else { // Spectate target
            var target = this.getSpecTarget();
            if (target != null) {
                this.setCenterPos(target.centerPos.x, target.centerPos.y);
                this._scale = target.getScale();
                this.viewBox = target.viewBox;
                this.viewNodes = target.viewNodes;
            }
        }
        this.socket.sendPacket(new Packet.UpdatePos(this, this.centerPos.x, this.centerPos.y, this._scale));
    }
};

PlayerTracker.prototype.pressSpace = function() {
    if (this.gameServer.running && !this.spectating && !this.mergeOverride)
        this.gameServer.splitCells(this);
};

PlayerTracker.prototype.pressW = function() {
    if (this.gameServer.running && !this.spectating)
        this.gameServer.ejectMass(this);
};

PlayerTracker.prototype.pressQ = function() {
    if (this.spectating) {
        if (this.gameServer.tickCount - this.lastQTick < 20) return;
        this.lastQTick = this.gameServer.tickCount;
        this.freeRoam = !this.freeRoam;
    }
};

PlayerTracker.prototype.getSpecTarget = function() {
    var target = this.gameServer.largestClient;
    if (target == null || target.isRemoved || !target.cells.length) {
        target = null;
        return target;
    }
    return target;
};

PlayerTracker.prototype.setCenterPos = function(x, y) {
    x = Math.max(x, this.gameServer.border.minX);
    y = Math.max(y, this.gameServer.border.minY);
    x = Math.min(x, this.gameServer.border.maxX);
    y = Math.min(y, this.gameServer.border.maxY);
    this.centerPos.x = x;
    this.centerPos.y = y;
};