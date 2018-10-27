// Needs further reworking...
'use strict';
const Tournament = require('./Tournament');
const Entity = require('../entity');
const Log = require('../modules/Logger');

function Hide(gameServer) {
    Tournament.apply(this, Array.prototype.slice.call(arguments));
    this.ID = 6;
    this.name = "Hide and Seek";
    this.maxContenders = 12;
    this.isTournament = 1;
    this.packetLB = 48;
    this.virusRandomSize = 1;
}

module.exports = Hide;
Hide.prototype = new Tournament();

Hide.prototype.onServerInit = function (gameServer) {
    Log.warn("Since the gamemode is Hide and Seek, it is highly recommended that you don't use the reload command.");
    Log.warn("This is because configs set by the gamemode will be reset to the config.ini values.");
    this.prepare(gameServer);
    if (gameServer.config.serverBots > this.maxContenders)
        gameServer.config.serverBots = this.maxContenders;
    gameServer.config.spawnInterval = 1;
    gameServer.config.foodSpawnAmount = 10;
    gameServer.config.foodMinAmount = 1200;
    gameServer.config.playerStartSize = 100;
    gameServer.config.minionStartSize = 100;
    gameServer.config.botStartSize = 100;
    gameServer.config.virusMinAmount = 50;
    gameServer.config.virusMaxAmount = 50;
    gameServer.config.virusRandomColor = 1;
    gameServer.config.ejectSpawnChance = 0;
    gameServer.config.playerDisconnectTime = 5;
    gameServer.config.borderWidth = 8000;
    gameServer.config.borderHeight = 8000;
    /*this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);
    this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);
    this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);
    this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);
    this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);
    this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);
    this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);
    this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);
    this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);
    this.spawnCell(gameServer, Math.random() * (141.2 - 100) + 100);*/
};

Hide.prototype.onPlayerSpawn = function (gameServer, player) {
    if ((this.gamePhase == 0) && (this.contenders.length < this.maxContenders)) {
        player.color = gameServer.randomColor();
        this.contenders.push(player);
        gameServer.spawnPlayer(player, gameServer.randomPosition());
        if (this.contenders.length == this.maxContenders) {
            this.startGamePrep(gameServer);
        }
    }
};