"use strict";
const Mode = require("./Mode");

class Teams extends Mode {
    constructor() {
        super();
        this.ID = 1;
        this.name = "Teams";
        this.decayMod = 1;
        this.packetLB = 50;
        this.isTeams = true;
        this.colorFuzziness = 38;
        this.teamCount = 3;
        this.colors = [
            {r: 255, g: 0, b: 0},
            {r: 0, g: 255, b: 0},
            {r: 0, g: 0, b: 255}
        ];
        this.nodes = [];
    }
    onServerInit(gameServer) {
        for (let i = 0; i < this.teamCount; i++) this.nodes[i] = [];
        for (let i = 0; i < gameServer.clients.length; i++) {
            let client = gameServer.clients[i].playerTracker;
            this.onPlayerInit(client), client.color = this.teamColor(client.team);
            for (let j = 0; j < client.cells.length; j++) {
                let cell = client.cells[j];
                cell.color = client.color;
                this.nodes[client.team].push(cell);
            }
        }
    }
    onPlayerInit(client) {
        client.team = Math.floor(Math.random() * this.teamCount);
    }
    onPlayerSpawn(gameServer, client) {
        client.color = this.teamColor(client.team);
        gameServer.spawnPlayer(client, gameServer.randomPosition());
    }
    onCellAdd(cell) {
        if (cell.cellType === 0) this.nodes[cell.owner.team].push(cell);
    }
    onCellRemove(cell) {
        let index = this.nodes[cell.owner.team].indexOf(cell);
        if (index !== -1) this.nodes[cell.owner.team].splice(index, 1);
    }
    onCellMove(cell, gameServer) {
        for (let i = 0; i < cell.owner.visibleNodes.length; i++) {
            let check = cell.owner.visibleNodes[i];
            if (check.cellType != 0 || cell.owner == check.owner) continue;
            let team = cell.owner.team;
            if (check.owner.team == team) {
                let m = cell.checkCellCollision(gameServer, check);
                if (m != null) !m.check.canEat(m.cell);
            }
        }
    }
    fuzzColor(component) {
        component += Math.random() * this.colorFuzziness >> 0;
        return Math.max(Math.min(component, 255), 0);
    }
    teamColor(team) {
        let color = this.colors[team];
        return {
            r: this.fuzzColor(color.r),
            g: this.fuzzColor(color.g),
            b: this.fuzzColor(color.b)
        };
    }
    updateLB(gameServer) {
        gameServer.leaderboardType = this.packetLB;
        let total = 0,
            teamMass = [];
        for (let i = 0; i < this.teamCount; i++) {
            teamMass[i] = 0;
            for (let j = 0; j < this.nodes[i].length; j++) {
                let cell = this.nodes[i][j];
                if (!cell || cell.isRemoved) continue;
                teamMass[i] += cell._mass;
                total += cell._mass;
            }
        }
        if (total <= 0)
            for (let i = 0; i < this.teamCount; i++) gameServer.leaderboard[i] = 0;
        else for (let i = 0; i < this.teamCount; i++) gameServer.leaderboard[i] = teamMass[i] / total;
        let clients = gameServer.clients.filter(client => !client.playerTracker.isRemoved && client.playerTracker.cells.length && client.playerTracker.socket.isConnected !== false);
        clients = clients.sort((a, b) => b.playerTracker._score - a.playerTracker._score);
        if (clients[0]) this.rankOne = clients[0].playerTracker;
    }
}

module.exports = Teams;
