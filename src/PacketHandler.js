var Packet = require("./packet"),
    BinaryReader = require("./packet/BinaryReader"),
    Entity = require("./entity");

function PacketHandler(gameServer, socket) {
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

module.exports = PacketHandler;

PacketHandler.prototype.handleMessage = function(message) {
    if (this.handler.hasOwnProperty(message[0])) {
        this.handler[message[0]](message);
        this.socket.lastAliveTime = this.gameServer.stepDateTime;
    }
};

PacketHandler.prototype.onProtocol = function(message) {
    if (message.length !== 5) return;
    this.handshakeProtocol = message[1] | (message[2] << 8) | (message[3] << 16) | (message[4] << 24);
    if (this.handshakeProtocol < 1 || this.handshakeProtocol > 17) return this.socket.close(1002, this.handshakeProtocol + " is a non-supported protocol!");
    this.handler = {
        255: this.onKey.bind(this)
    };
};

PacketHandler.prototype.onKey = function(message) {
    if (message.length !== 5) return;
    this.handshakeKey = message[1] | (message[2] << 8) | (message[3] << 16) | (message[4] << 24);
    if (this.handshakeProtocol > 6 && this.handshakeKey !== 0) return this.socket.close(1002, "This is a non-supported protocol!");
    this.onCompleted(this.handshakeProtocol, this.handshakeKey);
};

PacketHandler.prototype.onCompleted = function(protocol) {
    var gameServer = this.gameServer;
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
    this.socket.sendPacket(new Packet.SetBorder(this.socket.playerTracker, gameServer.border, gameServer.config.serverGamemode, "MultiOgar-Edited " + gameServer.version));
    gameServer.sendChatMessage(null, this.socket.playerTracker, "MultiOgar " + gameServer.version);
    if (gameServer.config.serverWelcome1) gameServer.sendChatMessage(null, this.socket.playerTracker, gameServer.config.serverWelcome1);
    if (gameServer.config.serverWelcome2) gameServer.sendChatMessage(null, this.socket.playerTracker, gameServer.config.serverWelcome2);
    if (!gameServer.config.serverChat) gameServer.sendChatMessage(null, this.socket.playerTracker, "The chat is disabled.");
};

PacketHandler.prototype.onJoin = function(message) {
    if (this.socket.playerTracker.cells.length) return;
    var reader = new BinaryReader(message);
    reader.skipBytes(1);
    var protocol = null;
    protocol = 6 > this.protocol ? reader.readStringZeroUnicode() : reader.readStringZeroUtf8(), this.nickName(protocol);
};

PacketHandler.prototype.onSpectate = function(message) {
    var client = this.socket.playerTracker;
    if (message.length === 1 && !client.cells.length) client.isSpectating = true;
};

PacketHandler.prototype.onMouse = function(message) {
    if (message.length === 13 || message.length === 9 || message.length === 21) this.mouseData = Buffer.concat([message]);
};

PacketHandler.prototype.onKeySpace = function(message) {
    if (message.length === 1) this.pressSpace = true;
};

PacketHandler.prototype.onKeyQ = function(message) {
    if (message.length !== 1) return;
    var client = this.socket.playerTracker;
    if (!client.cells.length || !client.minions.length) return;
    client.minion.follow = !client.minion.follow;
    this.gameServer.sendChatMessage(null, client, "Minions follow centerpoint: " + client.minion.frozen + ".");
    this.pressQ = true;
};

PacketHandler.prototype.onKeyW = function(message) {
    if (message.length === 1) this.pressW = true;
};

PacketHandler.prototype.onKeyE = function() {
    var client = this.socket.playerTracker;
    if (client.minions.length) client.minion.split = true;
};

PacketHandler.prototype.onKeyR = function() {
    var client = this.socket.playerTracker;
    if (client.minions.length) client.minion.eject = true;
};

PacketHandler.prototype.onKeyT = function() {
    var client = this.socket.playerTracker;
    if (!client.minions.length) return;
    client.minion.frozen = !client.minion.frozen;
    this.gameServer.sendChatMessage(null, client, "Minions frozen: " + client.minion.frozen + ".");
};

PacketHandler.prototype.onKeyP = function() {
    var client = this.socket.playerTracker;
    if (!client.minions.length) return;
    client.minion.collect = !client.minion.collect;
    this.gameServer.sendChatMessage(null, client, "Minion food collection: " + client.minion.collect + ".");
};

PacketHandler.prototype.onKeyO = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled || !client.cells.length) return;
    client.frozen = !client.frozen;
    this.gameServer.sendChatMessage(null, client, "Frozen: " + client.frozen + ".");
};

PacketHandler.prototype.onKeyM = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled || client.cells.length <= 1) return;
    client.mergeOverride = !client.mergeOverride;
    this.gameServer.sendChatMessage(null, client, "Force merging: " + client.mergeOverride + ".");
};

PacketHandler.prototype.onKeyI = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled || !client.cells.length) return;
    client.recMode = !client.recMode;
    this.gameServer.sendChatMessage(null, client, "Supersplitter: " + client.recMode + ".");
};

PacketHandler.prototype.onKeyK = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled || !client.cells.length) return;
    for (;client.cells.length;) this.gameServer.removeNode(client.cells[0]);
    this.gameServer.sendChatMessage(null, client, "You killed yourself.");
};

PacketHandler.prototype.onKeyY = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled || !client.cells.length) return;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];
        cell.setSize(cell._size + this.gameServer.config.playerSizeIncrement);
    }
};

PacketHandler.prototype.onKeyU = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled || !client.cells.length) return;
    var config = this.gameServer.config;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];
        if (cell._size - config.playerSizeIncrement > 31.623) cell.setSize(cell._size - config.playerSizeIncrement);
        else cell.setSize(31.623);
    }
};

PacketHandler.prototype.onKeyL = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled) return;
    var gameServer = this.gameServer;
    for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
    for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
    for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
    if (gameServer.gameMode.ID === 2)
        for (;gameServer.gameMode.mothercells.length;) gameServer.removeNode(gameServer.gameMode.mothercells[0]);
    this.gameServer.sendChatMessage(null, client, "Cleared all non-player nodes.");
};

PacketHandler.prototype.onKeyH = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled || !client.cells.length) return;
    var gameServer = this.gameServer,
        config = gameServer.config,
        minSize = 31.623;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];
        while (cell._size > minSize) {
            var angle = Math.PI * 2 * Math.random(),
                loss = config.ejectMinSize;
            if (config.ejectMaxSize > loss) loss = Math.random() * (config.ejectMaxSize - loss) + loss;
            var size = cell.radius - (loss + 5) * (loss + 5);
            cell.setSize(Math.sqrt(size));
            var pos = {
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
};

PacketHandler.prototype.onKeyZ = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled || !client.cells.length) return;
    client.color = this.gameServer.randomColor();
    for (var i = 0; i < client.cells.length; i++) client.cells[i].color = client.color;
    this.gameServer.sendChatMessage(null, client, "Changed your color to (" + client.color.r + ", " + client.color.g + ", " + client.color.b + ").");
};

PacketHandler.prototype.onKeyS = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled) return;
    var virus = new Entity.Virus(this.gameServer, null, client.mouse, this.gameServer.config.virusMinSize);
    this.gameServer.addNode(virus);
    this.gameServer.sendChatMessage(null, client, "Spawned a virus at (" + client.mouse.x + ", " + client.mouse.y + ").");
};

PacketHandler.prototype.onKeyJ = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled) return;
    var food = new Entity.Food(this.gameServer, null, client.mouse, client.OP.foodSize);
    food.color = client.OP.foodColor;
    this.gameServer.addNode(food);
};

PacketHandler.prototype.onKeyC = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled) return;
    client.OP.foodSize += 10;
    if (client.OP.foodSize >= this.gameServer.config.foodBrushLimit + 1) client.OP.foodSize = 10;
    this.gameServer.sendChatMessage(null, client, "Food size: " + client.OP.foodSize + ".");
};

PacketHandler.prototype.onKeyB = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled) return;
    var RGB = this.gameServer.randomColor();
    client.OP.foodColor = {
        r: RGB.r,
        g: RGB.g,
        b: RGB.b
    };
    this.gameServer.sendChatMessage(null, client, "Food color: (" + RGB.r + ", " + RGB.g + ", " + RGB.b + ").");
};

PacketHandler.prototype.onKeyG = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled || !client.cells.length) return;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];
        cell.position.x = client.mouse.x;
        cell.position.y = client.mouse.y;
        this.gameServer.updateNodeQuad(cell);
    }
    this.gameServer.sendChatMessage(null, client, "Teleported to (" + cell.position.x + ", " + cell.position.y + ").");
};

PacketHandler.prototype.onKeyN = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled) return;
    var gameServer = this.gameServer,
        config = gameServer.config;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i],
            angle = Math.random() * 2 * Math.PI,
            pos = {
                x: cell.position.x + cell._size * Math.sin(angle),
                y: cell.position.y + cell._size * Math.cos(angle)
            },
            size = config.foodMinSize;
        if (config.foodMaxSize > size) size = Math.random() * (config.foodMaxSize - size) + size;
        var food = new Entity.Food(gameServer, null, pos, size);
        food.color = gameServer.randomColor();
        gameServer.addNode(food);
        food.setBoost(200 + 200 * Math.random(), angle);
    }
};

PacketHandler.prototype.onKeyV = function() {
    var client = this.socket.playerTracker;
    if (!client.OP.enabled) return;
    var gameServer = this.gameServer,
        config = gameServer.config;
        pos = {
            x: client.mouse.x - client.centerPos.x,
            y: client.mouse.y - client.centerPos.y
        },
        angle = Math.atan2(pos.x, pos.y);
    var size = config.ejectMinSize;
    if (config.ejectMaxSize > size) size = Math.random() * (config.ejectMaxSize - size) + size;
    var eject = new Entity.EjectedMass(gameServer, null, client.mouse, size);
    eject.color = client.isSpectating || config.ejectRandomColor === 1 ? gameServer.randomColor() : client.color;
    gameServer.addNode(eject);
    eject.setBoost(config.ejectSpeed, angle);
};

PacketHandler.prototype.onKeyX = function() {
    var client = this.socket.playerTracker;
    if (!client.cells.length) return;
    client.rainbowEnabled = !client.rainbowEnabled;
    if (client.rainbowEnabled) this.intervalID = setInterval(this.rainbowLoop, 40);
    else clearInterval(this.intervalID);
    this.gameServer.sendChatMessage(null, client, "Rainbow: " + client.rainbowEnabled + ".");
};

PacketHandler.prototype.rainbowLoop = function() {
    var colors = [
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
    var client = this.socket.playerTracker;
    client.color = colors[this.tickRainbow];
    for (var i = 0; i < client.cells.length; i++) client.cells[i].color = client.color;
    this.tickRainbow += 1;
};

PacketHandler.prototype.onChat = function(message) {
    if (message.length < 3) return;
    var tick = this.gameServer.tickCount,
        dt = tick - this.lastChatTick;
    this.lastChatTick = tick;
    if (dt < 20) return;
    var flags = message[1],
        rvLength = (flags & 2 ? 4 : 0) + (flags & 4 ? 8 : 0) + (flags & 8 ? 16 : 0);
    if (message.length < 3 + rvLength) return;
    var reader = new BinaryReader(message);
    reader.skipBytes(2 + rvLength);
    var text = null;
    if (this.protocol < 6) text = reader.readStringZeroUnicode();
    else text = reader.readStringZeroUtf8();
    this.gameServer.onChatMSG(this.socket.playerTracker, null, text);
};

PacketHandler.prototype.onStat = function(message) {
    if (message.length !== 1) return;
    var tick = this.gameServer.tickCount,
        dt = tick - this.lastStatTick;
    this.lastStatTick = tick;
    if (dt < 30) return;
    this.socket.sendPacket(new Packet.ServerStat(this.socket.playerTracker, this.gameServer));
};

PacketHandler.prototype.mouse = function() {
    if (this.mouseData == null) return;
    var reader = new BinaryReader(this.mouseData);
    reader.skipBytes(1);
    var client = this.socket.playerTracker;
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
};

PacketHandler.prototype.process = function() {
    var client = this.socket.playerTracker;
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
};

PacketHandler.prototype.randomSkin = function() {
    var randomSkins = [],
        fs = require("fs"),
        skin = null;
    if (fs.existsSync("../src/ai/Skins.txt")) randomSkins = fs.readFileSync("../src/ai/Skins.txt", "utf8").split(/[\r\n]+/).filter(function(x) {
        return x !== "";
    });
    if (randomSkins.length > 0) {
        var index = (randomSkins.length * Math.random()) >>> 0;
        skin = randomSkins[index];
    }
    return skin;
};

PacketHandler.prototype.nickName = function(text) {
    var name = "",
        skin = null;
    if (text != null && text.length > 0) {
        var skinName = null,
            userName = text,
            n = -1;
        if (text[0] === "{" && (n = text.indexOf("}", 1)) >= 1) {
            var inner = text.slice(1, n);
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
};
