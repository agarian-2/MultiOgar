'use strict';
const Mode = require("./Mode");

function Teams() {
    Mode.apply(this, Array.prototype.slice.call(arguments));
    this.ID = 1;
    this.name = "Teams";
    this.decayMod = 1;
    this.packetLB = 50;
    this.isTeams = true;
    this.colorFuzziness = 32;
    this.teamCount = 3;
    this.colors = [
        {r: 255, g: 0, b: 0},
        {r: 0, g: 255, b: 0},
        {r: 0, g: 0, b: 255}
    ];
    this.nodes = [];
}

module.exports = Teams;
Teams.prototype = new Mode();

Teams.prototype.fuzzColor = function(component) {
    component += Math.random() * this.colorFuzziness >> 0;
    return Math.max(Math.min(component, 255), 0);
};

Teams.prototype.teamColor = function(team) {
    var color = this.colors[team];
    return {
        r: this.fuzzColor(color.r),
        g: this.fuzzColor(color.g),
        b: this.fuzzColor(color.b)
    };
};

Teams.prototype.onPlayerSpawn = function(gameServer, player) {
    player.color = this.teamColor(player.team);
    gameServer.spawnPlayer(player, gameServer.randomPosition());
};

Teams.prototype.onServerInit = function(gameServer) {
    for (var i = 0; i < this.teamCount; i++) this.nodes[i] = [];
    for (var i = 0; i < gameServer.clients.length; i++) {
        var client = gameServer.clients[i].playerTracker;
        this.onPlayerInit(client), client.color = this.teamColor(client.team);
        for (var j = 0; j < client.cells.length; j++) {
            var cell = client.cells[j];
            cell.color = client.color;
            this.nodes[client.team].push(cell);
        }
    }
};

Teams.prototype.onPlayerInit = function(player) {
    player.team = Math.floor(Math.random() * this.teamCount);
};

Teams.prototype.onCellAdd = function(cell) {
    if (cell.cellType === 0) this.nodes[cell.owner.team].push(cell);
};

Teams.prototype.onCellRemove = function(cell) {
    var index = this.nodes[cell.owner.team].indexOf(cell);
    if (index !== -1) this.nodes[cell.owner.team].splice(index, 1);
};

Teams.prototype.onCellMove = function(cell, gameServer) {
    for (var i = 0; i < cell.owner.visibleNodes.length; i++) {
        var check = cell.owner.visibleNodes[i];
        if (check.cellType !== 0 || cell.owner == check.owner) continue;
        var team = cell.owner.team;
        if (check.owner.team === team) {
            var m = cell.checkCellCollision(gameServer, check);
            if (m != null) !m.check.canEat(m.cell);
        }
    }
};

Teams.prototype.updateLB = function(gameServer, lb) {
    gameServer.leaderboardType = this.packetLB;
    for (var total = 0, teamMass = [], i = 0; i < this.teamCount; i++) {
        teamMass[i] = 0;
        for (var j = 0; j < this.nodes[i].length; j++) {
            var cell = this.nodes[i][j];
            if (!cell || cell.isRemoved) continue;
            teamMass[i] += cell._mass;
            total += cell._mass;
        }
    }
    if (total <= 0) for (var i = 0; i < this.teamCount; i++) gameServer.leaderboard[i] = 0;
    else for (var i = 0; i < this.teamCount; i++) gameServer.leaderboard[i] = teamMass[i] / total;
    var clients = gameServer.clients.filter(function(player) {
        var client = player.playerTracker;
        return !client.isRemoved && client.cells.length && client.socket.isConnected !== false;
    });
    clients.sort(function(a, b) {
        return b.playerTracker._score - a.playerTracker._score;
    });
    if (clients[0]) this.rankOne = clients[0].playerTracker;
};
