'use strict';
const FakeSocket = require("./FakeSocket");
const PacketHandler = require("../PacketHandler");

function BotLoader(gameServer) {
    this.gameServer = gameServer;
    this.loadNames();
}

module.exports = BotLoader;

BotLoader.prototype.getName = function() {
    var name = "";
    if (this.randomNames.length > 0) {
        var index = (this.randomNames.length * Math.random()) >>> 0;
        name = this.randomNames[index];
    } else name = "bot" + ++this.nameIndex;
    return name;
};

BotLoader.prototype.loadNames = function() {
    this.randomNames = [];
    var fs = require("fs");
    if (fs.existsSync("../src/ai/BotNames.txt")) {
        this.randomNames = fs.readFileSync("../src/ai/BotNames.txt", "utf8").split(/[\r\n]+/).filter(function (x) {
            return x != '';
        });
    }
    this.nameIndex = 0;
};

BotLoader.prototype.addBot = function() {
    var BotPlayer = require('./BotPlayer');
    var socket = new FakeSocket(this.gameServer);
    socket.playerTracker = new BotPlayer(this.gameServer, socket);
    socket.packetHandler = new PacketHandler(this.gameServer, socket);
    this.gameServer.clients.push(socket);
    socket.packetHandler.nickName(this.getName());
};

BotLoader.prototype.addMinion = function(owner, name) {
    var MinionPlayer = require('./MinionPlayer');
    var socket = new FakeSocket(this.gameServer);
    socket.playerTracker = new MinionPlayer(this.gameServer, socket, owner);
    socket.packetHandler = new PacketHandler(this.gameServer, socket);
    socket.playerTracker.owner = owner;
    this.gameServer.clients.push(socket);
    if (typeof name == "undefined" || name === "") {
        this.gameServer.config.minionSameName ? name = socket.playerTracker.owner._name :
        name = this.gameServer.config.minionDefaultName;
    }
    socket.packetHandler.nickName(name);
};