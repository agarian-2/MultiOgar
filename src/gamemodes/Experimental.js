var FFA = require("./FFA"),
    Entity = require("../entity");

function Experimental() {
    FFA.apply(this, Array.prototype.slice.call(arguments));
    this.ID = 2;
    this.decayMod = 1;
    this.name = "Experimental";
    this.mothercells = [];
    this.motherSpawnInterval = 100;
    this.motherMinAmount = 7;
}

module.exports = Experimental;
Experimental.prototype = new FFA;

Experimental.prototype.spawnMotherCell = function(gameServer) {
    if (this.mothercells.length >= this.motherMinAmount) return;
    if (!gameServer.willCollide(gameServer.randomPosition(), 149)) {
        var MotherCell = new Entity.MotherCell(gameServer, null, gameServer.randomPosition(), null);
        gameServer.addNode(MotherCell);
    }
};

Experimental.prototype.onServerInit = function(gameServer) {
    gameServer.running = true;
    var self = this;
    if (gameServer.config.virusPush === 1) Entity.Virus.prototype.onEat = function(cell) {
        var boost = Math.atan2(cell.boostDirection.x, cell.boostDirection.y);
        this.setBoost(gameServer.config.virusEjectSpeed - 460, boost);
    };
    Entity.MotherCell.prototype.onAdd = function() {
        self.mothercells.push(this);
    };
    Entity.MotherCell.prototype.onRemove = function() {
        var index = self.mothercells.indexOf(this); 
        if (index !== -1) self.mothercells.splice(index, 1);
    };
};

Experimental.prototype.onTick = function(gameServer) {
    if ((gameServer.tickCount % this.motherSpawnInterval) === 0) this.spawnMotherCell(gameServer);
    for (var i = 0; i < this.mothercells.length; ++i) {
        var updateInt = Math.random() * (50 - 25) + 25;
        if (this.mothercells[i]._size > this.mothercells[i].minSize) updateInt = 2;
        if ((gameServer.tickCount % ~~updateInt) === 0) this.mothercells[i].onUpdate();
    }
};

Experimental.prototype.onChange = function(gameServer) {
    for (;this.mothercells.length;) gameServer.removeNode(this.mothercells[0]);
    for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
    for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
    for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
    for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
    Entity.Virus.prototype.feed = require("../entity/Virus").prototype.feed;
};
