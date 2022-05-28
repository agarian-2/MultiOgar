function Mode() {
    this.ID = -1;
    this.name = "Null";
    this.decayMod = 1;
    this.packetLB = 49;
    this.isTeams = false;
    this.isTournament = false;
}

module.exports = Mode;

Mode.prototype.onServerInit = function(gameServer) {
    gameServer.running = true;
};

Mode.prototype.onTick = function() {};

Mode.prototype.onPlayerInit = function() {};

Mode.prototype.onPlayerSpawn = function(gameServer, player) {
    player.color = gameServer.randomColor();
    gameServer.spawnPlayer(player);
};

Mode.prototype.onPlayerDeath = function() {};

Mode.prototype.onCellAdd = function() {};

Mode.prototype.onCellRemove = function() {};

Mode.prototype.onCellMove = function() {};

Mode.prototype.updateLB = function(gameServer) {
    gameServer.leaderboardType = this.packetLB;
};

Mode.prototype.onChange = function(gameServer) {
    for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
    for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
    for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
    for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
};
