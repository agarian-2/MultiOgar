"use strict";
const Mode = require("./Mode");

class FFA extends Mode {
    constructor() {
        super();
        this.ID = 0;
        this.decayMod = 1;
        this.name = "Free For All";
    }
    onPlayerSpawn(gameServer, client) {
        client.color = gameServer.randomColor();
        gameServer.spawnPlayer(client, gameServer.randomPosition());
    }
    updateLB(gameServer, lb) {
        gameServer.leaderboardType = this.packetLB;
        let pos = 0;
        for (let i = 0; i < gameServer.clients.length; i++) {
            let client = gameServer.clients[i].playerTracker;
            if (client.isRemoved || !client.cells.length || client.socket.isConnected === false) continue;
            let j;
            for (j = 0; j < pos; j++)
                if (lb[j]._score < client._score) break;
            lb.splice(j, 0, client);
            pos++;
        }
        this.rankOne = lb[0];
    }
}

module.exports = FFA;
