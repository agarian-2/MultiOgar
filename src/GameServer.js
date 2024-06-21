"use strict";
const QuadNode = require("./modules/QuadNode");
const BotLoader = require("./ai/BotLoader");
const PlayerTracker = require("./PlayerTracker");
const PacketHandler = require("./PacketHandler");
const PlayerCommand = require("./modules/PlayerCommand");
const UserRoleEnum = require("../src/enum/UserRoleEnum");
const ini = require("../src/modules/ini");
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const Packet = require("./packet");
const Entity = require("./entity");
const Log = require("./modules/Logger");
const GameMode = require("./gamemodes");

class GameServer {
    constructor() {
        this.running = true;
        this.version = "2.0.0";
        this.httpServer = null;
        this.commands = null;
        this.lastNodeID = 1;
        this.lastPlayerID = 1;
        this.clients = [];
        this.socketCount = 0;
        this.largestClient = null;
        this.nodesAll = [];
        this.nodesPlayer = [];
        this.nodesVirus = [];
        this.nodesFood = [];
        this.nodesEject = [];
        this.nodesMoving = [];
        this.leaderboard = [];
        this.leaderboardType = -1;
        this.bots = new BotLoader(this);
        this.disableSpawn = false;
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
            serverMaxConnect: 100,
            serverPort: 443,
            serverBind: "0.0.0.0",
            serverTracker: 0,
            serverGamemode: 0,
            serverBots: 0,
            serverViewBaseX: 1920,
            serverViewBaseY: 1080,
            serverMinScale: .15,
            serverSpecScale: .4,
            serverStatsPort: 88,
            serverStatsUpdate: 60,
            serverMaxLB: 10,
            serverColorType: 0,
            serverTimeStep: 40,
            serverLBUpdate: 25,
            serverUserRoles: 0,
            // Client Configs
            serverChat: 1,
            serverChatAscii: 1,
            serverName: "My Server",
            serverWelcome1: "Welcome to my MultiOgar-Edited server!",
            serverWelcome2: "",
            clientBind: "",
            filterBadWords: 1,
            serverChatPassword: "12345",
            // Server Minion Configs
            minionDefaultName: "",
            serverMinions: 0,
            minionStartSize: 31.623,
            minionSameColor: 0,
            minionSameName: 0,
            minionTeamCollision: 1,
            // Anti-External Minion Configs
            serverIpLimit: 2,
            minionChecking: 1,
            minionIgnoreTime: 30,
            minionThreshold: 10,
            minionInterval: 1000,
            scrambleLevel: 1,
            playerBotGrow: 0,
            // Border Configs
            borderWidth: 14142,
            borderHeight: 14142,
            borderTransparency: 0,
            // Food Configs
            foodMinSize: 10,
            foodMaxSize: 10,
            foodMinAmount: 1500,
            foodMaxAmount: 3000,
            foodSpawnAmount: 30,
            foodGrowInterval: 4500,
            spawnInterval: 20,
            // Virus Cell Configs
            virusMinSize: 100,
            virusMaxSize: 141.4,
            virusMinAmount: 50,
            virusMaxAmount: 100,
            virusEjectSpeed: 780,
            virusSplitDiv: 36,
            virusRandomColor: 0,
            virusEatMult: 1.1576,
            virusMaxCells: 16,
            virusPush: 0,
            motherFoodSpawnRate: 2,
            // Ejected Cell Configs
            ejectMinSize: 36.056,
            ejectMaxSize: 36.056,
            ejectSizeLoss: 41.231,
            ejectCooldown: 2,
            ejectSpawnChance: 50,
            ejectVirus: 0,
            ejectSpeed: 780,
            ejectRandomColor: 0,
            ejectRandomAngle: 1,
            ejectCollisionType: 0,
            // Player Configs
            playerMinDecay: 31.623,
            playerMaxSize: 1500,
            playerMinSplit: 59.161,
            playerMinEject: 59.161,
            playerStartSize: 31.623,
            playerMaxCells: 16,
            playerSpeed: 30,
            playerMergeTime: 30,
            playerDecayRate: .002,
            playerDecayCap: 0,
            playerMaxNick: 30,
            playerDisconnectTime: 60,
            playerSplitSpeed: 780,
            playerSpikedCells: 0,
            playerSizeIncrement: 4,
            playerSplitDiv: 2,
            playerEatMult: 1.15,
            splitRandomColor: 0,
            splitRestoreTicks: 13,
            playerGrayDisconnect: 0,
            // Tournament Configs
            tourneyMaxPlayers: 12,
            tourneyPrepTime: 10,
            tourneyEndTime: 30,
            tourneyTimeLimit: 20,
            tourneyAutoFill: 1,
            tourneyAutoFillTime: 10,
            // Mis-cell-aneous Configs
            mobilePhysics: 0,
            freeRoamSpeed: 25,
            autoSplitMouse: 0,
            botStartSize: 31.623,
            foodBrushLimit: 100,
            gravitationalPushsplits: 0
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
    }
    start() {
        this.timerLoopBind = this.timerLoop.bind(this);
        this.mainLoopBind = this.mainLoop.bind(this);
        this.gameMode = GameMode.get(this.config.serverGamemode);
        this.gameMode.onServerInit(this);
        let bind = this.config.clientBind + "";
        this.clientBind = bind.split(" - ");
        this.httpServer = http.createServer();
        let wsOptions = {
            server: this.httpServer,
            perMessageDeflate: 0,
            maxPayload: 4096
        };
        this.wsServer = new WebSocket.Server(wsOptions);
        this.wsServer.on("error", this.socketError.bind(this));
        this.wsServer.on("connection", this.socketEvent.bind(this));
        this.httpServer.listen(this.config.serverPort, this.config.serverBind, this.onHttpOpen.bind(this));
        if (this.config.serverStatsPort > 0) this.startStatsServer(this.config.serverStatsPort);
    }
    onHttpOpen() {
        setTimeout(this.timerLoopBind, 1);
        Log.info("Listening on port " + this.config.serverPort + ".");
        Log.info("Current game mode is " + this.gameMode.name + ".");
        let botAmount = this.config.serverBots;
        if (botAmount) {
            for (var i = 0; i < botAmount; i++) this.bots.addBot();
            Log.info("Added " + botAmount + " player bots.");
        }
    }
    addNode(node) {
        let x = node.position.x,
            y = node.position.y,
            size = node._size;
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
        this.nodesAll.push(node);
        if (node.owner) {
            node.color = this.config.splitRandomColor ? this.randomColor() : node.owner.color;
            node.owner.cells.push(node);
            node.owner.socket.sendPacket(new Packet.AddNode(node.owner, node));
        }
        node.onAdd(this);
    }
    removeNode(node) {
        node.isRemoved = true;
        this.quadTree.remove(node.quadItem);
        node.quadItem = null;
        let index = this.nodesAll.indexOf(node);
        if (index !== -1) this.nodesAll.splice(index, 1);
        index = this.nodesMoving.indexOf(node);
        if (index !== -1) this.nodesMoving.splice(index, 1);
        node.onRemove(this);
    }
    socketError(error) {
        switch (Log.error("WebSocket: " + error.code + " - " + error.message), error.code) {
            case "EADDRINUSE": // ERROR ADDRESS IN USE
                Log.error("Server could not bind to port " + this.config.serverPort + "!");
                Log.error("Please close out of Skype or change 'serverPort' in config.ini to a different number!");
                break;
            case "EACCES": // ERROR ACCESS
                Log.error("Please make sure you are running MultiOgar with root privileges!");
        }
        process.exit(1);
    }
    socketEvent(ws) {
        let logIP = ws._socket.remoteAddress + ":" + ws._socket.remotePort;
        ws.on("error", error => {
            Log.writeError("[" + logIP + "] " + error.stack);
        });
        if (this.config.serverMaxConnect && this.socketCount >= this.config.serverMaxConnect) return ws.close(1000, "Connection slots are full!");
        if (this.checkIpBan(ws._socket.remoteAddress)) return ws.close(1000, "Your IP was banned!");
        if (this.config.serverIpLimit) {
            let ipConnections = 0;
            for (let i = 0; i < this.clients.length; i++) {
                let socket = this.clients[i];
                if (socket.isConnected === false || socket.remoteAddress !== ws._socket.remoteAddress) continue;
                ipConnections++;
            }
            if (ipConnections >= this.config.serverIpLimit) return ws.close(1000, "Player per IP limit reached!");
        }
        if (this.config.clientBind.length && this.clientBind.indexOf(ws.upgradeReq.headers.origin) < 0) return ws.close(1000, "This client is not allowed!");
        ws.isConnected = true;
        ws.remoteAddress = ws._socket.remoteAddress;
        ws.remotePort = ws._socket.remotePort;
        ws.lastAliveTime = Date.now();
        Log.info("A new player has connected to the server.");
        Log.write("CONNECTED " + ws.remoteAddress + ":" + ws.remotePort + ", origin: \"" + ws.upgradeReq.headers.origin + "\"");
        ws.playerTracker = new PlayerTracker(this, ws);
        ws.packetHandler = new PacketHandler(this, ws);
        ws.playerCommand = new PlayerCommand(this, ws.playerTracker);
        var self = this;
        ws.on("message", message => {
            if (!message.length) return;
            if (message.length > 256) return ws.close(1009, "Disconnected for spamming!");
            ws.packetHandler.handleMessage(message);
        });
        ws.on("error", () => {
            ws.packetHandler.sendPacket = () => {};
        });
        ws.on("close", () => {
            if (ws._socket.destroy != null && typeof ws._socket.destroy == "function") ws._socket.destroy();
            Log.info((ws.playerTracker._name || "An unnamed cell") + " has disconnected from the server.");
            self.socketCount--;
            ws.isConnected = false;
            ws.packetHandler.sendPacket = () => {};
            ws.closeReason = {
                reason: ws._closeCode,
                message: ws._closeMessage
            };
            ws.closeTime = Date.now();
            Log.write("DISCONNECTED " + ws.remoteAddress + ":" + ws.remotePort + ", code: " + ws._closeCode + ", reason: \"" + ws._closeMessage + "\", name: \"" + ws.playerTracker._name + "\"");
            if (self.config.playerGrayDisconnect) {
                let gray = Math.min(255, (ws.playerTracker.color.r * .2125 + ws.playerTracker.color.g * .7154 + ws.playerTracker.color.b * .0721)) >>> 0,
                    color = {
                        r: gray,
                        g: gray,
                        b: gray
                    };
                ws.playerTracker.color = color;
                for (let i = 0; i < ws.playerTracker.cells.length; i++) ws.playerTracker.cells[i].color = color;
            }
        });
        this.socketCount++;
        this.clients.push(ws);
        this.checkMinion(ws);
    }
    checkMinion(ws) {
        if (!this.config.minionChecking) return;
        if (!ws.upgradeReq.headers["user-agent"] || !ws.upgradeReq.headers["cache-control"] || ws.upgradeReq.headers["user-agent"].length < 50) ws.playerTracker.isMinion = true;
        if (this.config.minionThreshold && (ws.lastAliveTime - this.startTime) / 1000 >= this.config.minionIgnoreTime) {
            if (this.minionTest.length >= this.config.minionThreshold) {
                ws.playerTracker.isMinion = true;
                for (let i = 0; i < this.minionTest.length; i++) {
                    let playerTracker = this.minionTest[i];
                    if (!playerTracker.socket.isConnected) continue;
                    playerTracker.isMinion = true;
                }
                this.minionTest.length && this.minionTest.splice(0, 1);
            }
            this.minionTest.push(ws.playerTracker);
        }
        if (this.config.serverMinions && !ws.playerTracker.isMinion)
            for (let i = 0; i < this.config.serverMinions; i++) {
                this.bots.addMinion(ws.playerTracker);
                ws.playerTracker.minion.control = true;
            }
    }
    checkIpBan(ipAddress) {
        if (!this.ipBanList || !this.ipBanList.length || ipAddress === "127.0.0.1") return false;
        if (this.ipBanList.indexOf(ipAddress) >= 0) return true;
        let ipBin = ipAddress.split(".");
        if (ipBin.length != 4) return false;
        let subNet2 = ipBin[0] + "." + ipBin[1] + ".*.*";
        if (this.ipBanList.indexOf(subNet2) >= 0) return true;
        let subNet1 = ipBin[0] + "." + ipBin[1] + "." + ipBin[2] + ".*";
        if (this.ipBanList.indexOf(subNet1) >= 0) return true;
        return false;
    }
    setBorder(width, height) {
        let w = width / 2,
            h = height / 2;
        this.border = {
            minX: -w,
            minY: -h,
            maxX: w,
            maxY: h,
            width: width,
            height: height,
        };
    }
    randomColor() {
        switch (this.config.serverColorType) {
            default:
            case 0: // MultiOgar's original random color system
                {
                    let h = 360 * Math.random(),
                        s = 248 / 255,
                        color = {r: 1, g: 1, b: 1};
                    if (s > 0) {
                        h /= 60;
                        let i = ~~(h) >> 0,
                            f = h - i,
                            p = 1 * (1 - s),
                            q = 1 * (1 - s * f),
                            t = 1 * (1 - s * (1 - f));
                        switch (i) {
                            case 0:
                                color = {r: 1, g: t, b: p};
                                break;
                            case 1:
                                color = {r: q, g: 1, b: p};
                                break;
                            case 2:
                                color = {r: p, g: 1, b: t};
                                break;
                            case 3:
                                color = {r: p, g: q, b: 1};
                                break;
                            case 4:
                                color = {r: t, g: p, b: 1};
                                break;
                            default:
                                color = {r: 1, g: p, b: q};
                        }
                    }
                    color.r = Math.max(color.r, 0);
                    color.g = Math.max(color.g, 0);
                    color.b = Math.max(color.b, 0);
                    color.r = Math.min(color.r, 1);
                    color.g = Math.min(color.g, 1);
                    color.b = Math.min(color.b, 1);
                    return {
                        r: (color.r * 255) >> 0,
                        g: (color.g * 255) >> 0,
                        b: (color.b * 255) >> 0
                    };
                }
            case 1: // Ogar-Unlimited's random color system
                {
                    let color = [255, 7, (Math.random() * 255) >> 0];
                    color.sort(() => .5 - Math.random());
                    return {
                        r: color[0],
                        b: color[1],
                        g: color[2]
                    };
                }
            case 2: // Old Ogar's random color system
                {
                    let choices = [
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
                            {r:  55, g:  92, b: 255}
                        ],
                        color = choices[Math.floor(Math.random() * 12)];
                    return {
                        r: color.r,
                        g: color.g,
                        b: color.b
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
    }
    updateClient() {
        for (let i = 0; i < this.minionTest.length;) {
            let client = this.minionTest[i];
            if (this.stepDateTime - client.connectedTime < this.config.minionInterval) i++;
            else this.minionTest.splice(i, 1);
        }
        for (let i = 0; i < this.clients.length;) {
            let client = this.clients[i].playerTracker;
            client.checkConnection();
            if (client.isRemoved) this.clients.splice(i, 1);
            else i++;
        }
        for (let i = 0; i < this.clients.length; i++) {
            let client = this.clients[i].playerTracker;
            client.updateTick();
            client.sendUpdate();
        }
    }
    updateLeaderboard() {
        this.leaderboard = [];
        this.leaderboardType = -1;
        this.gameMode.updateLB(this, this.leaderboard);
        this.largestClient = this.gameMode.rankOne;
    }
    onChatMSG(from, to, message) { // Rename to onChatMessage later
        if (!message) return;
        message = message.trim();
        if (message === "") return;
        if (from && message.length > 0 && message[0] === "/") {
            message = message.slice(1, message.length);
            from.socket.playerCommand.executeCommandLine(message);
            return;
        }
        if (this.config.serverChat === 0) return;
        if (from && from.isMuted) return this.sendChatMessage(null, from, "You are currently muted!");
        if (message.length > 64) message = message.slice(0, 64);
        if (this.config.serverChatAscii === 0)
            for (let i = 0; i < message.length; i++) {
                let c = message.charCodeAt(i);
                if ((c < 0x20 || c > 0x7F) && from) return this.sendChatMessage(null, from, "You can only use ASCII text!");
            }
        if ((this.config.filterBadWords && this.checkBadWord(message)) && from) return this.sendChatMessage(null, from, "You cannot use bad words in the chat!");
        this.sendChatMessage(from, to, message);
    }
    checkBadWord(value) {
        if (!value) return false;
        value = " " + value.toLowerCase().trim() + " ";
        for (let i = 0; i < this.badWords.length; i++)
            if (value.indexOf(this.badWords[i]) >= 0) return true;
        return false;
    }
    sendChatMessage(from, to, message) {
        for (let i = 0; i < this.clients.length; i++) {
            let client = this.clients[i];
            if (client == null) continue;
            if (!to || to === client.playerTracker) client.sendPacket(new Packet.ChatMessage(from, message));
        }
    }
    broadcastMSG(message) { // Rename to broadcastMessage
        for (let i = 0; i < this.clients.length; i++) this.clients[i].sendPacket(new Packet.ChatMessage(null, message));
    }
    timerLoop() {
        let timeStep = this.config.serverTimeStep,
            ts = Date.now(),
            dt = ts - this.timeStamp;
        if (dt < timeStep - 5) return setTimeout(this.timerLoopBind, ((timeStep - 5) - dt) >> 0);
        if (dt > 120) this.timeStamp = ts - timeStep;
        this.updateTimeAvg += .5 * (this.updateTime - this.updateTimeAvg);
        if (this.timeStamp == 0) this.timeStamp = ts;
        this.timeStamp += timeStep;
        setTimeout(this.mainLoopBind, 0);
        setTimeout(this.timerLoopBind, 0);
    }
    mainLoop() {
        this.stepDateTime = Date.now();
        let start = process.hrtime(),
            self = this;
        if (this.running) {
            for (let i = 0; i < this.nodesPlayer.length; i++) {
                let cell = this.nodesPlayer[i];
                if (cell.isRemoved || cell == null || cell.owner == null) continue;
                this.updateMerge(cell, cell.owner);
                this.moveCell(cell);
                this.movePlayer(cell, cell.owner);
                this.autoSplit(cell, cell.owner);
                this.updateNodeQuad(cell);
                this.quadTree.find(cell.quadItem.bound, item => {
                    if (item.cell === cell) return;
                    let m = self.checkCellCollision(cell, item.cell);
                    if (self.checkRigidCollision(m)) self.resolveRigidCollision(m);
                    else self.resolveCollision(m);
                });
            }
            for (let i = 0; i < this.nodesMoving.length; i++) {
                let cell = this.nodesMoving[i];
                if (!cell || cell.isRemoved) continue;
                this.moveCell(cell);
                this.updateNodeQuad(cell);
                if (!cell.isMoving) this.nodesMoving.splice(i, 1);
                this.quadTree.find(cell.quadItem.bound, item => {
                    if (item.cell == cell) return;
                    let m = self.checkCellCollision(cell, item.cell);
                    if (cell.cellType === 3 && item.cell.cellType === 3 && !self.config.mobilePhysics && self.config.ejectCollisionType !== 2) self.resolveRigidCollision(m);
                    else self.resolveCollision(m);
                });
            }
            /*if (this.config.foodGrowInterval)
                for (let i = 0; i < this.nodesFood.length; i++) {
                    let food = this.nodesFood[i];
                    switch (food.growStage) {
                        case 0:
                            if (food.growStage === 0 && food.getAge() > this.config.foodGrowInterval && food.getAge() < this.config.foodGrowInterval * 2) {
                                food.setSize(this.massToSize(2));
                                food.growStage = 1;
                            }
                            break;
                        case 1:
                            if (food.growStage === 1 && food.getAge() > this.config.foodGrowInterval * 2 && food.getAge() < this.config.foodGrowInterval * 3) {
                                food.setSize(this.massToSize(3));
                                food.growStage = 2;
                            }
                            break;
                        case 2:
                            if (food.growStage === 3 && food.getAge() > this.config.foodGrowInterval * 3 && food.getAge() < this.config.foodGrowInterval * 4) {
                                food.setSize(this.massToSize(4));
                                food.growStage = 3;
                            }
                    }
                }*/
            if ((this.tickCount % this.config.spawnInterval) === 0) this.spawnCells(this.randomPosition());
            this.gameMode.onTick(this);
            if (((this.tickCount + 3) % 25) === 0) this.updateDecay();
            this.tickCount++;
        }
        this.updateClient();
        if (((this.tickCount + 7) % this.config.serverLBUpdate) === 0) this.updateLeaderboard();
        if (this.config.serverTracker && (this.tickCount % 750) === 0) this.pingServerTracker();
        let end = process.hrtime(start);
        this.updateTime = end[0] * 1000 + end[1] / 1e6;
    }
    massToSize(mass) {
        return Math.sqrt(100 * mass); 
    }
    sizeToMass(size) {
        return Math.pow(size, 2) / 100; 
    }
    updateMerge(cell, client) {
        let time = Math.max(this.config.playerMergeTime, cell._size * .2);
        if (cell.getAge() < 13) cell.canRemerge = false;
        if (this.config.playerMergeTime <= 0 || client.recMode) return cell.canRemerge = cell.boostDistance < 100;
        time *= 25;
        cell.canRemerge = cell.getAge() >= time;
    }
    updateDecay() {
        for (let i = 0; i < this.clients.length; i++) {
            let client = this.clients[i].playerTracker;
            for (let j = 0; j < client.cells.length; j++) {
                if (client.recMode || client.frozen) break;
                let cell = client.cells[j],
                    size = cell._size;
                if (cell == null || cell.isRemoved || size <= this.config.playerMinDecay) break;
                let rate = this.config.playerDecayRate,
                    cap = this.config.playerDecayCap;
                if (cap && cell._mass > cap) rate *= 10;
                let decay = 1 - rate * this.gameMode.decayMod;
                size = Math.sqrt(size * size * decay);
                size = Math.max(size, this.config.playerMinDecay);
                cell.setSize(size);
            }
        }
    }
    autoSplit(cell, client) {
        let maxSize = this.config.playerMaxSize;
        if (client.recMode || client.frozen) maxSize = Math.pow(this.config.playerMaxSize, 2);
        if (client.mergeOverride || cell._size < maxSize) return;
        if (client.cells.length >= this.config.playerMaxCells || this.config.mobilePhysics) return cell.setSize(maxSize);
        else {
            let angle = this.config.autoSplitMouse ? Math.atan2(client.mouse.x - cell.position.x, client.mouse.y - cell.position.y) : 2 * Math.PI * Math.random();
            this.splitPlayerCell(client, cell, angle, cell._mass / this.config.playerSplitDiv);
        }
    }
    movePlayer(cell, client) {
        if (client.socket.isConnected === false || client.frozen) return;
        let dx = ~~(client.mouse.x - cell.position.x),
            dy = ~~(client.mouse.y - cell.position.y),
            squared = dx * dx + dy * dy;
        if (squared < 1 || isNaN(dx) || isNaN(dy)) return;
        let sqrt = Math.sqrt(squared),
            speed = cell.getSpeed(sqrt);
        if (speed <= 0) return;
        cell.position.x += dx / sqrt * speed;
        cell.position.y += dy / sqrt * speed;
    }
    moveCell(cell) {
        if (cell.isMoving && !cell.boostDistance || cell.isRemoved) {
            cell.boostDistance = 0;
            cell.isMoving = true;
            return;
        }
        let speed = cell.boostDistance / 10;
        cell.boostDistance -= speed;
        cell.position.x += cell.boostDirection.x * speed;
        cell.position.y += cell.boostDirection.y * speed;
        let r = cell._size / 2;
        if (cell.position.x < this.border.minX + r || cell.position.x > this.border.maxX - r) cell.boostDirection.x =- cell.boostDirection.x;
        if (cell.position.y < this.border.minY + r || cell.position.y > this.border.maxY - r) cell.boostDirection.y =- cell.boostDirection.y;
        if (!this.config.borderTransparency) cell.checkBorder(this.border);
    }
    splitPlayerCell(client, parent, angle, mass, max) {
        if (client.cells.length >= max) return;
        let size2 = parent._size / Math.sqrt(this.config.playerSplitDiv),
            size1 = 0;
        if (mass) {
            size1 = Math.sqrt(100 * mass);
            size2 = Math.sqrt(parent.radius - size1 * size1);
        }
        if (isNaN(size2) || size2 < this.config.playerMinDecay) return;
        parent.setSize(size2);
        let pos = {
                x: parent.position.x,
                y: parent.position.y
            },
            size = size1 || size2,
            cell = new Entity.PlayerCell(this, client, pos, size);
        cell.setBoost(this.config.playerSplitSpeed * Math.pow(size, .0122), angle);
        this.addNode(cell);
    }
    updateNodeQuad(node) {
        let item = node.quadItem,
            x = node.position.x,
            y = node.position.y,
            size = node._size;
        if (item.x === x && item.y === y && item.size === size) return;
        item.x = x;
        item.y = y;
        item.size = size;
        item.bound.minX = x - size;
        item.bound.minY = y - size;
        item.bound.maxX = x + size;
        item.bound.maxY = y + size;
        this.quadTree.update(item);
    }
    checkRigidCollision(m) {
        if (!m.cell.owner || !m.check.owner) return false;
        if (m.cell.owner !== m.check.owner) return this.gameMode.isTeams && m.cell.owner.team === m.check.owner.team;
        if (m.cell.owner.mergeOverride) return false;
        let r = this.config.mobilePhysics ? 1 : this.config.splitRestoreTicks;
        if (m.cell.getAge() < r || m.check.getAge() < r) return false;
        return !m.cell.canRemerge || !m.check.canRemerge;
    }
    checkCellCollision(cell, check) {
        let r = cell._size + check._size,
            dx = check.position.x - cell.position.x,
            dy = check.position.y - cell.position.y,
            squared = dx * dx + dy * dy,
            sqrt = Math.sqrt(squared);
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
    }
    resolveRigidCollision(m) {
        if (m.d > m.r) return;
        if (m.cell.cellType === 3 && this.config.ejectCollisionType === 1) {
            m.cell.position.x -= m.push * m.dx * .41;
            m.cell.position.y -= m.push * m.dy * .41;
        } else {
            let rt = m.cell._mass + m.check._mass,
                r1 = m.cell._mass / rt,
                r2 = m.check._mass / rt,
                fx = ~~m.dx,
                fy = ~~m.dy;
            m.cell.position.x -= m.push * fx * r2;
            m.cell.position.y -= m.push * fy * r2;
            m.check.position.x += m.push * fx * r1;
            m.check.position.y += m.push * fy * r1;
        }
    }
    resolveCollision(m) {
        let cell = m.cell,
            check = m.check;
        if (cell._size > check._size) {
            cell = m.check;
            check = m.cell;
        }
        if (cell.isRemoved || check.isRemoved) return;
        let div = this.config.mobilePhysics ? 20 : 3,
            size = check._size - cell._size / div;
        if (m.squared >= size * size) return;
        if (this.config.gravitationalPushsplits && check.cellType === 0 && check.canEat(cell) && cell.getAge() < 1) return;
        if (cell.cellType === 3 && cell.getAge() < 1) return;
        if (cell.owner && cell.owner === check.owner) {
            if (cell.getAge(this.tickCount) < this.config.splitRestoreTicks || check.getAge(this.tickCount) < this.config.splitRestoreTicks) return;
            if (cell.owner.cells.length <= 2) cell.owner.mergeOverride = false;
        } else {
            let mult = cell.cellType === 2 ? this.config.virusEatMult : cell.cellType === 1 || cell.cellType === 3 ? 1 : this.config.playerEatMult;
            if (!check.canEat(cell) || check._size < mult * cell._size) return;
        }
        cell.isRemoved = true;
        check.onEat(cell);
        cell.onEaten(check);
        cell.killedBy = check;
        this.updateNodeQuad(check);
        this.removeNode(cell);
    }
    randomPosition() {
        return {
            x: this.border.minX + this.border.width * Math.random(),
            y: this.border.minY + this.border.height * Math.random()
        };
    }
    spawnCells(player) {
        let foodMaxCount = this.config.foodMinAmount - this.nodesFood.length,
            foodSpawnCount = Math.min(foodMaxCount, this.config.foodSpawnAmount);
        for (let i = 0; i < foodSpawnCount; i++) {
            let size = this.config.foodMinSize;
            if (this.config.foodMaxSize > size) size = Math.random() * (this.config.foodMaxSize - size) + size;
            let food = new Entity.Food(this, null, this.randomPosition(), size);
            food.color = this.randomColor();
            this.addNode(food);
        }
        let virusMaxCount = this.config.virusMinAmount - this.nodesVirus.length,
            virusSpawnCount = Math.min(virusMaxCount, 2);
        for (let i = 0; i < virusSpawnCount; i++)
            if (!this.willCollide(player, this.config.virusMinSize)) {
                let virus = new Entity.Virus(this, null, player, this.config.virusMinSize);
                this.addNode(virus);
            }
    }
    spawnPlayer(client, pos) {
        if (this.disableSpawn) return;
        let startSize = this.config.playerStartSize;
        if (client.spawnMass) startSize = client.spawnMass;
        else if (client.isMi) startSize = this.config.minionStartSize;
        else if (client.isBot) startSize = this.config.botStartSize;
        if (this.config.ejectSpawnChance) {
            let eject = this.nodesEject[Math.floor(Math.random() * this.nodesEject.length)];
            if (eject && eject.boostDistance < 1 && (Math.floor((Math.random() * 100) + 0)) <= this.config.ejectSpawnChance) {
                client.color = eject.color;
                pos = {
                    x: eject.position.x,
                    y: eject.position.y
                };
                startSize = Math.max(eject._size, startSize);
                this.removeNode(eject);
            }
        }
        for (let i = 0; i < 10 && this.willCollide(pos, startSize); i++) pos = this.randomPosition();
        let cell = new Entity.PlayerCell(this, client, pos, startSize);
        this.addNode(cell);
        client.mouse = {
            x: pos.x,
            y: pos.y
        };
        if (client.isMinion) {
            client.socket.close(1000, "Marked as a minion!");
            this.removeNode(cell);
        }
    }
    willCollide(pos, size) {
        let bound = {
                minX: pos.x - size,
                minY: pos.y - size,
                maxX: pos.x + size,
                maxY: pos.y + size
            },
            dist = bound.minX * bound.minX + bound.minY * bound.minY;
        if (dist + (size * size) <= (size * 2)) return null;
        return this.quadTree.any(bound, item => item.cell.cellType !== 3 && item.cell.cellType !== 1);
    }
    splitCells(client) {
        let knownCells = [],
            max = this.config.playerMaxCells;
        for (let i = 0; i < client.cells.length; i++)
            if (client.cells[i]._size > this.config.playerMinSplit) {
                if (client.recMode) max = Math.pow(this.config.playerMaxCells, 2) * 2;
                if (client.cells.length >= max) break;
                knownCells.push(client.cells[i]);
            }
        for (let i = 0; i < knownCells.length; i++) {
            let cell = knownCells[i],
                x = ~~(client.mouse.x - cell.position.x),
                y = ~~(client.mouse.y - cell.position.y);
            if (x * x + y * y < 1) x = y = 0;
            let angle = Math.atan2(x, y);
            this.splitPlayerCell(client, cell, angle, null, max);
        }
    }
    canEject(client) {
        if (client.lastEject == null) {
            client.lastEject = this.tickCount;
            return true;
        }
        if (this.tickCount - client.lastEject < this.config.ejectCooldown) return false;
        client.lastEject = this.tickCount;
        return true;
    }
    ejectMass(client) {
        if (!this.canEject(client)) return;
        for (let i = 0; i < client.cells.length; i++) {
            let cell = client.cells[i];
            if (!cell || cell._size < this.config.playerMinEject) continue;
            let dx = client.mouse.x - cell.position.x,
                dy = client.mouse.y - cell.position.y,
                squared = dx * dx + dy * dy;
            if (squared > 1) {
                dx /= Math.sqrt(squared);
                dy /= Math.sqrt(squared);
            } else dx = dy = 0;
            let loss = this.config.ejectSizeLoss;
            cell.setSize(Math.sqrt(cell.radius - loss * loss));
            let pos = {
                    x: cell.position.x + dx * cell._size,
                    y: cell.position.y + dy * cell._size
                },
                angle = Math.atan2(dx, dy);
            if (isNaN(angle)) angle = Math.PI / 2;
            else angle += this.config.ejectRandomAngle ? .6 * Math.random() - .3 : 0;
            let size = this.config.ejectMinSize;
            if (this.config.ejectMaxSize > size) size = Math.random() * (this.config.ejectMaxSize - size) + size;
            let eject = new Entity.EjectedMass(this, null, pos, size);
            if (this.config.ejectVirus) eject = new Entity.Virus(this, null, pos, size);
            if (this.config.ejectRandomColor) eject.color = this.randomColor();
            else eject.color = cell.color;
            eject.setBoost(this.config.ejectSpeed, angle);
            this.addNode(eject);
        }
    }
    shootVirus(parent, angle) {
        let pos = {
                x: parent.position.x,
                y: parent.position.y
            },
            virus = new Entity.Virus(this, null, pos, this.config.virusMinSize);
        virus.setBoost(this.config.virusEjectSpeed, angle);
        this.addNode(virus);
    }
    loadConfig() {
        let config = "../src/config.ini";
        try {
            if (fs.existsSync(config)) {
                let i = ini.parse(fs.readFileSync(config, "utf-8"));
                for (let r in i) this.config.hasOwnProperty(r) ? this.config[r] = i[r] : Log.error("Unknown config.ini value: " + r + "!");
            } else Log.warn("Config file not found! Generating new config..."),
            fs.writeFileSync(config, ini.stringify(this.config), "utf-8");
        } catch (ini) {
            Log.error(ini.stack);
            Log.error("Failed to load " + config + ": " + ini.message + "!");
        }
        this.config.playerMinDecay = Math.max(32, this.config.playerMinDecay);
        Log.setVerbosity(this.config.logVerbosity);
        Log.setFileVerbosity(this.config.logFileVerbosity);
    }
    loadBadWords() {
        let badWordFile = "../src/txt/badwords.txt";
        try {
            if (!fs.existsSync(badWordFile)) Log.warn(badWordFile + " not found!");
            else {
                let words = fs.readFileSync(badWordFile, "utf-8");
                words = words.split(/[\r\n]+/).map(arg => " " + arg.trim().toLowerCase() + " ").filter(arg => arg.length > 2);
                this.badWords = words;
                Log.info(this.badWords.length + " bad words loaded.");
            }
        } catch (err) {
            Log.error(err.stack);
            Log.error("Failed to load " + badWordFile + ": " + err.message);
        }
    }
    loadUserList() {
        if (!this.config.serverUserRoles) return Log.info("User roles are disabled.");
        let fileNameUsers = "../src/enum/userRoles.json";
        try {
            this.userList = [];
            if (!fs.existsSync(fileNameUsers)) return Log.warn(fileNameUsers + " is missing.");
            let usersJson = fs.readFileSync(fileNameUsers, "utf-8"),
                list = JSON.parse(usersJson.trim());
            for (let i = 0; i < list.length;) {
                let item = list[i];
                if (!item.hasOwnProperty("ip") || !item.hasOwnProperty("password") || !item.hasOwnProperty("role") || !item.hasOwnProperty("name")) {
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
    }
    loadBanList() {
        let fileNameIpBan = "../src/txt/ipbanlist.txt";
        try {
            if (fs.existsSync(fileNameIpBan)) {
                this.ipBanList = fs.readFileSync(fileNameIpBan, "utf8").split(/[\r\n]+/).filter(x => x != "");
                Log.info(this.ipBanList.length + " IP ban records loaded.");
            } else Log.warn(fileNameIpBan + " is missing.");
        } catch (err) {
            Log.error(err.stack);
            Log.error("Failed to load " + fileNameIpBan + ": " + err.message);
        }
    }
    startStats(port) {
        this.stats = "Test";
        this.getStats();
        this.httpServer = http.createServer(((req, res) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.writeHead(200);
            res.end(this.stats);
        }).bind(this));
        this.httpServer.on("error", error => {
            Log.error("Stats Server: " + error.message);
        });
        let statsBind = this.getStats.bind(this);
        this.httpServer.listen(port, (() => {
            Log.info("Started stats server on port " + port + ".");
            setInterval(statsBind, this.config.serverStatsUpdate * 1000);
        }).bind(this));
    }
    getStats() {
        let total = 0,
            alive = 0,
            spectate = 0;
        for (let i = 0; i < this.clients.length; i++) {
            let client = this.clients[i];
            if (!client || !client.isConnected || client.playerTracker.isMi) continue;
            total++;
            if (client.playerTracker.cells.length) alive++;
            else spectate++;
        }
        let data = {
            "server_name": this.config.serverName,
            "server_chat": this.config.serverChat ? "true" : "false",
            "border_width": this.border.width,
            "border_height": this.border.height,
            "gamemode": this.gameMode.name,
            "max_players": this.config.serverMaxConnect,
            "current_players": total,
            "alive": alive,
            "spectators": spectate,
            "update_time": this.updateTimeAvg.toFixed(3),
            "uptime": Math.round((this.stepDateTime - this.startTime) / 1000 / 60),
            "start_time": this.startTime
        };
        this.stats = JSON.stringify(data);
    }
    trackerRequest(options, type, body) {
        if (options.headers == null) options.headers = {};
        options.headers["user-agent"] = "MultiOgar-Edited " + this.version;
        options.headers["content-type"] = type;
        options.headers["content-length"] = body == null ? 0 : Buffer.byteLength(body, "utf8");
        let req = http.request(options, res => {
            if (res.statusCode != 200) return Log.writeError("[Tracker][" + options.host + "]: statusCode = " + res.statusCode);
            res.setEncoding("utf8");
        });
        req.on("error", error => {
            Log.writeError("[Tracker][" + options.host + "]: " + error);
        });
        req.shouldKeepAlive = 0;
        req.on("close", () => {
            req.destroy();
        });
        req.write(body);
        req.end();
    }
    pingServerTracker() {
        let os = require("os"),
            total = 0,
            alive = 0,
            spectate = 0;
            //bots = 0;
        for (let i = 0; i < this.clients.length; i++) {
            let client = this.clients[i];
            if (!client || client.isConnected === false) continue;
            //if (client.isConnected == null) bots++;
            else {
                total++;
                if (client.playerTracker.cells.length > 0) alive++;
                else if (client.playerTracker.isSpectating) spectate++;
            }
        }
        let data = "current_players=" + total +
            "&alive=" + alive +
            "&spectators=" + spectate +
            "&max_players=" + this.config.serverMaxConnect +
            "&sport=" + this.config.serverPort +
            "&gamemode=[**] " + this.gameMode.name +
            "&agario=true" +
            "&name=Unnamed Server" +
            "&opp=" + os.platform() + " " + os.arch() +
            "&uptime=" + process.uptime() +
            "&version=MultiOgar-Edited " + this.version +
            "&start_time=" + this.startTime;
        this.trackerRequest({
            host: "ogar.mivabe.nl",
            port: 80,
            path: "/master",
            method: "POST"
        }, "application/x-www-form-urlencoded", data);
    }
}

WebSocket.prototype.sendPacket = function(packet) {
    let socket = this.playerTracker.socket;
    if (packet == null || socket.isConnected == null || socket.playerTracker.isMi) return;
    if (this.readyState === WebSocket.OPEN) {
        if (this._socket.writable != null && !this._socket.writable) return;
        let buffer = packet.build(socket.packetHandler.protocol);
        if (buffer != null) this.send(buffer, {binary: 1});
    } else this.readyState = WebSocket.CLOSED, this.emit("close");
};

module.exports = GameServer;
