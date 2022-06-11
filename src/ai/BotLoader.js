"use strict";
const BotPlayer = require("./BotPlayer");
const MinionPlayer = require("./MinionPlayer");
const FakeSocket = require("./FakeSocket");
const PacketHandler = require("../PacketHandler");

class BotLoader {
    constructor(gameServer) {
        this.gameServer = gameServer;
        this.loadNames();
        this.loadSkins();
    }
    getName() {
        let skin = "",
            name = "";
        if (this.randomSkins.length > 0 && Math.random() < .75) skin = "{" + this.randomSkins[(this.randomSkins.length * Math.random()) >>> 0] + "}";
        if (this.randomNames.length > 0) name = this.randomNames[(this.randomNames.length * Math.random()) >>> 0];
        else name = "bot" + ++this.nameIndex;
        return skin + name;
    }
    loadNames() {
        this.randomNames = [];
        let fs = require("fs");
        if (fs.existsSync("../src/ai/BotNames.txt")) this.randomNames = fs.readFileSync("../src/ai/BotNames.txt", "utf8").split(/[\r\n]+/).filter(x => x !== "");
        this.nameIndex = 0;
    }
    loadSkins() {
        this.randomSkins = [];
        let fs = require("fs");
        if (fs.existsSync("../src/ai/Skins.txt")) this.randomSkins = fs.readFileSync("../src/ai/Skins.txt", "utf8").split(/[\r\n]+/).filter(x => x !== "");
    }
    addBot() {
        let socket = new FakeSocket(this.gameServer);
        socket.playerTracker = new BotPlayer(this.gameServer, socket);
        socket.packetHandler = new PacketHandler(this.gameServer, socket);
        this.gameServer.clients.push(socket);
        socket.packetHandler.nickName(this.getName());
    }
    addMinion(owner, name) {
        let socket = new FakeSocket(this.gameServer);
        socket.playerTracker = new MinionPlayer(this.gameServer, socket, owner);
        socket.packetHandler = new PacketHandler(this.gameServer, socket);
        socket.playerTracker.owner = owner;
        this.gameServer.clients.push(socket);
        owner.minions.push(socket.playerTracker);
        if (typeof name === "undefined" || name === "") name = this.gameServer.config.minionSameName ? socket.playerTracker.owner._name : this.gameServer.config.minionDefaultName;
        socket.packetHandler.nickName(name);
    }
}

module.exports = BotLoader;
