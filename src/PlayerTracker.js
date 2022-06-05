var Packet = require("./packet"),
    BinaryWriter = require("./packet/BinaryWriter");

function PlayerTracker(gameServer, socket) {
    this.OP = {
        enabled: false,
        foodSize: 10,
        foodColor: {
            r: 0,
            g: 0,
            b: 0
        }
    };
    this.gameServer = gameServer;
    this.socket = socket;
    this.pID = -1;
    this.userAuth = null;
    this.isRemoved = false;
    this.isCloseReq = false;
    this._name = "";
    this._skin = "";
    this._nameUtf8 = null;
    this._nameUnicode = null;
    this._skinUtf8 = null;
    this.color = {
        r: 0,
        g: 0,
        b: 0
    };
    this.viewNodes = [];
    this.clientNodes = [];
    this.cells = [];
    this.minions = [];
    this.mergeOverride = false;
    this._score = 0;
    this._scale = 1;
    this.massChanged = 1;
    this.borderCount = 0;
    this.tickLeaderboard = 0;
    this.team = 0;
    this.isSpectating = false;
    this.freeRoam = false;
    this.lastQTick = 0;
    this.centerPos = {
        x: 0,
        y: 0
    };
    this.mouse = {
        x: 0,
        y: 0
    };
    this.viewBox = {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        halfWidth: 0,
        halfHeight: 0
    };
    this.scrambleX = 0;
    this.scrambleY = 0;
    this.scrambleID = 0;
    /*this.scramble = {
        x: 0,
        y: 0,
        id: 0
    };*/
    this.connectedTime = 0;
    this.isMinion = false;
    this.isMuted = false;
    this.spawnMass = 0;
    this.frozen = false;
    this.customSpeed = 0;
    this.recMode = false;
    this.isMi = false;
    this.isBot = false;
    this.minion = {
        control: false,
        split: false,
        eject: false,
        frozen: false,
        collect: false,
        follow: false
    };
    this.rainbowEnabled = false;
    if (gameServer) {
        this.connectedTime = gameServer.stepDateTime;
        this.centerPos = {
            x: 0,
            y: 0
        };
        this.pID = gameServer.lastPlayerID++ >> 0;
        gameServer.gameMode.onPlayerInit(this);
        this.scrambleCoords();
    }
    var UserRoleEnum  = require("./enum/UserRoleEnum");
    this.userRole = UserRoleEnum.GUEST;
}

module.exports = PlayerTracker;

PlayerTracker.prototype.scrambleCoords = function() {
    if (!this.gameServer.config.scrambleLevel) {
        this.scrambleID = 0;
        this.scrambleX = 0;
        this.scrambleY = 0;
    } else { // 0xFFFFFFFF = 4294967295?
        this.scrambleID = (Math.random() * 0xFFFFFFFF) >>> 0;
        var maxX = Math.max(0, 31767 - this.gameServer.border.width),
            maxY = Math.max(0, 31767 - this.gameServer.border.height),
            x = maxX * Math.random(),
            y = maxY * Math.random();
        if (Math.random() >= .5) x = -x;
        if (Math.random() >= .5) y = -y;
        this.scrambleX = x;
        this.scrambleY = y;
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
    var totalSize = 0,
        totalScore = 0;
    for (var i = 0; i < this.cells.length; i++) {
        var node = this.cells[i];
        totalSize += node._size;
        totalScore += node.radius;
    }
    if (totalSize === 0) this._score = 0;
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
    this.isSpectating = this.freeRoam = false;
    if (!this.isMi && this.socket.isConnected != null) {
        if (this.socket.packetHandler.protocol < 6) this.socket.sendPacket(new Packet.UpdateNodes(this, [], [], [], this.clientNodes));
        this.socket.sendPacket(new Packet.ClearAll());
        this.clientNodes = [];
        this.scrambleCoords();
        if (this.gameServer.config.scrambleLevel < 2) this.socket.sendPacket(new Packet.SetBorder(this, this.gameServer.border));
        else if (this.gameServer.config.scrambleLevel === 3) {
            var rand = 10065536 * Math.random(),
                border = {
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
    if (this.socket.isConnected === false) {
        var pt = this.gameServer.config.playerDisconnectTime;
        if (pt < 0) return;
        var dt = (this.gameServer.stepDateTime - this.socket.closeTime) / 1000;
        if (!this.cells.length || dt >= pt) {
            var cells = this.cells;
            this.cells = [];
            for (var i = 0; i < cells.length; i++) this.gameServer.removeNode(cells[i]);
            this.isRemoved = true;
            return;
        }
        this.mouse.x = this.centerPos.x;
        this.mouse.y = this.centerPos.y;
        this.socket.packetHandler.pressSpace = this.socket.packetHandler.pressW = this.socket.packetHandler.pressQ = false;
        return;
    }
    if (!this.isCloseReq && this.gameServer.config.serverTimeout) {
        dt = (this.gameServer.stepDateTime - this.socket.lastAliveTime) / 1000;
        if (dt >= this.gameServer.config.serverTimeout) {
            this.socket.close(1000, "Connection timed out!");
            this.isCloseReq = true;
        }
    }
};

PlayerTracker.prototype.updateTick = function() {
    if (this.isRemoved || this.isMinion) return;
    this.socket.packetHandler.process();
    if (this.gameServer.clients.length > 400 && this.isMi) return;
    var config = this.gameServer.config;
    this.updateViewNodes(this.cells.length);
    var viewBaseX = config.serverViewBaseX,
        viewBaseY = config.serverViewBaseY;
    if (this.isSpectating) {
        viewBaseX = 2225;
        viewBaseY = 1275;
    }
    var scale = Math.max(this.getScale(), config.serverMinScale),
        width = (viewBaseX / scale) / 2,
        height = (viewBaseY / scale) / 2;
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
        if (item.cell.owner !== self) self.viewNodes.push(item.cell);
    });
    this.viewNodes = this.viewNodes.concat(this.cells);
    this.viewNodes.sort(function(a, b) {
        return a.nodeID - b.nodeID;
    });
};

PlayerTracker.prototype.sendUpdate = function() {
    if (this.isRemoved || !this.socket.packetHandler.protocol || !this.socket.isConnected || this.isMi || this.isMinion || (this.socket._socket.writable != null && !this.socket._socket.writable) || this.socket.readyState != this.socket.OPEN) return;
    if (this.gameServer.config.scrambleLevel === 2) {
        if (!this.borderCount) {
            var border = this.gameServer.border,
                view = this.viewBox,
                bound = {
                    minX: Math.max(border.minX, view.minX - view.halfWidth),
                    minY: Math.max(border.minY, view.minY - view.halfHeight),
                    maxX: Math.min(border.maxX, view.maxX + view.halfWidth),
                    maxY: Math.min(border.maxY, view.maxY + view.halfHeight)
                };
            this.socket.sendPacket(new Packet.SetBorder(this, bound));
        }
        if (++this.borderCount >= 20) this.borderCount = 0;
    }
    var addNodes = [],
        updNodes = [],
        eatNodes = [],
        delNodes = [],
        oldIndex = 0,
        newIndex = 0;
    for (;newIndex < this.viewNodes.length && oldIndex < this.clientNodes.length;) {
        if (this.viewNodes[newIndex].nodeID < this.clientNodes[oldIndex].nodeID) {
            addNodes.push(this.viewNodes[newIndex]);
            newIndex++;
            continue;
        }
        if (this.viewNodes[newIndex].nodeID > this.clientNodes[oldIndex].nodeID) {
            var node = this.clientNodes[oldIndex];
            if (node.isRemoved && node.killedBy !== null && node.owner !== node.killedBy.owner) eatNodes.push(node);
            else delNodes.push(node);
            oldIndex++;
            continue;
        }
        node = this.viewNodes[newIndex];
        if (node.isRemoved) continue;
        if (node.isMoving || node.cellType === 0) updNodes.push(node);
        if (this.gameServer.gameMode.ID === 3 || node.cellType === 2) addNodes.push(node);
        newIndex++;
        oldIndex++;
    }
    for (;newIndex < this.viewNodes.length;) {
        addNodes.push(this.viewNodes[newIndex]);
        newIndex++;
    }
    for (;oldIndex < this.clientNodes.length;) {
        node = this.clientNodes[oldIndex];
        if (node.isRemoved && node.killedBy !== null && node.owner !== node.killedBy.owner) eatNodes.push(node);
        else delNodes.push(node);
        oldIndex++;
    }
    this.clientNodes = this.viewNodes;
    this.socket.sendPacket(new Packet.UpdateNodes(this, addNodes, updNodes, eatNodes, delNodes));
    if (++this.tickLeaderboard > this.gameServer.config.serverLBUpdate) {
        this.tickLeaderboard = 0;
        if (this.gameServer.leaderboardType >= 0) this.socket.sendPacket(new Packet.UpdateLeaderboard(this, this.gameServer.leaderboard, this.gameServer.leaderboardType));
    }
};

PlayerTracker.prototype.updateViewNodes = function(len) {
    if (!this.isSpectating || len) { // Player is in-game
        var cx = 0,
            cy = 0;
        for (var i = 0; i < len; i++) {
            cx += this.cells[i].position.x / len;
            cy += this.cells[i].position.y / len;
            this.centerPos.x = cx;
            this.centerPos.y = cy;
        }
    } else { // Player is spectating
        if (this.freeRoam || this.getSpecTarget() == null) { // In free-roam
            var dx = this.mouse.x - this.centerPos.x,
                dy = this.mouse.y - this.centerPos.y,
                squared = dx * dx + dy * dy;
            if (squared < 1) return;
            var sqrt = Math.sqrt(squared),
                nx = dx / sqrt,
                ny = dy / sqrt,
                speed = Math.min(sqrt, this.gameServer.config.freeRoamSpeed);
            if (!speed) return;
            this._scale = this.gameServer.config.serverSpecScale;
            cx = this.centerPos.x + nx * speed;
            cy = this.centerPos.y + ny * speed;
            this.setCenterPos(cx, cy);
        } else { // Spectating a target
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
    if (this.gameServer.running && !this.isSpectating && !this.mergeOverride) this.gameServer.splitCells(this);
};

PlayerTracker.prototype.pressW = function() {
    if (this.gameServer.running && !this.isSpectating) this.gameServer.ejectMass(this);
};

PlayerTracker.prototype.pressQ = function() {
    if (!this.isSpectating || this.gameServer.tickCount - this.lastQTick < 20) return;
    this.lastQTick = this.gameServer.tickCount;
    this.freeRoam = !this.freeRoam;
};

PlayerTracker.prototype.getSpecTarget = function() {
    var target = this.gameServer.largestClient;
    if (target == null || target.isRemoved || !target.cells.length || target.isConnected === false) {
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
