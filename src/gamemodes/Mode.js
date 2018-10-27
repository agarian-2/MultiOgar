'use strict';
function Mode() {
    this.ID = -1;
    this.name = "Null";
    this.decayMod = 1;
    this.packetLB = 49;
    this.isTeams = 0;
    this.isTournament = 0;
}

module.exports = Mode;

Mode.prototype.onServerInit = function(gameServer) {
    gameServer.running = 1;
};

Mode.prototype.onTick = function(gameServer) {};

Mode.prototype.onPlayerInit = function(player) {};

Mode.prototype.onPlayerSpawn = function(gameServer, player) {
    player.color = gameServer.randomColor();
    gameServer.spawnPlayer(player);
};

Mode.prototype.onCellAdd = function(cell) {};

Mode.prototype.onCellRemove = function(cell) {};

Mode.prototype.onCellMove = function(cell, gameServer) {};

Mode.prototype.updateLB = function(gameServer) {
    gameServer.leaderboardType = this.packetLB;
};

Mode.prototype.onChange = function(gameServer) {
    for (;gameServer.nodes.all.length;) gameServer.removeNode(gameServer.nodes.all[0]);
    for (;gameServer.nodes.eject.length;) gameServer.removeNode(gameServer.nodes.eject[0]);
    for (;gameServer.nodes.food.length;) gameServer.removeNode(gameServer.nodes.food[0]);
    for (;gameServer.nodes.virus.length;) gameServer.removeNode(gameServer.nodes.virus[0]);
};