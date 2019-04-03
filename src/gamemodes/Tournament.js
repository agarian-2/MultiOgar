'use strict';
const Mode = require('./Mode'),
    Log = require('../modules/Logger');

function Tournament() {
    Mode.apply(this, Array.prototype.slice.call(arguments));
    this.ID = 4;
    this.name = "Tournament";
    this.packetLB = 48;
    this.isTournament = true;
    this.prepTime = 5;
    this.endTime = 15;
    this.autoFill = false;
    this.autoFillPlayers = 1;
    this.dcTime = 0;
    this.gamePhase = 0;
    this.contenders = [];
    this.maxContenders = 12;
    this.winner;
    this.timer;
    this.timeLimit = 3600;
}

module.exports = Tournament;
Tournament.prototype = new Mode();

Tournament.prototype.startGamePrep = function(gameServer) {
    this.gamePhase = 1;
    this.timer = this.prepTime;
};

Tournament.prototype.startGame = function(gameServer) {
    gameServer.disableSpawn = false;
    this.gamePhase = 2;
    gameServer.config.playerDisconnectTime = this.dcTime;
};

Tournament.prototype.endGame = function(gameServer) {
    this.winner = this.contenders[0];
    this.gamePhase = 3;
    this.timer = this.endTime;
};

Tournament.prototype.endGameTimeout = function(gameServer) {
    gameServer.disableSpawn = true;
    this.gamePhase = 4;
    this.timer = this.endTime;
};

Tournament.prototype.fillBots = function(gameServer) {
    var fill = this.maxContenders - this.contenders.length;
    for (var i = 0; i < fill; i++) gameServer.bots.addBot();
};

Tournament.prototype.prepare = function(gameServer) {
    for (var i = 0; i < gameServer.nodesAll.length; i++) {
        var node = gameServer.nodesAll[0];
        if (!node) continue;
        gameServer.removeNode(node);
    }
    for (var i = 0; i < gameServer.clients.length; i++) {
        if (gameServer.clients[i].isConnected != null) continue;
        gameServer.clients[i].close();
    }
    gameServer.bots.loadNames();
    this.gamePhase = 0;
    if (gameServer.config.tourneyAutoFill > 0) {
        this.timer = gameServer.config.tourneyAutoFill;
        this.autoFill = true;
        this.autoFillPlayers = gameServer.config.tourneyAutoFillTime;
    }
    this.dcTime = gameServer.config.playerDisconnectTime;
    gameServer.config.playerDisconnectTime = 0;
    this.prepTime = gameServer.config.tourneyPrepTime;
    this.endTime = gameServer.config.tourneyEndTime;
    this.maxContenders = gameServer.config.tourneyMaxPlayers;
    this.timeLimit = gameServer.config.tourneyTimeLimit * 60;
};

Tournament.prototype.onPlayerDeath = function(gameServer) {};

Tournament.prototype.formatTime = function(time) {
    if (time < 0) return "0:00";
    var min = Math.floor(this.timeLimit / 60),
        sec = this.timeLimit % 60;
    sec = (sec > 9) ? sec : "0" + sec.toString();
    return min + ":" + sec;
};

Tournament.prototype.onServerInit = function(gameServer) {
    Log.warn("Since the gamemode is Tournament, it is highly recommended that you don't use the reload command.");
    Log.warn("This is because configs set by the gamemode will be reset to the config.ini values.");
    gameServer.config.playerStartSize = 100;
    gameServer.config.botStartSize = 100;
    gameServer.config.minionStartSize = 100;
    gameServer.config.serverLBUpdate = 25;
    this.prepare(gameServer);
};

Tournament.prototype.onCellAdd = function(gameServer) {};

Tournament.prototype.onPlayerSpawn = function(gameServer, client) {
    if (this.gamePhase === 0 && this.contenders.length < this.maxContenders) {
        client.color = gameServer.randomColor();
        this.contenders.push(client);
        gameServer.spawnPlayer(client, gameServer.randomPosition());
        if (this.contenders.length == this.maxContenders) this.startGamePrep(gameServer);
    }
};

Tournament.prototype.onCellRemove = function(cell) {
    var owner = cell.owner;
    if (owner.cells.length <= 0) {
        var index = this.contenders.indexOf(owner);
        if (index !== -1) this.contenders.splice(index, 1);
        if (this.contenders.length == 1 && this.gamePhase === 2) this.endGame(cell.owner.gameServer);
        else this.onPlayerDeath(cell.owner.gameServer);
    }
};

Tournament.prototype.updateLB = function(gameServer, lb) {
    gameServer.leaderboardType = this.packetLB;
    switch (this.gamePhase) {
        case 0: // Waiting for players
            gameServer.config.ejectCooldown = 1e99;
            gameServer.config.playerSpeed = 0;
            gameServer.config.playerMaxCells = 1;
            gameServer.config.playerDecayRate = 0;
            lb[0] = "Waiting for";
            lb[1] = "players: ";
            lb[2] = this.contenders.length + "/" + this.maxContenders;
            if (this.autoFill) {
                if (this.timer <= 0) this.fillBots(gameServer);
                else if (this.contenders.length >= this.autoFillPlayers) this.timer--;
            }
            break;
        case 1: // Game about to start
            gameServer.config.ejectCooldown = 1e99;
            gameServer.config.playerSpeed = 0;
            gameServer.config.playerMaxCells = 1;
            gameServer.config.playerDecayRate = 0;
            lb[0] = "Game starting in:";
            lb[1] = this.timer.toString();
            lb[2] = "Good luck!";
            if (this.timer <= 0) this.startGame(gameServer);
            else this.timer--;
            break;
        case 2: // Game in progress
            gameServer.config.ejectCooldown = 0;
            gameServer.config.playerSpeed = 30;
            gameServer.config.playerMaxCells = 16;
            gameServer.config.playerDecayRate = .002;
            gameServer.leaderboardType = this.packetLB;
            lb[0] = "Players Remaining:";
            lb[1] = this.contenders.length + "/" + this.maxContenders;
            lb[2] = "Time Limit:";
            lb[3] = this.formatTime(this.timeLimit);
            //lb[4] = "---------------------------";
            lb[4] = "Largest Player:";
            var clients = gameServer.clients.filter(function(player) {
                var client = player.playerTracker;
                return !client.isRemoved && client.cells.length && client.socket.isConnected !== false;
            });
            clients.sort(function(a, b) {
                return b.playerTracker._score - a.playerTracker._score;
            });
            if (clients[0]) lb[5] = clients[0].playerTracker._name;
            if (this.timeLimit < 0) this.endGameTimeout(gameServer);
            else this.timeLimit--;
            break;
        case 3: // Winner declared
            gameServer.config.ejectCooldown = 0;
            gameServer.config.playerSpeed = 30;
            gameServer.config.playerMaxCells = 16;
            gameServer.config.playerDecayRate = .002;
            lb[0] = "Congratulations:";
            lb[1] = this.winner._name;
            lb[2] = "has won!";
            if (this.timer <= 0) {
                for (; gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
                for (; gameServer.nodesPlayer.length;) gameServer.removeNode(gameServer.nodesPlayer[0]);
                for (; gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
                for (; gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
                for (; gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
                return this.gamePhase = 0;
            } else {
                lb[3] = "---------------------------";
                lb[4] = "Game restarting in:";
                lb[5] = this.timer.toString();
                this.timer--;
            }
            break;
        case 4: // Time limit reached
            gameServer.config.ejectCooldown = 1e99;
            gameServer.config.playerSpeed = 0;
            gameServer.config.playerMaxCells = 1;
            gameServer.config.playerDecayRate = 0;
            lb[0] = "Time limit";
            lb[1] = "reached!";
            if (this.timer <= 0) {
                for (; gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
                for (; gameServer.nodesPlayer.length;) gameServer.removeNode(gameServer.nodesPlayer[0]);
                for (; gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
                for (; gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
                for (; gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
                return this.gamePhase = 0;
            } else {
                lb[2] = "Game restarting in:";
                lb[3] = this.timer.toString();
                this.timer--;
            }
        default:
            break;
    }
    clients = gameServer.clients.filter(function(player) {
        var client = player.playerTracker;
        return !client.isRemoved && client.cells.length && client.socket.isConnected !== false;
    });
    clients.sort(function(a, b) {
        return b.playerTracker._score - a.playerTracker._score;
    });
    if (clients[0]) this.rankOne = clients[0].playerTracker;
};

Tournament.prototype.onChange = function(gameServer) {
    gameServer.loadConfig();
    for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
    for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
    for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
    for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
};
