"use strict";

class Mode {
    constructor() {
        this.ID = -1;
        this.name = "Null";
        this.decayMod = 1;
        this.packetLB = 49;
        this.isTeams = false;
        this.isTournament = false;
    }
    onServerInit(gameServer) {
        gameServer.running = true;
    }
    onTick() {}
    onPlayerInit() {}
    onPlayerSpawn(gameServer, player) {
        player.color = gameServer.randomColor();
        gameServer.spawnPlayer(player);
    }
    onPlayerDeath() {}
    onCellAdd() {}
    onCellRemove() {}
    onCellMove() {}
    updateLB(gameServer) { // Rename to updateLeaderboard later
        gameServer.leaderboardType = this.packetLB;
    }
    onChange(gameServer) {
        for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
    }
}

module.exports = Mode;
