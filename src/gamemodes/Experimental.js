"use strict";
const FFA = require("./FFA");
const Entity = require("../entity");

class Experimental extends FFA {
    constructor() {
        super();
        this.ID = 2;
        this.decayMod = 1;
        this.name = "Experimental";
        this.mothercells = [];
        this.motherSpawnInterval = 100;
        this.motherMinAmount = 7;
    }
    onServerInit(gameServer) {
        gameServer.running = true;
        let self = this;
        Entity.MotherCell.prototype.onAdd = function() {
            self.mothercells.push(this);
        };
        Entity.MotherCell.prototype.onRemove = function() {
            let index = self.mothercells.indexOf(this); 
            if (index !== -1) self.mothercells.splice(index, 1);
        };
    }
    onTick(gameServer) {
        if ((gameServer.tickCount % this.motherSpawnInterval) === 0) this.spawnMotherCell(gameServer);
        for (let i = 0; i < this.mothercells.length; ++i) {
            let updateInt = Math.random() * (50 - 25) + 25;
            if (this.mothercells[i]._size > this.mothercells[i].minSize) updateInt = 2;
            if ((gameServer.tickCount % ~~updateInt) === 0) this.mothercells[i].onUpdate();
        }
    }
    spawnMotherCell(gameServer) {
        if (this.mothercells.length >= this.motherMinAmount) return;
        if (!gameServer.willCollide(gameServer.randomPosition(), 149)) {
            let mother = new Entity.MotherCell(gameServer, null, gameServer.randomPosition(), null);
            gameServer.addNode(mother);
        }
    }
    onChange(gameServer) {
        for (;this.mothercells.length;) gameServer.removeNode(this.mothercells[0]);
        for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
    }
}

module.exports = Experimental;
