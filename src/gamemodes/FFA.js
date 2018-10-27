'use strict';
const Mode = require("./Mode");

function FFA() {
	Mode.apply(this, Array.prototype.slice.call(arguments));
	this.ID = 0;
	this.decayMod = 1;
	this.name = "Free For All";
}

module.exports = FFA;
FFA.prototype = new Mode;

FFA.prototype.onPlayerSpawn = function(gameServer, player) {
	player.color = gameServer.randomColor();
	gameServer.spawnPlayer(player, gameServer.randomPosition());
};

FFA.prototype.updateLB = function(gameServer, lb) {
	gameServer.leaderboardType = this.packetLB;
	for (var i = 0, pos = 0; i < gameServer.clients.length; i++) {
		var client = gameServer.clients[i].playerTracker;
		if (client.isRemoved || !client.cells.length || client.socket.isConnected == 0) continue;
		for (var j = 0; j < pos; j++) if (lb[j]._score < client._score) break;
		lb.splice(j, 0, client);
		pos++;
	}
	var clients = gameServer.clients.valueOf();
	clients.sort(function (a, b) {
		return b.playerTracker._score - a.playerTracker._score;
	});
	if (clients[0] != null && clients[0].playerTracker.isRemoved != true && clients[0].playerTracker.isConnected != false) this.rankOne = clients[0].playerTracker;
};