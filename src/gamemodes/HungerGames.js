'use strict';
const Tournament = require('./Tournament'),
    Entity = require('../entity'),
    Log = require('../modules/Logger');

function HungerGames(gameServer) {
    Tournament.apply(this, Array.prototype.slice.call(arguments));
    this.ID = 5;
    this.name = "Hunger Games";
    this.maxContenders = 12;
    this.baseSpawnPoints = [
        // Right of map
        {x: 4950, y:-2500},
        {x: 4950, y:    0},
        {x: 4950, y: 2500},
        // Left of map
        {x:-4950, y:-2500},
        {x:-4950, y:    0},
        {x:-4950, y: 2500},
        // Top of map
        {x:-2500, y: 4950},
        {x:    0, y: 4950},
        {x: 2500, y: 4950},
        // Bottom of map
        {x:-2500, y:-4950},
        {x:    0, y:-4950},
        {x: 2500, y:-4950}
    ];
    this.contenderSpawnPoints;
}

module.exports = HungerGames;
HungerGames.prototype = new Tournament();

HungerGames.prototype.getPos = function() {
    var pos = {
        x: 0,
        y: 0
    };
    if (this.contenderSpawnPoints.length > 0) {
        var index = Math.floor(Math.random() * this.contenderSpawnPoints.length);
        pos = this.contenderSpawnPoints[index];
        this.contenderSpawnPoints.splice(index, 1);
    }
    return {
        x: pos.x,
        y: pos.y
    };
};

HungerGames.prototype.spawnFood = function(gameServer, size, pos) {
    var cell = new Entity.Food(gameServer, null, pos, size);
    cell.color = gameServer.randomColor();
    gameServer.addNode(cell);
};

HungerGames.prototype.spawnVirus = function(gameServer, pos) {
    var virus = new Entity.Virus(gameServer, null, pos, gameServer.config.virusMinSize);
    gameServer.addNode(virus);
};

HungerGames.prototype.onPlayerDeath = function(gameServer) {
    var len = gameServer.nodesAll.length;
    for (var i = 0; i < len; i++) {
        var node = gameServer.nodesAll[i];
        if (!node || node.cellType === 0) continue;
    }
};

HungerGames.prototype.onServerInit = function(gameServer) {
    Log.warn("Since the gamemode is HungerGames, it is highly recommended that you don't use the reload command.");
    Log.warn("This is because configs set by the gamemode will be reset to the config.ini values.");
    this.prepare(gameServer);
    this.contenderSpawnPoints = this.baseSpawnPoints.slice();
    if (gameServer.config.serverBots > this.maxContenders) gameServer.config.serverBots = this.maxContenders;
    gameServer.config.spawnInterval = 10;
    gameServer.config.foodSpawnAmount = 20;
    gameServer.config.foodMinAmount = 800;
    gameServer.config.playerStartSize = 100;
    gameServer.config.minionStartSize = 100;
    gameServer.config.botStartSize = 100;
    gameServer.config.foodMinSize = gameServer.massToSize(2);
    gameServer.config.foodMaxSize = gameServer.massToSize(3);
    gameServer.config.virusMinAmount = 16;
    gameServer.config.virusMaxAmount = 50;
    gameServer.config.ejectSpawnChance = 0;
    gameServer.config.playerDisconnectTime = 10;
    gameServer.config.borderWidth = 8000;
    gameServer.config.borderHeight = 8000;
};

HungerGames.prototype.resetMap = function(gameServer) {
    // 400 mass food
    this.spawnFood(gameServer, 200, {x: 0, y: 0});
    // 80 mass food
    this.spawnFood(gameServer, 90, {x:  810, y: 810});
    this.spawnFood(gameServer, 90, {x:  810, y:-810});
    this.spawnFood(gameServer, 90, {x: -810, y: 810});
    this.spawnFood(gameServer, 90, {x: -810, y:-810});
    // 50 mass food
    this.spawnFood(gameServer, 71, {x:   0, y: 1620});
    this.spawnFood(gameServer, 71, {x:   0, y:-1620});
    this.spawnFood(gameServer, 71, {x: 1620, y:   0});
    this.spawnFood(gameServer, 71, {x:-1620, y:   0});
    // 30 mass food
    this.spawnFood(gameServer, 55, {x: 1620, y: 810});
    this.spawnFood(gameServer, 55, {x: 1620, y:-810});
    this.spawnFood(gameServer, 55, {x:-1620, y: 810});
    this.spawnFood(gameServer, 55, {x:-1620, y:-810});
    this.spawnFood(gameServer, 55, {x: 810, y: 1620});
    this.spawnFood(gameServer, 55, {x: 810, y:-1620});
    this.spawnFood(gameServer, 55, {x:-810, y: 1620});
    this.spawnFood(gameServer, 55, {x:-810, y:-1620});
    // Viruses
    this.spawnVirus(gameServer, {x:     0, y: 810});
    this.spawnVirus(gameServer, {x:     0, y:-810});
    this.spawnVirus(gameServer, {x:   810, y:   0});
    this.spawnVirus(gameServer, {x:  -810, y:   0});
    this.spawnVirus(gameServer, {x: 1620, y: 1620});
    this.spawnVirus(gameServer, {x: 1620, y:-1620});
    this.spawnVirus(gameServer, {x:-1620, y: 1620});
    this.spawnVirus(gameServer, {x:-1620, y:-1620});
    this.spawnVirus(gameServer, {x:  810, y: 2430});
    this.spawnVirus(gameServer, {x:  810, y:-2430});
    this.spawnVirus(gameServer, {x: -810, y:-2430});
    this.spawnVirus(gameServer, {x: -810, y: 2430});
    this.spawnVirus(gameServer, {x:  2430, y: 810});
    this.spawnVirus(gameServer, {x:  2430, y:-810});
    this.spawnVirus(gameServer, {x: -2430, y:-810});
    this.spawnVirus(gameServer, {x: -2430, y: 810});=
};

HungerGames.prototype.onPlayerSpawn = function(gameServer, client) {
    if (this.gamePhase === 0 && this.contenders.length < this.maxContenders) {
        client.color = gameServer.randomColor();
        this.contenders.push(client);
        gameServer.spawnPlayer(client, this.getPos());
        if (this.contenders.length === this.maxContenders) {
            this.startGamePrep(gameServer);
            this.resetMap(gameServer);
        }
    }
};
