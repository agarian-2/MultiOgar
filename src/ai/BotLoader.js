var FakeSocket = require("./FakeSocket"),
    PacketHandler = require("../PacketHandler");

function BotLoader(gameServer) {
    this.gameServer = gameServer;
    this.loadNames();
    this.loadSkins();
}

module.exports = BotLoader;

BotLoader.prototype.getName = function() {
    var skin = "",
        name = "";
    if (this.randomSkins.length > 0 && Math.random() < .75) skin = "{" + this.randomSkins[(this.randomSkins.length * Math.random()) >>> 0] + "}";
    if (this.randomNames.length > 0) name = this.randomNames[(this.randomNames.length * Math.random()) >>> 0];
    else name = "bot" + ++this.nameIndex;
    return skin + name;
};

BotLoader.prototype.loadNames = function() {
    this.randomNames = [];
    var fs = require("fs");
    if (fs.existsSync("../src/ai/BotNames.txt")) this.randomNames = fs.readFileSync("../src/ai/BotNames.txt", "utf8").split(/[\r\n]+/).filter(function (x) {
        return x !== "";
    });
    this.nameIndex = 0;
};

BotLoader.prototype.loadSkins = function() {
    this.randomSkins = [];
    var fs = require("fs");
    if (fs.existsSync("../src/ai/Skins.txt")) this.randomSkins = fs.readFileSync("../src/ai/Skins.txt", "utf8").split(/[\r\n]+/).filter(function (x) {
        return x !== "";
    });
};

BotLoader.prototype.addBot = function() {
    var BotPlayer = require("./BotPlayer"),
        socket = new FakeSocket(this.gameServer);
    socket.playerTracker = new BotPlayer(this.gameServer, socket);
    socket.packetHandler = new PacketHandler(this.gameServer, socket);
    this.gameServer.clients.push(socket);
    socket.packetHandler.nickName(this.getName());
};

BotLoader.prototype.addMinion = function(owner, name) {
    var MinionPlayer = require("./MinionPlayer"),
        socket = new FakeSocket(this.gameServer);
    socket.playerTracker = new MinionPlayer(this.gameServer, socket, owner);
    socket.packetHandler = new PacketHandler(this.gameServer, socket);
    socket.playerTracker.owner = owner;
    this.gameServer.clients.push(socket);
    owner.minions.push(socket.playerTracker);
    if (typeof name === "undefined" || name === "") this.gameServer.config.minionSameName ? name = socket.playerTracker.owner._name : name = this.gameServer.config.minionDefaultName;
    socket.packetHandler.nickName(name);
};
