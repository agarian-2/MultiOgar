var Cell = require("./Cell");

function Virus() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 2;
    this.spiked = true;
    this.isMotherCell = false;
    if (!this.gameServer.config.virusRandomColor) this.color = {
        r: 51,
        g: 255,
        b: 51
    };
    else this.color = this.gameServer.randomColor();
}

module.exports = Virus;
Virus.prototype = new Cell;

Virus.prototype.canEat = function(prey) {
    if (this.gameServer.nodesVirus.length < this.gameServer.config.virusMaxAmount) return prey.cellType === 3;
};

Virus.prototype.onEat = function(prey) {
    if (this.gameServer.config.virusPush) this.setBoost(this.gameServer.config.virusEjectSpeed - 460, Math.atan2(prey.boostDirection.x, prey.boostDirection.y));
    else {
        this.setSize(Math.sqrt(this.radius + prey.radius));
        if (this._size >= this.gameServer.config.virusMaxSize) {
            this.setSize(this.gameServer.config.virusMinSize);
            this.gameServer.shootVirus(this, prey.boostDirection.angle);
        }
    }
};

Virus.prototype.onEaten = function(cell) {
    if (!cell.owner) return;
    const config = this.gameServer.config;
    var cellsLeft = (config.virusMaxCells || config.playerMaxCells) - cell.owner.cells.length;
    if (cellsLeft) {
        var splitCount,
            splitMin = config.virusSplitDiv,
            mass = cell._mass,
            splits = [];
        if (mass / cellsLeft < splitMin) {
            for (splitMass = mass / (splitCount = 2); splitMass > splitMin && 2 * splitCount < cellsLeft;) splitMass = mass / (splitCount *= 2);
            for (splitMass = mass / (splitCount + 1); splitCount-- > 0;) splits.push(splitMass);
            return this.explode(cell, splits);
        }
        for (var splitMass = mass / 2, massLeft = mass / 2; cellsLeft-- > 0;) {
            if (massLeft / cellsLeft < splitMin) for (splitMass = massLeft / cellsLeft; cellsLeft-- > 0;) splits.push(splitMass);
            for (;splitMass >= massLeft && cellsLeft > 0;) splitMass /= 2;
            splits.push(splitMass);
            massLeft -= splitMass;
        }
        this.explode(cell, splits);
    }
};

Virus.prototype.explode = function(cell, splits) {
    for (var i = 0; i < splits.length; i++) this.gameServer.splitPlayerCell(cell.owner, cell, 2 * Math.PI * Math.random(), splits[i]);
};

Virus.prototype.onAdd = function(gameServer) {
    gameServer.nodesVirus.push(this);
};

Virus.prototype.onRemove = function(gameServer) {
    var index = gameServer.nodesVirus.indexOf(this);
    if (index !== -1) gameServer.nodesVirus.splice(index, 1);
};
