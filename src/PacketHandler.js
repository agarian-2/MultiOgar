"use strict";
const Packet = require("./packet");
const BinaryReader = require("./packet/BinaryReader");
const Entity = require("./entity");
const fs = require("fs");

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
        this.randomSkins = fs.readFileSync("../src/txt/skins.txt", "utf8").split(/[\r\n]+/).filter(x => x !== "");
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
        if (this.handshakeProtocol > 6 && this.handshakeKey !== 0) return this.socket.close(1002, "This is a non-supported protocol!");
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
        this.socket.sendPacket(new Packet.SetBorder(this.socket.playerTracker, this.gameServer.border, this.gameServer.config.serverGamemode, "MultiOgar-Edited " + this.gameServer.version));
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "MultiOgar " + this.gameServer.version);
        if (this.gameServer.config.serverWelcome1) this.gameServer.sendChatMessage(null, this.socket.playerTracker, this.gameServer.config.serverWelcome1);
        if (this.gameServer.config.serverWelcome2) this.gameServer.sendChatMessage(null, this.socket.playerTracker, this.gameServer.config.serverWelcome2);
        if (!this.gameServer.config.serverChat) this.gameServer.sendChatMessage(null, this.socket.playerTracker, "The chat is disabled.");
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
        this.pressQ = true;
        if (!this.socket.playerTracker.cells.length || !this.socket.playerTracker.minions.length) return;
        this.socket.playerTracker.minion.follow = !this.socket.playerTracker.minion.follow;
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Minions follow centerpoint: " + this.socket.playerTracker.minion.frozen + ".");
    }
    onKeyW(message) {
        if (message.length === 1) this.pressW = true;
    }
    onKeyE(message) {
        if (message.length === 1 && this.socket.playerTracker.minions.length) this.socket.playerTracker.minion.split = true;
    }
    onKeyR(message) {
        if (message.length === 1 && this.socket.playerTracker.minions.length) this.socket.playerTracker.minion.eject = true;
    }
    onKeyT(message) {
        if (message.length !== 1 || !this.socket.playerTracker.minions.length) return;
        this.socket.playerTracker.minion.frozen = !this.socket.playerTracker.minion.frozen;
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Minions frozen: " + this.socket.playerTracker.minion.frozen + ".");
    }
    onKeyP(message) {
        if (message.length !== 1 || !this.socket.playerTracker.minions.length) return;
        this.socket.playerTracker.minion.collect = !this.socket.playerTracker.minion.collect;
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Minion food collection: " + this.socket.playerTracker.minion.collect + ".");
    }
    onKeyO(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled || !this.socket.playerTracker.cells.length) return;
        this.socket.playerTracker.frozen = !this.socket.playerTracker.frozen;
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Frozen: " + this.socket.playerTracker.frozen + ".");
    }
    onKeyM(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled || this.socket.playerTracker.cells.length <= 1) return;
        this.socket.playerTracker.mergeOverride = !this.socket.playerTracker.mergeOverride;
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Force merging: " + this.socket.playerTracker.mergeOverride + ".");
    }
    onKeyI(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled || !this.socket.playerTracker.cells.length) return;
        this.socket.playerTracker.recMode = !this.socket.playerTracker.recMode;
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Supersplitter: " + this.socket.playerTracker.recMode + ".");
    }
    onKeyK(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled || !this.socket.playerTracker.cells.length) return;
        for (;this.socket.playerTracker.cells.length;) this.gameServer.removeNode(this.socket.playerTracker.cells[0]);
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "You killed yourself.");
    }
    onKeyY(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled || !this.socket.playerTracker.cells.length) return;
        for (let i = 0; i < this.socket.playerTracker.cells.length; i++) {
            let cell = this.socket.playerTracker.cells[i];
            cell.setSize(cell._size + this.gameServer.config.playerSizeIncrement);
        }
    }
    onKeyU(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled || !this.socket.playerTracker.cells.length) return;
        for (let i = 0; i < this.socket.playerTracker.cells.length; i++) {
            let cell = this.socket.playerTracker.cells[i];
            if (cell._size - this.gameServer.config.playerSizeIncrement > 31.623) cell.setSize(cell._size - this.gameServer.config.playerSizeIncrement);
            else cell.setSize(31.623);
        }
    }
    onKeyL(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled) return;
        for (;this.gameServer.nodesFood.length;) this.gameServer.removeNode(this.gameServer.nodesFood[0]);
        for (;this.gameServer.nodesVirus.length;) this.gameServer.removeNode(this.gameServer.nodesVirus[0]);
        for (;this.gameServer.nodesEject.length;) this.gameServer.removeNode(this.gameServer.nodesEject[0]);
        if (this.gameServer.gameMode.ID === 2)
            for (;this.gameServer.gameMode.mothercells.length;) this.gameServer.removeNode(this.gameServer.gameMode.mothercells[0]);
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Cleared all non-player nodes.");
    }
    onKeyH(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled || !this.socket.playerTracker.cells.length) return;
        for (let i = 0; i < this.socket.playerTracker.cells.length; i++) {
            let cell = this.socket.playerTracker.cells[i];
            while (cell._size > 31.623) {
                let angle = Math.PI * 2 * Math.random(),
                    loss = this.gameServer.config.ejectMinSize;
                if (this.gameServer.config.ejectMaxSize > loss) loss = Math.random() * (this.gameServer.config.ejectMaxSize - loss) + loss;
                let size = cell.radius - (loss + 5) * (loss + 5);
                cell.setSize(Math.sqrt(size));
                let pos = {
                        x: cell.position.x + angle,
                        y: cell.position.y + angle
                    },
                    eject = new Entity.EjectedMass(this.gameServer, null, pos, loss);
                if (this.gameServer.config.ejectRandomColor === 1) eject.color = this.gameServer.randomColor();
                else eject.color = this.socket.playerTracker.color;
                eject.setBoost(this.gameServer.config.ejectSpeed * Math.random(), angle);
                this.gameServer.addNode(eject);
            }
            cell.setSize(31.623);
        }
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "You exploded yourself.");
    }
    onKeyZ(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled || !this.socket.playerTracker.cells.length) return;
        let color = this.gameServer.randomColor();
        this.socket.playerTracker.color = color;
        for (let i = 0; i < this.socket.playerTracker.cells.length; i++) this.socket.playerTracker.cells[i].color = color;
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Changed your color to (" + color.r + ", " + color.g + ", " + color.b + ").");
    }
    onKeyS(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled) return;
        let virus = new Entity.Virus(this.gameServer, null, this.socket.playerTracker.mouse, this.gameServer.config.virusMinSize);
        this.gameServer.addNode(virus);
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Spawned a virus at (" + this.socket.playerTracker.mouse.x + ", " + this.socket.playerTracker.mouse.y + ").");
    }
    onKeyJ(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled) return;
        let food = new Entity.Food(this.gameServer, null, this.socket.playerTracker.mouse, this.socket.playerTracker.OP.foodSize);
        food.color = this.socket.playerTracker.OP.foodColor;
        this.gameServer.addNode(food);
    }
    onKeyC(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled) return;
        this.socket.playerTracker.OP.foodSize += 10;
        if (this.socket.playerTracker.OP.foodSize >= this.gameServer.config.foodBrushLimit + 1) this.socket.playerTracker.OP.foodSize = 10;
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Food size: " + this.socket.playerTracker.OP.foodSize + ".");
    }
    onKeyB(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled) return;
        let color = this.gameServer.randomColor();
        this.socket.playerTracker.OP.foodColor = color;
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Food color: (" + color.r + ", " + color.g + ", " + color.b + ").");
    }
    onKeyG(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled || !this.socket.playerTracker.cells.length) return;
        let cell;
        for (let i = 0; i < this.socket.playerTracker.cells.length; i++) {
            cell = this.socket.playerTracker.cells[i];
            cell.position.x = this.socket.playerTracker.mouse.x;
            cell.position.y = this.socket.playerTracker.mouse.y;
            this.gameServer.updateNodeQuad(cell);
        }
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Teleported to (" + cell.position.x + ", " + cell.position.y + ").");
    }
    onKeyN(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled) return;
        for (let i = 0; i < this.socket.playerTracker.cells.length; i++) {
            let cell = this.socket.playerTracker.cells[i],
                angle = Math.random() * 2 * Math.PI,
                pos = {
                    x: cell.position.x + cell._size * Math.sin(angle),
                    y: cell.position.y + cell._size * Math.cos(angle)
                },
                size = this.gameServer.config.foodMinSize;
            if (this.gameServer.config.foodMaxSize > size) size = Math.random() * (this.gameServer.config.foodMaxSize - size) + size;
            let food = new Entity.Food(this.gameServer, null, pos, size);
            food.color = this.gameServer.randomColor();
            this.gameServer.addNode(food);
            food.setBoost(200 + 200 * Math.random(), angle);
        }
    }
    onKeyV(message) {
        if (message.length !== 1 || !this.socket.playerTracker.OP.enabled) return;
        let pos = {
                x: this.socket.playerTracker.mouse.x - this.socket.playerTracker.centerPos.x,
                y: this.socket.playerTracker.mouse.y - this.socket.playerTracker.centerPos.y
            },
            angle = Math.atan2(pos.x, pos.y),
            size = this.gameServer.config.ejectMinSize;
        if (this.gameServer.config.ejectMaxSize > size) size = Math.random() * (this.gameServer.config.ejectMaxSize - size) + size;
        let eject = new Entity.EjectedMass(this.gameServer, null, this.socket.playerTracker.mouse, size);
        eject.color = this.socket.playerTracker.isSpectating || this.gameServer.config.ejectRandomColor ? this.gameServer.randomColor() : this.socket.playerTracker.color;
        this.gameServer.addNode(eject);
        eject.setBoost(this.gameServer.config.ejectSpeed, angle);
    }
    onKeyX(message) {
        if (message.length !== 1 || !this.socket.playerTracker.cells.length) return;
        this.socket.playerTracker.rainbowEnabled = !this.socket.playerTracker.rainbowEnabled;
        if (this.socket.playerTracker.rainbowEnabled) this.intervalID = setInterval(this.rainbowLoop, 40);
        else clearInterval(this.intervalID);
        this.gameServer.sendChatMessage(null, this.socket.playerTracker, "Rainbow: " + this.socket.playerTracker.rainbowEnabled + ".");
    }
    rainbowLoop() {
        let colors = [
            {"r":255, "g":  0, "b":  0}, // Red
            {"r":255, "g": 32, "b":  0},
            {"r":255, "g": 64, "b":  0},
            {"r":255, "g": 96, "b":  0},
            {"r":255, "g":128, "b":  0}, // Orange
            {"r":255, "g":160, "b":  0},
            {"r":255, "g":192, "b":  0},
            {"r":255, "g":224, "b":  0},
            {"r":255, "g":255, "b":  0}, // Yellow
            {"r":192, "g":255, "b":  0},
            {"r":128, "g":255, "b":  0},
            {"r": 64, "g":255, "b":  0},
            {"r":  0, "g":255, "b":  0}, // Green
            {"r":  0, "g":192, "b": 64},
            {"r":  0, "g":128, "b":128},
            {"r":  0, "g": 64, "b":192},
            {"r":  0, "g":  0, "b":255}, // Blue
            {"r": 18, "g":  0, "b":192},
            {"r": 37, "g":  0, "b":128},
            {"r": 56, "g":  0, "b": 64},
            {"r": 75, "g":  0, "b":130}, // Indigo
            {"r": 92, "g":  0, "b":161},
            {"r":109, "g":  0, "b":192},
            {"r":126, "g":  0, "b":223},
            {"r":143, "g":  0, "b":255}, // Purple
            {"r":171, "g":  0, "b":192},
            {"r":199, "g":  0, "b":128},
            {"r":227, "g":  0, "b": 64}
        ];
        if (this.tickRainbow > colors.length - 1) this.tickRainbow = 0;
        this.socket.playerTracker.color = colors[this.tickRainbow];
        for (let i = 0; i < this.socket.playerTracker.cells.length; i++) this.socket.playerTracker.cells[i].color = this.socket.playerTracker.color;
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
        this.gameServer.onChatMSG(this.socket.playerTracker, null, text);
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
        if (this.mouseData.length === 13) {
            this.socket.playerTracker.mouse.x = reader.readInt32() - this.socket.playerTracker.scrambleX;
            this.socket.playerTracker.mouse.y = reader.readInt32() - this.socket.playerTracker.scrambleY;
        } else if (this.mouseData.length === 9) {
            this.socket.playerTracker.mouse.x = reader.readInt16() - this.socket.playerTracker.scrambleX;
            this.socket.playerTracker.mouse.y = reader.readInt16() - this.socket.playerTracker.scrambleY;
        } else if (this.mouseData.length === 21) {
            let x = reader.readDouble() - this.socket.playerTracker.scrambleX,
                y = reader.readDouble() - this.socket.playerTracker.scrambleY;
            if (!isNaN(x) && !isNaN(y)) {
                this.socket.playerTracker.mouse.x = x;
                this.socket.playerTracker.mouse.y = y;
            }
        }
        this.mouseData = null;
    }
    process() {
        if (this.pressSpace) {
            this.socket.playerTracker.pressSpace();
            this.pressSpace = false;
        }
        if (this.pressW) {
            this.socket.playerTracker.pressW();
            this.pressW = false;
        }
        if (this.pressQ) {
            this.socket.playerTracker.pressQ();
            this.pressQ = false;
        }
        if (this.socket.playerTracker.minion.split) this.socket.playerTracker.minion.split = false;
        if (this.socket.playerTracker.minion.eject) this.socket.playerTracker.minion.eject = false;
        this.mouse();
    }
    randomSkin() {
        let skin = null;
        if (this.randomSkins.length) skin = this.randomSkins[Math.floor(Math.random() * this.randomSkins.length)];
        return skin;
    }
    nickName(text) {
        let name = "",
            skin = null;
        if (text != null && text.length) {
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
