'use strict';
const QuadNode = require('./modules/QuadNode.js');
const BotLoader = require('./ai/BotLoader');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const Packet = require('./packet');
const Entity = require('./entity');
const Log = require('./modules/Logger');
const GameMode = require('./gamemodes');
//const Vector = require('./modules/Vec2');

function GameServer() {
    this.src = "../src";
    this.running = 1;
    this.version = "1.5.2";
    this.httpServer = null;
    this.commands = null;
    this.lastNodeID = 1;
    this.lastPlayerID = 1;
    this.clients = [];
    this.socketCount = 0;
    this.largestClient = null;
    // this is slow
    this.nodes = {
        all: [],
        player: [],
        virus: [],
        food: [],
        eject: [],
        moving: []
    };
    this.leaderboard = [];
    this.leaderboardType = -1;
    this.bots = new BotLoader(this);
    this.disableSpawn = 0;
    this.startTime = Date.now();
    this.stepDateTime = 0;
    this.timeStamp = 0;
    this.updateTime = 0;
    this.updateTimeAvg = 0;
    this.timerLoopBind = null;
    this.mainLoopBind = null;
    this.tickCount = 0;
    this.config = {
        // Logging Configs
        logVerbosity: 4,
        logFileVerbosity: 5,
        // Server Configs
        serverTimeout: 300,
        serverMaxConnect: 500,
        serverMinScale: .15,
        serverPort: 443,
        serverBind: "0.0.0.0",
        serverTracker: 0,
        serverGamemode: 0,
        serverBots: 0,
        serverViewBaseX: 1920,
        serverViewBaseY: 1080,
        serverSpecScale: .4,
        serverStatsPort: 88,
        serverStatsUpdate: 60,
        serverColorType: 0,
        serverTimeStep: 40,
        serverMaxLB: 10,
        serverLBUpdate: 25,
        serverUserRoles: 1,
        // Client Configs
        serverChat: 1,
        serverChatAscii: 1,
        serverName: "MultiOgar-Edited",
        serverWelcome1: "Welcome to MultiOgar-Edited!",
        serverWelcome2: "",
        clientBind: "",
        filterBadWords: 1,
        // Server Minion Configs
        minionDefaultName: "Minion",
        minionSameColor: 0,
        minionSameName: 0,
        minionStartSize: 31.623,
        minionTeamCollision: 1,
        serverMinions: 0,
        // Anti-External Minion Configs
        serverIpLimit: 4,
        minionChecking: 1,
        minionIgnoreTime: 30,
        minionThreshold: 10,
        minionInterval: 1000,
        scrambleLevel: 1,
        playerBotGrow: 0,
        // Border Configs
        borderWidth: 14142,
        borderHeight: 14142,
        borderBouncePhysics: 1,
        borderTransparency: 0,
        // Food Configs
        foodMinSize: 10,
        foodMaxSize: 20,
        foodMinAmount: 1000,
        foodMaxAmount: 2000,
        foodSpawnAmount: 30,
        spawnInterval: 20,
        // Virus Cell Configs
        virusMinSize: 100,
        virusMaxSize: 141.4,
        virusMinAmount: 50,
        virusMaxAmount: 100,
        virusRandomColor: 0,
        virusSplitDiv: 36,
        virusEjectSpeed: 780,
        virusEatMult: 1.1576,
        virusMaxCells: 16,
        virusPush: 0,
        // Ejected Cell Configs
        ejectMinSize: 36.06,
        ejectMaxSize: 36.06,
        ejectSizeLoss: 38.73,
        ejectCooldown: 2,
        ejectSpawnChance: 50,
        ejectRandomColor: 0,
        ejectVirus: 0,
        ejectSpeed: 780,
        ejectCollisionType: 0,
        // Player Configs
        playerMinDecay: 31.623,
        playerMaxSize: 1500,
        playerMinSplit: 60,
        playerMinEject: 56.57,
        playerStartSize: 31.623,
        playerMaxCells: 16,
        playerSpikedCells: 0,
        playerSpeed: 30,
        playerDecayRate: .002,
        playerDecayCap: 0,
        playerMergeTime: 30,
        playerMaxNick: 15,
        playerDisconnectTime: 60,
        playerSplitSpeed: 780,
        playerSizeIncrement: 5,
        playerSplitDiv: 2,
        playerEatMult: 1.115,
        //playerGrayDisconnect: 0,
        splitRandomColor: 0,
        splitRestoreTicks: 13,
        // Tournament Configs
        tourneyMaxPlayers: 12,
        tourneyPrepTime: 10,
        tourneyEndTime: 30,
        tourneyTimeLimit: 20,
        tourneyAutoFill: 0,
        tourneyAutoFillTime: 1,
        // Mis-cell-aneous Configs
        autoSplitMouse: 0,
        foodBrushLimit: 100,
        unshift: 1,
        botStartSize: 31.623,
        freeRoamSpeed: 25,
        mobilePhysics: 0,
        gravitationalPushsplits: 0,
        serverMonotoneType: "gray",
    };
    this.ipBanList = [];
    this.minionTest = [];
    this.userList = [];
    this.badWords = [];
    this.clientBind = [];
    this.loadConfig();
    this.loadBanList();
    this.loadUserList();
    this.loadBadWords();
    this.setBorder(this.config.borderWidth, this.config.borderHeight);
    this.quadTree = new QuadNode(this.border, 64, 32);
    this.gameMode = GameMode.get(this.config.serverGamemode);
    this.oldColors = [
        {r: 235, g:  75, b:   0},
        {r: 225, g: 125, b: 255},
        {r: 180, g:   7, b:  20},
        {r:  80, g: 170, b: 240},
        {r: 180, g:  90, b: 135},
        {r: 195, g: 240, b:   0},
        {r: 150, g:  18, b: 255},
        {r:  80, g: 245, b:   0},
        {r: 165, g:  25, b:   0},
        {r:  80, g: 145, b:   0},
        {r:  80, g: 170, b: 240},
        {r:  55, g:  92, b: 255},
    ];
}

module.exports = GameServer;

GameServer.prototype.start = function() {
    this.timerLoopBind = this.timerLoop.bind(this);
    this.mainLoopBind = this.mainLoop.bind(this);
    this.gameMode = GameMode.get(this.config.serverGamemode);
    this.gameMode.onServerInit(this);
    var bind = this.config.clientBind + "";
    this.clientBind = bind.split(' - ');
    this.httpServer = http.createServer();
    var wsOptions = {
        server: this.httpServer,
        perMessageDeflate: 0,
        maxPayload: 4096
    };
    this.wsServer = new WebSocket.Server(wsOptions);
    this.wsServer.on('error', this.socketError.bind(this));
    this.wsServer.on('connection', this.socketEvent.bind(this));
    this.httpServer.listen(this.config.serverPort, this.config.serverBind, this.onHttpOpen.bind(this));
    this.config.serverStatsPort > 0 && this.startStatsServer(this.config.serverStatsPort);
}; 

GameServer.prototype.onHttpOpen = function() {
    setTimeout(this.timerLoopBind, 1);
    Log.info("Listening on port " + this.config.serverPort + ".");
    Log.info("Current game mode is " + this.gameMode.name + ".");
    if (this.config.serverBots) {
        for (var i = 0; i < this.config.serverBots; i++) this.bots.addBot();
        Log.info("Added " + this.config.serverBots + " player bots.");
    }
};

GameServer.prototype.addNode = function(node) {
    var x = node.position.x;
    var y = node.position.y;
    var size = node._size;
    node.quadItem = {
        cell: node,
        bound: {
            minX: x - size,
            minY: y - size,
            maxX: x + size,
            maxY: y + size
        }
    };
    this.quadTree.insert(node.quadItem);
    this.nodes.all.push(node);
    if (node.owner) {
        this.config.splitRandomColor ? node.color = this.randomColor() : node.color = node.owner.color;
        node.owner.cells.push(node);
        node.owner.socket.sendPacket(new Packet.AddNode(node.owner, node));
    }
    node.onAdd(this);
};

GameServer.prototype.socketError = function(error) {
    switch (Log.error("WebSocket: " + error.code + " - " + error.message), error.code) {
        case "EADDRINUSE":
            Log.error("Server could not bind to port " + this.config.serverPort + "!");
            Log.error("Please close out of Skype or change 'serverPort' in config.ini to a different number!");
            break;
        case "EACCES":
            Log.error("Please make sure you are running MultiOgar with root privileges!");
            break;
    }
    process.exit(1);
};

GameServer.prototype.socketEvent = function(ws) {
    var logIP = ws._socket.remoteAddress + ":" + ws._socket.remotePort;
    ws.on('error', function (err) {Log.writeError("[" + logIP + "] " + err.stack)});
    if (this.config.serverMaxConnect && this.socketCount >= this.config.serverMaxConnect) return ws.close(1000, "Connection slots are full!");
    if (this.checkIpBan(ws._socket.remoteAddress)) return ws.close(1000, "Your IP was banned!");
    if (this.config.serverIpLimit) {
        var ipConnections = 0;
        for (var i = 0; i < this.clients.length; i++) {
            var socket = this.clients[i];
            if (!socket.isConnected || socket.remoteAddress != ws._socket.remoteAddress) continue;
            ipConnections++;
        }
        if (ipConnections >= this.config.serverIpLimit) return ws.close(1000, "Player per IP limit reached!");
    }
    if (this.config.clientBind.length && this.clientBind.indexOf(ws.upgradeReq.headers.origin) < 0) return ws.close(1000, "This client is not allowed!");
    ws.isConnected = 1;
    ws.remoteAddress = ws._socket.remoteAddress;
    ws.remotePort = ws._socket.remotePort;
    ws.lastAliveTime = Date.now();
    Log.write("CONNECTED " + ws.remoteAddress + ":" + ws.remotePort + ", origin: \"" + ws.upgradeReq.headers.origin + "\"");
    var PlayerTracker = require('./PlayerTracker');
    ws.playerTracker = new PlayerTracker(this, ws);
    var PacketHandler = require('./PacketHandler');
    ws.packetHandler = new PacketHandler(this, ws);
    var PlayerCommand = require('./modules/PlayerCommand');
    ws.playerCommand = new PlayerCommand(this, ws.playerTracker);
    var self = this;
    ws.on('message', function (message) {
        if (!message.length) return;
        if (message.length > 256) return ws.close(1009, "Disconnected for spamming!");
        ws.packetHandler.handleMSG(message);
    });
    ws.on('error', function (error) {
        ws.packetHandler.sendPacket = function (data) {};
    });
    ws.on('close', function (reason) {
        if (ws._socket.destroy != null && typeof ws._socket.destroy == 'function') ws._socket.destroy();
        self.socketCount--;
        ws.isConnected = 0;
        ws.packetHandler.sendPacket = function (data) {};
        ws.closeReason = {
            reason: ws._closeCode,
            message: ws._closeMessage
        };
        ws.closeTime = Date.now();
        Log.write("DISCONNECTED " + ws.remoteAddress + ":" + ws.remotePort + ", code: " + ws._closeCode +
            ", reason: \"" + ws._closeMessage + "\", name: \"" + ws.playerTracker._name + "\"");
        /*if (this.config.playerGrayDisconnect == 1) {
            var gray = Math.min(255, (ws.playerTracker.color.r * 0.2125 +
                ws.playerTracker.color.g * 0.7154 + ws.playerTracker.color.b * 0.0721)) >>> 0;
            var color = {r: gray, g: gray, b: gray};
            ws.playerTracker.color = color;
            ws.playerTracker.cells.forEach(function (cell) {
                cell.color = color;
            }, this);
        }*/
    });
    this.socketCount++;
    this.clients.push(ws);
    this.checkMinion(ws);
};

GameServer.prototype.checkMinion = function(ws) {
    if (!this.config.minionChecking) return;
    var config = this.config;
    if (!ws.upgradeReq.headers['user-agent'] || !ws.upgradeReq.headers['cache-control'] ||
        ws.upgradeReq.headers['user-agent'].length < 50) {
        ws.playerTracker.isMinion = 1;
    }
    if (config.minionThreshold) {
        if ((ws.lastAliveTime - this.startTime) / 1000 >= config.minionIgnoreTime) {
            if (this.minionTest.length >= config.minionThreshold) {
                ws.playerTracker.isMinion = 1;
                for (var i = 0; i < this.minionTest.length; i++) {
                    var playerTracker = this.minionTest[i];
                    if (!playerTracker.socket.isConnected) continue;
                    playerTracker.isMinion = 1;
                }
                this.minionTest.length && this.minionTest.splice(0, 1);
            }
            this.minionTest.push(ws.playerTracker);
        }
    }
    if (config.serverMinions && !ws.playerTracker.isMinion) {
        for (var i = 0; i < this.config.serverMinions; i++) {
            this.bots.addMinion(ws.playerTracker);
            ws.playerTracker.minion.control = 1;
        }
    }
};

GameServer.prototype.checkIpBan = function(ipAddress) {
    if (!this.ipBanList || this.ipBanList.length == 0 || ipAddress == "127.0.0.1") return 0;
    if (this.ipBanList.indexOf(ipAddress) >= 0) return 1;
    var ipBin = ipAddress.split('.');
    if (ipBin.length != 4) return 0;
    var subNet2 = ipBin[0] + "." + ipBin[1] + ".*.*";
    if (this.ipBanList.indexOf(subNet2) >= 0) return 1;
    var subNet1 = ipBin[0] + "." + ipBin[1] + "." + ipBin[2] + ".*";
    if (this.ipBanList.indexOf(subNet1) >= 0) return 1;
    return 0;
};

GameServer.prototype.setBorder = function(width, height) {
    var w = width / 2;
    var h = height / 2;
    this.border = {
        minX: -w,
        minY: -h,
        maxX: w,
        maxY: h,
        width: width,
        height: height,
    };
};

GameServer.prototype.randomColor = function() {
    switch (this.config.serverColorType) {
        default:
        case 0: // MultiOgar's original random color system
            {
                var h = 360 * Math.random();
                var s = 248 / 255;
                let RGB = {
                    r: 1,
                    g: 1,
                    b: 1
                };
                if (s > 0) {
                    h /= 60;
                    var i = ~~(h) >> 0;
                    var f = h - i;
                    var p = 1 * (1 - s);
                    var q = 1 * (1 - s * f);
                    var t = 1 * (1 - s * (1 - f));
                    switch (i) {
                        case 0:
                            RGB = {r: 1, g: t, b: p};
                            break;
                        case 1:
                            RGB = {r: q, g: 1, b: p};
                            break;
                        case 2:
                            RGB = {r: p, g: 1, b: t};
                            break;
                        case 3:
                            RGB = {r: p, g: q, b: 1};
                            break;
                        case 4:
                            RGB = {r: t, g: p, b: 1};
                            break;
                        default:
                            RGB = {r: 1, g: p, b: q};
                    }
                }
                RGB.r = Math.max(RGB.r, 0);
                RGB.g = Math.max(RGB.g, 0);
                RGB.b = Math.max(RGB.b, 0);
                RGB.r = Math.min(RGB.r, 1);
                RGB.g = Math.min(RGB.g, 1);
                RGB.b = Math.min(RGB.b, 1);
                return {
                    r: (RGB.r * 255) >> 0,
                    g: (RGB.g * 255) >> 0,
                    b: (RGB.b * 255) >> 0
                };
            }
        case 1: // Ogar-Unlimited's random color system
            {
                let RGB = [0xFF, 0x07, (Math.random() * 255) >> 0];
                RGB.sort(function () {
                    return .5 - Math.random();
                });
                return {
                    r: RGB[0],
                    b: RGB[1],
                    g: RGB[2]
                };
            }
        case 2: // Old Ogar's random color system
            {
                var index = Math.floor(Math.random() * this.oldColors.length);
                let RGB = this.oldColors[index];
                return {
                    r: RGB.r,
                    g: RGB.g,
                    b: RGB.b
                };
            }
        case 3: // Truely randomized color system
            {
                return {
                    r: Math.floor(255 * Math.random()) + 0,
                    g: Math.floor(255 * Math.random()) + 0,
                    b: Math.floor(255 * Math.random()) + 0
                };
            }
    }
};

GameServer.prototype.monotoneColors = function() {
    let color = Math.floor(255 * Math.random()) + 0;
    let config = this.config;
    return config.serverMonotoneType == "gray" ? {r: color, g: color, b: color} :
        config.serverMonotoneType == "red" ? {r: color, g: 0, b: 0} :
        config.serverMonotoneType == "yellow" ? {r: color, g: color, b: 0} :
        config.serverMonotoneType == "green" ? { r: 0, g: color, b: 0} :
        config.serverMonotoneType == "blue" ? {r: 0, g: 0, b: color} :
        config.serverMonotoneType == "cyan" ? {r: 0, g: color, b: color} :
        config.serverMonotoneType == "pink" ? {r: color, g: 0, b: color} :
        void 0;
};

GameServer.prototype.removeNode = function(node) {
    node.isRemoved = 1;
    this.quadTree.remove(node.quadItem);
    node.quadItem = null;
    var index = this.nodes.all.indexOf(node);
    index != -1 && this.nodes.all.splice(index, 1);
    index = this.nodes.moving.indexOf(node);
    index != -1 && this.nodes.moving.splice(index, 1);
    node.onRemove(this);
};

GameServer.prototype.updateClient = function() {
    for (var i = 0; i < this.minionTest.length;) {
        var client = this.minionTest[i];
        if (this.stepDateTime - client.connectedTime < this.config.minionInterval) i++;
        else this.minionTest.splice(i, 1);
    }
    for (var i = 0; i < this.clients.length;) {
        client = this.clients[i].playerTracker;
        client.checkConnection();
        if (client.isRemoved) this.clients.splice(i, 1);
        else i++;
    }
    for (var i = 0; i < this.clients.length; i++) this.clients[i].playerTracker.updateTick();
    for (var i = 0; i < this.clients.length; i++) this.clients[i].playerTracker.sendUpdate();
};

GameServer.prototype.updateLeaderboard = function() {
    this.leaderboard = [];
    this.leaderboardType = -1;
    this.gameMode.updateLB(this, this.leaderboard);
    this.largestClient = this.gameMode.rankOne;
};

GameServer.prototype.onChatMSG = function(from, to, message) {
    if (!message) return;
    message = message.trim();
    if (message == "") return;
    if (from && message.length > 0 && message[0] == '/') {
        message = message.slice(1, message.length);
        from.socket.playerCommand.executeCommandLine(message);
        return;
    }
    if (!this.config.serverChat) return;
    if (from && from.isMuted) return this.sendChatMSG(null, from, "You are currently muted!");
    if (message.length > 64) message = message.slice(0, 64);
    if (!this.config.serverChatAscii) {
        for (var i = 0; i < message.length; i++) {
            var c = message.charCodeAt(i);
            if ((c < 0x20 || c > 0x7F) && from) return this.sendChatMSG(null, from, "You can only use ASCII text!");
        }
    }
    if ((this.config.filterBadWords && this.checkBadWord(message)) && from)
        return this.sendChatMSG(null, from, "You cannot use bad words in the chat!");
    this.sendChatMSG(from, to, message);
};

GameServer.prototype.checkBadWord = function (value) {
    if (!value) return 0;
    value = " " + value.toLowerCase().trim() + " ";
    for (var i = 0; i < this.badWords.length; i++)
        if (value.indexOf(this.badWords[i]) >= 0) return 1;
    return 0;
};

GameServer.prototype.sendChatMSG = function(from, to, msg) {
    for (var i = 0; i < this.clients.length; i++) {
        var client = this.clients[i];
        if (client == null) continue;
        if (!to || to == client.playerTracker) client.sendPacket(new Packet.ChatMessage(from, msg));
    }
};

GameServer.prototype.timerLoop = function() {
    var timeStep = this.config.serverTimeStep;
    var ts = Date.now();
    var dt = ts - this.timeStamp;
    if (dt < timeStep - 5) return setTimeout(this.timerLoopBind, ((timeStep - 5) - dt) >> 0);
    if (dt > 120) this.timeStamp = ts - timeStep;
    this.updateTimeAvg += .5 * (this.updateTime - this.updateTimeAvg);
    if (this.timeStamp == 0) this.timeStamp = ts;
    this.timeStamp += timeStep;
    setTimeout(this.mainLoopBind, 0);
    setTimeout(this.timerLoopBind, 0);
};

GameServer.prototype.mainLoop = function() {
    this.stepDateTime = Date.now();
    var start = process.hrtime();
    var self = this;
    if (this.running) {
        for (var i = 0; i < this.nodes.player.length; i++) {
            let cell = this.nodes.player[i];
            if (cell.isRemoved || cell == null || cell.owner == null) continue;
            this.updateMerge(cell, cell.owner);
            this.moveCell(cell);
            this.movePlayer(cell, cell.owner);
            this.autoSplit(cell, cell.owner);
            this.updateNodeQuad(cell);
            this.quadTree.find(cell.quadItem.bound, function (item) {
                if (item.cell == cell) return;
                var m = self.checkCellCollision(cell, item.cell);
                if (self.checkRigidCollision(m)) self.resolveRigidCollision(m, self.border);
                else self.resolveCollision(m);
            });
        }
        for (var i = 0; i < this.nodes.moving.length; i++) {
            let cell = this.nodes.moving[i];
            if (!cell || cell.isRemoved) continue;
            this.moveCell(cell);
            this.updateNodeQuad(cell);
            if (!cell.isMoving) this.nodes.moving.splice(i, 1);
            this.quadTree.find(cell.quadItem.bound, function(item) {
                if (item.cell == cell) return;
                var m = self.checkCellCollision(cell, item.cell);
                if (cell.cellType == 3 && item.cell.cellType == 3 &&
                    !self.config.mobilePhysics && self.config.ejectCollisionType != 2) self.resolveRigidCollision(m, self.border);
                else self.resolveCollision(m);
            });
        }
        if ((this.tickCount % this.config.spawnInterval) === 0) this.spawnCells(this.randomPosition());
        this.gameMode.onTick(this);
        if (((this.tickCount + 3) % 25) === 0) this.updateDecay();
        this.tickCount++;
    }
    this.updateClient();
    if (((this.tickCount + 7) % this.config.serverLBUpdate) === 0) this.updateLeaderboard();
    if (this.config.serverTracker && (this.tickCount % 750) === 0) this.pingServerTracker();
    var end = process.hrtime(start);
    this.updateTime = end[0] * 1000 + end[1] / 1e6;
};

GameServer.prototype.updateMerge = function(cell, client) {
    var time = Math.max(this.config.playerMergeTime, cell._size * .2);
    if (cell.getAge() < 13) cell.canRemerge = 0;
    if (!this.config.playerMergeTime || client.recMode)
        return cell.canRemerge = cell.boostDistance < 100;
    time *= 25, cell.canRemerge = cell.getAge() >= time;
};

GameServer.prototype.updateDecay = function() {
    var config = this.config;
    for (var i = 0; i < this.clients.length; i++) {
        for (var client = this.clients[i].playerTracker, j = 0; j < client.cells.length; j++) {
            var cell = client.cells[j];
            var size = cell._size;
            if (cell == null || cell.isRemoved) return;
            if (size <= config.playerMinDecay) return;
            if (client.recMode || client.frozen) var rate = 0;
            else rate = config.playerDecayRate;
            var cap = config.playerDecayCap;
            if (cap && cell._mass > cap) rate *= 10;
            var decay = 1 - rate * this.gameMode.decayMod;
            size = Math.sqrt(size * size * decay);
            size = Math.max(size, config.playerMinDecay);
            cell.setSize(size);
        }
    }
};

GameServer.prototype.autoSplit = function(cell, client) {
    var config = this.config;
    if (config.autoSplitMouse) angle = Math.atan2(client.mouse.x - cell.position.x, client.mouse.y - cell.position.y);
    else var angle = 2 * Math.random() * Math.PI;
    if (client.recMode || client.frozen) var maxSize = config.playerMaxSize * config.playerMaxSize;
    else maxSize = config.playerMaxSize;
    if (client.mergeOverride || cell._size < maxSize) return;
    if (client.cells.length >= config.playerMaxCells || config.mobilePhysics) {
        if (cell.setSize(maxSize), config.mobilePhysics) return;
    } else this.splitPlayerCell(client, cell, angle, cell._mass / config.playerSplitDiv);
};

GameServer.prototype.movePlayer = function(cell, client) {
    if (client.socket.isConnected == 0 || client.frozen) return;
    var dx = ~~(client.mouse.x - cell.position.x);
    var dy = ~~(client.mouse.y - cell.position.y);
    var squared = dx * dx + dy * dy;
    if (squared < 1 || isNaN(dx) || isNaN(dy)) return;
    var sqrt = Math.sqrt(squared);
    var speed = cell.getSpeed(sqrt);
    if (speed <= 0) return;
    cell.position.x += dx / sqrt * speed;
    cell.position.y += dy / sqrt * speed;
};

GameServer.prototype.moveCell = function(cell) {
    if (cell.isMoving && !cell.boostDistance || cell.isRemoved) {
        cell.boostDistance = 0;
        cell.isMoving = 1;
        return;
    }
    var speed = cell.boostDistance / 10;
    cell.boostDistance -= speed;
    cell.position.x += cell.boostDirection.x * speed;
    cell.position.y += cell.boostDirection.y * speed;
    if (this.config.borderBouncePhysics) {
        var r = cell._size / 2;
        if (cell.position.x < this.border.minX + r || cell.position.x > this.border.maxX - r)
        cell.boostDirection.x =- cell.boostDirection.x;
        if (cell.position.y < this.border.minY + r || cell.position.y > this.border.maxY - r)
        cell.boostDirection.y =- cell.boostDirection.y;
    }
    !this.config.borderTransparency && cell.checkBorder(this.border);
};

GameServer.prototype.splitPlayerCell = function(client, parent, angle, mass, max) {
    var config = this.config;
    if (client.cells.length >= max) return;
    if (mass) {
        var size1 = Math.sqrt(100 * mass);
        var size2 = Math.sqrt(parent.radius - size1 * size1);
    } else size2 = parent._size / Math.sqrt(config.playerSplitDiv);
    if (isNaN(size2) || size2 < config.playerMinDecay) return 0;
    parent.setSize(size2);
    var pos = {
        x: parent.position.x,
        y: parent.position.y
    };
    var size = size1 || size2;
    var cell = new Entity.PlayerCell(this, client, pos, size);
    cell.setBoost(config.playerSplitSpeed * Math.pow(size, .0122), angle);
    this.addNode(cell);
};

GameServer.prototype.updateNodeQuad = function(node) {
    var item = node.quadItem;
    var x = node.position.x;
    var y = node.position.y;
    var size = node._size;
    if (item.x === x && item.y === y && item.size === size) return;
    item.x = x;
    item.y = y;
    item.size = size;
    item.bound.minX = x - size;
    item.bound.minY = y - size;
    item.bound.maxX = x + size;
    item.bound.maxY = y + size;
    this.quadTree.update(item);
};

GameServer.prototype.checkRigidCollision = function(m) {
    if (!m.cell.owner || !m.check.owner) return 0;
    if (m.cell.owner != m.check.owner) {
        /*if (this.gameMode.isTeams && (!this.config.minionTeamCollision && m.cell.owner.isMi)) return 0;
        else */return this.gameMode.isTeams && m.cell.owner.team == m.check.owner.team;
    }
    if (m.cell.owner.mergeOverride) return 0;
    var r = (this.config.mobilePhysics) ? 1 : this.config.splitRestoreTicks;
    if (m.cell.getAge() < r || m.check.getAge() < r) return 0;
    return !m.cell.canRemerge || !m.check.canRemerge;
};

GameServer.prototype.checkCellCollision = function(cell, check) {
    var r = cell._size + check._size;
    var dx = check.position.x - cell.position.x;
    var dy = check.position.y - cell.position.y;
    var squared = dx * dx + dy * dy;
    var sqrt = Math.sqrt(squared);
    return {
        cell: cell,
        check: check,
        r: r,
        dx: dx,
        dy: dy,
        d: sqrt,
        push: Math.min((r - sqrt) / sqrt, r - sqrt),
        squared: squared
    };
};

GameServer.prototype.resolveRigidCollision = function(m) {
    if (m.d > m.r) return;
    if (m.cell.cellType == 3 && this.config.ejectCollisionType == 1) {
        m.cell.position.x -= m.push * m.dx * .41;
        m.cell.position.y -= m.push * m.dy * .41;
    } else {
        var rt = m.cell._mass + m.check._mass;
        var r1 = ~~m.cell._mass / rt;
        var r2 = ~~m.check._mass / rt;
        m.cell.position.x -= ~~(m.push * m.dx * r2);
        m.cell.position.y -= ~~(m.push * m.dy * r2);
        m.check.position.x += ~~(m.push * m.dx * r1);
        m.check.position.y += ~~(m.push * m.dy * r1);
    }
};

GameServer.prototype.resolveCollision = function(m) {
    var cell = m.cell;
    var check = m.check;
    if (cell._size > check._size) {
        cell = m.check;
        check = m.cell;
    }
    if (cell.isRemoved || check.isRemoved) return;
    var div = this.config.mobilePhysics ? 20 : 3;
    var size = check._size - cell._size / div;
    if (m.squared >= size * size) return;
    if (this.config.gravitationalPushsplits && (!check.canEat(cell) || cell.getAge() < 1 && check.cellType == 0)) return;
    if (cell.owner && cell.owner == check.owner) {
        if (cell.getAge(this.tickCount) < this.config.splitRestoreTicks ||
            check.getAge(this.tickCount) < this.config.splitRestoreTicks) return;
        if (cell.owner.cells.length <= 2) cell.owner.mergeOverride = 0;
    } else {
        if (cell.cellType == 2) var mult = this.config.virusEatMult;
        //else if (cell.cellType == 1 || cell.cellType == 3) mult = 1;
        else mult = this.config.playerEatMult;
        if (check._size < mult * cell._size) return;
        if (!check.canEat(cell)) return;
    }
    cell.isRemoved = 1;
    check.onEat(cell);
    cell.onEaten(check);
    cell.killedBy = check;
    this.updateNodeQuad(check);
    this.removeNode(cell);
};

GameServer.prototype.randomPosition = function() {
    return {
        x: this.border.minX + this.border.width * Math.random(),
        y: this.border.minY + this.border.height * Math.random()
    };
};

GameServer.prototype.spawnCells = function(player) {
    var config = this.config;
    var maxCount = config.foodMinAmount - this.nodes.food.length;
    var spawnCount = Math.min(maxCount, config.foodSpawnAmount);
    for (var i = 0; i < spawnCount; i++) {
        var size = config.foodMinSize;
        if (config.foodMaxSize > size) size = Math.random() * (config.foodMaxSize - size) + size;
        var food = new Entity.Food(this, null, this.randomPosition(), size);
        food.color = this.randomColor();
        this.addNode(food);
    }
    for (maxCount = config.virusMinAmount - this.nodes.virus.length,
        spawnCount = Math.min(maxCount, 2), i = 0; i < spawnCount; i++) {
        if (!this.willCollide(player, config.virusMinSize)) {
            var virus = new Entity.Virus(this, null, player, config.virusMinSize);
            this.addNode(virus);
        }
    }
};

GameServer.prototype.spawnPlayer = function(client, pos) {
    var config = this.config;
    if (this.disableSpawn) return;
    var startSize = config.playerStartSize;
    if (client.spawnMass) startSize = client.spawnMass;
    else if (client.isMi) startSize = config.minionStartSize;
    else if (client.isBot) startSize = config.botStartSize;
    var index = ~~(this.nodes.eject.length * Math.random());
    var eject = this.nodes.eject[index];
    if (eject && eject.boostDistance < 1 && (Math.floor((Math.random() * 100) + 0)) <= config.ejectSpawnChance) {
        client.color = eject.color;
        pos = {x: eject.position.x, y: eject.position.y};
        startSize = Math.max(eject._size, startSize);
        this.removeNode(eject);
    }
    for (var i = 0; i < 10 && this.willCollide(pos, startSize); i++) pos = this.randomPosition();
    var cell = new Entity.PlayerCell(this, client, pos, startSize);
    this.addNode(cell);
    client.mouse = {x: pos.x, y: pos.y};
    if (client.isMinion) client.socket.close(1000, "Marked as a minion!"), this.removeNode(cell);
};

GameServer.prototype.willCollide = function(pos, size) {
    var bound = {
        minX: pos.x - size,
        minY: pos.y - size,
        maxX: pos.x + size,
        maxY: pos.y + size
    };
    var dist = bound.minX * bound.minX + bound.minY * bound.minY;
    if (dist + (size * size) <= (size * 2)) return null;
    return this.quadTree.any(bound, function(item) {
        return item.cell.cellType != 3 && item.cell.cellType != 1;
    });
};

GameServer.prototype.splitCells = function(client) {
    var config = this.config;
    var cellToSplit = [];
    for (let i = 0; i < client.cells.length; i++) {
        if (client.cells[i]._size > config.playerMinSplit) {
            if (!client.recMode) var max = config.playerMaxCells;
            else max = (config.playerMaxCells * config.playerMaxCells) * 2;
            if (client.cells.length >= max) break;
            cellToSplit.push(client.cells[i]);
        }
    }
    for (let i = 0; i < cellToSplit.length; i++) {
        var cell = cellToSplit[i];
        var x = ~~(client.mouse.x - cell.position.x);
        var y = ~~(client.mouse.y - cell.position.y);
        if (x * x + y * y < 1) x = 1, y = 0;
        var angle = Math.atan2(x, y);
        this.splitPlayerCell(client, cell, angle, null, max);
    }
};

GameServer.prototype.canEject = function(client) {
    if (client.lastEject == null) return 1, client.lastEject = this.tickCount;
    var dt = this.tickCount - client.lastEject;
    if (dt < this.config.ejectCooldown) return 0;
    client.lastEject = this.tickCount;
    return 1;
};

GameServer.prototype.ejectMass = function(client) {
    if (!this.canEject(client)) return;
    var config = this.config;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];
        if (!cell || cell._size < config.playerMinEject) continue;
        var dx = client.mouse.x - cell.position.x;
        var dy = client.mouse.y - cell.position.y;
        var squared = dx * dx + dy * dy;
        if (squared > 1) dx /= Math.sqrt(squared), dy /= Math.sqrt(squared);
        else dx = 1, dy = 0;
        var loss = config.ejectSizeLoss;
        cell.setSize(Math.sqrt(cell.radius - loss * loss));
        var pos = {
            x: cell.position.x + dx * cell._size,
            y: cell.position.y + dy * cell._size
        };
        var angle = Math.atan2(dx, dy);
        if (isNaN(angle)) angle = Math.PI / 2;
        angle += .6 * Math.random() - .3;
        var size = config.ejectMinSize;
        if (config.ejectMaxSize > size) size = Math.random() * (config.ejectMaxSize - size) + size;
        if (config.ejectVirus) var eject = new Entity.Virus(this, null, pos, size);
        else eject = new Entity.EjectedMass(this, null, pos, size);
        if (config.ejectRandomColor) eject.color = this.randomColor();
        else eject.color = cell.color;
        eject.setBoost(config.ejectSpeed, angle);
        this.addNode(eject);
    }
};

GameServer.prototype.shootVirus = function(parent, angle) {
    var pos = {x: parent.position.x, y: parent.position.y};
    var virus = new Entity.Virus(this, null, pos, this.config.virusMinSize);
    virus.setBoost(this.config.virusEjectSpeed, angle);
    this.addNode(virus);
};

GameServer.prototype.loadConfig = function() {
    var config = this.src + "/config.ini";
    var ini = require(this.src + "/modules/ini.js");
    try {
        if (fs.existsSync(config)) {
            var i = ini.parse(fs.readFileSync(config, "utf-8"));
            for (var r in i) this.config.hasOwnProperty(r) ?
                this.config[r] = i[r] : Log.error("Unknown config.ini value: " + r);
        } else Log.warn("Config file not found! Generating new config..."),
        fs.writeFileSync(config, ini.stringify(this.config), "utf-8");
    } catch (ini) {
        Log.error(ini.stack);
        Log.error("Failed to load " + config + ": " + ini.message);
    }
    this.config.playerMinDecay = Math.max(32, this.config.playerMinDecay);
    Log.setVerbosity(this.config.logVerbosity);
    Log.setFileVerbosity(this.config.logFileVerbosity);
};

GameServer.prototype.loadBadWords = function() {
    if (!this.config.filterBadWords) return Log.info("The bad word filter is disabled.");
    var badWordFile = this.src + '/badwords.txt';
    try {
        if (!fs.existsSync(badWordFile)) Log.warn(badWordFile + " not found!");
        else {
            var words = fs.readFileSync(badWordFile, 'utf-8');
            words = words.split(/[\r\n]+/);
            words = words.map(function(arg) {return " " + arg.trim().toLowerCase() + " "});
            words = words.filter(function(arg) {return arg.length > 2});
            this.badWords = words;
            Log.info(this.badWords.length + " bad words loaded.");
        }
    } catch (err) {
        Log.error(err.stack);
        Log.error("Failed to load " + badWordFile + ": " + err.message);
    }
};

GameServer.prototype.loadUserList = function() {
    if (!this.config.serverUserRoles) return Log.info("User roles are disabled.");
    var UserRoleEnum = require(this.src + '/enum/UserRoleEnum');
    var fileNameUsers = this.src + '/enum/userRoles.json';
    try {
        this.userList = [];
        if (!fs.existsSync(fileNameUsers))
            return Log.warn(fileNameUsers + " is missing.");
        var usersJson = fs.readFileSync(fileNameUsers, 'utf-8');
        var list = JSON.parse(usersJson.trim());
        for (var i = 0; i < list.length; ) {
            var item = list[i];
            if (!item.hasOwnProperty("ip") ||
                !item.hasOwnProperty("password") ||
                !item.hasOwnProperty("role") ||
                !item.hasOwnProperty("name")) {
                list.splice(i, 1);
                continue;
            }
            if (!item.password || !item.password.trim()) {
                Log.warn("User account \"" + item.name + "\" disabled");
                list.splice(i, 1);
                continue;
            }
            if (item.ip) item.ip = item.ip.trim();
            item.password = item.password.trim();
            if (!UserRoleEnum.hasOwnProperty(item.role)) {
                Log.warn("Unknown user role: " + item.role);
                item.role = UserRoleEnum.USER;
            } else item.role = UserRoleEnum[item.role];
            item.name = (item.name || "").trim();
            i++;
        }
        this.userList = list;
        Log.info(this.userList.length + " user records loaded.");
    } catch (err) {
        Log.error(err.stack);
        Log.error("Failed to load " + fileNameUsers + ": " + err.message);
    }
};

GameServer.prototype.loadBanList = function() {
    var fileNameIpBan = this.src + '/ipbanlist.txt';
    try {
        if (fs.existsSync(fileNameIpBan)) {
            this.ipBanList = fs.readFileSync(fileNameIpBan, "utf8").split(/[\r\n]+/).filter(function(x) {
                return x != '';
            });
            Log.info(this.ipBanList.length + " IP ban records loaded.");
        } else Log.warn(fileNameIpBan + " is missing.");
    } catch (err) {
        Log.error(err.stack);
        Log.error("Failed to load " + fileNameIpBan + ": " + err.message);
    }
};

WebSocket.prototype.sendPacket = function(packet) {
    var socket = this.playerTracker.socket;
    if (packet == null || socket.isConnected == null || socket.playerTracker.isMi) return;
    if (this.readyState == WebSocket.OPEN) {
        if (this._socket.writable != null && !this._socket.writable) return;
        var buffer = packet.build(socket.packetHandler.protocol);
        if (buffer != null) this.send(buffer, {binary: 1});
    } else this.readyState = WebSocket.CLOSED, this.emit('close');
};

GameServer.prototype.startStats = function(port) {
    this.stats = "Test";
    this.getStats();
    this.httpServer = http.createServer(function (req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200);
        res.end(this.stats);
    }.bind(this));
    this.httpServer.on('error', function (err) {
        Log.error("Stats Server: " + err.message);
    });
    var statsBind = this.getStats.bind(this);
    this.httpServer.listen(port, function () {
        Log.info("Started stats server on port " + port);
        setInterval(statsBind, this.config.serverStatsUpdate * 1000);
    }.bind(this));
};

GameServer.prototype.getStats = function() {
    var total = 0;
    var alive = 0;
    var spectate = 0;
    for (var i = 0, len = this.clients.length; i < len; i++) {
        var socket = this.clients[i];
        if (!socket || !socket.isConnected || socket.playerTracker.isMi) continue;
        total++;
        if (socket.playerTracker.cells.length) alive++;
        else spectate++;
    }
    var data = {
        'server_name': this.config.serverName,
        'server_chat': this.config.serverChat ? "true" : "false",
        'border_width': this.border.width,
        'border_height': this.border.height,
        'gamemode': this.gameMode.name,
        'max_players': this.config.serverMaxConnect,
        'current_players': total,
        'alive': alive,
        'spectators': spectate,
        'update_time': this.updateTimeAvg.toFixed(3),
        'uptime': Math.round((this.stepDateTime - this.startTime) / 1000 / 60),
        'start_time': this.startTime
    };
    this.stats = JSON.stringify(data);
};

GameServer.prototype.pingServerTracker = function() {
    var os = require('os');
    var total = 0;
    var alive = 0;
    var spectate = 0;
    var bots = 0;
    for (var i = 0, len = this.clients.length; i < len; i++) {
        var socket = this.clients[i];
        if (!socket || socket.isConnected == 0) continue;
        if (socket.isConnected == null) bots++;
        else {
            total++;
            if (socket.playerTracker.cells.length) alive++;
            else spectate++;
        }
    }
    var data = 'current_players=' + total +
        '&alive=' + alive +
        '&spectators=' + spectate +
        '&max_players=' + this.config.serverMaxConnect +
        '&sport=' + this.config.serverPort +
        '&gamemode=[**] ' + this.gameMode.name +
        '&agario=true' +
        '&name=Unnamed Server' +
        '&opp=' + os.platform() + ' ' + os.arch() +
        '&uptime=' + process.uptime() +
        '&version=MultiOgar-Edited ' + this.version +
        '&start_time=' + this.startTime;
    trackerRequest({
        host: 'ogar.mivabe.nl',
        port: 80,
        path: '/master',
        method: 'POST'
    }, 'application/x-www-form-urlencoded', data);
};

function trackerRequest(options, type, body) {
    if (options.headers == null) options.headers = {};
    options.headers['user-agent'] = 'MultiOgar-Edited ' + this.version;
    options.headers['content-type'] = type;
    options.headers['content-length'] = body == null ? 0 : Buffer.byteLength(body, 'utf8');
    var req = http.request(options, function (res) {
        if (res.statusCode != 200) {
            return Log.writeError("[Tracker][" + options.host + "]: statusCode = " + res.statusCode);
        }
        res.setEncoding('utf8');
    });
    req.on('error', function (err) {Log.writeError("[Tracker][" + options.host + "]: " + err)});
    req.shouldKeepAlive = 0;
    req.on('close', function () {req.destroy()});
    req.write(body);
    req.end();
}
