"use strict";
const Mode = require("./Mode");
const Log = require("../modules/Logger");

class Tournament extends Mode {
    constructor() {
        super();
        this.ID = 4;
        this.name = "Tournament";
        this.packetLB = 48;
        this.isTournament = true;
        this.prepTime = 5;
        this.endTime = 15;
        this.autoFill = 0;
        this.autoFillPlayers = 1;
        this.dcTime = 0;
        this.gamePhase = 0;
        this.contenders = [];
        this.maxContenders = 12;
        this.winner;
        this.timer;
        this.timeLimit = 3600;
    }
    onServerInit(gameServer) {
        Log.warn("Since the gamemode is Tournament, it is highly recommended that you don't use the reload command.");
        Log.warn("This is because configs set by the gamemode will be reset to the config.ini values.");
        gameServer.config.playerStartSize = 100;
        gameServer.config.botStartSize = 100;
        gameServer.config.minionStartSize = 100;
        gameServer.config.serverLBUpdate = 25;
        this.prepare(gameServer);
    }
    onPlayerSpawn(gameServer, client) {
        if (this.gamePhase === 0 && this.contenders.length < this.maxContenders) {
            client.color = gameServer.randomColor();
            this.contenders.push(client);
            gameServer.spawnPlayer(client, gameServer.randomPosition());
            if (this.contenders.length == this.maxContenders) this.startGamePrep(gameServer);
        }
    }
    onCellRemove(cell) {
        let owner = cell.owner;
        if (!owner.cells.length) {
            let index = this.contenders.indexOf(owner);
            if (index !== -1) this.contenders.splice(index, 1);
            if (this.contenders.length === 1 && this.gamePhase === 2) this.endGame();
        }
    }
    startGamePrep() {
        this.gamePhase = 1;
        this.timer = this.prepTime;
    }
    startGame(gameServer) {
        gameServer.disableSpawn = false;
        this.gamePhase = 2;
        gameServer.config.playerDisconnectTime = this.dcTime;
    }
    endGame() {
        this.winner = this.contenders[0];
        this.gamePhase = 3;
        this.timer = this.endTime;
    }
    endGameTimeout(gameServer) {
        gameServer.disableSpawn = true;
        this.gamePhase = 4;
        this.timer = this.endTime;
    }
    fillBots(gameServer) {
        for (let i = 0; i < this.maxContenders - this.contenders.length; i++) gameServer.bots.addBot();
    }
    prepare(gameServer) {
        for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
        for (let i = 0; i < gameServer.clients.length; i++) {
            if (gameServer.clients[i].isConnected != null) continue;
            gameServer.clients[i].close();
        }
        gameServer.bots.loadNames();
        this.gamePhase = 0;
        if (gameServer.config.tourneyAutoFill > 0) {
            this.timer = gameServer.config.tourneyAutoFill;
            this.autoFill = 1;
            this.autoFillPlayers = gameServer.config.tourneyAutoFillTime;
        }
        this.dcTime = gameServer.config.playerDisconnectTime;
        gameServer.config.playerDisconnectTime = 0;
        this.prepTime = gameServer.config.tourneyPrepTime;
        this.endTime = gameServer.config.tourneyEndTime;
        this.maxContenders = gameServer.config.tourneyMaxPlayers;
        this.timeLimit = gameServer.config.tourneyTimeLimit * 60;
    }
    formatTime(time) {
        if (time < 0) return "0:00";
        let min = Math.floor(this.timeLimit / 60),
            sec = this.timeLimit % 60;
        sec = (sec > 9) ? sec : "0" + sec.toString();
        return min + ":" + sec;
    }
    updateLB(gameServer, lb) {
        let clients = gameServer.clients.filter(client => !client.playerTracker.isRemoved && client.playerTracker.cells.length && client.playerTracker.socket.isConnected !== false);
        clients = clients.sort((a, b) => b.playerTracker._score - a.playerTracker._score);
        gameServer.leaderboardType = this.packetLB;
        switch (this.gamePhase) {
            case 0: // Waiting for players
                gameServer.config.ejectCooldown = 1e99;
                gameServer.config.playerSpeed = 0;
                gameServer.config.playerMaxCells = 1;
                gameServer.config.playerDecayRate = 0;
                lb[0] = "Player amount: ";
                lb[1] = this.contenders.length + "/" + this.maxContenders;
                if (this.autoFill) {
                    if (this.timer <= 0) this.fillBots(gameServer);
                    else if (this.contenders.length >= this.autoFillPlayers) this.timer--;
                }
                break;
            case 1: // Game about to start
                gameServer.config.ejectCooldown = 1e9;
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
                lb[0] = "Players remaining:";
                lb[1] = this.contenders.length + "/" + this.maxContenders;
                lb[2] = "Time limit:";
                lb[3] = this.formatTime(this.timeLimit);
                lb[4] = "Largest player:";
                if (clients[0]) lb[5] = clients[0].playerTracker._name;
                if (this.timeLimit < 0) this.endGameTimeout(gameServer);
                else this.timeLimit--;
                break;
            case 3: // Winner declared
                gameServer.config.ejectCooldown = 0;
                gameServer.config.playerSpeed = 30;
                gameServer.config.playerMaxCells = 16;
                gameServer.config.playerDecayRate = .002;
                lb[0] = "Winner:";
                lb[1] = this.winner._name;
                lb[2] = "Congratulations!";
                if (this.timer <= 0) {
                    for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
                    for (;gameServer.nodesPlayer.length;) gameServer.removeNode(gameServer.nodesPlayer[0]);
                    for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
                    for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
                    for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
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
                lb[0] = "Time is up!";
                if (this.timer <= 0) {
                    for (; gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
                    for (; gameServer.nodesPlayer.length;) gameServer.removeNode(gameServer.nodesPlayer[0]);
                    for (; gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
                    for (; gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
                    for (; gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
                    return this.gamePhase = 0;
                } else {
                    lb[1] = "---------------------------";
                    lb[2] = "Game restarting in:";
                    lb[3] = this.timer.toString();
                    this.timer--;
                }
        }
        if (clients[0]) this.rankOne = clients[0].playerTracker;
    }
    onChange(gameServer) {
        gameServer.loadConfig();
        for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
    }
}

module.exports = Tournament;
