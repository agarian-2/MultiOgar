"use strict";
const Packet = require("./packet");
const BinaryReader = require("./packet/BinaryReader");
const Entity = require("./entity");

class PacketHandler {
    constructor(gameServer, socket) {
        this.gameServer = gameServer;
        this.socket = socket;
        this.protocol = 0;
        this.handshakeProtocol = null;
        this.handshakeKey = null;
        this.lastChatTick = 0;
        this.lastStatTick = 0;
        this.pressQ = false;
        this.pressW = false;
        this.pressSpace = false;
        this.mouseData = null;
        this.intervalID = null;
        this.rainbowLoop = this.rainbowLoop.bind(this);
        this.tickRainbow = 0;
        this.handler = {
            254: this.onProtocol.bind(this)
        };
        this.socket.playerTracker.minion = this.socket.playerTracker.minion;
    }
    handleMessage(message) {
        if (this.handler.hasOwnProperty(message[0])) {
            this.handler[message[0]](message);
            this.socket.lastAliveTime = this.gameServer.stepDateTime;
        }
    }
    onProtocol(message) {
        if (message.length !== 5) return;
        this.handshakeProtocol = message[1] | (message[2] << 8) | (message[3] << 16) | (message[4] << 24);
        if (this.handshakeProtocol < 1 || this.handshakeProtocol > 17) return this.socket.close(1002, this.handshakeProtocol + " is a non-supported protocol!");
        this.handler = {
            255: this.onKey.bind(this)
        };
    }
    onKey(message) {
        if (message.length !== 5) return;
        this.handshakeKey = message[1] | (message[2] << 8) | (message[3] << 16) | (message[4] << 24);
        if (this.handshakeProtocol > 6 && this.handshakeKey !== 0) return this.socket.close(1002, this.handshakeProtocol + " is a non-supported protocol!");
        this.onCompleted(this.handshakeProtocol, this.handshakeKey);
    }
    onCompleted(protocol) {
        this.handler = {
            0: this.onJoin.bind(this),
            1: this.onSpectate.bind(this),
            16: this.onMouse.bind(this),
            17: this.onKeySpace.bind(this),
            18: this.onKeyQ.bind(this),
            21: this.onKeyW.bind(this),
            22: this.onKeyE.bind(this),
            23: this.onKeyR.bind(this),
            24: this.onKeyT.bind(this),
            25: this.onKeyP.bind(this),
            26: this.onKeyO.bind(this),
            27: this.onKeyM.bind(this),
            28: this.onKeyI.bind(this),
            29: this.onKeyK.bind(this),
            30: this.onKeyY.bind(this),
            31: this.onKeyU.bind(this),
            33: this.onKeyL.bind(this),
            34: this.onKeyH.bind(this),
            35: this.onKeyZ.bind(this),
            36: this.onKeyX.bind(this),
            37: this.onKeyS.bind(this),
            38: this.onKeyC.bind(this),
            39: this.onKeyG.bind(this),
            40: this.onKeyJ.bind(this),
            41: this.onKeyB.bind(this),
            42: this.onKeyV.bind(this),
            43: this.onKeyN.bind(this),
            99: this.onChat.bind(this),
            254: this.onStat.bind(this)
        };
        this.protocol = protocol;
        this.socket.sendPacket(new Packet.ClearAll());
        let gameServer = this.gameServer;
        this.socket.sendPacket(new Packet.SetBorder(this.socket.playerTracker, gameServer.border, gameServer.config.serverGamemode, "MultiOgar-Edited " + gameServer.version));
        gameServer.sendChatMessage(null, this.socket.playerTracker, "MultiOgar " + gameServer.version);
        if (gameServer.config.serverWelcome1) gameServer.sendChatMessage(null, this.socket.playerTracker, gameServer.config.serverWelcome1);
        if (gameServer.config.serverWelcome2) gameServer.sendChatMessage(null, this.socket.playerTracker, gameServer.config.serverWelcome2);
        if (!gameServer.config.serverChat) gameServer.sendChatMessage(null, this.socket.playerTracker, "The chat is disabled.");
    }
    onJoin(message) {
        if (this.socket.playerTracker.cells.length) return;
        let reader = new BinaryReader(message);
        reader.skipBytes(1);
        let protocol = null;
        protocol = 6 > this.protocol ? reader.readStringZeroUnicode() : reader.readStringZeroUtf8(), this.nickName(protocol);
    }
    onSpectate(message) {
        if (message.length === 1 && !this.socket.playerTracker.cells.length) this.socket.playerTracker.isSpectating = true;
    }
    onMouse(message) {
        if (message.length === 13 || message.length === 9 || message.length === 21) this.mouseData = Buffer.concat([message]);
    }
    onKeySpace(message) {
        if (message.length === 1) this.pressSpace = true;
    }
    onKeyQ(message) {
        if (message.length !== 1) return;
        let client = this.socket.playerTracker;
        if (client.cells.length && this.socket.playerTracker.minions.length) {
            client.minion.follow = !client.minion.follow;
            this.gameServer.sendChatMessage(null, client, "Minions follow centerpoint: " + client.minion.frozen + ".");
        }
        this.pressQ = true;
    }
    onKeyW(message) {
        if (message.length === 1) this.pressW = true;
    }
    onKeyE() {
        let client = this.socket.playerTracker;
        if (client.minions.length) client.minion.split = true;
    }
    onKeyR() {
        let client = this.socket.playerTracker;
        if (client.minions.length) client.minion.eject = true;
    }
    onKeyT() {
        let client = this.socket.playerTracker;
        if (!client.minions.length) return;
        client.minion.frozen = !client.minion.frozen;
        this.gameServer.sendChatMessage(null, client, "Minions frozen: " + client.minion.frozen + ".");
    }
    onKeyP() {
        let client = this.socket.playerTracker;
        if (!client.minions.length) return;
        client.minion.collect = !client.minion.collect;
        this.gameServer.sendChatMessage(null, client, "Minion food collection: " + client.minion.collect + ".");
    }
    onKeyO() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        client.frozen = !client.frozen;
        this.gameServer.sendChatMessage(null, client, "Frozen: " + client.frozen + ".");
    }
    onKeyM() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        client.mergeOverride = !client.mergeOverride;
        this.gameServer.sendChatMessage(null, client, "Force merging: " + client.mergeOverride + ".");
    }
    onKeyI() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        client.recMode = !client.recMode;
        this.gameServer.sendChatMessage(null, client, "Supersplitter: " + client.recMode + ".");
    }
    onKeyK() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        for (;client.cells.length;) this.gameServer.removeNode(client.cells[0]);
        this.gameServer.sendChatMessage(null, client, "You killed yourself.");
    }
    onKeyY() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        for (let i = 0; i < client.cells.length; i++) {
            let cell = client.cells[i];
            cell.setSize(cell._size + this.gameServer.config.playerSizeIncrement);
        }
    }
    onKeyU() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        for (let i = 0; i < client.cells.length; i++) {
            let cell = client.cells[i];
            if (20 < cell._size) cell.setSize(cell._size - this.gameServer.config.playerSizeIncrement);
        }
    }
    onKeyL() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled) return;
        let gameServer = this.gameServer;
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        if (gameServer.gameMode.ID === 2)
            for (;gameServer.gameMode.mothercells.length;) gameServer.removeNode(gameServer.gameMode.mothercells[0]);
        this.gameServer.sendChatMessage(null, client, "Cleared all non-player nodes.");
    }
    onKeyH() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        let gameServer = this.gameServer,
            config = gameServer.config,
            minSize = Math.sqrt(1010);
        for (let i = 0; i < client.cells.length; i++) {
            let cell = client.cells[i];
            while (minSize < cell._size) {
                let angle = 6.28 * Math.random(),
                    loss = gameServer.config.ejectMinSize;
                if (gameServer.config.ejectMaxSize > loss) loss = Math.random() * (gameServer.config.ejectMaxSize - loss) + loss;
                let size = cell.radius - (loss + 5) * (loss + 5);
                cell.setSize(Math.sqrt(size));
                let pos = {
                        x: cell.position.x + angle,
                        y: cell.position.y + angle
                    },
                    eject = new Entity.EjectedMass(gameServer, null, pos, loss);
                if (config.ejectRandomColor === 1) eject.color = gameServer.randomColor();
                else eject.color = client.color;
                eject.setBoost(config.ejectSpeed * Math.random(), angle);
                gameServer.addNode(eject);
            }
            cell.setSize(minSize);
        }
        this.gameServer.sendChatMessage(null, client, "You exploded yourself.");
    }
    onKeyZ() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        client.color = this.gameServer.randomColor();
        for (let i = 0; i < client.cells.length; i++) client.cells[i].color = client.color;
        this.gameServer.sendChatMessage(null, client, "Changed your color to (" + client.color.r + ", " + client.color.g + ", " + client.color.b + ").");
    }
    onKeyS() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled) return;
        let virus = new Entity.Virus(this.gameServer, null, client.mouse, this.gameServer.config.virusMinSize);
        this.gameServer.addNode(virus);
        this.gameServer.sendChatMessage(null, client, "Spawned a virus at (" + client.mouse.x + ", " + client.mouse.y + ").");
    }
    onKeyJ() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled) return;
        let food = new Entity.Food(this.gameServer, null, client.mouse, client.OP.foodSize);
        food.color = client.OP.foodColor;
        this.gameServer.addNode(food);
    }
    onKeyC() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled) return;
        client.OP.foodSize += 10;
        if (client.OP.foodSize >= this.gameServer.config.foodBrushLimit + 1) client.OP.foodSize = 10;
        this.gameServer.sendChatMessage(null, client, "Food size: " + client.OP.foodSize + ".");
    }
    onKeyB() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled) return;
        let colors = [
                {r: 255, g: 0, b: 0},
                {r: 255, g: 155, b: 0},
                {r: 255, g: 255, b: 0},
                {r: 0, g: 255, b: 0},
                {r: 0, g: 0, b: 255},
                {r: 140, g: 0, b: 185},
                {r: 255, g: 0, b: 255},
                {r: 140, g: 70, b: 15},
                {r: 100, g: 100, b: 100},
                {r: 170, g: 170, b: 170},
                {r: 255, g: 255, b: 255},
                {r: 0, g: 0, b: 0}
            ],
            RGB = colors[Math.floor(Math.random() * colors.length)];
        this.gameServer.sendChatMessage(null, client, "Food color: (" + RGB.r + ", " + RGB.g + ", " + RGB.b + ").");
        return client.OP.foodColor = {
            r: RGB.r,
            g: RGB.g,
            b: RGB.b
        };
    }
    onKeyG() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        let cell;
        for (let i = 0; i < client.cells.length; i++) {
            cell = client.cells[i];
            cell.position.x = client.mouse.x;
            cell.position.y = client.mouse.y;
            this.gameServer.updateNodeQuad(cell);
        }
        this.gameServer.sendChatMessage(null, client, "Teleported to (" + cell.position.x + ", " + cell.position.y + ").");
    }
    onKeyN() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        let config = this.gameServer.config;
        for (let i = 0; i < client.cells.length; i++) {
            let cell = client.cells[i],
                angle = Math.random() * 2 * Math.PI,
                pos = {
                    x: cell.position.x + cell._size * Math.sin(angle),
                    y: cell.position.y + cell._size * Math.cos(angle)
                },
                size = config.foodMinSize;
            if (config.foodMaxSize > size) size = Math.random() * (config.foodMaxSize - size) + size;
            let food = new Entity.Food(this.gameServer, null, pos, size);
            food.color = this.gameServer.randomColor();
            this.gameServer.addNode(food);
            food.setBoost(200 + 200 * Math.random(), angle);
        }
    }
    onKeyV() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled) return;
        let gameServer = this.gameServer,
            pos = {
                x: client.mouse.x - client.centerPos.x,
                y: client.mouse.y - client.centerPos.y
            },
            angle = Math.atan2(pos.x, pos.y);
        let size = gameServer.config.ejectMinSize;
        if (gameServer.config.ejectMaxSize > size) size = Math.random() * (gameServer.config.ejectMaxSize - size) + size;
        let eject = new Entity.EjectedMass(gameServer, null, client.mouse, size);
        eject.color = client.isSpectating || gameServer.config.ejectRandomColor === 1 ? gameServer.randomColor() : client.color;
        gameServer.addNode(eject);
        eject.setBoost(gameServer.config.ejectSpeed, angle);
    }
    onKeyX() {
        let client = this.socket.playerTracker;
        if (!client.OP.enabled || !client.cells.length) return;
        client.rainbowEnabled = !client.rainbowEnabled;
        if (client.rainbowEnabled) this.intervalID = setInterval(this.rainbowLoop, 40);
        else clearInterval(this.intervalID);
        this.gameServer.sendChatMessage(null, client, "Rainbow: " + client.rainbowEnabled + ".");
    }
    rainbowLoop() {
        let colors = [
            {"r":255, "g":  0, "b": 0}, // Red
            {"r":255, "g": 32, "b": 0},
            {"r":255, "g": 64, "b": 0},
            {"r":255, "g": 96, "b": 0},
            {"r":255, "g":128, "b": 0}, // Orange
            {"r":255, "g":160, "b": 0},
            {"r":255, "g":192, "b": 0},
            {"r":255, "g":224, "b": 0},
            {"r":255, "g":255, "b": 0}, // Yellow
            {"r":192, "g":255, "b": 0},
            {"r":128, "g":255, "b": 0},
            {"r": 64, "g":255, "b": 0},
            {"r": 0, "g":255, "b": 0}, // Green
            {"r": 0, "g":192, "b": 64},
            {"r": 0, "g":128, "b":128},
            {"r": 0, "g": 64, "b":192},
            {"r": 0, "g": 0, "b":255}, // Blue
            {"r": 18, "g": 0, "b":192},
            {"r": 37, "g": 0, "b":128},
            {"r": 56, "g": 0, "b": 64},
            {"r": 75, "g": 0, "b":130}, // Indigo
            {"r": 92, "g": 0, "b":161},
            {"r":109, "g": 0, "b":192},
            {"r":126, "g": 0, "b":223},
            {"r":143, "g": 0, "b":255}, // Purple
            {"r":171, "g": 0, "b":192},
            {"r":199, "g": 0, "b":128},
            {"r":227, "g": 0, "b": 64}
        ];
        if (this.tickRainbow > 27) this.tickRainbow = 0;
        let client = this.socket.playerTracker;
        client.color = colors[this.tickRainbow];
        for (let i = 0; i < client.cells.length; i++) client.cells[i].color = client.color;
        this.tickRainbow += 1;
    }
    onChat(message) {
        if (message.length < 3) return;
        let tick = this.gameServer.tickCount,
            dt = tick - this.lastChatTick;
        this.lastChatTick = tick;
        if (dt < 20) return;
        let flags = message[1],
            rvLength = (flags & 2 ? 4 : 0) + (flags & 4 ? 8 : 0) + (flags & 8 ? 16 : 0);
        if (message.length < 3 + rvLength) return;
        let reader = new BinaryReader(message);
        reader.skipBytes(2 + rvLength);
        let text = null;
        if (this.protocol < 6) text = reader.readStringZeroUnicode();
        else text = reader.readStringZeroUtf8();
        this.gameServer.onChatMessage(this.socket.playerTracker, null, text);
    }
    onStat(message) {
        if (message.length !== 1) return;
        let tick = this.gameServer.tickCount,
            dt = tick - this.lastStatTick;
        this.lastStatTick = tick;
        if (dt < 30) return;
        this.socket.sendPacket(new Packet.ServerStat(this.socket.playerTracker, this.gameServer));
    }
    mouse() {
        if (this.mouseData == null) return;
        let reader = new BinaryReader(this.mouseData);
        reader.skipBytes(1);
        let client = this.socket.playerTracker;
        if (this.mouseData.length === 13) {
            client.mouse.x = reader.readInt32() - client.scrambleX;
            client.mouse.y = reader.readInt32() - client.scrambleY;
        } else if (this.mouseData.length === 9) {
            client.mouse.x = reader.readInt16() - client.scrambleX;
            client.mouse.y = reader.readInt16() - client.scrambleY;
        } else if (this.mouseData.length === 21) {
            client.mouse.x = ~~reader.readDouble() - client.scrambleX;
            client.mouse.y = ~~reader.readDouble() - client.scrambleY;
        }
        this.mouseData = null;
    }
    process() {
        let client = this.socket.playerTracker;
        if (this.pressSpace) {
            client.pressSpace();
            this.pressSpace = false;
        }
        if (this.pressW) {
            client.pressW();
            this.pressW = false;
        }
        if (this.pressQ) {
            client.pressQ();
            this.pressQ = false;
        }
        if (client.minion.split) client.minion.split = false;
        if (client.minion.eject) client.minion.eject = false;
        this.mouse();
    }
    randomSkin() {
        let randomSkins = [],
            fs = require("fs"),
            skin = null;
        if (fs.existsSync("../src/ai/Skins.txt")) randomSkins = fs.readFileSync("../src/ai/Skins.txt", "utf8").split(/[\r\n]+/).filter(x => x !== "");
        if (randomSkins.length > 0) {
            let index = (randomSkins.length * Math.random()) >>> 0;
            skin = randomSkins[index];
        }
        return skin;
    }
    nickName(text) {
        let name = "",
            skin = null;
        if (text != null && text.length > 0) {
            let skinName = null,
                userName = text,
                n = -1;
            if (text[0] === "{" && (n = text.indexOf("}", 1)) >= 1) {
                let inner = text.slice(1, n);
                if (n > 1) skinName = inner === "r" ? this.randomSkin() : inner;
                else skinName = "";
                userName = text.slice(n + 1);
            }
            skin = skinName;
            name = userName;
        }
        if (name.length > this.gameServer.config.playerMaxNick) name = name.substring(0, this.gameServer.config.playerMaxNick);
        if (this.gameServer.config.filterBadWords && this.gameServer.checkBadWord(name)) {
            skin = null;
            name = "";
        }
        this.socket.playerTracker.joinGame(name, skin);
    }
}

module.exports = PacketHandler;
